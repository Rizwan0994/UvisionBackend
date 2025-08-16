const {
    professionalProfile: ProfessionalProfileModel,
    user: UserModel,
    category: CategoryModel,
    professionalCategory: ProfessionalCategoryModel,
    professionalPortfolio: ProfessionalPortfolioModel,
    professionalServices: ProfessionalServicesModel,
    Op
} = require('../models');
const ProfessionalMetricsService = require('../services/professionalMetrics.service');
const { geocodeLocation, calculateDistance } = require('../services/geocoding.service');
const createError = require('http-errors');

/**
 * Create or update professional profile
 * Note: responseTime and level are automatically calculated by the system
 */
const createOrUpdateProfile = async (data, loginUser) => {
    const userId = loginUser.id;
    
    // Extract categories from data
    const { categories, ...profileData } = data;
    
    // Remove system-calculated fields from request data
    const {
        responseTime,
        level,
        qualityScore,
        completionRate,
        totalMessages,
        totalMessageResponseTime,
        lastResponseTime,
        averageResponseTime,
        cancelledBookings,
        levelCalculatedAt,
        responseTimeCalculatedAt,
        ...allowedFields
    } = profileData;

    // Warn if user tried to set system fields
    if (responseTime || level) {
        console.warn(`User ${userId} attempted to set system-calculated fields (responseTime: ${responseTime}, level: ${level})`);
    }

    try {
        //if profilePicture is provided then update in users table
        if (profileData.profileImage) {
            await UserModel.update(
                { profilePicture: profileData.profileImage },
                { where: { id: userId } }
            );
        }
        let profile = await ProfessionalProfileModel.findOne({
            where: { userId: userId }
        });

        if (profile) {
            // Update existing profile
            await profile.update(allowedFields);
        } else {
            // Create new profile
            profile = await ProfessionalProfileModel.create({
                userId: userId,
                memberSince: new Date(),
                ...allowedFields
            });
        }

        // Handle categories if provided
        if (categories && Array.isArray(categories)) {
            await updateProfessionalCategories(profile.id, categories);
        }

        // Calculate profile completeness
        const completeness = calculateProfileCompleteness(profile);
        await profile.update({ profileCompleteness: completeness });

        // Recalculate metrics after profile update
        await ProfessionalMetricsService.recalculateAllMetrics(profile.id);

        // Fetch updated profile with user data and categories
        const updatedProfile = await ProfessionalProfileModel.findByPk(profile.id, {
            include: [
                {
                    model: UserModel,
                    as: 'user',
                    attributes: ['id', 'fullName', 'email', 'userName', 'profilePicture']
                },
                {
                    model: CategoryModel,
                    as: 'categories',
                    attributes: ['id', 'name', 'slug', 'icon', 'color'],
                    through: { attributes: ['isPrimary'] }
                }
            ]
        });

        return {
            data: {
                profile: updatedProfile
            },
            message: 'Professional profile updated successfully'
        };

    } catch (error) {
        console.error('Error in createOrUpdateProfile:', error);
        throw error;
    }
};

/**
 * Get my professional profile
 */
const getMyProfile = async (loginUser) => {
    const userId = loginUser.id;

    try {
        const profile = await ProfessionalProfileModel.findOne({
            where: { userId: userId },
            exclude: [
                'title',
                'deletedAt',
                'isDeleted',
            ],
            include: [
                {
                    model: UserModel,
                    as: 'user',
                    attributes: ['id', 'fullName', 'email', 'userName', 'profilePicture']
                },
                {
                    model: CategoryModel,
                    as: 'categories',
                    attributes: ['id', 'name', 'slug', 'icon', 'color'],
                    through: { attributes: ['isPrimary'] }
                }
            ]
        });

        if (!profile) {
            throw new createError["NotFound"]('Professional profile not found');
        }

        // Get current metrics
        const metrics = await ProfessionalMetricsService.getMetrics(profile.id);

        return {
            data: {
                profile: profile,
                metrics: metrics
            },
            message: 'Profile retrieved successfully'
        };

    } catch (error) {
        console.error('Error in getMyProfile:', error);
        throw error;
    }
};

/**
 * Get public professional profile
 */
