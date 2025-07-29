'use strict';
const {
    Model, DataTypes
} = require('sequelize');

module.exports = (sequelize) => {

    class ProfessionalReviews extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
            // Associations are managed in /models/associate/config.js
        }
    }

    ProfessionalReviews.init({
        professionalId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'professionalProfiles',
                key: 'id'
            }
        },
        clientId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'users',
                key: 'id'
            }
        },
        bookingId: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'professionalBookings',
                key: 'id'
            }
        },
        rating: {
            type: DataTypes.DECIMAL(2, 1),
            allowNull: false,
            validate: {
                min: 1.0,
                max: 5.0
            },
            comment: 'Rating from 1.0 to 5.0'
        },
        // title: {
        //     type: DataTypes.STRING,
        //     allowNull: true,
        //     comment: 'Review title'
        // },
        comment: {
            type: DataTypes.TEXT,
            allowNull: true,
            comment: 'Review comment/feedback'
        },

        isDeleted: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        }
    }, {
        sequelize,
        modelName: 'professionalReviews',
        timestamps: true,
        paranoid: true,
        indexes: [
            {
                fields: ['professionalId']
            },
            {
                fields: ['clientId']
            },
            {
                fields: ['bookingId']
            },
            {
                fields: ['rating']
            },
            {
                fields: ['isDeleted']
            },
            {
                fields: ['createdAt']
            }
        ]
    });

    return ProfessionalReviews;
};
