'use strict';
const {
    Model, DataTypes
} = require('sequelize');

module.exports = (sequelize) => {
    class MessageEmoji extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
            // define association here
        }
    }
    MessageEmoji.init({
        messageId: DataTypes.INTEGER,
        userId: DataTypes.INTEGER,
        emojiCode: DataTypes.STRING,
        createdBy: DataTypes.INTEGER,
    }, {
        sequelize,
        modelName: 'messageEmoji',
        timestamps: true,
    });
    return MessageEmoji;
};