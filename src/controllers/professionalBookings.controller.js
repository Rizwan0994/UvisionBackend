'use strict';

const { v4: uuidv4 } = require('uuid');
const createError = require('http-errors');
const {
    user: UserModel,
    professionalProfile: ProfessionalProfileModel,
    professionalServices: ProfessionalServicesModel,
    professionalBookings: ProfessionalBookingsModel,
    professionalAvailability: ProfessionalAvailabilityModel,
    bookingPayments: BookingPaymentsModel,
    Op
} = require("../models/index");

// Import Stripe service
const stripeService = require('../services/stripe.service');
const emailService = require('../services/email');

// Helper function to generate booking number
const generateBookingNumber = () => {
    return 'BK' + Date.now() + Math.floor(Math.random() * 1000);
};

// Helper function to generate confirmation code
const generateConfirmationCode = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

// Create new booking (Step 1 - Service Selection)
exports.createBooking = async (data, loginUser) => {
    try {
        const { professionalId, serviceId, eventDate, duration } = data;

        // Validate client role
        const client = await UserModel.scope(['roleData']).findOne({
            where: { id: loginUser.id, isDeleted: false }
        });

        if (!client || client.roleData?.name !== 'client') {
            throw new createError["Forbidden"]("Only clients can create bookings");
        }

        // Check if professional exists
        const professional = await ProfessionalProfileModel.scope(['user']).findOne({
            where: { id: professionalId, isDeleted: false, isActive: true }
        });

        if (!professional) {
            return { status: 0, message: "Professional not found or inactive" };
        }

        // Check if service exists and belongs to professional
        const service = await ProfessionalServicesModel.findOne({
            where: { id: serviceId, professionalId: professionalId, isDeleted: false, isActive: true }
        });

        if (!service) {
            return { status: 0, message: "Service not found or inactive" };
        }

        // Check availability for the selected date
        const existingBooking = await ProfessionalBookingsModel.findOne({
            where: {
                professionalId: professionalId,
                eventDate: eventDate,
                status: { [Op.in]: ['pending', 'confirmed', 'in_progress'] }
            }
        });

        if (existingBooking) {
            return { status: 0, message: "Professional is not available on the selected date" };
        }

        const bookingData = {
            professionalId,
            clientId: loginUser.id,
            serviceId,
            bookingNumber: generateBookingNumber(),
            confirmationCode: generateConfirmationCode(),
            bookingDate: new Date(),
            eventDate: new Date(eventDate),
            duration,
            totalAmount: service.price,
            currency: service.currency || 'EUR',
            status: 'pending',
            paymentStatus: 'pending'
        };

        const booking = await ProfessionalBookingsModel.create(bookingData);
        
        return { 
            message: "Booking created successfully. Please complete the details.", 
            booking: {
                id: booking.id,
                bookingNumber: booking.bookingNumber,
                confirmationCode: booking.confirmationCode,
                professional: professional,
                service: service,
                eventDate: booking.eventDate,
                totalAmount: booking.totalAmount,
                currency: booking.currency,
                status: booking.status
            }
        };
    } catch (error) {
        throw error;
    }
};

// Update booking details (Step 2 - Event Details)
exports.updateBookingDetails = async (bookingId, data, loginUser) => {
    try {
        const { 
            location, 
            startTime, 
            duration, 
            eventType, 
            guestCount, 
            specialRequirements, 
            additionalServices 
        } = data;

        // Find booking and verify ownership
        const booking = await ProfessionalBookingsModel.findOne({
            where: { 
                id: bookingId, 
                clientId: loginUser.id, 
                status: 'pending' 
            }
        });

        if (!booking) {
            return { status: 0, message: "Booking not found or cannot be modified" };
        }

        // Calculate additional costs
        let additionalCost = 0;
        if (additionalServices && additionalServices.length > 0) {
            additionalCost = additionalServices.reduce((sum, service) => sum + (service.price || 0), 0);
        }

        const updateData = {
            location,
            startTime,
            duration,
            eventType,
            guestCount,
            specialRequirements,
            additionalServices: additionalServices || [],
            totalAmount: parseFloat(booking.totalAmount) + additionalCost,
            pricing: {
                basePrice: booking.totalAmount,
                additionalServices: additionalServices || [],
                additionalCost: additionalCost,
                totalAmount: parseFloat(booking.totalAmount) + additionalCost
            }
        };

        await ProfessionalBookingsModel.update(updateData, {
            where: { id: bookingId, clientId: loginUser.id }
        });

        const updatedBooking = await ProfessionalBookingsModel.findOne({
            where: { id: bookingId }
        });

        return { 
            message: "Booking details updated successfully.", 
            booking: updatedBooking 
        };
    } catch (error) {
        throw error;
    }
};

