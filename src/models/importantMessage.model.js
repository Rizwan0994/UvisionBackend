'use strict';
const {
    Model, DataTypes
} = require('sequelize');

module.exports = (sequelize) => {
    class ImportantMessage extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
            // define association here
        }
    }
    ImportantMessage.init({
        chatId: DataTypes.INTEGER,
        userId: DataTypes.INTEGER,
        messageId: DataTypes.INTEGER,
    }, {
        sequelize,
        modelName: 'importantMessage',
        timestamps: true,
    });
    return ImportantMessage;
};