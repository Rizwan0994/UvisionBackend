const { ProfessionalProfile, professionalBookings, ProfessionalReviews, Message } = require('../models');
const { Op } = require('sequelize');

class ProfessionalMetricsService {
    
    /**
     * Calculate and update professional level based on performance metrics
     * @param {number} professionalId - Professional profile ID
     * @returns {Promise<string>} - Updated level
     */
    static async calculateLevel(professionalId) {
        try {
            const profile = await ProfessionalProfile.findByPk(professionalId);
            if (!profile) {
                throw new Error('Professional profile not found');
            }

            // Get metrics for level calculation
            const metrics = await this.getMetrics(professionalId);
            
            let level = 'Level 01'; // Default level
            let score = 0;

            // Calculate score based on various factors
            
            // 1. Experience Years (max 20 points)
            if (profile.experienceYears) {
                score += Math.min(profile.experienceYears * 2, 20);
            }

            // 2. Rating (max 25 points)
            if (profile.rating) {
                score += (profile.rating / 5) * 25;
            }

            // 3. Completed Projects (max 20 points)
            if (profile.completedProjects) {
                score += Math.min(profile.completedProjects * 0.5, 20);
            }

            // 4. Quality Score (max 15 points)
            if (profile.qualityScore) {
                score += (profile.qualityScore / 100) * 15;
            }

            // 5. Completion Rate (max 10 points)
            if (profile.completionRate) {
                score += (profile.completionRate / 100) * 10;
            }

            // 6. Total Reviews (max 10 points)
            if (profile.totalReviews) {
                score += Math.min(profile.totalReviews * 0.2, 10);
            }

            // Determine level based on score
            if (score >= 80) {
                level = 'Expert';
            } else if (score >= 60) {
                level = 'Level 05';
            } else if (score >= 45) {
                level = 'Level 04';
            } else if (score >= 30) {
                level = 'Level 03';
            } else if (score >= 15) {
                level = 'Level 02';
            } else {
                level = 'Level 01';
            }

            // Update profile with new level
            await profile.update({
                level: level,
                levelCalculatedAt: new Date()
            });

            return level;
        } catch (error) {
            console.error('Error calculating professional level:', error);
            throw error;
        }
    }

    /**
     * Calculate and update response time based on message response patterns
     * @param {number} professionalId - Professional profile ID
     * @returns {Promise<string>} - Updated response time
     */
    static async calculateResponseTime(professionalId) {
        try {
            const profile = await ProfessionalProfile.findByPk(professionalId);
            if (!profile) {
                throw new Error('Professional profile not found');
            }

            // If no messages or response data, return default
            if (!profile.totalMessages || !profile.averageResponseTime) {
                await profile.update({
                    responseTime: 'New Professional',
                    responseTimeCalculatedAt: new Date()
                });
                return 'New Professional';
            }

            let responseTime = 'New Professional';
            const avgMinutes = profile.averageResponseTime;

            // Convert minutes to appropriate time description
            if (avgMinutes <= 30) {
                responseTime = '<30 minutes';
            } else if (avgMinutes <= 60) {
                responseTime = '<1 hour';
            } else if (avgMinutes <= 120) {
                responseTime = '<2 hours';
            } else if (avgMinutes <= 240) {
                responseTime = '<4 hours';
            } else if (avgMinutes <= 480) {
                responseTime = '<8 hours';
            } else if (avgMinutes <= 1440) {
                responseTime = '<1 day';
            } else if (avgMinutes <= 2880) {
                responseTime = '<2 days';
            } else {
                responseTime = '>2 days';
            }

            // Update profile with new response time
            await profile.update({
                responseTime: responseTime,
                responseTimeCalculatedAt: new Date()
            });

            return responseTime;
        } catch (error) {
            console.error('Error calculating response time:', error);
            throw error;
        }
    }

    /**
     * Update response time metrics when a professional sends a message
     * @param {number} professionalId - Professional profile ID
     * @param {number} responseTimeMinutes - Response time in minutes
     */
    static async updateResponseTimeMetrics(professionalId, responseTimeMinutes) {
        try {
            const profile = await ProfessionalProfile.findByPk(professionalId);
            if (!profile) {
                throw new Error('Professional profile not found');
            }

            const currentTotal = profile.totalMessageResponseTime || 0;
            const currentCount = profile.totalMessages || 0;
            
            // Update totals
            const newTotal = currentTotal + responseTimeMinutes;
            const newCount = currentCount + 1;
            const newAverage = Math.round(newTotal / newCount);

            await profile.update({
                totalMessages: newCount,
                totalMessageResponseTime: newTotal,
                lastResponseTime: responseTimeMinutes,
                averageResponseTime: newAverage
            });

            // Recalculate response time if it's been more than 24 hours since last calculation
            const lastCalculated = profile.responseTimeCalculatedAt;
            const hoursSinceLastCalculation = lastCalculated ? 
                (new Date() - lastCalculated) / (1000 * 60 * 60) : 24;

            if (hoursSinceLastCalculation >= 24) {
                await this.calculateResponseTime(professionalId);
            }

        } catch (error) {
            console.error('Error updating response time metrics:', error);
            throw error;
        }
    }

