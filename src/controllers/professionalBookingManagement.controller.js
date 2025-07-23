'use strict';

const createError = require('http-errors');
const ProfessionalMetricsHooks = require('../hooks/professionalMetrics.hooks');
const {
    user: UserModel,
    professionalProfile: ProfessionalProfileModel,
    professionalBookings: ProfessionalBookingsModel,
    Op
} = require("../models/index");

// Get all bookings for a professional
exports.getProfessionalBookings = async (loginUser) => {
    try {
        // Check if user has professional profile
        const profile = await ProfessionalProfileModel.findOne({
            where: { userId: loginUser.id }
        });

        if (!profile) {
            return { status: 0, message: "Professional profile not found" };
        }

        const bookings = await ProfessionalBookingsModel.scope(['client', 'service']).findAll({
            where: { professionalId: profile.id },
            order: [['createdAt', 'DESC']]
        });

        return { 
            bookings, 
            message: "Professional bookings retrieved successfully." 
        };
    } catch (error) {
        throw error;
    }
};

// Update booking status by professional
exports.updateBookingStatus = async (bookingId, status, loginUser) => {
    try {
        // Check if user has professional profile
        const profile = await ProfessionalProfileModel.findOne({
            where: { userId: loginUser.id }
        });

        if (!profile) {
            return { status: 0, message: "Professional profile not found" };
        }

        // Find booking and verify ownership
        const booking = await ProfessionalBookingsModel.findOne({
            where: { 
                id: bookingId, 
                professionalId: profile.id 
            }
        });

        if (!booking) {
            return { status: 0, message: "Booking not found" };
        }

        // Validate status transition
        const validStatuses = ['confirmed', 'in_progress', 'completed', 'cancelled'];
        if (!validStatuses.includes(status)) {
            return { status: 0, message: "Invalid status" };
        }

        // Update booking status
        await ProfessionalBookingsModel.update({ 
            status: status,
            statusUpdatedAt: new Date(),
            ...(status === 'completed' && { completionDate: new Date() })
        }, {
            where: { id: bookingId, professionalId: profile.id }
        });

        // Trigger metrics hooks based on status
        if (status === 'completed') {
            await ProfessionalMetricsHooks.onBookingCompleted(profile.id);
        } else if (status === 'cancelled') {
            await ProfessionalMetricsHooks.onBookingCancelled(profile.id);
        }

        return { 
            message: `Booking status updated to ${status} successfully.` 
        };
    } catch (error) {
        throw error;
    }
};

// Get booking details for professional
exports.getProfessionalBookingDetails = async (bookingId, loginUser) => {
    try {
        // Check if user has professional profile
        const profile = await ProfessionalProfileModel.findOne({
            where: { userId: loginUser.id }
        });

        if (!profile) {
            return { status: 0, message: "Professional profile not found" };
        }

        const booking = await ProfessionalBookingsModel.scope(['client', 'service']).findOne({
            where: { 
                id: bookingId, 
                professionalId: profile.id 
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

// Get bookings statistics for professional
exports.getBookingStats = async (loginUser) => {
    try {
        // Check if user has professional profile
        const profile = await ProfessionalProfileModel.findOne({
            where: { userId: loginUser.id }
        });

        if (!profile) {
            return { status: 0, message: "Professional profile not found" };
        }

        const stats = await ProfessionalBookingsModel.findAll({
            where: { professionalId: profile.id },
            attributes: [
                'status',
                [ProfessionalBookingsModel.sequelize.fn('COUNT', ProfessionalBookingsModel.sequelize.col('id')), 'count']
            ],
            group: ['status']
        });

        const totalEarnings = await ProfessionalBookingsModel.findOne({
            where: { 
                professionalId: profile.id,
                status: 'completed',
                paymentStatus: 'paid'
            },
            attributes: [
                [ProfessionalBookingsModel.sequelize.fn('SUM', ProfessionalBookingsModel.sequelize.col('totalAmount')), 'totalEarnings']
            ]
        });

        return { 
            stats, 
            totalEarnings: totalEarnings?.dataValues?.totalEarnings || 0,
            message: "Booking statistics retrieved successfully." 
        };
    } catch (error) {
        throw error;
    }
};

// Get upcoming bookings for professional
exports.getUpcomingBookings = async (loginUser) => {
    try {
        // Check if user has professional profile
        const profile = await ProfessionalProfileModel.findOne({
            where: { userId: loginUser.id }
        });

        if (!profile) {
            return { status: 0, message: "Professional profile not found" };
        }

        const upcomingBookings = await ProfessionalBookingsModel.scope(['client', 'service']).findAll({
            where: { 
                professionalId: profile.id,
                eventDate: { [Op.gte]: new Date() },
                status: { [Op.in]: ['confirmed', 'in_progress'] }
            },
            order: [['eventDate', 'ASC']],
            limit: 10
        });

        return { 
            upcomingBookings, 
            message: "Upcoming bookings retrieved successfully." 
        };
    } catch (error) {
        throw error;
    }
};
