'use strict';

const SUBSCRIPTION_PERMISSIONS = require('../constants/subscription-permissions');

/**
 * Get permissions based on subscription plan and status
 */
const getPermissionsByPlan = (planType, subscriptionStatus) => {
    if (subscriptionStatus !== 'active') {
        return SUBSCRIPTION_PERMISSIONS.inactive;
    }
    
    return SUBSCRIPTION_PERMISSIONS[planType] || SUBSCRIPTION_PERMISSIONS.inactive;
};

/**
 * Check if user has specific feature permission
 */
const hasFeaturePermission = (permissions, feature) => {
    return permissions.features[feature] === true;
};

/**
 * Check if user is within usage limits
 */
const isWithinLimit = (permissions, limitType, currentUsage) => {
    const limit = permissions.limits[limitType];
    return currentUsage < limit;
};

module.exports = {
    getPermissionsByPlan,
    hasFeaturePermission,
    isWithinLimit
};
