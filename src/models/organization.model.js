'use strict';
const {
    Model, DataTypes
} = require('sequelize');

module.exports = (sequelize) => {
    class Organization extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
            // define association here
        }
    }
    Organization.init({
        name: DataTypes.STRING,
        image: {
            type:DataTypes.STRING,
            defaultValue: "https://chatapp-storage-2022.s3.us-west-2.amazonaws.com/Default_Hospital_Image.png"
        },
        owner: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        },
        createdBy: DataTypes.INTEGER,
    }, {
        sequelize,
        modelName: 'organization',
        timestamps: true,
    });
    return Organization;
};