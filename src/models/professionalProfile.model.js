'use strict';
const {
    Model, DataTypes
} = require('sequelize');

module.exports = (sequelize) => {

    class ProfessionalProfile extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
            // Associations are managed in /models/associate/config.js
        }
    }

    ProfessionalProfile.init({
        userId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            unique: true,
            references: {
                model: 'users',
                key: 'id'
            }
        },
        title: {
            type: DataTypes.STRING,
            allowNull: false,
            comment: 'Professional title (e.g., Photographer, Designer)'
        },
        specialization: {  //photographer, videographer, etc.
            type: DataTypes.STRING,
            allowNull: true,
            comment: 'Area of specialization'
        },
        bio: {
            type: DataTypes.TEXT,
            allowNull: true,
            comment: 'Professional bio/about section'
        },

        level: {
            type: DataTypes.STRING,
            allowNull: true,
            defaultValue: 'Level 01',
            comment: 'Professional level - automatically calculated by system based on performance metrics'
        },
        location: {
            type: DataTypes.STRING,
            allowNull: true,
            comment: 'Professional location (city, country)'
        },
        languages: {
            type: DataTypes.JSON,
            allowNull: true,
            comment: 'Languages spoken (array of languages)'
        },
        responseTime: {
            type: DataTypes.STRING,
            allowNull: true,
            defaultValue: 'New Professional',
            comment: 'Average response time - automatically calculated by system based on message response patterns'
        },
        rating: {
            type: DataTypes.DECIMAL(2, 1),
            allowNull: true,
            defaultValue: 0.0,
            comment: 'Average rating from reviews'
        },
        totalReviews: {
            type: DataTypes.INTEGER,
            allowNull: true,
            defaultValue: 0,
            comment: 'Total number of reviews'
        },
        completedProjects: {
            type: DataTypes.INTEGER,
            allowNull: true,
            defaultValue: 0,
            comment: 'Number of completed projects'
        },
        memberSince: {
            type: DataTypes.DATE,
            allowNull: true,
            comment: 'Date when professional joined'
        },
        // isVerified: {
        //     type: DataTypes.BOOLEAN,
        //     defaultValue: false,
        //     comment: 'Whether professional is verified'
        // },
        isAvailable: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
            comment: 'Whether professional is available for new bookings'
        },
        profileCompleteness: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
            comment: 'Profile completion percentage'
        },
        coverImage: {
            type: DataTypes.STRING(1000),
            allowNull: true,
            comment: 'Cover image URL for profile'
        },
        equipments: {
            type: DataTypes.JSON,
            allowNull: true,
            comment: 'Array of equipments professional'   
        },
        // System-calculated metrics for automatic level and response time calculation
        totalMessages: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
            comment: 'Total messages sent by professional'
        },
        totalMessageResponseTime: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
            comment: 'Total response time in minutes (for calculating average)'
        },
        lastResponseTime: {
            type: DataTypes.INTEGER,
            allowNull: true,
            comment: 'Last response time in minutes'
        },
        averageResponseTime: {
            type: DataTypes.INTEGER,
            allowNull: true,
            comment: 'Average response time in minutes - used for responseTime calculation'
        },
        qualityScore: {
            type: DataTypes.DECIMAL(5, 2),
            defaultValue: 0.0,
            comment: 'Quality score based on reviews and performance (0-100)'
        },
        completionRate: {
            type: DataTypes.DECIMAL(5, 2),
            defaultValue: 100.0,
            comment: 'Booking completion rate percentage'
        },
        cancelledBookings: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
            comment: 'Number of cancelled bookings'
        },
        levelCalculatedAt: {
            type: DataTypes.DATE,
            allowNull: true,
            comment: 'Last time level was calculated'
        },
        responseTimeCalculatedAt: {
            type: DataTypes.DATE,
            allowNull: true,
            comment: 'Last time response time was calculated'
        },
        isDeleted: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        },
        isActive: {
            type: DataTypes.BOOLEAN,
            defaultValue: true
        }
    }, {
        sequelize,
        modelName: 'ProfessionalProfile',
        tableName: 'professionalProfiles',
        timestamps: true,
        paranoid: true,
        indexes: [
            {
                fields: ['userId']
            },
            {
                fields: ['isActive', 'isDeleted']
            },
            {
                fields: ['rating']
            },
            {
                fields: ['location']
            }
        ]
    });

    return ProfessionalProfile;
};
