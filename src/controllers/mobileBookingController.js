'use strict';

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const createError = require('http-errors');
const { v4: uuidv4 } = require('uuid');
const { 
    user: UserModel,
    professionalProfile: ProfessionalProfileModel,
    professionalServices: ProfessionalServicesModel,
    professionalBookings: ProfessionalBookingsModel,
    bookingPayments: BookingPaymentsModel
} = require('../models/index');
const emailService = require('../services/email');

// Helper function to generate booking number
const generateBookingNumber = () => {
    return 'BK' + Date.now() + Math.floor(Math.random() * 1000);
};

// Helper function to generate confirmation code
const generateConfirmationCode = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Create Mobile Checkout Session
 */
exports.createMobileCheckoutSession = async (data, loginUser) => {
    try {
        const { professionalId, serviceId, eventDate, eventTime, location, specialRequests, returnUrl, cancelUrl } = data;
        
        if (!professionalId || !serviceId || !eventDate || !returnUrl || !cancelUrl) {
            throw new createError.BadRequest('Missing required fields');
        }

        // Validate client role
        const client = await UserModel.scope(['roleData']).findOne({
            where: { id: loginUser.id, isDeleted: false }
        });

        if (!client || client.roleData?.name !== 'client') {
            throw new createError.Forbidden('Only clients can create mobile bookings');
        }

        // Get service details for pricing
        const professional = await ProfessionalProfileModel.scope(['user']).findOne({
            where: { id: professionalId, isDeleted: false, isActive: true }
        });

        if (!professional) {
            throw new createError.NotFound('Professional not found or inactive');
        }

        const service = await ProfessionalServicesModel.findOne({
            where: { id: serviceId, professionalId: professionalId, isDeleted: false, isActive: true }
        });

        if (!service) {
            throw new createError.NotFound('Service not found or inactive');
        }
        const eventDateObj = new Date(eventDate);
        const startOfDay = new Date(eventDateObj.getFullYear(), eventDateObj.getMonth(), eventDateObj.getDate());
        const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000 - 1);
        // Check availability for the selected date
        const existingBooking = await ProfessionalBookingsModel.findOne({
            where: {
                professionalId: professionalId,
                eventDate: {
                    [require('sequelize').Op.between]: [startOfDay, endOfDay]
                },
                status: { [require('sequelize').Op.in]: ['pending', 'confirmed', 'in_progress'] }
            }
        });
    

        if (existingBooking) {
            throw new createError.BadRequest('Professional is not available on the selected date');
        }

        // Create booking record first (like web flow)
        const bookingData = {
            professionalId,
            clientId: loginUser.id,
            serviceId,
            bookingNumber: generateBookingNumber(),
            confirmationCode: generateConfirmationCode(),
            bookingDate: new Date(),
            eventDate: new Date(eventDate),
            eventTime,
            location,
            specialRequests,
            totalAmount: service.price,
            currency: service.currency || 'EUR',
            status: 'pending',
            paymentStatus: 'pending',
            paymentMethod: 'mobile_stripe'
        };

        const booking = await ProfessionalBookingsModel.create(bookingData);

        const upfrontAmount = service.price * 0.3; // 30% upfront

        // Create Stripe Checkout Session
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [{
                price_data: {
                    currency: 'eur',
                    product_data: {
                        name: `Booking Deposit - ${service.serviceName}`,
                        description: `30% upfront payment for ${service.serviceName}`,
                    },
                    unit_amount: Math.round(upfrontAmount * 100),
                },
                quantity: 1,
            }],
            mode: 'payment',
            success_url: `${returnUrl}?session_id={CHECKOUT_SESSION_ID}&booking_id=${booking.id}`,
            cancel_url: cancelUrl,
            metadata: {
                bookingId: booking.id,
                professionalId,
                serviceId,
                paymentType: 'upfront',
                amount: upfrontAmount,
                clientId: loginUser.id,
                eventDate,
                eventTime,
                location,
                specialRequests
            },
        });

        return {
            status: 1,
            data: {
                checkoutUrl: session.url,
                sessionId: session.id,
                bookingId: booking.id,
                professionalId,
                upfrontAmount,
                totalAmount: service.price,
                confirmationCode: booking.confirmationCode
            },
            message: 'Mobile checkout session created successfully'
        };

    } catch (error) {
        console.error('Mobile checkout error:', error);
        throw error;
    }
};

/**
 * Verify Mobile Payment and Complete Booking
 */
