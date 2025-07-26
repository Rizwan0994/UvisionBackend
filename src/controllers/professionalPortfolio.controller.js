const {
    professionalPortfolio: ProfessionalPortfolioModel,
    professionalProfile: ProfessionalProfileModel,
    sequelize
} = require('../models');
const { MEDIA_TYPE } = require('../constants/professional.constant');
const createError = require('http-errors');

/**
 * Add Portfolio Item
 */
const addPortfolioItem = async (data, loginUser) => {
    try {
        const userId = loginUser.id;
        const {
            mediaType,
            mediaUrl
        } = data;

        // Get professional profile
        const professionalProfile = await ProfessionalProfileModel.findOne({
            where: { userId, isDeleted: false }
        });

        if (!professionalProfile) {
            throw new createError["NotFound"]('Professional profile not found');
        }

        const portfolioItem = await ProfessionalPortfolioModel.create({
            professionalId: professionalProfile.id,
            mediaType,
            mediaUrl,
            thumbnailUrl: null,
            displayOrder: 0,
            isPublic: true
        });

        return {
            data: portfolioItem,
            message: 'Portfolio item added successfully'
        };
    } catch (error) {
        console.error('Error in addPortfolioItem:', error);
        throw error;
    }
};

/**
 * Get My Portfolio
 */
const getMyPortfolio = async (req,res) => {
    try {
    
        const userId = req.loginUser.id;
        const { mediaType, page = 1, limit = 12 } = req.query;

        // Get professional profile
        const professionalProfile = await ProfessionalProfileModel.findOne({
            where: { userId, isDeleted: false }
        });

        if (!professionalProfile) {
            throw new createError["NotFound"]('Professional profile not found');
        }

        const whereClause = { 
            professionalId: professionalProfile.id,
            isDeleted: false 
        };

        if (mediaType) {
            whereClause.mediaType = mediaType;
        }

        const offset = (page - 1) * limit;

        const { count, rows } = await ProfessionalPortfolioModel.findAndCountAll({
            where: whereClause,
            order: [['displayOrder', 'ASC'], ['createdAt', 'DESC']],
            limit: parseInt(limit),
            offset: parseInt(offset)
        });

        const totalPages = Math.ceil(count / limit);

        return {
            data: {
                portfolio: rows,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages,
                    totalItems: count,
                    itemsPerPage: parseInt(limit)
                }
            },
            message: 'Portfolio retrieved successfully'
        };
    } catch (error) {
        console.error('Error in getMyPortfolio:', error);
        throw error;
    }
};

/**
 * Update Portfolio Item
 */
const updatePortfolioItem = async (portfolioId, data, loginUser) => {
    try {
        const userId = loginUser.id;
        const {
            mediaType,
            mediaUrl
        } = data;

        // Get professional profile
        const professionalProfile = await ProfessionalProfileModel.findOne({
            where: { userId, isDeleted: false }
        });

        if (!professionalProfile) {
            throw new createError["NotFound"]('Professional profile not found');
        }

        const portfolioItem = await ProfessionalPortfolioModel.findOne({
            where: { 
                id: portfolioId,
                professionalId: professionalProfile.id,
                isDeleted: false 
            }
        });

        if (!portfolioItem) {
            throw new createError["NotFound"]('Portfolio item not found');
        }

        await portfolioItem.update({
            mediaType,
            mediaUrl
        });

        return {
            data: portfolioItem,
            message: 'Portfolio item updated successfully'
        };
    } catch (error) {
        console.error('Error in updatePortfolioItem:', error);
        throw error;
    }
};

/**
 * Delete Portfolio Item
 */
const deletePortfolioItem = async (portfolioId, loginUser) => {
    try {
        const userId = loginUser.id;

        // Get professional profile
        const professionalProfile = await ProfessionalProfileModel.findOne({
            where: { userId, isDeleted: false }
        });

        if (!professionalProfile) {
            throw new createError["NotFound"]('Professional profile not found');
        }

        const portfolioItem = await ProfessionalPortfolioModel.findOne({
            where: { 
                id: portfolioId,
                professionalId: professionalProfile.id,
                isDeleted: false 
            }
        });

        if (!portfolioItem) {
            throw new createError["NotFound"]('Portfolio item not found');
        }

        // Soft delete
        await portfolioItem.update({
            isDeleted: true
        });

        return {
            data: { id: portfolioId },
            message: 'Portfolio item deleted successfully'
        };
    } catch (error) {
        console.error('Error in deletePortfolioItem:', error);
        throw error;
    }
};

module.exports = {
    addPortfolioItem,
    getMyPortfolio,
    updatePortfolioItem,
    deletePortfolioItem
};
