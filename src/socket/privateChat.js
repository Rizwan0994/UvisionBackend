'use strict';
const momentTimezone = require('moment-timezone');
const { 
    addMember, 
    removeMember, 
    isGroupAdmin, 
    getLastMessageFromChatId, 
    chatDetailFn, 
    makeAdmin, 
    removeAdmin
} = require("../controllers/chat.controller");
const { 
    updateMessage, 
    deleteMessage, 
    viewDeletedMessage, 
    sendMessage, 
    getMessageFormatUsingMessageId 
} = require("../controllers/message.controller");
const { 
    createOrUpdateMessageEmoji ,
    findMessageEmoji,
    deleteMessageEmoji,
    sendReactionNotificationByMessageId
} = require("../controllers/messageEmoji.controller");
const { user: UserModel, chat: ChatModel, Op, message } = require("../models/index");
const { GHOST_MODE_KEY } = require("../constants/auth.constant");
// const { MODULE } = require("../constants/module.constant");
const { getChatsByDesignationIds } = require("../controllers/designations.controller");

module.exports = (io, socket) => {
    /**
     * @params {Object} 
     * {
     *    chatType: CHAT_TYPE.GROUP || CHAT_TYPE.SINGLE,
     *    chatId: String,
     *    message: String,
     *    mediaType: String,
     *    mediaUrl: String,
     *    type: String,
     *    sendTo: String,
     *    sendBy: String,
     *    quotedMessageId: String,
     * }
     */
    
    // handle message and task when use sent message
    socket.on('message', async (data, callback) => {
        try {
            const result = await sendMessage({ ...data, loginUser: socket.handshake.query.loginUser });
            if(!data.isMessage && data.hasOwnProperty('dueDate') && !momentTimezone(new Date(data.dueDate)).diff(momentTimezone(),'day') && data.hasOwnProperty('assignedUsers') && data.assignedUsers.length) {
                await require("../crons/task.cron").runTaskAlert(io, result?.data?.task?.id, result?.data?.loginUser?.dataValues?.name);
            }
            io.in(data.chatId).to(GHOST_MODE_KEY).emit('new-message', { ...result.data });
            io.in(data.chatId).to(GHOST_MODE_KEY).emit('res-single-chat-list', result.singleMessage);

            if(result?.data.hasOwnProperty("categoryChat") && result?.data.categoryChat.length){
                for (const categoryChat of result?.data.categoryChat) {
                    io.in(categoryChat.AssignUserSlug).emit('CATEGORY_MENTION_CHAT', categoryChat.chat.dataValues );
                }
            } 
            // if(result.data?.hasOwnProperty("messageTaskCategories") && result.data?.messageTaskCategories && result.data?.messageTaskCategories.length){
            //     io.in("CATEGORY_CHAT").emit('CATEGORY_MENTION_CHAT', { message: result.singleMessage.message});
            // }
            callback();
        } catch (error) {
            console.log("Error: ", error)
        }
    });

    // // handle message and task when use sent message
    // socket.on('followup-task-message', async data => {
    //     try {
    //         let messageData = await getMessageFormatUsingMessageId(data.messageId, socket.handshake.query.loginUser.id);
    //         let result = await sendMessage({ ...messageData[0], loginUser: socket.handshake.query.loginUser });
    //         if(!result.data.isMessage && result.data.hasOwnProperty('dueDate') && !momentTimezone(new Date(result.data.dueDate)).diff(momentTimezone(),'day') && result.data.hasOwnProperty('assignedUsers') && result.data.assignedUsers.length) {
    //             let userSlugs = await getSlugs(result.data.assignedUsers);
    //             io.in(userSlugs).emit('res-task-alert', {message: "The task needs to be finished by the end of the day (EOD)."});
    //         }
    //         io.in(result.data.chatId).to(constants.GHOST_MODE_KEY).emit('new-message', { ...result.data });
    //         io.in(result.data.chatId).to(constants.GHOST_MODE_KEY).emit('res-single-chat-list', result.singleMessage);
    //     } catch (error) {
    //         console.log("Error: ", error)
    //     }
    // });

    // Handling to create message reaction 
    socket.on('req-create-message-reaction', async data => {
        try {
            const getSingleReactionMessageEmoji =  await createOrUpdateMessageEmoji({ ...data, loginUser: socket.handshake.query.loginUser });
            const getMessageReactions = await findMessageEmoji({ messageId: data.messageId });
            await sendReactionNotificationByMessageId({ messageId: data.messageId, loginUser: socket.handshake.query.loginUser, getSingleReactionMessageEmoji })
            io.in(data.chatId).to(GHOST_MODE_KEY).emit('update-realtime-message', {
                chatId : data.chatId,
                messageId : data.messageId, 
                updatedData :{
                    messageEmojis: getMessageReactions
                }
            });
        } catch (error) {
            console.log("Error: ", error)
        }
    });

    // Handling to delete message reaction 
    socket.on('req-delete-message-reaction', async data => {
        try {
            await deleteMessageEmoji(data);
            const getMessageReactions = await findMessageEmoji({ messageId: data.messageId });
            io.in(data.chatId).to(GHOST_MODE_KEY).emit('update-realtime-message', {
                chatId : data.chatId,
                messageId : data.messageId, 
                updatedData :{
                    messageEmojis: getMessageReactions
                }
            });
        } catch (error) {
            console.log("Error: ", error)
        }
    });

    // handle to add memeber in chat
    socket.on('req-add-member', async data => {
        try {
            let addedUserList = [], addedUserIds = [], adduserChat = [];
            const groupInfo = await isGroupAdmin({ chatId: data.chatId, userId: socket.handshake.query.loginUser.id });
            if (groupInfo && groupInfo.isAdmin) {
                const chatInfo = await ChatModel.findByPk(data.chatId, { raw: true });
                for (const singleUser of data.users) {
                    let obj = {
                        chatId: data.chatId,
                        userId: singleUser,
                        initialMessage: data.initialMessage
                    };
                    const { userData, message } = await addMember({ ...obj, loginUser: socket.handshake.query.loginUser });
                    io.in(data.chatId).emit('new-message', { ...message.dataValues, recipents: [] });
                    addedUserList.push(userData);
                    addedUserIds.push(userData.id)
                }
                const [chatDetail, userList] = await Promise.all([
                    chatDetailFn({ chatId: data.chatId, loginUserId: socket.handshake.query.loginUser.id }, ["chatUser"]), 
                    UserModel.findAll({ where: { id: { [Op.in]: chatInfo.users } }, raw: true })
                ]);
                for (const singleUser of addedUserList) {
                    io.in(singleUser.slug).emit('new-chat-data', chatDetail);
                }
                chatDetail.dataValues.chatusers.map(chatUsers => {
                    if(chatUsers && addedUserIds.includes(chatUsers.dataValues.user.dataValues.id)){
                        adduserChat.push(chatUsers.dataValues);
                    }
                })
                for (const singleUser of userList) {
                    // io.in(singleUser.slug).emit('group-update-member', chatDetail);
                    io.in(singleUser.slug).emit('group-update-member', {
                        users: adduserChat,
                        chatId: chatDetail.id,
                        type:"add-members"
                    });
                }

            } else {
                console.log("You are unauthorized.");
            }
        } catch (error) {
            console.log("error: ", error);
        }
    })

    // handle add member via designation in chat
    socket.on('req-add-designation-member', async data => {
        try {
            // let usersSlug = [];
            data.groupIds = await getChatsByDesignationIds(data.designationIds)
            if(data.groupIds.length){
                for (const singleChat of data.groupIds) {
                    let obj = {
                        chatId: singleChat,
                        userId: data.userId,
                        initialMessage: false
                    };
                    const { userData, message } = await addMember({ ...obj, loginUser: socket.handshake.query.loginUser });
                    io.in(singleChat).emit('new-message', { ...message.dataValues, recipents: [] });
                    // usersSlug.push(userData.slug);
                    // const chatInfo = await ChatModel.findByPk(singleChat, { raw: true });
                    // const [chatDetail, userList] = await Promise.all([
                    //     chatDetailFn({ chatId: singleChat, loginUserId: socket.handshake.query.loginUser.id }, ["lastMessage"]), 
                    //     UserModel.findAll({ where: { id: { [Op.in]: chatInfo.users } }, raw: true })
                    // ]);
                    // for (const singleUser of usersSlug) {
                    //     io.in(singleUser).emit('new-chat-data', chatDetail);
                    // }
                    // for (const singleUser of userList) {
                    //     io.in(singleUser.slug).emit('group-update-member', chatDetail);
                    // }
                }
            }
        } catch (error) {
            console.log("error: ", error);
        }
    })

    // handle remove member from chat
    socket.on('req-remove-member', async data => {
        try {
            if (!data.userId || !data.chatId) return;
            const obj = {
                chatId: data.chatId,
                userId: data.userId
            }
            const { userInfo, isRequestNewAdmin, requestNewAdminId, message } = await removeMember({ ...obj, loginUser: socket.handshake.query.loginUser });
            io.in(userInfo.slug).emit('res-remove-member', { chatId: data.chatId });
            
            // request for set admin if there is no admin available
            if (isRequestNewAdmin) {
                io.in(data.chatId).emit('res-make-group-admin', { chatId: data.chatId, userId: requestNewAdminId });
            }
            const [chatInfo, chatDetail] = await Promise.all([ChatModel.findByPk(data.chatId, { raw: true }), chatDetailFn({ chatId: data.chatId, loginUserId: socket.handshake.query.loginUser.id }, ["chatUser"])]);
            const userList = await UserModel.findAll({ where: { id: { [Op.in]: chatInfo.users } }, raw: true });
            for (const singleUser of userList) {
                // io.in(singleUser.slug).emit('group-update-member', chatDetail);
                io.in(singleUser.slug).emit('group-update-member', {
                    userId: userInfo.id,
                    chatId: chatDetail.id,
                    type: "remove-member"
                });
            }
            io.in(data.chatId).emit('new-message', { ...message.dataValues, recipents: [] });
        } catch (error) {
            console.log("error: ", error);
        }
    })

    // handle to make group Admin
    socket.on('req-make-group-admin', async data => {
        try {
            const makedAdmin = await makeAdmin({ chatId: data.chatId, userId: data.userId, requestedUserId: socket.handshake.query.loginUser.id });
            io.in(data.chatId).emit('res-make-group-admin', makedAdmin);
        } catch (error) {
            console.log(error)
        }
    })

    // handle to remove group admin
    socket.on('req-remove-group-admin', async data => {
        try {
            const makedAdmin = await removeAdmin({ chatId: data.chatId, userId: data.userId, requestedUserId: socket.handshake.query.loginUser.id });
            io.in(data.chatId).emit('res-remove-group-admin', makedAdmin);
        } catch (error) {
            console.log(error)
        }
    })

    // when user left group/chat when this socket will be runs
    socket.on('disconnect-user-chat', async data => {
        socket.leave(data.chatId);
    })

    /**Not in Use */
    socket.on('send-files', data => {
        io.in(data.chatId).emit('send-files', data);
    });

    // edit chat messages
    socket.on('req-edited-chat-message', async data => {
        try {
            const { updatedMessage, mentionusers } = await updateMessage({ messageId: data.messageId, chatId: data.chatId, messageData: data.messageData, loginUserId: socket.handshake.query.loginUser.id });
            data.messageData.updatedMentionUsers = mentionusers;
            io.in(data.chatId).emit('res-edited-chat-message', { messageId: data.messageId, chatId: data.chatId, messageData: data.messageData });
        } catch (error) {
            console.log(error)
        }
    });

    // delete chat messages
    socket.on('req-delete-chat-message', async data => {
        try {
            const deletedMessageInfo = await deleteMessage({ messageId: data.messageId, chatId: data.chatId, loginUserId: socket.handshake.query.loginUser.id });
            io.in(data.chatId).emit('res-delete-chat-message', { messageId: data.messageId, chatId: data.chatId });
            if (deletedMessageInfo.deletedTaskId) {
                io.in(data.chatId).emit('manage-task-module:res-delete', { taskId: deletedMessageInfo.deletedTaskId, chatId: data.chatId });
            }
            const updatedChat = await getLastMessageFromChatId({ chatId: data.chatId, loginUserId: socket.handshake.query.loginUser.id });
            io.in(data.chatId).emit('res-update-chat-list', updatedChat);
        } catch (error) {
            console.log(error)
        }
    });

    // remove to view deleted messages
    socket.on('req-view-deleted-message', async data => {
        try {
            const viewDeletedMessageInfo = await viewDeletedMessage({ messageId: data.messageId, loginUserId: socket.handshake.query.loginUser.id });

            socket.emit('res-view-deleted-message', viewDeletedMessageInfo);
        } catch (error) {
            console.log(error)
        }
    });

    // socket.on('req-forward-message', async data => {
    //     try {
    //         console.log('req-forward :>> ', data);
    //         const result = await forwardMessage({ ...data, requestedUserId: socket.handshake.query.loginUser.id });
    //         for (const chat of result.chats) {

    //             const chatData = data.chats.find(ch => ch.chatId === chat.chatId)

    //             io.in(chat.chatId).emit('new-message', {
    //                 ...chat.dataValues,
    //                 chatType: chatData ? chatData.type : "",
    //                 sendByDetail: {
    //                     profilePicture: socket.handshake.query.loginUser.profilePicture,
    //                     name: socket.handshake.query.loginUser.name
    //                 },
    //                 sendTo: chatData.sendTo,
    //                 recipents: []
    //             });

    //             const result = await singleChat({ ...chat.dataValues, messageId: chat.dataValues.id, loginUser: socket.handshake.query.loginUser });
    //             const [doc] = result.data
    //             io.to(chat.chatId).emit('res-single-chat-list', doc?.dataValues);
    //         }
    //     } catch (error) {
    //         console.log(error)
    //     }
    // });

    // handle to forward/follow-up message or task 
    socket.on('req-forward-follow-message', async data => {
        try {
            let messageData = await getMessageFormatUsingMessageId(data.messageData.id, socket.handshake.query.loginUser.id, data.chats, data.isFollowupTask);
            if(messageData.length){
                for (const message of messageData) {
                    let result = await sendMessage({ ...message, loginUser: socket.handshake.query.loginUser });
                    if(!result.data.isMessage && result.data.hasOwnProperty('dueDate') && !momentTimezone(new Date(result.data.dueDate)).diff(momentTimezone(),'day') && result.data.hasOwnProperty('assignedUsers') && result.data.assignedUsers.length) {
                        await require("../crons/task.cron").runTaskAlert(io, result?.data?.task?.id, result?.data?.loginUser?.dataValues?.name);
                    }
                    io.in(result.data.chatId).to(GHOST_MODE_KEY).emit('new-message', { ...result.data });
                    io.in(result.data.chatId).to(GHOST_MODE_KEY).emit('res-single-chat-list', result.singleMessage);
                }
            }
        } catch (error) {
            console.log("Error: ", error)
        }
    });
}