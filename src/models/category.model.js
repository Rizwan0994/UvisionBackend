'use strict';
const {
    Model, DataTypes
} = require('sequelize');

module.exports = (sequelize) => {

    class Category extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
            // Associations are managed in /models/associate/config.js
        }
    }

    Category.init({
        name: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
            comment: 'Category name (e.g., Photography, Videography, Music)'
        },
        slug: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
            comment: 'URL-friendly category slug'
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true,
            comment: 'Category description'
        },
        icon: {
            type: DataTypes.STRING,
            allowNull: true,
            comment: 'Category icon URL or icon class'
        },
        color: {
            type: DataTypes.STRING,
            allowNull: true,
            comment: 'Category color code for UI'
        },
        sortOrder: {
            type: DataTypes.INTEGER,
            allowNull: true,
            defaultValue: 0,
            comment: 'Sort order for category display'
        },
        isActive: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
            comment: 'Whether category is active'
        },
        isDeleted: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        }
    }, {
        sequelize,
        modelName: 'category',
        timestamps: true,
        paranoid: true,
        indexes: [
            {
                fields: ['name'],
                unique: true
            },
            {
                fields: ['slug'],
                unique: true
            },
            {
                fields: ['isActive', 'isDeleted']
            },
            {
                fields: ['sortOrder']
            }
        ]
    });

    return Category;
};
