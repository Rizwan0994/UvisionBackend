const {
    category: CategoryModel,
    professionalCategory: ProfessionalCategoryModel, 
    Op,
    sequelize
} = require('../models');

/**
 * Get all categories
 */
const getAllCategories = async (data = {}) => {
    const {
        isActive = true,
        page = 1,
        limit = 100
    } = data;

    try {
        const whereClause = {
            isDeleted: false
        };

        if (isActive !== null) {
            whereClause.isActive = isActive;
        }

        const offset = (page - 1) * limit;

        // const { count, rows } = await CategoryModel.findAndCountAll({
        //     where: whereClause,
        //     attributes: ['id', 'name', 'slug', 'description', 'icon', 'color', 'sortOrder', 'isActive'],
        //     order: [['sortOrder', 'ASC'], ['name', 'ASC']],
        //     limit: parseInt(limit),
        //     offset: parseInt(offset)
        // });

        const { count, rows } = await CategoryModel.findAndCountAll({
            where: whereClause,
            attributes: [
                'id',
                'name',
                'slug',
                'description',
                'icon',
                'color',
                'sortOrder',
                'isActive',
                // add count of professionals
                [sequelize.fn('COUNT', sequelize.col('professionalCategories.professionalId')), 'professionalCount']
            ],
            include: [
                {
                    model: ProfessionalCategoryModel,
                    attributes: [],
                }
            ],
            group: ['category.id'],
            order: [['sortOrder', 'ASC'], ['name', 'ASC']],
            limit: parseInt(limit),
            offset: parseInt(offset),
            subQuery: false
        });
        return {
            data: {
                categories: rows,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(count / limit),
                    totalItems: count,
                    itemsPerPage: parseInt(limit)
                }
            },
            message: 'Categories retrieved successfully'
        };
    } catch (error) {
        console.error('Error in getAllCategories:', error);
        throw error;
    }
};

/**
 * Get category by ID or slug
 */
const getCategoryById = async (identifier) => {
    try {
        const whereClause = {
            isDeleted: false
        };

        // Check if identifier is numeric (ID) or string (slug)
        if (isNaN(identifier)) {
            whereClause.slug = identifier;
        } else {
            whereClause.id = identifier;
        }

        const categoryData = await CategoryModel.findOne({
            where: whereClause,
            attributes: ['id', 'name', 'slug', 'description', 'icon', 'color', 'sortOrder', 'isActive']
        });

        if (!categoryData) {
            return { status: 0, message: 'Category not found' };
        }

        return {
            data: {
                category: categoryData
            },
            message: 'Category retrieved successfully'
        };

    } catch (error) {
        console.error('Error in getCategoryById:', error);
        throw error;
    }
};

/**
 * Search categories by name
 */
const searchCategories = async (data) => {
    const { query, page = 1, limit = 20 } = data;

    try {
        const whereClause = {
            isActive: true,
            isDeleted: false
        };

        if (query) {
            whereClause[Op.or] = [
                { name: { [Op.iLike]: `%${query}%` } },
                { description: { [Op.iLike]: `%${query}%` } }
            ];
        }

        const offset = (page - 1) * limit;

        const { count, rows } = await CategoryModel.findAndCountAll({
            where: whereClause,
            attributes: ['id', 'name', 'slug', 'description', 'icon', 'color', 'sortOrder'],
            order: [['sortOrder', 'ASC'], ['name', 'ASC']],
            limit: parseInt(limit),
            offset: offset
        });

        return {
            data: {
                categories: rows,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(count / limit),
                    totalItems: count,
                    itemsPerPage: parseInt(limit)
                }
            },
            message: 'Categories search completed successfully'
        };

    } catch (error) {
        console.error('Error in searchCategories:', error);
        throw error;
    }
};

module.exports = {
    getAllCategories,
    getCategoryById,
    searchCategories
};
