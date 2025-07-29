'use strict';

const createError = require('http-errors');
const {
    professionalReviews: ProfessionalReviewsModel,
    professionalBookings: ProfessionalBookingsModel,
    professionalProfile: ProfessionalProfileModel,
    user: UserModel,
    Op
} = require("../models/index");

/**
 * Create a new review for a completed booking
 */
exports.createReview = async (data, loginUser) => {
    try {
        const { bookingId, rating, comment } = data;

        // Validate input
        if (!bookingId || !rating) {
            throw new createError["BadRequest"]("Booking ID and rating are required");
        }

        if (rating < 1.0 || rating > 5.0) {
            throw new createError["BadRequest"]("Rating must be between 1.0 and 5.0");
        }

        // Verify booking exists and belongs to the client
        const booking = await ProfessionalBookingsModel.findOne({
            where: { 
                id: bookingId, 
                clientId: loginUser.id,
                status: 'completed',
                paymentStatus: 'paid'
            },
            include: [
                {
                    model: ProfessionalProfileModel,
                    as: 'professional'
                }
            ]
        });

        if (!booking) {
            throw new createError["NotFound"]("Booking not found or not eligible for review");
        }

        // Check if review already exists
        const existingReview = await ProfessionalReviewsModel.findOne({
            where: { 
                bookingId: bookingId,
                clientId: loginUser.id,
                isDeleted: false
            }
        });

        if (existingReview) {
            throw new createError["BadRequest"]("Review already exists for this booking");
        }

        // Create the review
        const reviewData = {
            professionalId: booking.professionalId,
            clientId: loginUser.id,
            bookingId: bookingId,
            rating: parseFloat(rating),
            comment: comment ? comment.trim() : null
        };

        const review = await ProfessionalReviewsModel.create(reviewData);

        return {
            data: {
                review: {
                    id: review.id,
                    rating: review.rating,
                    comment: review.comment,
                    createdAt: review.createdAt
                }
            },
            message: "Review added successfully"
        };
    } catch (error) {
        throw error;
    }
};

/**
 * Get all reviews created by the client
 */
exports.getMyReviews = async (loginUser) => {
    try {
        const reviews = await ProfessionalReviewsModel.findAll({
            where: { 
                clientId: loginUser.id,
                isDeleted: false
            },
            include: [
                {
                    model: ProfessionalProfileModel,
                    as: 'professional',
                    include: [
                        {
                            model: UserModel,
                            as: 'user',
                            attributes: ['id', 'fullName', 'profilePicture']
                        }
                    ]
                },
                {
                    model: ProfessionalBookingsModel,
                    as: 'booking',
                    attributes: ['id', 'bookingNumber', 'eventDate']
                }
            ],
            order: [['createdAt', 'DESC']]
        });

        return {
            data: {
                reviews: reviews
            },
            message: "Reviews retrieved successfully"
        };
    } catch (error) {
        throw error;
    }
};

/**
 * Get all reviews for a specific professional
 */
exports.getReviewsByProfessional = async (professionalId) => {
    try {
        const reviews = await ProfessionalReviewsModel.findAll({
            where: { 
                professionalId: professionalId,
                isDeleted: false
            },
            include: [
                {
                    model: UserModel,
                    as: 'client',
                    attributes: ['id', 'fullName', 'profilePicture']
                },
                {
                    model: ProfessionalBookingsModel,
                    as: 'booking',
                    attributes: ['id', 'eventDate']
                }
            ],
            order: [['createdAt', 'DESC']]
        });

        // Calculate average rating
        const totalReviews = reviews.length;
        const averageRating = totalReviews > 0 
            ? reviews.reduce((sum, review) => sum + parseFloat(review.rating), 0) / totalReviews
            : 0;

        return {
            data: {
                reviews: reviews,
                averageRating: parseFloat(averageRating.toFixed(1)),
                totalReviews: totalReviews
            },
            message: "Professional reviews retrieved successfully"
        };
    } catch (error) {
        throw error;
    }
};
