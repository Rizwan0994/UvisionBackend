'use strict';
const {
    Model, DataTypes
} = require('sequelize');
const { LOGS } = require('../constants/user.constant');

module.exports = (sequelize) => {
    class Logs extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
            // define association here
        }
    }
    Logs.init({
        userId: DataTypes.INTEGER,
        eventType: { 
            type: DataTypes.ENUM, 
            values: [ LOGS.CREATE, LOGS.UPDATE, LOGS.DELETE ], 
            defaultValue: null 
        },
        eventDescription: DataTypes.STRING,
        updatedBy : DataTypes.INTEGER
    }, {
        sequelize,
        modelName: 'logs',
        timestamps: true,
    });
    return Logs;
};