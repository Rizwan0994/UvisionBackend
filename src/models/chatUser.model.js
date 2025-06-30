'use strict';
const {
    Model, DataTypes
} = require('sequelize');

module.exports = (sequelize) => {
    class ChatUsers extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
            // define association here
        }
    }
    ChatUsers.init({
        chatId: DataTypes.INTEGER,
        userId: DataTypes.INTEGER,
        isAdmin: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        },
        initialMessage:{ type: DataTypes.BOOLEAN, defaultValue: true },
        isImportantChat:{ type: DataTypes.BOOLEAN, defaultValue: true },
    }, {
        defaultScope: {
            where: { isGhostChat: false },
        },
        sequelize,
        modelName: 'chatusers',
        timestamps: true,
    });
    return ChatUsers;
};