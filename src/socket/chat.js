'use strict';
const { 
    chatList, 
    updateChatWallpaper,  
    getTasksByChatId, 
    updateChatDetails, 
    update,
    chatDetailFn,
} = require("../controllers/chat.controller");
const { readMessages } = require("../controllers/notification.controller");
const {
    Op,
    user: UserModel,
    chat: ChatModel
} = require("../models/index");
module.exports = (io, socket) => {
    // join users chats 
    socket.on('join-chat',async data => {
        if(data && data.hasOwnProperty('chatId') && data.chatId && data.chatId.length){
            socket.join(data.chatId);
        }else{
            // conect to all socket client
            let chatList = await ChatModel.findAll({
                where: {
                    users: {
                        [Op.contains]: [socket.handshake.query.loginUser.id]
                    }
                }
            })
            let chatIds = chatList.map(ele => ele.dataValues.id);
            socket.join(chatIds);
        } 
    })


    // Socket event to retrieve chat list
    socket.on('chat-list', async data => {
        try {
            const result = await chatList({ ...data, loginUser: socket.handshake.query.loginUser });
            io.to(socket.id).emit('res-chat-list', result);
        } catch (error) {
            console.log("Error: ", error);
        }
    });

    // Socket event for new chat request
    socket.on('new-chat-request', async data => {
        const [userData, chatDetail] = await Promise.all([
            UserModel.findAll({ where: { id: { [Op.in]: data.users } }, raw: true }),
            chatDetailFn({ chatId: data.chatId, loginUserId: data.createdBy })
        ]);
        for (let singleUser of userData) {
            io.in(singleUser.slug).emit('new-chat-data', chatDetail);
        }
    });

    // Socket event to update chat background
    socket.on('req-update-chat-background', async data => {
        try {
            const result = await updateChatWallpaper({ ...data, loginUser: socket.handshake.query.loginUser });
            io.to(socket.id).emit('res-update-chat-background', result);
        } catch (error) {
            console.log("Error: ", error);
        }
    });

    // Socket event to get chat tasks
    socket.on('req-get-chat-tasks', async data => {
        try {
            const result = await getTasksByChatId(data);
            io.to(socket.id).emit('res-get-chat-tasks', result);
        } catch (error) {
            console.log("Error: ", error);
        }
    });

    // Socket event to update group details
    socket.on('group-details:req-update', async data => {
        try {
            const result = await updateChatDetails(data);
            io.to(data.chatId).emit('group-details:res-update', result);
        } catch (error) {
            console.log("Error: ", error);
        }
    });

    // Socket event to allow sending messages
    socket.on('req-allow-send-message', async (data, callback) => {
        try {
            if (data.chatId) {
                data.id = data.chatId;
                delete data.chatId;
            }
            const result = await update(data);
            socket.to(result.id).emit('res-allow-send-message', result);
            callback({status: 1, data: result});
        } catch (error) {
            console.log("Error: ", error);
        }
    });

    // As following socket handle user reads message or not
    socket.on('mark-read-chat', async (data, callback) => {
        console.log("mark-read-chat ==>", data);
        const result = await readMessages({ recipientId: socket.handshake.query.loginUser.id, chatId: data.chatId });
        if(result.messageRead.messageIsRead === 0){
            io.in(data.chatId).emit('res-mark-read-chat', result);
        }
        callback({ status:1, message: "message read successfully" })
    })
    

}