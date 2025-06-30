'use strict';
const momentTimeZone = require('moment-timezone');
const { CHAT_TYPE, CHAT_LOGS, CHAT_LIST_USER_FIELDS, TEMPLATE_STATUS } = require('../constants/chat.constant');
const { MESSAGE_TYPE } = require('../constants/message.constant');
const { TASK_STATUS } = require('../constants/task.constant');
const { USER_FIELDS_FORMAT, USER_FIELDS } = require('../constants/user.constant');
const { chatNotification } = require("./notification.controller");
const {
    chat: ChatModel,
    chatUser: ChatUsersModel,
    message: MessageModel,
    user: UserModel,
    messageRecipient: MessageRecipientModel,
    templates: TemplateModel,
    attachment: Attachment,
    chatLogs: ChatLogs,
    userDesignations: UserDesignationsModel,
    designations: DesignationModel,
    Op,
    Sequelize,
} = require("../models/index");
const { allEqual } = require("../helpers/common");
const { queryGenerator, list } = require("../util/dbServices");
const { announcementReadModel } = require('../models/associate/config');

/**
 * Creates a new chat.
 * @param {Object} data - The data for creating a chat.
 * @returns {Object} The newly created chat.
 */
exports.createChat = async (data) => {
    try {
        const obj = {
            users: data.users,
            name: data.name || null,
            image: data.image || null,
            createdBy: data.loginUser.id,
            type: data.type
        }
        if (data.type === CHAT_TYPE.GROUP) {
            const insertedData = await ChatModel.create(obj);
           // console.log('insertedData :>> ', insertedData);
            let userArray = [];
            for (let singleUser of obj.users) {
                if (data.loginUser.id === singleUser) {
                    userArray.push({ chatId: insertedData.dataValues.id, userId: singleUser, isAdmin: true });
                } else {
                    userArray.push({ chatId: insertedData.dataValues.id, userId: singleUser });
                }
            }
            if(checkGhostUser && checkGhostUser.length){
                for(let singleGhostUser of checkGhostUser){
                    if(!obj.users.includes(singleGhostUser.dataValues.id)){
                        userArray.push({ chatId: insertedData.dataValues.id, userId: singleGhostUser.dataValues.id, isGhostChat: true })
                    }
                }
            }
            const message = await MessageModel.create({ type: MESSAGE_TYPE.CHAT_LOG, chatId: insertedData.id, message: '', sendBy: data.loginUser.id })
            await ChatLogs.create({ createdBy: data.loginUser.id, userId: null, chatId: insertedData.id, messageId: message.id, type: CHAT_LOGS.CHAT_CREATED });
            await ChatUsersModel.bulkCreate(userArray);
            return insertedData;
        } else {
            let flag = {};
            flag = allEqual(obj.users) ? Op.contained : Op.contains;
            const chatDetail = await ChatModel.findOne({ where: { users: { [flag]: obj.users }, type: data.type } })
            if (chatDetail) {
                return chatDetail;
            } else {
                const insertedData = await ChatModel.create(obj);
                let userArray = [];
                for (let singleUser of obj.users) {
                    userArray.push({ chatId: insertedData.dataValues.id, userId: singleUser });
                }
                if(checkGhostUser && checkGhostUser.length){
                    for(let singleGhostUser of checkGhostUser){
                        if(!obj.users.includes(singleGhostUser.dataValues.id)){
                            userArray.push({ chatId: insertedData.dataValues.id, userId: singleGhostUser.dataValues.id, isGhostChat: true })
                        }
                    }
                }
                await ChatUsersModel.bulkCreate(userArray);
                return insertedData;
            }
        }
    } catch (error) {
        console.log('error :>> ', error);
        throw new createError["BadRequest"]("Something went wrong");
    }
}

/**
 * Creates a new chat.
 * @param {Object} dataToList - The data for creating a chat.
 * @param {Object} loginUser - The logged-in user.
 * @returns {Object} The newly created chat.
 */
