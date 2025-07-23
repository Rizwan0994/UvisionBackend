const {
    professionalPortfolio: ProfessionalPortfolioModel,
    professionalProfile: ProfessionalProfileModel
} = require('../models');
const { successResponse, errorResponse } = require('../helpers/common');
const { MEDIA_TYPE } = require('../constants/professional.constant');

/**
 * Add Portfolio Item
 */
const addPortfolioItem = async (req, res) => {
    try {
        const userId = req.user.id;
        const {
            title,
            description,
            mediaType,
            mediaUrl,
            thumbnailUrl,
            category,
            tags,
            projectDate,
            clientName,
            projectType,
            location,
            equipment,
            isFeatured
        } = req.body;

        // Get professional profile
        const professionalProfile = await ProfessionalProfileModel.findOne({
            where: { userId, isDeleted: false }
        });

        if (!professionalProfile) {
            return errorResponse(res, 'Professional profile not found', 404);
        }

        const portfolioItem = await ProfessionalPortfolioModel.create({
            professionalId: ProfessionalProfileModel.id,
            title,
            description,
            mediaType,
            mediaUrl,
            thumbnailUrl,
            category,
            tags,
            projectDate,
            clientName,
            projectType,
            location,
            equipment,
            isFeatured: isFeatured || false
        });

        return successResponse(res, 'Portfolio item added successfully', portfolioItem);
    } catch (error) {
        console.error('Error in addPortfolioItem:', error);
        return errorResponse(res, 'Failed to add portfolio item', 500);
    }
};

/**
 * Get My Portfolio
 */
const getMyPortfolio = async (req, res) => {
    try {
        const userId = req.user.id;
        const { category, mediaType, page = 1, limit = 12 } = req.query;

        // Get professional profile
        const professionalProfile = await ProfessionalProfileModel.findOne({
            where: { userId, isDeleted: false }
        });

        if (!professionalProfile) {
            return errorResponse(res, 'Professional profile not found', 404);
        }

        const whereClause = { 
            professionalId: ProfessionalProfileModel.id,
            isDeleted: false 
        };

        if (category) {
            whereClause.category = category;
        }
        if (mediaType) {
            whereClause.mediaType = mediaType;
        }

        const offset = (page - 1) * limit;

        const { count, rows } = await ProfessionalPortfolioModel.findAndCountAll({
            where: whereClause,
            order: [['isFeatured', 'DESC'], ['displayOrder', 'ASC'], ['createdAt', 'DESC']],
            limit: parseInt(limit),
            offset: parseInt(offset)
        });

        const totalPages = Math.ceil(count / limit);

        return successResponse(res, 'Portfolio retrieved successfully', {
            portfolio: rows,
            pagination: {
                currentPage: parseInt(page),
                totalPages,
                totalItems: count,
                itemsPerPage: parseInt(limit)
            }
        });
    } catch (error) {
        console.error('Error in getMyPortfolio:', error);
        return errorResponse(res, 'Failed to retrieve portfolio', 500);
    }
};

/**
 * Get Portfolio by Professional ID
 */
const getPortfolioByProfessionalId = async (req, res) => {
    try {
        const { professionalId } = req.params;
        const { category, mediaType, page = 1, limit = 12 } = req.query;

        const whereClause = { 
            professionalId,
            isDeleted: false,
            isPublic: true 
        };

        if (category) {
            whereClause.category = category;
        }
        if (mediaType) {
            whereClause.mediaType = mediaType;
        }

        const offset = (page - 1) * limit;

        const { count, rows } = await ProfessionalPortfolioModel.findAndCountAll({
            where: whereClause,
            order: [['isFeatured', 'DESC'], ['displayOrder', 'ASC'], ['createdAt', 'DESC']],
            limit: parseInt(limit),
            offset: parseInt(offset)
        });

        const totalPages = Math.ceil(count / limit);

        return successResponse(res, 'Portfolio retrieved successfully', {
            portfolio: rows,
            pagination: {
                currentPage: parseInt(page),
                totalPages,
                totalItems: count,
                itemsPerPage: parseInt(limit)
            }
        });
    } catch (error) {
        console.error('Error in getPortfolioByProfessionalId:', error);
        return errorResponse(res, 'Failed to retrieve portfolio', 500);
    }
};

/**
 * Update Portfolio Item
 */
