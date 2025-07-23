'use strict';
const {
    Model, DataTypes
} = require('sequelize');

module.exports = (sequelize) => {

    class ProfessionalAvailability extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
            // Associations are managed in /models/associate/config.js
        }
    }

    ProfessionalAvailability.init({
        professionalId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'professionalProfiles',
                key: 'id'
            }
        },
        dayOfWeek: {
            type: DataTypes.ENUM(
                'monday',
                'tuesday', 
                'wednesday',
                'thursday',
                'friday',
                'saturday',
                'sunday'
            ),
            allowNull: true,
            comment: 'Day of week for recurring availability'
        },
        specificDate: {
            type: DataTypes.DATEONLY,
            allowNull: true,
            comment: 'Specific date for one-time availability'
        },
        availabilityType: {
            type: DataTypes.ENUM(
                'recurring',
                'specific',
                'blocked'
            ),
            allowNull: false,
            defaultValue: 'recurring',
            comment: 'Type of availability setting'
        },
        startTime: {
            type: DataTypes.TIME,
            allowNull: true,
            comment: 'Start time for availability'
        },
        endTime: {
            type: DataTypes.TIME,
            allowNull: true,
            comment: 'End time for availability'
        },
        isAvailable: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
            comment: 'Whether professional is available during this time'
        },
        timeSlots: {
            type: DataTypes.JSON,
            allowNull: true,
            comment: 'Specific time slots available'
        },
        maxBookings: {
            type: DataTypes.INTEGER,
            allowNull: true,
            comment: 'Maximum bookings allowed for this slot'
        },
        currentBookings: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
            comment: 'Current number of bookings for this slot'
        },
        timeZone: {
            type: DataTypes.STRING,
            allowNull: true,
            comment: 'Time zone for the availability'
        },
        notes: {
            type: DataTypes.TEXT,
            allowNull: true,
            comment: 'Notes about this availability slot'
        },
        priority: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
            comment: 'Priority for this availability slot'
        },
        isActive: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
            comment: 'Whether this availability is active'
        },
        isDeleted: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        }
    }, {
        sequelize,
        modelName: 'professionalAvailability',
        timestamps: true,
        paranoid: true,
        indexes: [
            {
                fields: ['professionalId']
            },
            {
                fields: ['dayOfWeek']
            },
            {
                fields: ['specificDate']
            },
            {
                fields: ['availabilityType']
            },
            {
                fields: ['isAvailable', 'isActive']
            }
        ]
    });

    return ProfessionalAvailability;
};
