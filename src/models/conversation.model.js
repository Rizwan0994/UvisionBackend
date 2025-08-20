'use strict';
const {
    Model, DataTypes
} = require('sequelize');

module.exports = (sequelize) => {
    class Conversation extends Model {
        static associate(models) {
            // Associations are defined in models/associate/config.js
        }
    }
    
    Conversation.init({
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
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
                model: 'users', 
                key: 'id'
            }
        },
        lastMessageAt: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        },
        lastMessage: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        lastMessageBy: {
            type: DataTypes.INTEGER,
            allowNull: true
        },
        isActive: {
            type: DataTypes.BOOLEAN,
            defaultValue: true
        }
    }, {
        sequelize,
        modelName: 'conversation',
        tableName: 'conversations',
        timestamps: true,
        indexes: [
            {
                unique: true,
                fields: ['clientId', 'professionalId']
            },
            {
                fields: ['lastMessageAt']
            }
        ]
    });
    
    return Conversation;
};
