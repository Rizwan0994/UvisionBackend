'use strict';
const {
    Model, DataTypes
} = require('sequelize');
const { MESSAGE_TYPE } = require('../constants/message.constant');

module.exports = (sequelize) => {
    class Message extends Model {}
    Message.init({
        chatId: {
            type: DataTypes.INTEGER
        },
        subject: {
            type: DataTypes.TEXT,
            get() {
                const isMessageDeleted = this.getDataValue('isDeleted');
                return isMessageDeleted ? '' : this.getDataValue('subject');
            }
        },
        message: {
            type: DataTypes.TEXT,
            get() {
                const isMessageDeleted = this.getDataValue('isDeleted');
                return isMessageDeleted ? '' : this.getDataValue('message');
            }
        },
        mediaType: {
            type: DataTypes.STRING,
            get() {
                const isMessageDeleted = this.getDataValue('isDeleted');
                return isMessageDeleted ? '' : this.getDataValue('mediaType');
            }
        },
        mediaUrl: {
            type: DataTypes.STRING,
            get() {
                const isMessageDeleted = this.getDataValue('isDeleted');
                return isMessageDeleted ? '' : this.getDataValue('mediaUrl');
            }
        },
        fileName: {
            type: DataTypes.STRING,
            get() {
                const isMessageDeleted = this.getDataValue('isDeleted');
                return isMessageDeleted ? '' : this.getDataValue('fileName');
            }
        },
        type: {
            type: DataTypes.ENUM,
            values: [MESSAGE_TYPE.URGENT, MESSAGE_TYPE.EMERGENCY, MESSAGE_TYPE.ROUTINE, MESSAGE_TYPE.CHAT_LOG],
            default: MESSAGE_TYPE.ROUTINE
        },
        sendTo: DataTypes.INTEGER,
        sendBy: DataTypes.INTEGER,
        quotedMessageId: DataTypes.INTEGER,
        taskDueDate: DataTypes.DATE,
        threadId: DataTypes.INTEGER,
        ccText: DataTypes.TEXT,
        bccText: DataTypes.TEXT,
        isImportant: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        },
        isForwarded: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        },
        isMessage: {
            type: DataTypes.BOOLEAN,
            defaultValue: true
        },
        isEdited: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        },
        isDeleted: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        },
        deletedBy: {
            type: DataTypes.INTEGER
        },
        plainText: {
            type: DataTypes.TEXT,
            get() {
                return this.getDataValue('plainText') ? this.getDataValue('plainText').split(';'): "";
            },
            set(val) {
                this.setDataValue('plainText',val.join(';'));
            },
        },
        plain_message: {
            type: DataTypes.TEXT,
        },
        plain_subject: {
            type: DataTypes.TEXT,
        },
        followupTaskMessageId: {
            type: DataTypes.INTEGER
        }
    }, {
        defaultScope: {
            attributes: { exclude: ['plainText', 'plain_message', 'plain_subject'] },
        },
        hooks:{
            beforeUpdate: (instance, option) => {
                let message = instance.dataValues?.message?.replace(/&|```|~|\*|_|--/g, '')
                if(message){
                    const regex = /<@(\d+)>\((.*?)\)/g;
                    const matches = [...message.matchAll(regex)];
                    if(matches){ matches.forEach(match => { message = message.replace(match[0],`@${match[2]} `);}); }
                    instance.dataValues.plain_message = message;
                }
                instance.dataValues.plain_subject = instance.dataValues?.subject?.replace(/&|```|~|\*|_|--/g, '');
            },
            // remove mention user and formatted message
            beforeSave: (instance, option) => {
                let message = instance.dataValues?.message?.replace(/&|```|~|\*|_|--/g, '')
                if(message){
                    const regex = /<@(\d+)>\((.*?)\)/g;
                    const matches = [...message.matchAll(regex)];
                    if(matches){ matches.forEach(match => { message = message.replace(match[0],`@${match[2]} `);}); }
                    instance.dataValues.plain_message = message;
                }
                instance.dataValues.plain_subject = instance.dataValues?.subject?.replace(/&|```|~|\*|_|--/g, '');
            },
            beforeBulkCreate: (instance, option) => {
                if(instance.length){
                    for (const inst of instance) {
                        let message = inst.dataValues?.message?.replace(/&|```|~|\*|_|--/g, '')
                        if(message){
                            const regex = /<@(\d+)>\((.*?)\)/g;
                            const matches = [...message.matchAll(regex)];
                            if(matches){ matches.forEach(match => { message = message.replace(match[0],`@${match[2]} `);}); }
                            inst.dataValues.plain_message = message;
                        }
                        inst.dataValues.plain_subject = inst.dataValues?.subject?.replace(/&|```|~|\*|_|--/g, '');
                    }
                }
            },
        },
        sequelize,
        modelName: 'message',
        timestamps: true,
    });
    return Message;
};