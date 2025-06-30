'use strict';
const {
    Model, DataTypes
} = require('sequelize');

module.exports = (sequelize) => {
    class Designations extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
            // define association here
        }
    }
    Designations.init({
        name: DataTypes.TEXT,
        key: DataTypes.STRING,
        createdBy: {
            type: DataTypes.INTEGER,
        },
    }, {
        sequelize,
        modelName: 'designations',
        timestamps: true,
    });
    return Designations;
};