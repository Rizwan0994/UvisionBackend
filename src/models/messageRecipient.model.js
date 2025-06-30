'use strict';
const {
    Model, DataTypes
} = require('sequelize');

module.exports = (sequelize) => {
    class MessageRecipient extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
            // define association here
        }
    }
    MessageRecipient.init({
        recipientId: DataTypes.INTEGER,
        messageId: DataTypes.INTEGER,
        chatId: DataTypes.INTEGER,
        isRead: { type: DataTypes.BOOLEAN, defaultValue: false },
    }, {
        sequelize,
        modelName: 'messagerecipient',
        timestamps: true,
    });
    return MessageRecipient;
};