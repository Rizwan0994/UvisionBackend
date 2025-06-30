'use strict';
const {
    Model, DataTypes
} = require('sequelize');


module.exports = (sequelize) => {
    class Comment extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
            // define association here
        }
    }
    Comment.init({
        text: {
            type: DataTypes.TEXT
        },
        subTaskId: {
            type: DataTypes.INTEGER,
        },
        taskId: {
            type: DataTypes.INTEGER,
        },
        userId: {
            type: DataTypes.INTEGER,
        },
        isEdited: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        },
        replyCommentId:{
            type: DataTypes.INTEGER
        }
    }, {
        sequelize,
        modelName: 'comment',
        timestamps: true,
    });
    return Comment;
};