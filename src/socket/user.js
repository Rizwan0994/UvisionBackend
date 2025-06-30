'use strict';
const { 
    updateUserRole, 
    updateUserActiveStatus, 
    deleteUser, 
    updateProfilePicture 
} = require("../controllers/user.contoller");
const { createUserLog, listUserLogByDate } = require("../controllers/userLogs.controller");
const { getAllTaskHours } =  require("../controllers/task.controller");
const { updateNotification } = require("../controllers/notification.controller");
const Op = require("../models/index").Op;
const UserModel = require("../models/index").user;
const { CHAT_TYPE } = require("../constants/chat.constant");

module.exports = (io, socket) => {
      // join room with user's slugs when user will be online.
    socket.on('join-device', async data => {
        try {
            const getUser = await UserModel.findByPk(data.userId, { raw: true });
            socket.join(getUser.slug);
        } catch (error) {
            console.log('error :>> ', error);
        }
    })

    // create log and return calculated logs
    socket.on('create-user-log', async (data, callback) => {
        try {
            const result = await createUserLog({ ...data, userId: socket.handshake.query.loginUser.id });
            io.to(socket.id).emit('res-create-user-log', result);
            const resultTotalTime = await getAllTaskHours({ ...data, loginUser: socket.handshake.query.loginUser });
            io.to(socket.id).emit('dashboard:res-tasks-work-hours', resultTotalTime);
            callback({status: 1, data: result});
        } catch (error) {
            callback({status: 0, data: "Something went wrong"});
            console.log("Error: ", error)
        }
    });

    // list logs by filtering
    socket.on('list-user-logs', async data => {
        try {
            const result = await listUserLogByDate({ ...data, userId: socket.handshake.query.loginUser.id, });
            io.to(socket.id).emit('res-create-user-log', result);
        } catch (error) {
            console.log("Error: ", error)
        }
    });
    
    // for creating user roles
    socket.on('change-user-role', async (data, callback) => {
        try {
            const result = await updateUserRole({ data, user: socket.handshake.query.loginUser });
            //io.to(socket.id).emit('res-change-user-role', result);
            io.emit('res-change-user-role', result);
            callback({status: 1, data: result});
        } catch (error) {
            callback({status: 0, message: "Something went wrong"});
            console.log("Error: ", error)
        }
    });
    
    // handle usr activation actions
    socket.on('deactive-account', async (data, callback) => {
        try {
            const result = await updateUserActiveStatus({ data, user: socket.handshake.query.loginUser });
            // io.to(socket.id).emit('res-deactive-account', result);
            io.emit('res-deactive-account', result);
            callback({status: 1, data: result});
        } catch (error) {
            callback({status: 0, message: "Something went wrong"});
            console.log("Error: ", error)
        }
    });

    // soft delete user account if login user is super admin
    socket.on('delete-user', async (data, callback) => {
        try {
            const result = await deleteUser({ data, user: socket.handshake.query.loginUser });
            // io.to(socket.id).emit('res-deactive-account', result);
            io.emit('res-delete-user', result);
            callback({status: 1, data: result});
        } catch (error) {
            callback({status: 0, message: "Something went wrong"});
            console.log("Error: ", error)
        }
    });
    
    // update profile picture
    socket.on('profile-picture:req-update', async data => {
        try {
            console.log('test  -----------------------------------data :>> ', data);
            const userData = socket.handshake.query.loginUser
            const result = await updateProfilePicture({ formData: data, user: userData });
            io.to(socket.id).emit('profile-picture:res-update', result);
        } catch (error) {
            console.log("Error: ", error)
        }
    });

    // to handle reciving message notification to user.
    socket.on('update-notification', async data => {
        try {
            if (data.chatType === CHAT_TYPE.GROUP) {
                let getUser = await UserModel.findAll({
                where:{
                    id : {
                        [Op.in] : data.userId
                    }
                },
                attributes: ["id","slug"],
                raw: true
                });
                for (let singleUser of data.userId) {
                    const notificationResp = await updateNotification({ chatId: data.chatId, userId: singleUser, messageId: data.messageId, messageType: data.messageType, mentionUsers: data.mentionusers });
                    // const getUser = await UserModel.findByPk(singleUser, { raw: true });
                    let info = getUser.find(x => x.id === singleUser);
                    io.in(info.slug).emit('add-notification', { chatId: data.chatId, messageDetail: notificationResp.messageData, notification: notificationResp.chatUserData });
                }
            } else if (data.chatType === CHAT_TYPE.PRIVATE) {
                const notificationResp = await updateNotification({ chatId: data.chatId, userId: data.userId, messageId: data.messageId, messageType: data.messageType });
                const getUser = await UserModel.findByPk(data.userId, { raw: true });
                io.in(getUser.slug).emit('add-notification', { chatId: data.chatId, messageDetail: notificationResp.messageData, notification: notificationResp.chatUserData });
            }
        } catch (error) {
            console.log('error :>> ', error);
        }
    })
}