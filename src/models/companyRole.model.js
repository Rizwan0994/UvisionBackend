'use strict';
const {
    Model, DataTypes
} = require('sequelize');

module.exports = (sequelize) => {
    class CompanyRole extends Model {}
    CompanyRole.init({
        name: DataTypes.STRING,
        createdBy: {
            type: DataTypes.INTEGER,
        },
    }, {
        sequelize,
        modelName: 'companyRole',
        timestamps: true,
    });
    return CompanyRole;
};