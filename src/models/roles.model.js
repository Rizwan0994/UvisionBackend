'use strict';
const {
    Model, DataTypes
} = require('sequelize');

module.exports = (sequelize) => {

    class Roles extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
            // define association here
        }
    }
    //three roles we have for our application
    // 1. admin
    //2 client
    //3 professional

    Roles.init({
        name: DataTypes.STRING,
    }, {
        sequelize,
        modelName: 'roles',
        timestamps: true,
    });

    return Roles;
};