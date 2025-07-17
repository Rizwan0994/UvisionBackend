const {
    category: CategoryModel,
    Op
} = require('../models');

/**
 * Get all categories
 */
const getAllCategories = async (data = {}) => {
    const {
        includeSubcategories = true,
        parentId = null,
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

        if (parentId !== null) {
            whereClause.parentId = parentId;
        }

        const includeOptions = [];
        
        if (includeSubcategories && parentId === null) {
            includeOptions.push({
                model: CategoryModel,
                as: 'subcategories',
                attributes: ['id', 'name', 'slug', 'description', 'icon', 'color', 'sortOrder'],
                where: { isActive: true, isDeleted: false },
                required: false
            });
        }

        if (parentId !== null) {
            includeOptions.push({
                model: CategoryModel,
                as: 'parent',
                attributes: ['id', 'name', 'slug', 'icon', 'color']
            });
        }

        const offset = (page - 1) * limit;

        const { count, rows } = await CategoryModel.findAndCountAll({
            where: whereClause,
            include: includeOptions,
            order: [['sortOrder', 'ASC'], ['name', 'ASC']],
            limit: parseInt(limit),
            offset: offset
        });

        return {
            categories: rows,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(count / limit),
                totalItems: count,
                itemsPerPage: parseInt(limit)
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
            include: [
                {
                    model: CategoryModel,
                    as: 'subcategories',
                    attributes: ['id', 'name', 'slug', 'description', 'icon', 'color', 'sortOrder'],
                    where: { isActive: true, isDeleted: false },
                    required: false
                },
                {
                    model: CategoryModel,
                    as: 'parent',
                    attributes: ['id', 'name', 'slug', 'icon', 'color'],
                    required: false
                }
            ]
        });

        if (!categoryData) {
            return { status: 0, message: 'Category not found' };
        }

        return {
            category: categoryData,
            message: 'Category retrieved successfully'
        };

    } catch (error) {
        console.error('Error in getCategoryById:', error);
        throw error;
    }
};

/**
 * Get main categories only (no subcategories)
 */
const getMainCategories = async () => {
    try {
        const categories = await CategoryModel.findAll({
            where: {
                parentId: null,
                isActive: true,
                isDeleted: false
            },
            attributes: ['id', 'name', 'slug', 'description', 'icon', 'color', 'sortOrder'],
            order: [['sortOrder', 'ASC'], ['name', 'ASC']]
        });

        return {
            categories: categories,
            message: 'Main categories retrieved successfully'
        };

    } catch (error) {
        console.error('Error in getMainCategories:', error);
        throw error;
    }
};

/**
 * Get subcategories for a specific parent category
 */
const getSubcategories = async (parentId) => {
    try {
        const subcategories = await CategoryModel.findAll({
            where: {
                parentId: parentId,
                isActive: true,
                isDeleted: false
            },
            attributes: ['id', 'name', 'slug', 'description', 'icon', 'color', 'sortOrder'],
            include: [
                {
                    model: CategoryModel,
                    as: 'parent',
                    attributes: ['id', 'name', 'slug']
                }
            ],
            order: [['sortOrder', 'ASC'], ['name', 'ASC']]
        });

        return {
            subcategories: subcategories,
            message: 'Subcategories retrieved successfully'
        };

    } catch (error) {
        console.error('Error in getSubcategories:', error);
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
            attributes: ['id', 'name', 'slug', 'description', 'icon', 'color', 'parentId'],
            include: [
                {
                    model: CategoryModel,
                    as: 'parent',
                    attributes: ['id', 'name', 'slug'],
                    required: false
                }
            ],
            order: [['sortOrder', 'ASC'], ['name', 'ASC']],
            limit: parseInt(limit),
            offset: offset
        });

        return {
            categories: rows,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(count / limit),
                totalItems: count,
                itemsPerPage: parseInt(limit)
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
    getMainCategories,
    getSubcategories,
    searchCategories
};
