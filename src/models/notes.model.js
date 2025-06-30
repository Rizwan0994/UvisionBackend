'use strict';
const {
    Model, DataTypes
} = require('sequelize');
const { NOTE_TAG } = require("../constants/chat.constant");
const { NOTES_VISIBILITY } = require("../constants/note.constant");

module.exports = (sequelize) => {
    class Note extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
            // define association here
        }
    }
    Note.init({
        title: DataTypes.STRING,
        detail: DataTypes.TEXT,
        tag: {
            type: DataTypes.ENUM,
            values: [NOTE_TAG.FAVOURITE, NOTE_TAG.IMPORTANT, NOTE_TAG.PERSONAL, NOTE_TAG.WORK],
            defaultValue: NOTE_TAG.PERSONAL
        },
        chatId: {
            type: DataTypes.INTEGER,
        },
        createdBy: {
            type: DataTypes.INTEGER,
        },
        lastUpdatedBy  :{
            type: DataTypes.INTEGER,
        },
        isPublic:{
            type: DataTypes.BOOLEAN,
            defaultValue: false
        },
        visibility: {
            type: DataTypes.ENUM,
            values: [NOTES_VISIBILITY.PUBLIC, NOTES_VISIBILITY.PRIVATE, NOTES_VISIBILITY.PERSONAL],
            defaultValue: NOTES_VISIBILITY.PUBLIC
        }
    }, {
        sequelize,
        modelName: 'note',
        timestamps: true,
    });
    return Note;
};