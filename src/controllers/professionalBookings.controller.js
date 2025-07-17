'use strict';

const { v4: uuidv4 } = require('uuid');
const createError = require('http-errors');
const {
    user: UserModel,
    professionalProfile: ProfessionalProfileModel,
    professionalServices: ProfessionalServicesModel,
    professionalBookings: ProfessionalBookingsModel,
    professionalAvailability: ProfessionalAvailabilityModel,
    Op
} = require("../models/index");

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
