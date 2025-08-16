'use strict';
const {
    Model, DataTypes
} = require('sequelize');

module.exports = (sequelize) => {
    class Subscription extends Model {
        static associate(models) {
           //assoctaions are managed in /models/associate/config.js
 
        }
    }

    Subscription.init({
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        userId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'users',
                key: 'id'
            }
        },
        stripeCustomerId: {
            type: DataTypes.STRING,
            allowNull: true
        },
        stripeSubscriptionId: {
            type: DataTypes.STRING,
            allowNull: true
        },
        status: {
            type: DataTypes.ENUM(['active', 'inactive', 'canceled', 'past_due', 'trialing']),
            defaultValue: 'inactive'
        },
        plan: {
            type: DataTypes.ENUM(['essential', 'advanced', 'premium']),
            allowNull: false
        },
        billingCycle: {
            type: DataTypes.ENUM(['monthly', 'annual']),
            allowNull: true,
            defaultValue: 'monthly'
        },
        stripePriceId: {
            type: DataTypes.STRING,
            allowNull: false
        },
        currentPeriodStart: {
            type: DataTypes.DATE,
            allowNull: true
        },
        currentPeriodEnd: {
            type: DataTypes.DATE,
            allowNull: true
        },
        cancelAtPeriodEnd: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        },
        isPromotionalPricing: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false
        },
        promotionalPeriodEnd: {
            type: DataTypes.DATE,
            allowNull: true
        },
        isDeleted: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        }
    }, {
        sequelize,
        modelName: 'subscription',
        tableName: 'subscriptions',
        timestamps: true,
        indexes: [
            {
                unique: true,
                fields: ['userId', 'isDeleted'],
                where: {
                    isDeleted: false
                }
            }
        ]
    });

    return Subscription;
};
