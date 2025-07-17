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
        title: {
            type: DataTypes.STRING,
            allowNull: true,
            comment: 'Review title'
        },
        comment: {
            type: DataTypes.TEXT,
            allowNull: true,
            comment: 'Review comment/feedback'
        },
        serviceType: {
            type: DataTypes.STRING,
            allowNull: true,
            comment: 'Type of service reviewed'
        },
        workQuality: {
            type: DataTypes.DECIMAL(2, 1),
            allowNull: true,
            comment: 'Rating for work quality'
        },
        communication: {
            type: DataTypes.DECIMAL(2, 1),
            allowNull: true,
            comment: 'Rating for communication'
        },
        timeliness: {
            type: DataTypes.DECIMAL(2, 1),
            allowNull: true,
            comment: 'Rating for timeliness'
        },
        professionalism: {
            type: DataTypes.DECIMAL(2, 1),
            allowNull: true,
            comment: 'Rating for professionalism'
        },
        valueForMoney: {
            type: DataTypes.DECIMAL(2, 1),
            allowNull: true,
            comment: 'Rating for value for money'
        },
        wouldRecommend: {
            type: DataTypes.BOOLEAN,
            allowNull: true,
            comment: 'Whether client would recommend'
        },
        projectDuration: {
            type: DataTypes.STRING,
            allowNull: true,
            comment: 'Duration of the project'
        },
        projectBudget: {
            type: DataTypes.STRING,
            allowNull: true,
            comment: 'Budget range of the project'
        },
        helpfulCount: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
            comment: 'Number of people who found review helpful'
        },
        isVerified: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
            comment: 'Whether review is verified'
        },
        isPublic: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
            comment: 'Whether review is public'
        },
        professionalResponse: {
            type: DataTypes.TEXT,
            allowNull: true,
            comment: 'Professional response to review'
        },
        responseDate: {
            type: DataTypes.DATE,
            allowNull: true,
            comment: 'Date when professional responded'
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
                fields: ['isPublic', 'isDeleted']
            },
            {
                fields: ['createdAt']
            }
        ]
    });

    return ProfessionalReviews;
};
