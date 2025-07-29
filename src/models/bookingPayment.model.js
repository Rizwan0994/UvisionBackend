'use strict';
const {
    Model, DataTypes
} = require('sequelize');

module.exports = (sequelize) => {

    class BookingPayments extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
            // Associations are managed in /models/associate/config.js
        }
    }

    BookingPayments.init({
        bookingId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'professionalBookings',
                key: 'id',
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
        professionalId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'professionalProfiles',
                key: 'id'
            }
        },
        stripePaymentIntentId: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
            comment: 'Stripe Payment Intent ID'
        },
        stripeAccountId: {
            type: DataTypes.STRING,
            allowNull: false,
            comment: 'Professional Stripe Connect Account ID'
        },
        paymentType: {
            type: DataTypes.ENUM('upfront_30', 'remaining_70'),
            allowNull: false,
            comment: 'Type of payment - upfront 30% or remaining 70%'
        },
        amount: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            comment: 'Payment amount'
        },
        platformFee: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            comment: 'Platform fee (10% of total booking)'
        },
        professionalAmount: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            comment: 'Amount to be transferred to professional'
        },
        currency: {
            type: DataTypes.STRING(3),
            allowNull: false,
            defaultValue: 'EUR',
            comment: 'Payment currency'
        },
        status: {
            type: DataTypes.ENUM(
                'pending',
                'requires_payment_method',
                'requires_confirmation',
                'requires_action',
                'processing',
                'requires_capture',
                'cancelled',
                'succeeded',
                'failed'
            ),
            allowNull: false,
            defaultValue: 'pending',
            comment: 'Payment status from Stripe'
        },
        capturedAt: {
            type: DataTypes.DATE,
            allowNull: true,
            comment: 'When payment was captured'
        },
        transferredAt: {
            type: DataTypes.DATE,
            allowNull: true,
            comment: 'When amount was transferred to professional'
        },
        stripeTransferId: {
            type: DataTypes.STRING,
            allowNull: true,
            comment: 'Stripe transfer ID for professional payout'
        },
        failureReason: {
            type: DataTypes.STRING,
            allowNull: true,
            comment: 'Reason for payment failure'
        },
        metadata: {
            type: DataTypes.JSON,
            allowNull: true,
            comment: 'Additional payment metadata'
        },
        isDeleted: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        }
    }, {
        sequelize,
        modelName: 'bookingPayments',
        tableName: 'bookingPayments',
        timestamps: true,
        paranoid: true,
        indexes: [
            {
                fields: ['bookingId']
            },
            {
                fields: ['stripePaymentIntentId']
            },
            {
                fields: ['clientId']
            },
            {
                fields: ['professionalId']
            },
            {
                fields: ['status']
            },
            {
                fields: ['paymentType']
            }
        ]
    });

    return BookingPayments;
};