exports.create = async (dataToList, loginUser) => {
    try {
        const insertedData = await this.createChat({...dataToList, loginUser});
        const chatFullDetail = await this.chatDetailFn({ chatId: insertedData.dataValues.id, loginUserId: loginUser.id }, ["chatUser"]);
        return { message: "Chat added successfully.", data: chatFullDetail };
    } catch (error) {
        throw error;
    }
}

/**
 * Retrieves a list of chats.
 * @param {Object} dataToList - The data for listing chats.
 * @param {Object} loginUser - The logged-in user.
 * @returns {Object} The list of chats.
 */
exports.list = async (dataToList, loginUser) => {
    try {
        // let dataToList = { ...req.body || {} };
        let includeChatUser = {};
        if (dataToList.query && dataToList.query.hasOwnProperty('search') && dataToList.query.search.length) {
            let search = dataToList.query.search.length ? dataToList.query.search.map(ele => `%${ele?.trim()}%`) : [];
            let searchQuery = search.map(field => {
                return { name: { [Op.iLike]: field } };
            });
            let userList = await UserModel.findAll({
                where: {
                    [Op.or]: searchQuery,
                    id : {
                        [Op.ne] : loginUser.id
                    },
                    isDeleted: false
                },
                attributes: ['id']
            })
            userList = userList.map(ele => ele.dataValues.id);
            searchQuery = search.map(field => {
                return {
                    [Op.or]: [
                        { name: { [Op.iLike]: field } },
                        {
                            [Op.and]: [
                                { users: { [Op.overlap]: userList } },
                                { name: { [Op.eq]: null } }
                            ]
                        }
                    ]
                }
            });
            let filterMethod = {}
            if(dataToList.query.filterMethod == "AND"){
                filterMethod = {
                    [Op.and]: searchQuery
                }
                delete dataToList.query.filterMethod;
            }else{
                filterMethod = {
                    [Op.or]: searchQuery
                }
                delete dataToList.query.filterMethod;
            }
            dataToList.query = {
                ...dataToList.query,
                ...filterMethod
                // [Op.and]: searchQuery
            }
            delete dataToList.query.search;
        }
        if (dataToList.query && dataToList.query.hasOwnProperty('includeChatUserDetails') && dataToList.query.includeChatUserDetails) {
            includeChatUser = {
                model: "chatUser",
                attributes: ['chatId', 'userId'],
                include: [
                    {
                        model: "user",
                        attributes: CHAT_LIST_USER_FIELDS,
                        include: [{
                            model: "userDesignations",
                            attributes: ['designationId'],
                            include: [{
                                model: "designation",
                                attributes: ['name'],
                                as: "designation"
                            }],
                        }],
                        order: [['id', 'DESC']]
                    }
                ],
                required: false
            }
            delete dataToList.query.includeChatUserDetails
        } 


        let includeLastMsgIsRead = true;
        if (dataToList.query && dataToList.query.hasOwnProperty('includeLastMsgIsRead')) {
            if(dataToList.query.includeLastMsgIsRead == false) includeLastMsgIsRead = false;
            delete dataToList.query.includeLastMsgIsRead;
        }
        if(dataToList.query.hasOwnProperty('filterMethod')){
            delete dataToList.query.filterMethod;
        }
        const {queryGenerate, populate} = await queryGenerator(dataToList);
        if (dataToList.isCountOnly) {
            let data = await ChatModel.count(queryGenerate)
            return {data};
        }
        if (dataToList.isCount) {
            let data = await ChatModel.scope(populate).findAndCountAll(queryGenerate);
            if (populate.includes('lastMessage')) {
                data.rows = checkMessageAllRead(data.rows, includeLastMsgIsRead);
            }
            data.rows = filteringChatType(data.rows, loginUser.id);
            return { data };
        }
        let data = await ChatModel.scope(populate).findAll(queryGenerate);
        if (populate.includes('lastMessage')) {
            data = checkMessageAllRead(data, includeLastMsgIsRead);
        }
        data = filteringChatType(data, loginUser.id);
        return { data };
    } catch (error) {
        throw error;
    }
}

/**
 * Retrieves a list of chats.
 * @param {Object} dataToList - The data for listing chats.
 * @param {Object} loginUser - The logged-in user.
 * @returns {Object} The list of chats.
 */
