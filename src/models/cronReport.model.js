'use strict';
const {
    Model, DataTypes
} = require('sequelize');

module.exports = (sequelize) => {
    class CronReport extends Model {}
    CronReport.init({
        job: DataTypes.STRING,
        lastSync: {
            type: DataTypes.DATE,
            defaultValue: sequelize.literal("CURRENT_TIMESTAMP"),
        },
        onDate: DataTypes.DATE,
        isRunning:{
            type: DataTypes.BOOLEAN,
            defaultValue: false
        },
        log: DataTypes.TEXT
    }, {
        sequelize,
        modelName: 'cronReport',
        timestamps: true,
    });
    return CronReport;
};