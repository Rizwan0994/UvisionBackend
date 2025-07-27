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
        displayOrder: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
            comment: 'Order in which to display the portfolio item'
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