exports.chatList = async (dataToList, loginUser) => {
    try {
        let data = list(ChatModel, dataToList);
        return data;
    } catch (error) {
        throw error;
    }
}



/**
 * Retrieves a single chat.
 * @param {Object} data - The data for retrieving a single chat.
 * @returns {Object} The single chat.
 */
exports.singleChat = async (data) => {
    return new Promise(async (resolve, reject) => {
        try {
            await chatNotification(data);
            const chatList = await ChatModel.findAll({
                where: { 
                    users: { [Op.contains]: [data.loginUser.id] } ,
                    id: data.chatId
                },
                attributes: ['id', 'name', 'image', 'type', 'description', 'users', 'updatedAt', 'routineHour', 'routineMinute', 'emergencyHour', 'emergencyMinute', 'urgentHour', 'urgentMinute'], 
                include: [
                    {
                        model: ChatUsersModel.unscoped(),
                        // where: { userId: data.loginUser.id },
                        attributes: ['chatId', 'userId', ],
                        include: [
                            {
                                model: UserModel,
                                attributes: ['id', 'name', 'profilePicture', 'profileStatus', 'lastSeen']
                            }
                        ],
                    },
                    {
                        model: MessageModel,
                        where: {
                            id: data.messageId
                        },
                        attributes: ['id', 'message', 'subject', "sendBy", 'createdAt', 'chatId', 'fileName', 'mediaType', 'isMessage', 'isDeleted', 'type'],
                        include: [
                            {
                                model: UserModel,
                                attributes: ['id', 'name',],
                                // include :[{
                                //     model: UserDesignationsModel,
                                //     attributes :['designationId','priority'],
                                //     where :{
                                //         priority : true
                                //     },
                                //     include: [{
                                //         model: DesignationModel,
                                //         attributes : ['name'],
                                //         as : "designation"
                                //     }],
                                // }],
                                as: 'sendByDetail'
                            }
                        ],
                        order: [['createdAt', 'DESC']],
                        limit: 1
                    },
                ],
                order: [['updatedAt', 'DESC']]
            });
            resolve({ status: 1, message: "Chat list get successfully.", data: chatList });
        } catch (error) {
            console.log(error)
            reject({ status: 0, message: "Something went wrong." });
        }

    })
}

/**
 * Retrieves the last message from a chat based on the chat ID.
 * @param {Object} data - The data for retrieving the last message.
 * @returns {Object} The last message from the chat.
 */
exports.getLastMessageFromChatId = async (data) => {
    return new Promise(async (resolve, reject) => {
        try {
            let obj = {};
            // if (data.loginUserId) {
            //     users = { [Op.contains]: [data.loginUserId] }
            // }
            const chatList = await ChatModel.findOne({
                attributes: ['updatedAt'],
                where: { id: data.chatId, ...obj },
                include: [
                    {
                        model: MessageModel,
                        attributes: ['id', 'message', 'subject', 'createdAt', 'sendBy', 'chatId', 'fileName', 'mediaType', 'isMessage', 'isDeleted', 'type'],
                        include: [
                            {
                                model: UserModel,
                                attributes: ['id', 'name',],
                                as: 'sendByDetail'
                            }
                        ],
                        order: [['createdAt', 'DESC']],
                        limit: 1
                    },
                ]
            });
            resolve(chatList);
        } catch (error) {
            reject(error);
        }
    });
}

// get all chat detailed information

exports.chatDetailFn = async (data, scope = [ "chatUser", "lastMessage", "tasks" ], validateChatuser = false) => {
    return new Promise(async (resolve, reject) => {
        try {
            let obj = {};
            let chatList = await ChatModel
            .scope(scope)
            .findOne({
                where: { id: data.chatId, ...obj }
            });
            if(validateChatuser) {
                chatList = filteringChatType([chatList], data.loginUserId); 
                resolve(chatList[0]); 
                return;
            } 
            resolve(chatList)
        } catch (error) {
            reject(error);
        }
    });
}