// Process payment (Step 3 - Payment)
exports.processPayment = async (bookingId, paymentData, loginUser) => {
    try {
        const { 
            paymentMethod, 
            cardNumber, 
            cardholderName, 
            expiryDate, 
            cvv,
            paymentType = 'full' // full or partial
        } = paymentData;

        // Find booking and verify ownership
        const booking = await ProfessionalBookingsModel.findOne({
            where: { 
                id: bookingId, 
                clientId: loginUser.id, 
                status: 'pending' 
            }
        });

        if (!booking) {
            return { status: 0, message: "Booking not found or cannot be processed" };
        }

        // Here you would integrate with your payment processor (Stripe, PayPal, etc.)
        // For now, we'll simulate payment processing
        const transactionId = 'TXN_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
        
        let paymentStatus = 'paid';
        let advanceAmount = null;
        let remainingAmount = null;

        if (paymentType === 'partial') {
            // For partial payment, take 25% advance
            advanceAmount = (parseFloat(booking.totalAmount) * 0.25).toFixed(2);
            remainingAmount = (parseFloat(booking.totalAmount) - parseFloat(advanceAmount)).toFixed(2);
            paymentStatus = 'partial';
        }

        const paymentUpdateData = {
            paymentStatus,
            paymentMethod,
            transactionId,
            advanceAmount,
            remainingAmount,
            status: 'confirmed' // Move to confirmed after payment
        };

        await ProfessionalBookingsModel.update(paymentUpdateData, {
            where: { id: bookingId, clientId: loginUser.id }
        });

        const updatedBooking = await ProfessionalBookingsModel.findOne({
            where: { id: bookingId }
        });

        return { 
            message: "Payment processed successfully. Booking confirmed.", 
            booking: updatedBooking,
            transactionId: transactionId
        };
    } catch (error) {
        throw error;
    }
};

// Confirm booking (Step 4 - Confirmation)
exports.confirmBooking = async (bookingId, confirmationCode, loginUser) => {
    try {
        // Find booking and verify ownership
        const booking = await ProfessionalBookingsModel.scope(['professional', 'client', 'service']).findOne({
            where: { 
                id: bookingId, 
                clientId: loginUser.id,
                confirmationCode: confirmationCode
            }
        });

        if (!booking) {
            return { status: 0, message: "Invalid booking or confirmation code" };
        }

        // Update booking status to confirmed
        await ProfessionalBookingsModel.update({ 
            status: 'confirmed',
            confirmedAt: new Date()
        }, {
            where: { id: bookingId }
        });

        // Here you would typically:
        // 1. Send confirmation email to client
        // 2. Send notification to professional
        // 3. Update professional's availability

        return { 
            message: "Booking confirmed successfully!", 
            booking: booking,
            confirmationCode: confirmationCode
        };
    } catch (error) {
        throw error;
    }
};

// Get client's bookings
exports.getMyBookings = async (loginUser) => {
    try {
        const bookings = await ProfessionalBookingsModel.scope(['professional', 'service']).findAll({
            where: { clientId: loginUser.id },
            order: [['createdAt', 'DESC']]
        });

        return { 
            bookings, 
            message: "Bookings retrieved successfully." 
        };
    } catch (error) {
        throw error;
    }
};

// Get specific booking details
exports.getBookingDetails = async (bookingId, loginUser) => {
    try {
        const booking = await ProfessionalBookingsModel.scope(['professional', 'client', 'service']).findOne({
            where: { 
                id: bookingId, 
                clientId: loginUser.id 
            }
        });

        if (!booking) {
            return { status: 0, message: "Booking not found" };
        }

        return { 
            booking, 
            message: "Booking details retrieved successfully." 
        };
    } catch (error) {
        throw error;
    }
};

// Cancel booking
exports.cancelBooking = async (bookingId, reason, loginUser) => {
    try {
        // Find booking and verify ownership
        const booking = await ProfessionalBookingsModel.findOne({
            where: { 
                id: bookingId, 
                clientId: loginUser.id,
                status: { [Op.in]: ['pending', 'confirmed'] }
            }
        });

        if (!booking) {
            return { status: 0, message: "Booking not found or cannot be cancelled" };
        }

        // Update booking status
        await ProfessionalBookingsModel.update({ 
            status: 'cancelled',
            cancellationReason: reason,
            cancelledAt: new Date()
        }, {
            where: { id: bookingId }
        });

        // Here you would typically:
        // 1. Process refund if payment was made
        // 2. Send notification to professional
        // 3. Update professional's availability

        return { 
            message: "Booking cancelled successfully." 
        };
    } catch (error) {
        throw error;
    }
};

