'use strict';
const {
    Model, DataTypes
} = require('sequelize');

module.exports = (sequelize) => {

    class UserDesignations extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
            // define association here
        }
    }
    UserDesignations.init({
       userId : DataTypes.INTEGER,
       designationId: DataTypes.INTEGER,
    }, {
        sequelize,
        modelName: 'userDesignations',
        timestamps: true,
    });
    return UserDesignations;
};