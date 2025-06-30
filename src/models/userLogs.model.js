'use strict';
const {
    Model, DataTypes
} = require('sequelize');
const { LOGS } = require('../constants/user.constant');

module.exports = (sequelize) => {
    class UserLogs extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
            // define association here
        }
    }
    UserLogs.init({
        userId: DataTypes.INTEGER,
        time: DataTypes.DATE,
        date: DataTypes.DATE,
        type: { 
            type: DataTypes.ENUM, 
            values: [LOGS.CLOCKIN, LOGS.CLOCKOUT, LOGS.OUT_FOR_BREAK, LOGS.BACK_FROM_BREAK, LOGS.ON_CALL_START, LOGS.ON_CALL_END], 
            defaultValue: null 
        },
    }, {
        sequelize,
        modelName: 'userLogs',
        timestamps: true,
    });
    return UserLogs;
};