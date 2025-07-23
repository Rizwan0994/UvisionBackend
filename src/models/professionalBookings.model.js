'use strict';
const {
    Model, DataTypes
} = require('sequelize');

module.exports = (sequelize) => {

    class ProfessionalBookings extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
            // Associations are managed in /models/associate/config.js
        }
    }

    ProfessionalBookings.init({
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
        serviceId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'professionalServices',
                key: 'id'
            }
        },
        bookingNumber: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
            comment: 'Unique booking reference number'
        },
        confirmationCode: {
            type: DataTypes.STRING,
            allowNull: true,
            comment: 'Confirmation code for booking verification'
        },
        status: {
            type: DataTypes.ENUM(
                'pending', 
                'confirmed', 
                'in_progress', 
                'completed', 
                'cancelled', 
                'refunded',
                'disputed'
            ),
            allowNull: false,
            defaultValue: 'pending',
            comment: 'Booking status'
        },
        bookingDate: {
            type: DataTypes.DATE,
            allowNull: false,
            comment: 'Date and time of the booking'
        },
        eventDate: {
            type: DataTypes.DATE,
            allowNull: true,
            comment: 'Date of the actual event/service'
        },
        startTime: {
            type: DataTypes.TIME,
            allowNull: true,
            comment: 'Start time of the service'
        },
        duration: {
            type: DataTypes.STRING,
            allowNull: true,
            comment: 'Duration of the service'
        },
        location: {
            type: DataTypes.STRING,
            allowNull: true,
            comment: 'Location where service will be provided'
        },
        eventType: {
            type: DataTypes.STRING,
            allowNull: true,
            comment: 'Type of event (wedding, corporate, etc.)'
        },
        guestCount: {
            type: DataTypes.INTEGER,
            allowNull: true,
            comment: 'Number of guests/attendees'
        },
        specialRequirements: {
            type: DataTypes.TEXT,
            allowNull: true,
            comment: 'Special requirements from client'
        },
        additionalServices: {
            type: DataTypes.JSON,
            allowNull: true,
            comment: 'Additional services selected by client'
        },
        packageDetails: {
            type: DataTypes.JSON,
            allowNull: true,
            comment: 'Selected package details'
        },
        pricing: {
            type: DataTypes.JSON,
            allowNull: true,
            comment: 'Pricing breakdown'
        },
        totalAmount: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            comment: 'Total booking amount'
        },
        currency: {
            type: DataTypes.STRING(3),
            allowNull: true,
            defaultValue: 'EUR',
            comment: 'Currency for pricing'
        },
        paymentStatus: {
            type: DataTypes.ENUM(
                'pending',
                'partial',
                'paid',
                'refunded',
                'failed'
            ),
            allowNull: false,
            defaultValue: 'pending',
            comment: 'Payment status'
        },
        advanceAmount: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: true,
            comment: 'Advance payment amount'
        },
        remainingAmount: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: true,
            comment: 'Remaining payment amount'
        },
        paymentMethod: {
            type: DataTypes.STRING,
            allowNull: true,
            comment: 'Payment method used'
        },
        transactionId: {
            type: DataTypes.STRING,
            allowNull: true,
            comment: 'Payment transaction ID'
        },
        clientNotes: {
            type: DataTypes.TEXT,
            allowNull: true,
            comment: 'Notes from client'
        },
        professionalNotes: {
            type: DataTypes.TEXT,
            allowNull: true,
            comment: 'Notes from professional'
        },
        cancellationReason: {
            type: DataTypes.TEXT,
            allowNull: true,
            comment: 'Reason for cancellation'
        },
        cancellationPolicy: {
            type: DataTypes.JSON,
            allowNull: true,
            comment: 'Cancellation policy terms'
        },
        reminderSent: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
            comment: 'Whether reminder was sent'
        },
        confirmationDate: {
            type: DataTypes.DATE,
            allowNull: true,
            comment: 'Date when booking was confirmed'
        },
        completionDate: {
            type: DataTypes.DATE,
            allowNull: true,
            comment: 'Date when service was completed'
        },
        statusUpdatedAt: {
            type: DataTypes.DATE,
            allowNull: true,
            comment: 'Date when status was last updated'
        },
        isDeleted: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        }
    }, {
        sequelize,
        modelName: 'professionalBookings',
        tableName: 'professionalBookings',
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
                fields: ['serviceId']
            },
            {
                fields: ['status']
            },
            {
                fields: ['paymentStatus']
            },
            {
                fields: ['bookingDate']
            },
            {
                fields: ['eventDate']
            },
            {
                fields: ['bookingNumber'],
                unique: true
            }
        ]
    });

    return ProfessionalBookings;
};
