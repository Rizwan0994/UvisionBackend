'use strict';
const {
    Model, DataTypes
} = require('sequelize');

module.exports = (sequelize) => {
    class Version extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
            // define association here
        }
    }
    Version.init({
        versionId: DataTypes.STRING,
        note: DataTypes.TEXT,
        createdBy: DataTypes.INTEGER,
        publishAStatus :{
            type: DataTypes.BOOLEAN,
            defaultValue: false
        }
    }, {
        sequelize,
        modelName: 'version',
        timestamps: true,
    });
    return Version;
};