exports.verifyMobilePayment = async (data, loginUser) => {
    try {
        const { sessionId, professionalId } = data;
        
        if (!sessionId || !professionalId) {
            throw new createError.BadRequest('Missing sessionId or professionalId');
        }

        const session = await stripe.checkout.sessions.retrieve(sessionId);
        
        if (session.payment_status !== 'paid') {
            throw new createError.BadRequest('Payment not completed');
        }

        // Verify metadata matches
        if (session.metadata.clientId != loginUser.id || session.metadata.professionalId != professionalId) {
            throw new createError.Forbidden('Invalid session data');
        }

        const upfrontAmount = session.amount_total / 100;
        const totalAmount = upfrontAmount / 0.3; // Calculate total from 30%
        const remainingAmount = totalAmount * 0.7;
        const bookingId = session.metadata.bookingId;

        // Update booking status to confirmed
        const booking = await ProfessionalBookingsModel.findOne({
            where: { id: bookingId, clientId: loginUser.id }
        });

        if (!booking) {
            throw new createError.NotFound('Booking not found');
        }

        // Get professional data for stripeAccountId
        const professional = await ProfessionalProfileModel.scope(['user']).findByPk(professionalId);

        // Update booking status
        await booking.update({
            status: 'confirmed',
            advanceAmount: upfrontAmount,
            remainingAmount: remainingAmount,
            confirmationDate: new Date(),
            paymentStatus: 'partial',
            transactionId: session.payment_intent || null,
        });

        // Create payment record
        // Create payment record with correct field names
        await BookingPaymentsModel.create({
            bookingId: booking.id,
            clientId: loginUser.id,
            professionalId: professionalId,
            stripeSessionId: session.id,
            stripePaymentIntentId: session.payment_intent || null,
            stripeAccountId: professional.stripeConnectAccountId || 'platform',
            paymentType: 'upfront_30',
            amount: upfrontAmount,
            platformFee: 0,
            professionalAmount: upfrontAmount,
            currency: 'EUR',
            status: 'succeeded',
            capturedAt: new Date(),
            metadata: session
        });

        // Send confirmation email with confirmation code
        try {
            const professional = await ProfessionalProfileModel.scope(['user']).findByPk(professionalId);
            const service = await ProfessionalServicesModel.findByPk(booking.serviceId);
            const client = await UserModel.findByPk(loginUser.id);

            await emailService.sendEmail({
                to: client.email,
                subject: `Booking Confirmed - ${service.serviceName}`,
                template: '/views/booking-confirmation',
                data: {
                    clientName: client.fullName,
                    bookingNumber: booking.bookingNumber,
                    professionalName: professional.user.fullName,
                    serviceName: service.serviceName,
                    eventDate: new Date(booking.eventDate).toLocaleDateString(),
                    eventTime: booking.eventTime || 'TBD',
                    location: booking.location || 'TBD',
                    specialRequests: booking.specialRequests,
                    totalAmount: parseFloat(booking.totalAmount).toFixed(2),
                    upfrontAmount: upfrontAmount.toFixed(2),
                    remainingAmount: remainingAmount.toFixed(2),
                    platformFee: 0,
                    confirmationCode: booking.confirmationCode,
                    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000'
                }
            });
        } catch (emailError) {
            console.error('Error sending booking confirmation email:', emailError);
            // Don't fail the payment if email fails
        }

        return {
            status: 1,
            data: {
                paymentStatus: 'completed',
                sessionId: session.id,
                bookingId: booking.id,
                upfrontAmount,
                remainingAmount,
                totalAmount,
                professionalId,
                confirmationCode: booking.confirmationCode,
                message: `Remaining payment of €${remainingAmount.toFixed(2)} due after service completion. Use confirmation code: ${booking.confirmationCode}`
            },
            message: 'Mobile payment verified and booking confirmed successfully'
        };

    } catch (error) {
        console.error('Payment verification error:', error);
        throw error;
    }
};

/**
 * Get Payment Status
 */
exports.getPaymentStatus = async (sessionId, loginUser) => {
    try {
        if (!sessionId) {
            throw new createError.BadRequest('Session ID is required');
        }
        
        const session = await stripe.checkout.sessions.retrieve(sessionId);
        
        // Verify user owns this session
        if (session.metadata.clientId != loginUser.id) {
            throw new createError.Forbidden('Access denied to this session');
        }
        
        return {
            status: 1,
            data: {
                paymentStatus: session.payment_status,
                amount: session.amount_total / 100,
                currency: session.currency,
                sessionId: session.id
            },
            message: 'Payment status retrieved successfully'
        };

    } catch (error) {
        console.error('Payment status error:', error);
        throw error;
    }
};