    /**
     * Update quality score based on reviews and performance
     * @param {number} professionalId - Professional profile ID
     */
    static async updateQualityScore(professionalId) {
        try {
            const profile = await ProfessionalProfile.findByPk(professionalId);
            if (!profile) {
                throw new Error('Professional profile not found');
            }

            let qualityScore = 0;
            let factors = 0;

            // Rating factor (40% of quality score)
            if (profile.rating && profile.totalReviews > 0) {
                qualityScore += (profile.rating / 5) * 40;
                factors++;
            }

            // Completion rate factor (30% of quality score)
            if (profile.completionRate) {
                qualityScore += (profile.completionRate / 100) * 30;
                factors++;
            }

            // Response time factor (20% of quality score)
            if (profile.averageResponseTime) {
                let responseScore = 0;
                if (profile.averageResponseTime <= 60) responseScore = 20;
                else if (profile.averageResponseTime <= 120) responseScore = 15;
                else if (profile.averageResponseTime <= 240) responseScore = 10;
                else if (profile.averageResponseTime <= 480) responseScore = 5;
                
                qualityScore += responseScore;
                factors++;
            }

            // Total reviews factor (10% of quality score)
            if (profile.totalReviews) {
                const reviewScore = Math.min(profile.totalReviews * 0.5, 10);
                qualityScore += reviewScore;
                factors++;
            }

            // If no factors, default to 0
            if (factors === 0) {
                qualityScore = 0;
            }

            await profile.update({
                qualityScore: Math.round(qualityScore * 100) / 100
            });

            // Recalculate level after quality score update
            await this.calculateLevel(professionalId);

        } catch (error) {
            console.error('Error updating quality score:', error);
            throw error;
        }
    }

    /**
     * Update completion rate based on booking history
     * @param {number} professionalId - Professional profile ID
     */
    static async updateCompletionRate(professionalId) {
        try {
            const profile = await ProfessionalProfile.findByPk(professionalId);
            if (!profile) {
                throw new Error('Professional profile not found');
            }

            // Get booking statistics
            const totalBookings = await professionalBookings.count({
                where: { professionalId: professionalId }
            });

            const completedBookings = await professionalBookings.count({
                where: { 
                    professionalId: professionalId,
                    status: 'completed'
                }
            });

            const cancelledBookings = await professionalBookings.count({
                where: { 
                    professionalId: professionalId,
                    status: 'cancelled'
                }
            });

            let completionRate = 100;
            if (totalBookings > 0) {
                completionRate = (completedBookings / totalBookings) * 100;
            }

            await profile.update({
                completionRate: Math.round(completionRate * 100) / 100,
                completedProjects: completedBookings,
                cancelledBookings: cancelledBookings
            });

            // Update quality score after completion rate update
            await this.updateQualityScore(professionalId);

        } catch (error) {
            console.error('Error updating completion rate:', error);
            throw error;
        }
    }

    /**
     * Get comprehensive metrics for a professional
     * @param {number} professionalId - Professional profile ID
     * @returns {Promise<Object>} - Metrics object
     */
    static async getMetrics(professionalId) {
        try {
            const profile = await ProfessionalProfile.findByPk(professionalId);
            if (!profile) {
                throw new Error('Professional profile not found');
            }

            return {
                level: profile.level,
                responseTime: profile.responseTime,
                qualityScore: profile.qualityScore,
                completionRate: profile.completionRate,
                rating: profile.rating,
                totalReviews: profile.totalReviews,
                completedProjects: profile.completedProjects,
                averageResponseTime: profile.averageResponseTime,
                totalMessages: profile.totalMessages,
                lastCalculated: {
                    level: profile.levelCalculatedAt,
                    responseTime: profile.responseTimeCalculatedAt
                }
            };
        } catch (error) {
            console.error('Error getting professional metrics:', error);
            throw error;
        }
    }

    /**
     * Recalculate all metrics for a professional
     * @param {number} professionalId - Professional profile ID
     */
    static async recalculateAllMetrics(professionalId) {
        try {
            await this.updateCompletionRate(professionalId);
            await this.updateQualityScore(professionalId);
            await this.calculateLevel(professionalId);
            await this.calculateResponseTime(professionalId);
            
            return await this.getMetrics(professionalId);
        } catch (error) {
            console.error('Error recalculating all metrics:', error);
            throw error;
        }
    }
}

module.exports = ProfessionalMetricsService;
