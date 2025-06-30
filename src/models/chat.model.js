'use strict';
const {
    Model, DataTypes
} = require('sequelize');
const { CHAT_TYPE } = require('../constants/chat.constant');

module.exports = (sequelize) => {
    class Chat extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
            // define association here
        }
    }
    Chat.init({
        name: DataTypes.STRING,
        users: DataTypes.ARRAY(DataTypes.INTEGER),
        image: DataTypes.STRING,
        description: DataTypes.STRING,
        createdBy: DataTypes.INTEGER,
        type: {
            type: DataTypes.ENUM,
            values: [CHAT_TYPE.GROUP, CHAT_TYPE.PRIVATE],
            default: CHAT_TYPE.PRIVATE
        },
        routineHour: {
            type: DataTypes.INTEGER,
        },
        routineMinute: {
            type: DataTypes.INTEGER,
        },
        emergencyHour: {
            type: DataTypes.INTEGER,
        },
        emergencyMinute: {
            type: DataTypes.INTEGER,
        },
        urgentHour: {
            type: DataTypes.INTEGER,
        },
        urgentMinute: {
            type: DataTypes.INTEGER,
        },
        allowOnlyAdminMessage: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        }
        // updatedAt:{
        //     type: DataTypes.DATE,
        // }
    }, {
        sequelize,
        modelName: 'chat',
        timestamps: true,
    });
    return Chat;
};