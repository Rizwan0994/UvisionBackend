'use strict';
const {
    Model, DataTypes
} = require('sequelize');
const { CRON_STATUS } = require('../constants/cron.constant');

module.exports = (sequelize) => {
    class Cron extends Model {}
    Cron.init({
        job: DataTypes.STRING,
        lastSync: {
            type: DataTypes.DATE,
            defaultValue: sequelize.literal("CURRENT_TIMESTAMP"),
        },
        isRunning:{
            type: DataTypes.BOOLEAN,
            defaultValue: false
        }
    },{
        sequelize,
        modelName: 'cron',
        timestamps: true,
    });
    return Cron;
};