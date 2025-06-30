'use strict';
const {
    Model, DataTypes
} = require('sequelize');
const { MESSAGE_TAG } = require('../constants/message.constant');

module.exports = (sequelize) => {
    class MentionUser extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
            // define association here
        }
    }
    MentionUser.init({
        userId: DataTypes.INTEGER,
        messageId: DataTypes.INTEGER,
        chatId: DataTypes.INTEGER, 
        type: {
            type: DataTypes.ENUM,
            values: [MESSAGE_TAG.CC, MESSAGE_TAG.BCC, MESSAGE_TAG.MESSAGE],
            default: MESSAGE_TAG.CC
        },
    }, {
        sequelize,
        modelName: 'mentionuser',
        timestamps: true,
    });
    return MentionUser;
};