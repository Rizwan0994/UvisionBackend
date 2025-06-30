'use strict';
const {
    Model, DataTypes
} = require('sequelize');

module.exports = (sequelize) => {
    class ChatTemplate extends Model { }
    ChatTemplate.init({
        chatId: DataTypes.INTEGER,
        createdBy: DataTypes.INTEGER,
        templateTabId: DataTypes.INTEGER
    }, {
        sequelize,
        modelName: 'chatTemplate',
        timestamps: true,
    });
    return ChatTemplate;
};
