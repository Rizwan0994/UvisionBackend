const ProfessionalMetricsService = require('../services/professionalMetrics.service');

/**
 * Professional Metrics Hooks
 * These hooks automatically update professional metrics when certain events occur
 */

class ProfessionalMetricsHooks {
    
    /**
     * Hook to call when a professional sends a message
     * @param {number} professionalId - Professional profile ID
     * @param {Date} messageTimestamp - When the message was sent
     * @param {Date} previousMessageTimestamp - Previous message timestamp (for calculating response time)
     */
    static async onMessageSent(professionalId, messageTimestamp, previousMessageTimestamp) {
        try {
            if (previousMessageTimestamp) {
                const responseTimeMinutes = Math.round(
                    (messageTimestamp - previousMessageTimestamp) / (1000 * 60)
                );
                
                await ProfessionalMetricsService.updateResponseTimeMetrics(
                    professionalId,
                    responseTimeMinutes
                );
            }
        } catch (error) {
            console.error('Error in onMessageSent hook:', error);
        }
    }

    /**
     * Hook to call when a booking is completed
     * @param {number} professionalId - Professional profile ID
     */
    static async onBookingCompleted(professionalId) {
        try {
            await ProfessionalMetricsService.updateCompletionRate(professionalId);
        } catch (error) {
            console.error('Error in onBookingCompleted hook:', error);
        }
    }

    /**
     * Hook to call when a booking is cancelled
     * @param {number} professionalId - Professional profile ID
     */
    static async onBookingCancelled(professionalId) {
        try {
            await ProfessionalMetricsService.updateCompletionRate(professionalId);
        } catch (error) {
            console.error('Error in onBookingCancelled hook:', error);
        }
    }

    /**
     * Hook to call when a new review is added
     * @param {number} professionalId - Professional profile ID
     * @param {number} rating - Review rating
     */
    static async onReviewAdded(professionalId, rating) {
        try {
            // This will be implemented when review system is added
            // For now, we'll just recalculate all metrics
            await ProfessionalMetricsService.recalculateAllMetrics(professionalId);
        } catch (error) {
            console.error('Error in onReviewAdded hook:', error);
        }
    }

    /**
     * Hook to call when a professional's profile is updated
     * @param {number} professionalId - Professional profile ID
     */
    static async onProfileUpdated(professionalId) {
        try {
            await ProfessionalMetricsService.updateQualityScore(professionalId);
        } catch (error) {
            console.error('Error in onProfileUpdated hook:', error);
        }
    }

    /**
     * Scheduled hook to recalculate metrics (should be called by cron job)
     * @param {number} professionalId - Professional profile ID (optional, if not provided, updates all)
     */
    static async scheduledMetricsUpdate(professionalId = null) {
        try {
            if (professionalId) {
                await ProfessionalMetricsService.recalculateAllMetrics(professionalId);
            } else {
                // Update all professionals (this would be for a cron job)
                const { ProfessionalProfile } = require('../models');
                const profiles = await ProfessionalProfile.findAll({
                    where: { isActive: true, isDeleted: false }
                });

                for (const profile of profiles) {
                    await ProfessionalMetricsService.recalculateAllMetrics(profile.id);
                }
            }
        } catch (error) {
            console.error('Error in scheduledMetricsUpdate hook:', error);
        }
    }
}

module.exports = ProfessionalMetricsHooks;