const getProfile = async (professionalId) => {
    try {
        const profile = await ProfessionalProfileModel.findOne({
            where: { 
                id: professionalId,
                isActive: true,
                isDeleted: false
            },
            include: [
                {
                    model: UserModel,
                    as: 'user',
                    attributes: ['id', 'fullName', 'userName', 'profilePicture']
                },
                {
                    model: CategoryModel,
                    as: 'categories',
                    attributes: ['id', 'name', 'slug', 'icon', 'color'],
                    through: { attributes: ['isPrimary'] },
                    required: false
                },
                {
                //PORTFOLIO
                    model: ProfessionalPortfolioModel,
                     as: 'portfolio',
                    attributes: ['id', 'mediaUrl', 'createdAt'],
                    required: false 

                },
                {
                    model: ProfessionalServicesModel,
                    as: 'services',
                    attributes: ['id','duration','serviceName', 'price','currency'],
                    where: { isDeleted: false },
                    required: false
                }
            ]
        });

        if (!profile) {
            throw new createError["NotFound"]('Professional profile not found');
        }

        // Return public profile (exclude sensitive metrics)
        const publicProfile = {
            ...profile.toJSON(),
            // Remove internal tracking fields from public view
            totalMessages: undefined,
            totalMessageResponseTime: undefined,
            lastResponseTime: undefined,
            averageResponseTime: undefined,
            levelCalculatedAt: undefined,
            responseTimeCalculatedAt: undefined
        };

        return {
            data: {
                profile: publicProfile
            },
            message: 'Profile retrieved successfully'
        };

    } catch (error) {
        console.error('Error in getProfile:', error);
        throw error;
    }
};

/**
 * Search professionals
 */
const searchProfessionals = async (data) => {
    const {
        name,
        location,
        minRating,
        maxRate,
        serviceType,
        categoryIds,
        page = 1,
        limit = 10,
        sortBy = 'rating',
        sortOrder = 'DESC',
        // New parameters for geolocation
        userLat,
        userLng,
        radius = 50, // Default radius in kilometers
        nearMe = false
    } = data;

    try {
        const whereClause = {
            isActive: true,
            isDeleted: false
        };

    
  

         

        if (location) {
            whereClause.location = { [Op.iLike]: `%${location}%` };
        }

        if (minRating) {
            whereClause.rating = { [Op.gte]: minRating };
        }

        const includeOptions = [
            {
                model: UserModel,
                as: 'user',
                attributes: ['id', 'fullName', 'userName', 'profilePicture'],
                required: false // Will be set to true if name search is used
            },
            {
                model: CategoryModel,
                as: 'categories',
                attributes: ['id', 'name', 'slug', 'icon', 'color'],
                through: { attributes: ['isPrimary'] }
            }
        ];

        //search by user name from usertable of professional
        if (name) {
            whereClause[Op.or] = [
                { '$user.fullName$': { [Op.iLike]: `%${name}%` } },
                { '$user.userName$': { [Op.iLike]: `%${name}%` } }
            ];
            // Make user join required when searching by name
            includeOptions[0].required = true;
        }

        // Add category filtering if specified
        if (categoryIds && categoryIds.length > 0) {
            includeOptions[1].where = {
                id: { [Op.in]: categoryIds }
            };
            includeOptions[1].required = true;
        } else {
            includeOptions[1].required = false;
        }

        const offset = (page - 1) * limit;

        const { count, rows } = await ProfessionalProfileModel.findAndCountAll({
            where: whereClause,
            include: includeOptions,
            order: [[sortBy, sortOrder]],
            limit: parseInt(limit),
            offset: offset,
            distinct: true
        });

        // Remove internal tracking fields from search results and add geocoding
        const professionalPromises = rows.map(async (profile) => {
            const profileData = {
                ...profile.toJSON(),
                totalMessages: undefined,
                totalMessageResponseTime: undefined,
                lastResponseTime: undefined,
                averageResponseTime: undefined,
                levelCalculatedAt: undefined,
                responseTimeCalculatedAt: undefined
            };

            // Geocode location if available
            let coordinates = null;
            let distance = null;

            if (profileData.location) {
                coordinates = await geocodeLocation(profileData.location);
            }

            // Calculate distance if user coordinates provided
            if (coordinates && userLat && userLng) {
                distance = calculateDistance(userLat, userLng, coordinates.lat, coordinates.lng);
            }

            return {
                ...profileData,
                coordinates,
                distance
            };
        });

        let cleanedProfiles = await Promise.all(professionalPromises);

        // Filter by radius if nearMe search and coordinates available
        if (nearMe && userLat && userLng) {
            cleanedProfiles = cleanedProfiles.filter(profile => 
                profile.distance !== null && profile.distance <= radius
            );
        }

        // Sort by distance if nearMe search, otherwise use original sorting
        if (nearMe && userLat && userLng) {
            cleanedProfiles.sort((a, b) => {
                if (a.distance === null) return 1;
                if (b.distance === null) return -1;
                return a.distance - b.distance;
            });
        }

        return {
            data: {
                professionals: cleanedProfiles,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: nearMe ? Math.ceil(cleanedProfiles.length / limit) : Math.ceil(count / limit),
                    totalItems: nearMe ? cleanedProfiles.length : count,
                    itemsPerPage: parseInt(limit)
                },
                searchInfo: {
                    nearMe,
                    userLocation: userLat && userLng ? { lat: userLat, lng: userLng } : null,
                    radius: nearMe ? radius : null
                }
            },
            message: 'Professionals retrieved successfully'
        };

    } catch (error) {
        console.error('Error in searchProfessionals:', error);
        throw error;
    }
};