// Get available time slots for a professional on a specific date
exports.getAvailableSlots = async (professionalId, date) => {
    try {
        const selectedDate = new Date(date);
        const startOfDay = new Date(selectedDate.setHours(0, 0, 0, 0));
        const endOfDay = new Date(selectedDate.setHours(23, 59, 59, 999));

        // Get existing bookings for the date
        const existingBookings = await ProfessionalBookingsModel.findAll({
            where: {
                professionalId: professionalId,
                eventDate: {
                    [Op.between]: [startOfDay, endOfDay]
                },
                status: { [Op.in]: ['pending', 'confirmed', 'in_progress'] }
            }
        });

        // Get professional's availability settings
        const availability = await ProfessionalAvailabilityModel.findAll({
            where: { professionalId: professionalId }
        });

        // Generate available time slots (simplified logic)
        const availableSlots = [];
        const workingHours = [9, 10, 11, 12, 13, 14, 15, 16, 17, 18]; // 9 AM to 6 PM
        
        workingHours.forEach(hour => {
            const slotTime = new Date(selectedDate);
            slotTime.setHours(hour, 0, 0, 0);
            
            const isBooked = existingBookings.some(booking => {
                const bookingTime = new Date(booking.eventDate);
                return bookingTime.getHours() === hour;
            });
            
            if (!isBooked) {
                availableSlots.push({
                    time: slotTime.toISOString(),
                    displayTime: `${hour}:00`,
                    available: true
                });
            }
        });

        return { 
            availableSlots, 
            message: "Available slots retrieved successfully." 
        };
    } catch (error) {
        throw error;
    }
};

// ================== PAYMENT PROCESSING FUNCTIONS ==================

/**
 * Process upfront payment (30%) for booking
 */
exports.processUpfrontPayment = async (data, loginUser) => {
    try {
        const { bookingId, paymentMethodId } = data;

        // Find booking and verify ownership
        const booking = await ProfessionalBookingsModel.findOne({
            where: { 
                id: bookingId, 
                clientId: loginUser.id, 
                status: 'pending' 
            },
            include: [
                {
                    model: ProfessionalProfileModel,
                    as: 'professional'
                },
                {
                    model: ProfessionalServicesModel,
                    as: 'service'
                }
            ]
        });

        if (!booking) {
            throw new createError["NotFound"]("Booking not found or not accessible");
        }

        // Check if professional has active Stripe account
        if (!booking.professional.stripeConnectAccountId || booking.professional.paymentAccountStatus !== 'active') {
            throw new createError["BadRequest"]("Professional payment account not set up");
        }

        // Get client details
        const client = await UserModel.findOne({
            where: { id: loginUser.id }
        });

        // Calculate payment amounts
        const amounts = stripeService.calculateBookingAmounts(booking.totalAmount);

        // Create upfront payment intent
        const { paymentIntent, amounts: calculatedAmounts } = await stripeService.createBookingPaymentIntent({
            totalAmount: booking.totalAmount,
            professionalStripeAccountId: booking.professional.stripeConnectAccountId,
            bookingId: booking.id,
            clientId: loginUser.id
        }, client.email);

        // Store payment record
        const paymentRecord = await BookingPaymentsModel.create({
            bookingId: booking.id,
            clientId: loginUser.id,
            professionalId: booking.professionalId,
            stripePaymentIntentId: paymentIntent.id,
            stripeAccountId: booking.professional.stripeConnectAccountId,
            paymentType: 'upfront_30',
            amount: calculatedAmounts.upfrontAmount,
            platformFee: calculatedAmounts.platformFee * 0.30, // 30% of platform fee
            professionalAmount: calculatedAmounts.professionalUpfront,
            currency: 'EUR',
            status: paymentIntent.status
        });

        // Update booking with payment info
        await booking.update({
            paymentStatus: 'partial',
            advanceAmount: calculatedAmounts.upfrontAmount,
            remainingAmount: calculatedAmounts.remainingAmount,
            transactionId: paymentIntent.id
        });

        return {
            message: "Payment intent created successfully",
            data: {
                paymentIntent: {
                    id: paymentIntent.id,
                    client_secret: paymentIntent.client_secret,
                    amount: calculatedAmounts.upfrontAmount,
                    currency: 'EUR'
                },
                amounts: calculatedAmounts,
                booking: {
                    id: booking.id,
                    bookingNumber: booking.bookingNumber,
                    service: booking.service.serviceName,
                    eventDate: booking.eventDate
                }
            }
        };
    } catch (error) {
        // Handle Stripe cross-border payment error specifically
        if (error.message && error.message.includes('Cannot create a destination charge for connected accounts in FR')) {
            throw new createError["BadRequest"]("Payment processing temporarily unavailable for this professional. Please contact support or try again later.");
        }
        
        // Handle other Stripe errors
        if (error.type === 'StripeError' || error.type === 'StripeInvalidRequestError') {
            throw new createError["BadRequest"]("Payment processing error. Please check your payment details and try again.");
        }
        
        throw error;
    }
};