exports.chatDetail = async (dataToList, loginUser) => {
    try {
        const chatList = await this.chatDetailFn({ chatId: dataToList.id, loginUserId: loginUser.id }, ["chatUser"]);
        return { message: "Chat get successfully.", data: chatList };
    } catch (error) {
        throw error;
    }
}

exports.addMember = (data) => {
    return new Promise(async (resolve, reject) => {
        try {
            const [createdUser, userData] = await Promise.all([
                ChatUsersModel.create({ chatId: data.chatId, userId: data.userId, initialMessage: data.initialMessage }), 
                UserModel.findByPk(data.userId, { raw: true })
            ]);

            await ChatModel.update({ users: Sequelize.fn('array_append', Sequelize.col('users'), data.userId) }, { where: { id: data.chatId } });
            const message = await this.createChatLog({
                userId: data.userId, chatId: data.chatId, createdBy: data.loginUser.id, type: CHAT_LOGS.USER_ADDED
            })
            resolve({ userData, message });
        } catch (error) {
            console.log('error :>> ', error);
            reject(error);
        }
    });
}

exports.removeMember = (data) => {
    return new Promise(async (resolve, reject) => {
        try {
            let requestNewAdminId = null;
            const [chatUser, messageRecipient, chatList] = await Promise.all([
                ChatUsersModel.destroy({ where: { chatId: data.chatId, userId: data.userId } }),
                MessageRecipientModel.destroy({ where: { chatId: data.chatId, recipientId: data.userId } }),
                ChatModel.update({ users: Sequelize.fn('array_remove', Sequelize.col('users'), data.userId) }, { where: { id: data.chatId } }),
            ]);
            const message = await this.createChatLog({
                userId: data.userId, chatId: data.chatId, createdBy: data.loginUser.id, type: CHAT_LOGS.USER_REMOVED
            })

            if(chatUser){
                await TemplateModel.update({ 
                    status: TEMPLATE_STATUS.PENDING, 
                    scheduleTime: null 
                },
                { 
                    where: { 
                        createdBy: data.userId,
                        chatId: data.chatId
                    }
                })
            }
            const [noOfAdmins, userInfo] = await Promise.all([ChatUsersModel.count({ where: { chatId: data.chatId, isAdmin: true } }), UserModel.findByPk(data.userId, { raw: true })]);
            if (noOfAdmins === 0) {
                const oldMember = await ChatUsersModel.findOne({ where: { chatId: data.chatId }, order: [["createdAt", "ASC"]], raw: true });
                if (oldMember) {
                    requestNewAdminId = oldMember.id;
                    await ChatUsersModel.update({ isAdmin: true }, { where: { id: oldMember.id } });
                }
            }
            resolve({ userInfo, isRequestNewAdmin: Boolean(!noOfAdmins), requestNewAdminId, message });
        } catch (error) {
            reject(error);
        }
    });
}

exports.createChatLog = async (data) => {
    const { userId, chatId, createdBy } = data
    let type = data.type
    if (userId === createdBy) type = CHAT_LOGS.USER_LEFT
    const message = await MessageModel.create({ type: MESSAGE_TYPE.CHAT_LOG, chatId, message: '', sendBy: createdBy })
    await ChatLogs.create({ ...data, messageId: message.dataValues.id, type })
    const messageData = MessageModel.findOne({
        where: { id: message.id },
        include: [{
            model: ChatLogs,
            include: [{
                model: UserModel,
                as: 'user'
            },
            {
                model: UserModel,
                as: 'addedBy'

            }]
        }]
    })

    return messageData
}

exports.isGroupAdmin = (data) => {
    return new Promise(async (resolve, reject) => {
        try {
            const chatUsers = await ChatUsersModel.findOne({ where: { chatId: data.chatId, userId: data.userId }, raw: true });
            resolve(chatUsers);
        } catch (error) {
            reject(error);
        }
    });
}