/**
 * Update availability status
 */
const updateAvailability = async (isAvailable, loginUser) => {
    const userId = loginUser.id;

    try {
        const profile = await ProfessionalProfileModel.findOne({
            where: { userId: userId }
        });

        if (!profile) {
            throw new createError["NotFound"]('Professional profile not found');
        }

        await profile.update({ isAvailable });

        return {
            data: {
                isAvailable: profile.isAvailable
            },
            message: 'Availability updated successfully'
        };

    } catch (error) {
        console.error('Error in updateAvailability:', error);
        throw error;
    }
};

/**
 * Recalculate professional metrics
 */
const recalculateMetrics = async (loginUser) => {
    const userId = loginUser.id;

    try {
        const profile = await ProfessionalProfileModel.findOne({
            where: { userId: userId }
        });

        if (!profile) {
            throw new createError["NotFound"]('Professional profile not found');
        }

        const metrics = await ProfessionalMetricsService.recalculateAllMetrics(profile.id);

        return {
            data: {
                metrics: metrics
            },
            message: 'Metrics recalculated successfully'
        };

    } catch (error) {
        console.error('Error in recalculateMetrics:', error);
        throw error;
    }
};

/**
 * Update professional categories
 * @param {number} professionalId - Professional profile ID
 * @param {Array} categories - Array of category objects with id and isPrimary
 */
async function updateProfessionalCategories(professionalId, categories) {
    try {
        console.log(`Updating categories for professional ID: ${professionalId}`, categories);
        // Remove existing categories
       const t= await ProfessionalCategoryModel.destroy({
            where: { professionalId: professionalId }
        });
        console.log(`Removed ${t} existing categories for professional ID: ${professionalId}`);

        // Add new categories
        const categoryData = categories.map(category => ({
            professionalId: professionalId,
            categoryId: category.id || category.categoryId,
            isPrimary: category.isPrimary || false
        }));

        await ProfessionalCategoryModel.bulkCreate(categoryData);
    } catch (error) {
        console.error('Error updating professional categories:', error);
        throw error;
    }
}

/**
 * Calculate profile completeness percentage
 */
function calculateProfileCompleteness(profile) {
    const requiredFields = [
        'title',
        'specialization',
        'bio',
        'location',
        'experienceYears',
        'languages',
        'coverImage'
    ];

    const completedFields = requiredFields.filter(field => {
        const value = profile[field];
        return value !== null && value !== undefined && value !== '';
    });

    return Math.round((completedFields.length / requiredFields.length) * 100);
}

module.exports = {
    createOrUpdateProfile,
    getMyProfile,
    getProfile,
    searchProfessionals,
    updateAvailability,
    recalculateMetrics
};
