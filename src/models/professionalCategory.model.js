'use strict';
const {
    Model, DataTypes
} = require('sequelize');

module.exports = (sequelize) => {

    class ProfessionalCategory extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
            // Associations are managed in /models/associate/config.js
        }
    }

    ProfessionalCategory.init({
        professionalId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'professionalProfiles',
                key: 'id'
            }
        },
        categoryId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'categories',
                key: 'id'
            }
        },
        isPrimary: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
            comment: 'Whether this is the primary category for the professional'
        },
        isDeleted: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        }
    }, {
        sequelize,
        modelName: 'professionalCategory',
        tableName: 'professionalCategories',
        timestamps: true,
        paranoid: true,
        indexes: [
            {
                fields: ['professionalId']
            },
            {
                fields: ['categoryId']
            },
            {
                fields: ['professionalId', 'categoryId'],
                unique: true
            },
            {
                fields: ['isPrimary']
            }
        ]
    });

    return ProfessionalCategory;
};
