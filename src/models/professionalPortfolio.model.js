'use strict';
const {
    Model, DataTypes
} = require('sequelize');

module.exports = (sequelize) => {

    class ProfessionalPortfolio extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
            // Associations are managed in /models/associate/config.js
        }
    }

    ProfessionalPortfolio.init({
        professionalId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'professionalProfiles',
                key: 'id'
            },
            comment: 'Reference to professional profile'
        },
        title: {
            type: DataTypes.STRING,
            allowNull: false,
            comment: 'Portfolio item title'
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true,
            comment: 'Portfolio item description'
        },
        mediaType: {
            type: DataTypes.ENUM('image', 'video', 'document'),
            allowNull: false,
            defaultValue: 'image',
            comment: 'Type of media (image, video, document)'
        },
        mediaUrl: {
            type: DataTypes.STRING,
            allowNull: false,
            comment: 'URL of the main media file'
        },
        thumbnailUrl: {
            type: DataTypes.STRING,
            allowNull: true,
            comment: 'URL of the thumbnail image'
        },
        category: {
            type: DataTypes.STRING,
            allowNull: true,
            comment: 'Category of the portfolio item'
        },
        tags: {
            type: DataTypes.JSON,
            allowNull: true,
            comment: 'Array of tags for the portfolio item'
        },
        projectDate: {
            type: DataTypes.DATE,
            allowNull: true,
            comment: 'Date when the project was completed'
        },
        clientName: {
            type: DataTypes.STRING,
            allowNull: true,
            comment: 'Name of the client (if applicable)'
        },
        projectType: {
            type: DataTypes.STRING,
            allowNull: true,
            comment: 'Type of project (wedding, corporate, etc.)'
        },
        location: {
            type: DataTypes.STRING,
            allowNull: true,
            comment: 'Location where the project was done'
        },
        equipment: {
            type: DataTypes.JSON,
            allowNull: true,
            comment: 'Array of equipment used for the project'
        },
        isFeatured: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
            comment: 'Whether this item is featured in portfolio'
        },
        displayOrder: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
            comment: 'Order in which to display the portfolio item'
        },
        viewCount: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
            comment: 'Number of times this portfolio item was viewed'
        },
        likeCount: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
            comment: 'Number of likes for this portfolio item'
        },
        isPublic: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true,
            comment: 'Whether this portfolio item is publicly visible'
        },
        isDeleted: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
            comment: 'Soft delete flag'
        },
        createdAt: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW
        },
        updatedAt: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW
        }
    }, {
        sequelize,
        modelName: 'professionalPortfolio',
        tableName: 'professionalPortfolios',
        timestamps: true,
        indexes: [
            {
                fields: ['professionalId']
            },
            {
                fields: ['mediaType']
            },
            {
                fields: ['category']
            },
            {
                fields: ['isFeatured']
            },
            {
                fields: ['isPublic']
            },
            {
                fields: ['isDeleted']
            },
            {
                fields: ['displayOrder']
            },
            {
                fields: ['createdAt']
            }
        ]
    });

    return ProfessionalPortfolio;
};
