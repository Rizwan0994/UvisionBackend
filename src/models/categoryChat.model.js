'use strict';
const {
    Model, DataTypes
} = require('sequelize');

module.exports = (sequelize) => {
    class CategoryChat extends Model { }
    CategoryChat.init({
        categoryId: DataTypes.INTEGER,
        userId: DataTypes.INTEGER,
        createdBy: DataTypes.INTEGER,
        unreadMentionCount: {
            type: DataTypes.INTEGER, 
            defaultValue: 0
        }
    }, {
        sequelize,
        modelName: 'categoryChat',
        timestamps: true,
    });
    return CategoryChat;
};