const updatePortfolioItem = async (req, res) => {
    try {
        const userId = req.user.id;
        const { portfolioId } = req.params;
        const {
            title,
            description,
            mediaType,
            mediaUrl,
            thumbnailUrl,
            category,
            tags,
            projectDate,
            clientName,
            projectType,
            location,
            equipment,
            isFeatured,
            isPublic
        } = req.body;

        // Get professional profile
        const professionalProfile = await ProfessionalProfileModel.findOne({
            where: { userId, isDeleted: false }
        });

        if (!professionalProfile) {
            return errorResponse(res, 'Professional profile not found', 404);
        }

        const portfolioItem = await ProfessionalPortfolioModel.findOne({
            where: { 
                id: portfolioId,
                professionalId: ProfessionalProfileModel.id,
                isDeleted: false 
            }
        });

        if (!portfolioItem) {
            return errorResponse(res, 'Portfolio item not found', 404);
        }

        await portfolioItem.update({
            title,
            description,
            mediaType,
            mediaUrl,
            thumbnailUrl,
            category,
            tags,
            projectDate,
            clientName,
            projectType,
            location,
            equipment,
            isFeatured,
            isPublic
        });

        return successResponse(res, 'Portfolio item updated successfully', portfolioItem);
    } catch (error) {
        console.error('Error in updatePortfolioItem:', error);
        return errorResponse(res, 'Failed to update portfolio item', 500);
    }
};

/**
 * Delete Portfolio Item
 */
const deletePortfolioItem = async (req, res) => {
    try {
        const userId = req.user.id;
        const { portfolioId } = req.params;

        // Get professional profile
        const professionalProfile = await ProfessionalProfileModel.findOne({
            where: { userId, isDeleted: false }
        });

        if (!professionalProfile) {
            return errorResponse(res, 'Professional profile not found', 404);
        }

        const portfolioItem = await ProfessionalPortfolioModel.findOne({
            where: { 
                id: portfolioId,
                professionalId: ProfessionalProfileModel.id,
                isDeleted: false 
            }
        });

        if (!portfolioItem) {
            return errorResponse(res, 'Portfolio item not found', 404);
        }

        await portfolioItem.update({ isDeleted: true });

        return successResponse(res, 'Portfolio item deleted successfully');
    } catch (error) {
        console.error('Error in deletePortfolioItem:', error);
        return errorResponse(res, 'Failed to delete portfolio item', 500);
    }
};

/**
 * Update Portfolio Display Order
 */
const updatePortfolioOrder = async (req, res) => {
    try {
        const userId = req.user.id;
        const { portfolioOrders } = req.body; // Array of {id, displayOrder}

        // Get professional profile
        const professionalProfile = await ProfessionalProfileModel.findOne({
            where: { userId, isDeleted: false }
        });

        if (!professionalProfile) {
            return errorResponse(res, 'Professional profile not found', 404);
        }

        // Update display orders
        for (const portfolioOrder of portfolioOrders) {
            await ProfessionalPortfolioModel.update(
                { displayOrder: portfolioOrder.displayOrder },
                { 
                    where: { 
                        id: portfolioOrder.id,
                        professionalId: ProfessionalProfileModel.id,
                        isDeleted: false 
                    }
                }
            );
        }

        return successResponse(res, 'Portfolio order updated successfully');
    } catch (error) {
        console.error('Error in updatePortfolioOrder:', error);
        return errorResponse(res, 'Failed to update portfolio order', 500);
    }
};

/**
 * Get Portfolio Categories
 */
const getPortfolioCategories = async (req, res) => {
    try {
        const { professionalId } = req.params;

        const categories = await ProfessionalPortfolioModel.findAll({
            where: { 
                professionalId,
                isDeleted: false,
                isPublic: true,
                category: { [db.Op.ne]: null }
            },
            attributes: ['category'],
            group: ['category'],
            raw: true
        });

        const categoryList = categories.map(item => item.category);

        return successResponse(res, 'Portfolio categories retrieved successfully', categoryList);
    } catch (error) {
        console.error('Error in getPortfolioCategories:', error);
        return errorResponse(res, 'Failed to retrieve portfolio categories', 500);
    }
};

/**
 * Increment Portfolio View Count
 */
const incrementViewCount = async (req, res) => {
    try {
        const { portfolioId } = req.params;

        const portfolioItem = await ProfessionalPortfolioModel.findOne({
            where: { 
                id: portfolioId,
                isDeleted: false,
                isPublic: true 
            }
        });

        if (!portfolioItem) {
            return errorResponse(res, 'Portfolio item not found', 404);
        }

        await portfolioItem.increment('viewCount');

        return successResponse(res, 'View count updated successfully');
    } catch (error) {
        console.error('Error in incrementViewCount:', error);
        return errorResponse(res, 'Failed to update view count', 500);
    }
};

module.exports = {
    addPortfolioItem,
    getMyPortfolio,
    getPortfolioByProfessionalId,
    updatePortfolioItem,
    deletePortfolioItem,
    updatePortfolioOrder,
    getPortfolioCategories,
    incrementViewCount
};
