'use strict';
const ProfessionalMetricsHooks = require('../hooks/professionalMetrics.hooks');

/**
 * Professional metrics cron functions following the existing cron pattern
 */

/**
 * Update all professional metrics - runs every 6 hours
 */
exports.updateAllProfessionalMetrics = async () => {
    try {
        console.log('Running scheduled professional metrics update...');
        await ProfessionalMetricsHooks.scheduledMetricsUpdate();
        console.log('Professional metrics updated successfully');
        return { success: true, message: 'Professional metrics updated successfully' };
    } catch (error) {
        console.error('Error updating professional metrics:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Update response time metrics for active professionals - runs every hour
 */
exports.updateActiveResponseTimes = async () => {
    try {
        console.log('Running hourly response time metrics update...');
        
        const { ProfessionalProfile } = require('../models');
        const ProfessionalMetricsService = require('../services/professionalMetrics.service');
        
        const twentyFourHoursAgo = new Date();
        twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

        // Find professionals who have had messages in the last 24 hours
        const activeProfiles = await ProfessionalProfile.findAll({
            where: {
                isActive: true,
                isDeleted: false,
                updatedAt: { [require('sequelize').Op.gte]: twentyFourHoursAgo }
            }
        });

        for (const profile of activeProfiles) {
            await ProfessionalMetricsService.calculateResponseTime(profile.id);
        }

        console.log(`Updated response time metrics for ${activeProfiles.length} active professionals`);
        return { 
            success: true, 
            message: `Response time metrics updated for ${activeProfiles.length} professionals` 
        };
    } catch (error) {
        console.error('Error updating response time metrics:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Update completion rates for all professionals - runs daily
 */
exports.updateProfessionalCompletionRates = async () => {
    try {
        console.log('Running daily completion rate update...');
        
        const { ProfessionalProfile } = require('../models');
        const ProfessionalMetricsService = require('../services/professionalMetrics.service');
        
        const activeProfiles = await ProfessionalProfile.findAll({
            where: {
                isActive: true,
                isDeleted: false
            }
        });

        for (const profile of activeProfiles) {
            await ProfessionalMetricsService.updateCompletionRate(profile.id);
        }

        console.log(`Updated completion rates for ${activeProfiles.length} professionals`);
        return { 
            success: true, 
            message: `Completion rates updated for ${activeProfiles.length} professionals` 
        };
    } catch (error) {
        console.error('Error updating completion rates:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Manual trigger for updating specific professional metrics
 */
exports.updateSpecificProfessionalMetrics = async (professionalId) => {
    try {
        console.log(`Manual professional metrics update for professional ${professionalId}...`);
        await ProfessionalMetricsHooks.scheduledMetricsUpdate(professionalId);
        console.log(`Manual professional metrics update completed for professional ${professionalId}`);
        return { success: true, message: 'Professional metrics updated successfully' };
    } catch (error) {
        console.error(`Error in manual metrics update for professional ${professionalId}:`, error);
        return { success: false, error: error.message };
    }
};
