'use strict';
const {
    Model, DataTypes
} = require('sequelize');

module.exports = (sequelize) => {
    class DesignationGroup extends Model {}
    DesignationGroup.init({
        designationId: DataTypes.INTEGER,
        chatId: DataTypes.INTEGER,
        createdBy: {
            type: DataTypes.INTEGER,
        },
    }, {
        sequelize,
        modelName: 'designationGroup',
        timestamps: true,
    });
    return DesignationGroup;
};