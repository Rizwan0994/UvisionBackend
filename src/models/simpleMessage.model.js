'use strict';
const {
    Model, DataTypes
} = require('sequelize');

module.exports = (sequelize) => {
    class SimpleMessage extends Model {
        static associate(models) {
            // Associations are defined in models/associate/config.js
        }
    }
    
    SimpleMessage.init({
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        conversationId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'conversations',
                key: 'id'
            }
        },
        senderId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'users',
                key: 'id'
            }
        },
        message: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        messageType: {
            type: DataTypes.ENUM('text', 'image', 'video', 'document', 'file'),
            defaultValue: 'text'
        },
        fileUrl: {
            type: DataTypes.STRING,
            allowNull: true
        },
        fileName: {
            type: DataTypes.STRING,
            allowNull: true
        },
        originalFileName: {
            type: DataTypes.STRING,
            allowNull: true
        },
        fileSize: {
            type: DataTypes.BIGINT,
            allowNull: true
        },
        mimeType: {
            type: DataTypes.STRING,
            allowNull: true
        },
        s3Key: {
            type: DataTypes.STRING,
            allowNull: true
        },
        isRead: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        },
        readAt: {
            type: DataTypes.DATE,
            allowNull: true
        }
    }, {
        sequelize,
        modelName: 'simpleMessage',
        tableName: 'simple_messages',
        timestamps: true,
        indexes: [
            {
                fields: ['conversationId', 'createdAt']
            },
            {
                fields: ['senderId']
            }
        ]
    });
    
    return SimpleMessage;
};
