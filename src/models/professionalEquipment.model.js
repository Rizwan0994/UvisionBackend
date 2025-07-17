'use strict';
const {
    Model, DataTypes
} = require('sequelize');

module.exports = (sequelize) => {

    class ProfessionalEquipment extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
            // Associations are managed in /models/associate/config.js
        }
    }

    ProfessionalEquipment.init({
        professionalId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'professionalProfiles',
                key: 'id'
            }
        },
        equipmentName: {
            type: DataTypes.STRING,
            allowNull: false,
            comment: 'Name of the equipment'
        },
        equipmentType: {
            type: DataTypes.STRING,
            allowNull: true,
            comment: 'Type/category of equipment'
        },
        brand: {
            type: DataTypes.STRING,
            allowNull: true,
            comment: 'Brand of the equipment'
        },
        model: {
            type: DataTypes.STRING,
            allowNull: true,
            comment: 'Model of the equipment'
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true,
            comment: 'Description of the equipment'
        },
        specifications: {
            type: DataTypes.JSON,
            allowNull: true,
            comment: 'Technical specifications'
        },
        purchaseDate: {
            type: DataTypes.DATE,
            allowNull: true,
            comment: 'Date when equipment was purchased'
        },
        condition: {
            type: DataTypes.ENUM(
                'new',
                'excellent',
                'good',
                'fair',
                'poor'
            ),
            allowNull: true,
            defaultValue: 'good',
            comment: 'Condition of the equipment'
        },
        isOwned: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
            comment: 'Whether equipment is owned or rented'
        },
        isPrimary: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
            comment: 'Whether this is primary equipment for services'
        },
        isPortable: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
            comment: 'Whether equipment is portable'
        },
        weight: {
            type: DataTypes.DECIMAL(8, 2),
            allowNull: true,
            comment: 'Weight of equipment in kg'
        },
        powerRequirement: {
            type: DataTypes.STRING,
            allowNull: true,
            comment: 'Power requirements'
        },
        setupTime: {
            type: DataTypes.STRING,
            allowNull: true,
            comment: 'Time required for setup'
        },
        operatingCost: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: true,
            comment: 'Operating cost per use'
        },
        maintenanceSchedule: {
            type: DataTypes.JSON,
            allowNull: true,
            comment: 'Maintenance schedule details'
        },
        lastMaintenanceDate: {
            type: DataTypes.DATE,
            allowNull: true,
            comment: 'Date of last maintenance'
        },
        warrantyExpiry: {
            type: DataTypes.DATE,
            allowNull: true,
            comment: 'Warranty expiry date'
        },
        insuranceValue: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: true,
            comment: 'Insurance value'
        },
        tags: {
            type: DataTypes.JSON,
            allowNull: true,
            comment: 'Tags for equipment categorization'
        },
        imageUrl: {
            type: DataTypes.STRING(1000),
            allowNull: true,
            comment: 'Image URL of the equipment'
        },
        isActive: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
            comment: 'Whether equipment is active/available'
        },
        displayOrder: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
            comment: 'Order for displaying equipment'
        },
        isDeleted: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        }
    }, {
        sequelize,
        modelName: 'professionalEquipment',
        timestamps: true,
        paranoid: true,
        indexes: [
            {
                fields: ['professionalId']
            },
            {
                fields: ['equipmentType']
            },
            {
                fields: ['isPrimary']
            },
            {
                fields: ['isActive', 'isDeleted']
            }
        ]
    });

    return ProfessionalEquipment;
};
