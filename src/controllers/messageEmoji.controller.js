'use strict';
const { upsert } = require('../helpers/common');
const {
    Op,
    messageEmoji: MessageEmojiModel,
    message: MessageModel,
} = require("../models/index");
const { firebaseNotificationMessageHandler } = require("../controllers/message.controller");

exports.createOrUpdateMessageEmoji = async (data) => {
    return new Promise(async (resolve, reject) => {
        try {
            const createData = await upsert(MessageEmojiModel,
                {
                    messageId: data.messageId,
                    userId: data.userId ? data.userId : data.loginUser.id,
                    emojiCode: data.emojiCode,
                    createdBy: data.loginUser.id
                },
                {
                    messageId: data.messageId,
                    userId: data.userId ? data.userId : data.loginUser.id,
                })
            resolve(createData)
        }catch (error) {
            console.log('error :>> ', error);
            reject(error);
        }
    })
}

exports.findMessageEmoji = async (data) => {
    return new Promise(async (resolve, reject) => {
        try {
            const message = await MessageEmojiModel.scope("userEmojiInfo").findAll({
                where:{
                    messageId: data.messageId
                },
                attributes: ["id", "userId", "messageId", "emojiCode"],
                order: [["createdAt", "DESC"]]
            })
            resolve(message);
        }catch (error) {
            console.log('error :>> ', error);
            reject(error);
        }
    })
}

exports.deleteMessageEmoji = async (data) => {
    return new Promise(async (resolve, reject) => {
        try {
            const message = await MessageEmojiModel.destroy({
                where:{
                    id: data.reactId
                }
            })
            resolve(message)
        }catch (error) {
            console.log('error :>> ', error);
            reject(error);
        }
    })
}

exports.sendReactionNotificationByMessageId = async (data) => {
    return new Promise(async (resolve, reject) => {
        try {
            const messageInfo = await MessageModel.scope(["getFCMTokenBySendBy","defaultScope","userChat"]).findAll({
                attributes: ["sendBy"],
                where:{
                    id: data.messageId,
                    sendBy: {
                        [Op.ne] : data.loginUser.id
                    }
                },
                raw: true
            })            
            if(messageInfo.length){
                let FCMTokens = messageInfo.map(ele => ele['sendByDetail.FCMTokens.deviceKey'])
                let formatedMessage = `Reacted ${data.getSingleReactionMessageEmoji.dataValues.emojiCode} to your message`;
                await firebaseNotificationMessageHandler({ FCMTokens, messageInfo, message: formatedMessage, loginUser: data.loginUser, chatType: messageInfo[0]['userChat.type'], chatName: messageInfo[0]["userChat.name"] ?  messageInfo[0]["userChat.name"] : data.loginUser.name});
            }
            resolve(messageInfo)
        }catch (error) {
            console.log('error :>> ', error);
            reject(error);
        }
    })
}