/**
 * Confirm upfront payment after successful payment method confirmation
 */
exports.confirmUpfrontPayment = async (data, loginUser) => {
    try {
        const { paymentIntentId } = data;

        // Find payment record
        const paymentRecord = await BookingPaymentsModel.findOne({
            where: { 
                stripePaymentIntentId: paymentIntentId,
                clientId: loginUser.id,
                paymentType: 'upfront_30'
            },
            include: [
                {
                    model: ProfessionalBookingsModel,
                    as: 'booking'
                }
            ]
        });

        if (!paymentRecord) {
            throw new createError["NotFound"]("Payment record not found");
        }

        // Confirm and capture the payment
        const paymentResult = await stripeService.confirmAndCaptureUpfrontPayment(paymentIntentId);

        // Handle case where additional client action is required
        if (paymentResult.status === 'requires_action') {
            return {
                success: false,
                requires_action: true,
                client_secret: paymentResult.client_secret,
                next_action: paymentResult.next_action,
                message: paymentResult.message || "Additional authentication required"
            };
        }

        // Update payment record
        await paymentRecord.update({
            status: paymentResult.status,
            capturedAt: paymentResult.status === 'succeeded' ? new Date() : null,
            metadata: paymentResult
        });

        // Update booking status if payment successful
        if (paymentResult.status === 'succeeded') {
            await paymentRecord.booking.update({
                status: 'confirmed',
                paymentStatus: 'partial',
                confirmationDate: new Date()
            });

            // Generate confirmation code for remaining payment
            const confirmationCode = generateConfirmationCode();
            await paymentRecord.booking.update({ confirmationCode });

            // Get complete booking details for email
            const completeBooking = await ProfessionalBookingsModel.findOne({
                where: { id: paymentRecord.booking.id },
                include: [
                    {
                        model: ProfessionalProfileModel,
                        as: 'professional',
                        include: [
                            {
                                model: UserModel,
                                as: 'user'
                            }
                        ]
                    },
                    {
                        model: UserModel,
                        as: 'client'
                    },
                    {
                        model: ProfessionalServicesModel,
                        as: 'service'
                    }
                ]
            });

            // Calculate payment amounts for email
            const amounts = stripeService.calculateBookingAmounts(completeBooking.totalAmount);

            // Send booking confirmation email
            try {
                await emailService.sendEmail({
                    to: completeBooking.client.email,
                    subject: `Booking Confirmed - ${completeBooking.service.serviceName}`,
                    template: '/views/booking-confirmation',
                    data: {
                        clientName: completeBooking.client.fullName || completeBooking.client.firstName,
                        bookingNumber: completeBooking.bookingNumber,
                        professionalName: completeBooking.professional.user.fullName || completeBooking.professional.user.firstName,
                        serviceName: completeBooking.service.serviceName,
                        eventDate: completeBooking.eventDate ? new Date(completeBooking.eventDate).toLocaleDateString() : 'TBD',
                        eventTime: completeBooking.startTime || completeBooking.eventTime || 'TBD',
                        location: completeBooking.location || 'TBD',
                        specialRequests: completeBooking.specialRequirements || completeBooking.specialRequests,
                        totalAmount: parseFloat(completeBooking.totalAmount).toFixed(2),
                        upfrontAmount: amounts.upfrontAmount,
                        remainingAmount: amounts.remainingAmount,
                        platformFee: amounts.platformFee,
                        confirmationCode: confirmationCode,
                        frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000'
                    }
                });
            } catch (emailError) {
                console.error('Error sending booking confirmation email:', emailError);
                // Don't fail the payment if email fails
            }

            return {
                message: "Upfront payment confirmed successfully",
                booking: {
                    id: paymentRecord.booking.id,
                    status: 'confirmed',
                    confirmationCode: confirmationCode,
                    paymentStatus: 'partial'
                },
                paymentStatus: paymentResult.status
            };
        } else {
            throw new createError["BadRequest"](`Payment failed: ${paymentResult.status}`);
        }
    } catch (error) {
        throw error;
    }
};

