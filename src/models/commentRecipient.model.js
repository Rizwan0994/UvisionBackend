'use strict';
const {
    Model, DataTypes
} = require('sequelize');

module.exports = (sequelize) => {
    class CommentRecipient extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
            // define association here
        }
    }
    CommentRecipient.init({
        commentId: {
            type: DataTypes.INTEGER,
        },
        userId: {
            type: DataTypes.INTEGER,
        },
        isRead: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        },
        isMention:{
            type: DataTypes.BOOLEAN,
            defaultValue: false
        }
    }, {
        sequelize,
        modelName: 'commentRecipient',
        timestamps: true,
    });
    return CommentRecipient;
};