'use strict';
const {
    Op,
    chat: ChatModel,
    chatUser: ChatUserModel,
    message: MessageModel,
    user: UserModel,
    messageRecipient: MessageRecipientModel
} = require("../models/index");

exports.chatNotification = async (data) => {
    return new Promise( async(resolve, reject) =>{
        try {
            let chatList = await ChatModel.findAll({
                where: { users: { [Op.contains]: [data.loginUser.id] } },
                include: [{
                    model: MessageRecipientModel,
                    where: { isRead: false, recipientId: data.loginUser.id },
                    attributes: ['id', 'messageId', 'recipientId', 'isRead'],
                    include: [{
                        model: MessageModel,
                        attributes: ['id', 'type', 'sendBy', 'sendTo', 'createdAt'],
                    }],
                    order: [
                        ['id', 'DESC']
                    ],
                }],
    
                order: [
                    ['updatedAt', 'DESC']
                ],
            })
            for (let singleChat of chatList) {
                const unreadMessages = singleChat.dataValues.messagerecipients.reduce(
                    (previousValue, currentValue) => {
                        if (currentValue.dataValues.message.dataValues.type === "routine") {
                            previousValue.routine += 1;
                        } else if (currentValue.dataValues.message.dataValues.type === "emergency") {
                            previousValue.emergency += 1;
                        } else if (currentValue.dataValues.message.dataValues.type === "urgent") {
                            previousValue.urgent += 1;
                        }
                        return previousValue;
                    },
                    { routine: 0, emergency: 0, urgent: 0 }
                );
                await ChatUserModel.update({ routineUnreadMessageCount: unreadMessages.routine, emergencyUnreadMessageCount: unreadMessages.emergency, urgentUnreadMessageCount: unreadMessages.urgent }, { where: { chatId: singleChat.dataValues.id, userId: data.loginUser.id } });
            }
            resolve({ status: 1, message: "count updated successfully." });
        } catch (error) {
            console.log("error: ", error);
            reject({ status: 0, message: "Something went wrong." });
        }
    });
}

exports.readMessages = async (data) => {
    return new Promise(async (resolve, reject) => {
        try {
            // console.log("readMessage ==>",data);
            const [chatUsers, messageRecipent ] = await Promise.all([
                // await ChatUserModel.unscoped().update(
                //     {
                //         routineUnreadMessageCount: 0,
                //         emergencyUnreadMessageCount: 0,
                //         urgentUnreadMessageCount: 0,
                //         atTheRateMentionMessageCount: 0,
                //         hasMentionMessageCount: 0,
                //     },
                //     { 
                //         where: { chatId: data.chatId, userId: data.recipientId },
                //         returning : true
                //     },
    
                // ),
                await MessageRecipientModel.update(
                    { isRead: true },
                    { 
                        where: { recipientId: data.recipientId, chatId: data.chatId, isRead: false },
                        returning: true
                    },
                )
            ])
            // console.log(chatUsers[1][0]);
            let messageIsRead = await ChatUserModel.count({
                where : { 
                    chatId : data.chatId,
                }
            })
            const messageRead = {
                chatId: data.chatId,
                // recipientId: messageRecipent[1][0]?.dataValues.recipientId
                messageIsRead
            }
            resolve({ status: 1, message: "count updated successfully.", messageRead });
        } catch (error) {
            console.log("error: ", error);
            reject({ status: 0, message: "Something went wrong." });
        }
    })
};

exports.updateNotification = async (data) => {
    return new Promise( async (resolve, reject) => {
        try {
            const [chatUserData, messageData] = await Promise.all([
                ChatUserModel.findOne({ where: { chatId: data.chatId, userId: data.userId }, attributes: ['chatId', 'userId'  ] }),
                MessageModel.findByPk(data.messageId, {
                    include: {
                        model: UserModel, as: "sendByDetail", attributes: ['profilePicture', 'name']
                    },
                })
            ])
            resolve({chatUserData, messageData })
        } catch (error) {
            console.log("error: ", error);
            reject({ status: 0, message: "Something went wrong." });
        }
    })
}