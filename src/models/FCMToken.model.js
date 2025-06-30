'use strict';
const {
    Model, DataTypes
} = require('sequelize');

module.exports = (sequelize) => {
    class FCMToken extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
            // define association here
        }
    }
    FCMToken.init({
        userId: DataTypes.INTEGER,
        deviceType : DataTypes.STRING,
        browserType: DataTypes.STRING,
        deviceKey: DataTypes.STRING 
    }, {
        sequelize,
        modelName: 'FCMToken',
        timestamps: true,
    });
    return FCMToken;
};