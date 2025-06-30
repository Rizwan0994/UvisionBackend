'use strict';
const {
    Model, DataTypes
} = require('sequelize');

module.exports = (sequelize) => {
    class Attachment extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
            // define association here
        }
    }
    Attachment.init({
        mediaUrl: {
            type: DataTypes.STRING
        },
        fileName: {
            type: DataTypes.STRING
        },
        mediaType: {
            type: DataTypes.STRING
        },
        taskId: {
            type: DataTypes.INTEGER,
        },
        createdBy: {
            type: DataTypes.INTEGER,
        },
        isDeleted: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        },
    }, {
        sequelize,
        modelName: 'attachment',
        timestamps: true,
    });
    return Attachment;
};