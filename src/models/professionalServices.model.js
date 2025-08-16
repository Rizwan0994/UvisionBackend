'use strict';
const {
    Model, DataTypes
} = require('sequelize');

module.exports = (sequelize) => {

    class ProfessionalServices extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
            // Associations are managed in /models/associate/config.js
        }
    }

    ProfessionalServices.init({
        professionalId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'professionalProfiles',
                key: 'id'
            }
        },
        serviceName: {
            type: DataTypes.STRING,
            allowNull: false,
            comment: 'Name of the service'
        },
        duration: {
            type: DataTypes.INTEGER, 
            allowNull: false,
        },
        // serviceType: {
        //     type: DataTypes.STRING,
        //     allowNull: true,
        //     comment: 'Type/category of service'
        // },
        // description: {
        //     type: DataTypes.TEXT,
        //     allowNull: true,
        //     comment: 'Service description'
        // },
        price: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            comment: 'Service price'
        },
        currency: {
            type: DataTypes.STRING(3),
            allowNull: true,
            defaultValue: 'EUR',
            comment: 'Currency for pricing'
        },

        // isPopular: {
        //     type: DataTypes.BOOLEAN,
        //     defaultValue: false,
        //     comment: 'Whether this is a popular service'
        // },
        isActive: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
            comment: 'Whether service is active'
        },
        // displayOrder: {
        //     type: DataTypes.INTEGER,
        //     defaultValue: 0,
        //     comment: 'Order for displaying services'
        // },
        // tags: {
        //     type: DataTypes.JSON,
        //     allowNull: true,
        //     comment: 'Tags associated with service'
        // },
        isDeleted: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        }
    }, {
        sequelize,
        modelName: 'professionalServices',
        timestamps: true,
        paranoid: true,
        indexes: [
            {
                fields: ['professionalId']
            },
            {
                fields: ['isActive', 'isDeleted']
            },
            // {
            //     fields: ['serviceType']
            // },
            {
                fields: ['price']
            }
        ]
    });

    return ProfessionalServices;
};