/**
 * Process remaining payment (70%) when confirmation code is verified
 */
exports.processRemainingPayment = async (data, loginUser) => {
    try {
        const { bookingId, confirmationCode } = data;

        // Find booking with confirmation code
        const booking = await ProfessionalBookingsModel.findOne({
            where: { 
                id: bookingId,
                confirmationCode: confirmationCode,
                status: 'confirmed',
                paymentStatus: 'partial'
            },
            include: [
                {
                    model: ProfessionalProfileModel,
                    as: 'professional'
                }
            ]
        });

        if (!booking) {
            throw new createError["NotFound"]("Booking not found or confirmation code invalid");
        }

        // Get the original upfront payment record to get payment method
        const upfrontPayment = await BookingPaymentsModel.findOne({
            where: { 
                bookingId: booking.id,
                paymentType: 'upfront_30',
                status: 'succeeded'
            }
        });

        if (!upfrontPayment) {
            throw new createError["NotFound"]("Original payment not found");
        }

        // Get payment method from original payment intent
        const originalIntent = await stripeService.getPaymentIntentDetails(upfrontPayment.stripePaymentIntentId);
        const paymentMethodId = originalIntent.payment_method;

        // Get client details
        const client = await UserModel.findOne({
            where: { id: booking.clientId }
        });

        // Create remaining payment intent
        const { paymentIntent, amounts } = await stripeService.createRemainingPaymentIntent({
            totalAmount: booking.totalAmount,
            professionalStripeAccountId: booking.professional.stripeConnectAccountId,
            bookingId: booking.id,
            clientId: booking.clientId
        }, client.email, paymentMethodId);

        // Capture the remaining payment immediately
        const capturedIntent = await stripeService.captureRemainingPayment(paymentIntent.id);

        // Store remaining payment record
        const remainingPaymentRecord = await BookingPaymentsModel.create({
            bookingId: booking.id,
            clientId: booking.clientId,
            professionalId: booking.professionalId,
            stripePaymentIntentId: capturedIntent.id,
            stripeAccountId: booking.professional.stripeConnectAccountId,
            paymentType: 'remaining_70',
            amount: amounts.remainingAmount,
            platformFee: amounts.platformFee * 0.70, // 70% of platform fee
            professionalAmount: amounts.professionalRemaining,
            currency: 'EUR',
            status: capturedIntent.status,
            capturedAt: new Date(),
            metadata: capturedIntent
        });

        // Update booking status to completed
        await booking.update({
            status: 'completed',
            paymentStatus: 'paid',
            completionDate: new Date(),
            confirmationCode: null // Clear confirmation code after use
        });

        return {
            message: "Remaining payment processed successfully",
            booking: {
                id: booking.id,
                status: 'completed',
                paymentStatus: 'paid'
            },
            paymentAmount: amounts.remainingAmount,
            totalPaid: parseFloat(booking.totalAmount)
        };
    } catch (error) {
        // Handle Stripe cross-border payment error specifically
        if (error.message && error.message.includes('Cannot create a destination charge for connected accounts in FR')) {
            throw new createError["BadRequest"]("Payment processing temporarily unavailable for this professional. Please contact support or try again later.");
        }
        
        // Handle other Stripe errors
        if (error.type === 'StripeError' || error.type === 'StripeInvalidRequestError') {
            throw new createError["BadRequest"]("Payment processing error. Please check your payment details and try again.");
        }
        
        throw error;
    }
};

/**
 * Get booking payment details
 */
exports.getBookingPayments = async (bookingId, loginUser) => {
    try {
        // Verify booking ownership (client or professional)
        const booking = await ProfessionalBookingsModel.findOne({
            where: { 
                id: bookingId,
                [Op.or]: [
                    { clientId: loginUser.id },
                    { '$professional.userId$': loginUser.id }
                ]
            },
            include: [
                {
                    model: ProfessionalProfileModel,
                    as: 'professional'
                }
            ]
        });

        if (!booking) {
            throw new createError["NotFound"]("Booking not found or not accessible");
        }

        // Get all payment records for this booking
        const payments = await BookingPaymentsModel.findAll({
            where: { bookingId: bookingId },
            order: [['createdAt', 'ASC']]
        });

        return {
            booking: {
                id: booking.id,
                bookingNumber: booking.bookingNumber,
                status: booking.status,
                paymentStatus: booking.paymentStatus,
                totalAmount: booking.totalAmount,
                currency: booking.currency
            },
            payments: payments,
            message: "Payment details retrieved successfully"
        };
    } catch (error) {
        throw error;
    }
};
