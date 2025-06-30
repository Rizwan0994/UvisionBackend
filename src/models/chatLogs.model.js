'use strict';
const {
    Model, DataTypes
} = require('sequelize');
const { CHAT_LOGS } = require('../constants/chat.constant');

module.exports = (sequelize) => {
    class ChatLogs extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
            // define association here
        }
    }
    ChatLogs.init({
        createdBy: DataTypes.INTEGER,
        userId: DataTypes.INTEGER,
        messageId: DataTypes.INTEGER,
        chatId: DataTypes.INTEGER,
        type: {
            type: DataTypes.ENUM,
            values: [CHAT_LOGS.CHAT_CREATED, CHAT_LOGS.USER_ADDED, CHAT_LOGS.USER_REMOVED, CHAT_LOGS.USER_LEFT]
        },
    }, {
        sequelize,
        modelName: 'chatLogs',
        timestamps: true,
    });
    return ChatLogs;
};