exports.makeAdmin = async (data) => {
    return new Promise(async (resolve, reject) => {
        try {
            const chatUsers = await ChatUsersModel.findOne({ where: { chatId: data.chatId, userId: data.requestedUserId }, raw: true });
            if (chatUsers && chatUsers.isAdmin) {
                const updatedData = await ChatUsersModel.update({ isAdmin: true }, { where: { chatId: data.chatId, userId: data.userId } })
                resolve({ chatId: data.chatId, userId: data.userId });
            } else {
                reject({ message: "You are unauthorized." });
            }
        } catch (error) {
            reject(error);
        }
    });
}

exports.removeAdmin = async (data) => {
    return new Promise(async (resolve, reject) => {
        try {
            const chatUsers = await ChatUsersModel.findOne({ where: { chatId: data.chatId, userId: data.requestedUserId }, raw: true });
            if (chatUsers && chatUsers.isAdmin) {
                const updatedData = await ChatUsersModel.update({ isAdmin: false }, { where: { chatId: data.chatId, userId: data.userId } })
                resolve({ chatId: data.chatId, userId: data.userId });
            } else {
                reject({ message: "You are unauthorized." });
            }
        } catch (error) {
            reject(error);
        }
    });
}






exports.getAllGroupsList = async () => {
    try {
        const data = await ChatModel.findAll({
            where: {
                type: CHAT_TYPE.GROUP
            },
            order: [['name', 'ASC']]
        });
        return { status: 1, message: "Fetch group chats successfully.", data };
    } catch (error) {
        throw error;
    }
}



exports.updateChatDetails = async (data) => {
    return new Promise(async (resolve, reject) => {
        try {
            let obj = {}
            if (data.profilePicture) obj.image = data.profilePicture
            if (data.name) obj.name = data.name
            if (data.description) obj.description = data.description

            await ChatModel.update(obj, { where: { id: data.chatId } });
            resolve({ status: 1, message: "Chat details updated successfully.", chatId: data.chatId, data: obj });
        } catch (error) {
            reject({ status: 0, message: "Something went wrong." });
        }
    })
}

exports.IsChatExist = async (data) => {
    try {
        let chatInfo = await ChatModel.findOne({ 
            where: {
                users: {
                    [Op.contained]: data.users 
                },
                // [Op.and]: [
                //     { 
                //         users : {
                //             [Op.contains] : [data.users[0]] 
                //         },
                //     },
                //     { 
                //         users : {
                //             [Op.contains] : [data.users[1]]
                //         },
                //     } 
                // ],
                type: CHAT_TYPE.PRIVATE
            }
        });
        return chatInfo;
    } catch (error) {
        console.log('error :>> ', error);
    }
}

exports.update = async(data) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (!data.id) {
                reject({ status: 0, message: "Insufficient request parameters! id is required." });
            }
            const formDetails = await ChatModel.update(data, { 
                where: { id: data.id }, 
                returning: true,
                raw: true
            });
            resolve(formDetails[1][0]);
        } catch (error) {
            console.log("error: ", error);
            reject({ status: 0, message: "Something went wrong." });
        }
    })
}


function checkMessageAllRead(messageList, status) {
    messageList = messageList?.map(ele => {
        if (status) {
            let readAll = false;
            let readArr = ele.dataValues?.messages[0]?.dataValues?.messagerecipients?.map((itm) => itm.isRead);
            let isReadAll = readArr?.some((isRead) => { return isRead === false });
            if (!isReadAll && !!readArr?.length) {
                readAll = true
            }
            delete ele.dataValues?.messages[0]?.dataValues?.messagerecipients;
            if (ele.dataValues.messages[0]?.dataValues) ele.dataValues.messages[0].dataValues.lastMessageIsRead = readAll
            return {
                ...ele.dataValues
            }
        } else {
            delete ele.dataValues.messages;
            return {
                ...ele.dataValues
            }
        }
    })
    return messageList;
}

function filteringChatType(chatList, userId) {
    let list = chatList.map((chat) => {
        if(chat.hasOwnProperty('dataValues')) chat = chat.dataValues;
        if (chat.type === CHAT_TYPE.GROUP) {
            return {
                ...chat,
                chatusers: chat.chatusers.filter(chatusr => {
                    return chatusr.dataValues.userId === userId
                })
            }
        }
        return chat;
    })
    return list;
}









