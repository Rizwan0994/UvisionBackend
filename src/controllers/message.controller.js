'use strict';
const momentTimezone = require('moment-timezone');
const { MESSAGE_TAG, THREAD_TYPE, MESSAGE_TYPE, MESSAGE_LIMIT_SEARCH } = require('../constants/message.constant');
const { CHAT_TYPE } = require('../constants/chat.constant');
const { USER_FIELDS_FORMAT } = require('../constants/user.constant');
const { 
    createNotificationMessage,

} = require('../helpers/common');
const { singleChat } = require('./chat.controller');
const {
    Op,
    Sequelize,
    chat: ChatModel,
    chatUser: ChatUserModel,
    message: MessageModel,
    user: UserModel,

    messageRecipient: MessageRecipientModel,
    attachment: Attachment,
    chatLogs: ChatLogs,
    userDesignations: UserDesignationsModel,
    designations: DesignationModel,
    mentionUser: MentionUserModel,
    importantMessage: ImportantMessageModel,
    comment: CommentModel,
    FCMToken: FCMTokenModel,
    subTask: SubTaskModel,
} = require("../models/index");
const { SendFirebaseNotification } = require("../services/firebase");

exports.messageQuery = async (query, paginate, userId, paginateFlow) => {
    const result = await MessageModel.scope([
        "defaultScope",
        "sendByDetail",
        "userEmojiInfo",
        "messageRecipient",
        "quotedMessageDetail",
        "messageTaskCategory",
        "ChatLogs",
        "mentionUser",
        { method : ["importantMessage", userId] },
        { method : ["taskDetails", userId] }
    ]).findAndCountAll({
        col: "message.id",
        attributes :{
            exclude : ["bccText", "threadId"]
        },
        where: {
            ...query
        },
        order: paginateFlow === "DOWN" ? [["createdAt", "ASC"]] : [["createdAt", "DESC"]],
        ...paginate,
        distinct: true
    })
    return result;
}



exports.create = async (data) => {
    try {
        let obj = {
            type: data.type,
            chatId: data.chatId,
            message: data.message,
            subject: data.subject,
            mediaType: data.mediaType || null,
            mediaUrl: data.mediaUrl || null,
            fileName: data.fileName || null,
            quotedMessageId: data.quotedMessageId || null,
            isMessage: data.isMessage,
            taskDueDate: data.dueDate || null,
            threadId: data.threadId || null,
            ccText: data.ccText || null,
            bccText: data.bccText || null,
            followupTaskMessageId: data.followupTaskMessageId || null,
            isForwarded: data.isForwarded || false,
            plainText: []
        };
        if (data.chatType === CHAT_TYPE.GROUP) {
            obj.sendBy = data.sendBy;
        } else {
            obj.sendTo = data.sendTo;
            obj.sendBy = data.sendBy;
        }

    

    
        const result = await MessageModel.create(obj);

        if (data.quotedMessageId) {
            result.dataValues.quotedMessageDetail = await MessageModel.findByPk(data.quotedMessageId, {
                include: [
                    {
                        model: UserModel, 
                        attributes: ['id', 'name', 'companyName', 'mainDesignation'],
                        as: "sendByDetail", 
                    },
                    {
                        model : ChatModel,
                        attributes : ['name'],
                        as : 'userChat'
                    }
                ]
            });
        }
        if(data){
            result.dataValues.userDesignations = await UserDesignationsModel.findAll({
                where :{
                    userId : data.sendBy,
                    priority : true
                },
                include: [{
                    model: DesignationModel,
                    attributes : ['name'],
                    as : "designation"
                }],
            });
        }
        let taskCreated = {};
  


        if (data.chatType === CHAT_TYPE.GROUP) {
            let userArray = [];
            for (let singleUser of data.sendTo) {
                userArray.push({ recipientId: singleUser, chatId: data.chatId, messageId: result.dataValues.id, isRead: false });
            }
            await MessageRecipientModel.bulkCreate(userArray);
        } else {
            await MessageRecipientModel.create({ recipientId: data.sendTo, chatId: data.chatId, messageId: result.dataValues.id, isRead: false });
        }







        if(data.sendTo && !Array.isArray(data.sendTo)) {
            let chat = await UserModel.findByPk(data.sendBy);
            result.dataValues.chatName = chat.dataValues.name;
        }else{
            let chat = await ChatModel.findByPk(data.chatId);
            result.dataValues.chatName = chat.dataValues.name;
        }
        await ChatModel.update({ type: data.chatType }, { where  : { id: data.chatId }});

        return { savedMessage: {...result.dataValues} };
    } catch (error) {
        console.log("error: ", error);
    }
}





exports.deleteMessage = (data) => {
    return new Promise(async (resolve, reject) => {
        try {
            const messageInfo = await MessageModel.findByPk(data.messageId, { attributes: ["id", "isDeleted"], where: { sendBy: data.loginUserId }, raw: true });
            if (!messageInfo) {
                reject({ message: "Message not found." });
            } else {
                const updatedMessage = await MessageModel.update(
                    { isDeleted: true, deletedBy: data.loginUserId }, 
                    { where: { id: data.messageId }, individualHooks: true }
                );
         

                resolve({ deletedMessageId: data.messageId, chatId: data.chatId});
            }
        } catch (error) {
            reject(error);
        }
    })
}



/**
 * @description : when user click user's chat at that time api will be call.
 */

exports.messageList = async (dataToList, loginUser, initialmessage, chatId, queryString) => {
    try {
        let typeObj = (dataToList.type && dataToList.type !== "") ? { type: dataToList.type } : {};
        if ((dataToList.search && dataToList.search.length) || (dataToList.type && dataToList.type !== "")) {
            typeObj.isDeleted = false;
        }
        let query = {}
        if (dataToList.search && dataToList.search.length) {
            let search = dataToList.search.length ? dataToList.search.map(ele => `%${ele?.trim()}%`) : [];
            let queryFilter = search.map(field => {
                return { [Op.or] : [ 
                    {plain_message: { [Op.iLike]:  field  }},
                    {plain_subject: { [Op.iLike]:  field  }}, 
                    {ccText: { [Op.iLike]:  field.replace("@", "")  }} ,
                    {fileName: { [Op.iLike]:  field  }}, 
                   ]   }
            });
            if(dataToList.filterMethod === "AND"){
                query = { 
                    ...query, 
                    [Op.and]: queryFilter
                }
            }else{
                query = { 
                    ...query, 
                    [Op.or]: queryFilter
                }
            }
        }
        if(dataToList.type){
            query = {
                ...query,
                type : dataToList.type
            }
        }
        if(dataToList.hasOwnProperty('createdAt') && !initialmessage && dataToList.createdAt){
            query = {
                ...query,
                createdAt: {
                    [Op.gte] : momentTimezone(dataToList.createdAt).format()
                }
            }
        }
        if(dataToList.hasOwnProperty('messageId') && dataToList.hasOwnProperty('pagitionFlow')){
            if(dataToList.pagitionFlow == "UP"){
                query = {
                    ...query,
                    id: dataToList?.includeMessage ? { [Op.lte]: dataToList.messageId } : { [Op.lt]: dataToList.messageId }
                }
            }
            if(dataToList.pagitionFlow == "DOWN"){
                query = {
                    ...query,
                    id: dataToList?.includeMessage ? { [Op.gte]: dataToList.messageId } : { [Op.gt]: dataToList.messageId }
                }
            }
            delete dataToList.messageId, dataToList.paginateFlow;
        }
        let queryFilter = {
            chatId: dataToList.chatId,        
            ...typeObj,
            ...query
        }
        
        let paginate = {
            limit: dataToList.limit,
            offset: dataToList.offset
        }
        let messageList = await this.messageQuery(queryFilter, paginate, loginUser.id, dataToList.pagitionFlow)    
        messageList.rows = messageList.rows.map(ele => {    
            let readAll = false;
            let readArr = ele.dataValues?.messagerecipients.map((itm) => itm.isRead);
            let isReadAll = readArr?.some((isRead) => { return isRead === false });
            if (!isReadAll && !!readArr?.length) {
                readAll = true
            }
            ele.dataValues.messagerecipients = ele.dataValues?.messagerecipients.find((itm) => itm.dataValues.recipientId === loginUser.id); 
            if(ele.dataValues) ele.dataValues.messageIsRead = readAll
            return {
                ...ele.dataValues
            }
        })
        return messageList;
    } catch (error) {
        throw error;
    }
}

exports.threadMessageList = async (dataToList) => {
    try {
        let queryString = {};
        if(!dataToList.hasOwnProperty('threadType') || !dataToList.hasOwnProperty('messageId')){
            return [];
        }
        if(dataToList.threadType === THREAD_TYPE.PARENT){
            let message = await MessageModel.findOne({
                where: { id : dataToList.messageId},
                attributes: ['quotedMessageId']
            });
            dataToList.messageId = message.dataValues.quotedMessageId;
            queryString = { 
                where: { id: dataToList.messageId, isDeleted: false },
            }
        }
        if(dataToList.threadType === THREAD_TYPE.CHILD) {
            queryString = { 
                where: { quotedMessageId: dataToList.messageId, isDeleted: false },
            }
        }
        const messageList = await MessageModel.findAndCountAll({
            ...queryString,
            include: [
                {
                    model: UserModel, as: "sendByDetail", attributes: ['profilePicture', 'name']
                },
                {
                    model: MessageModel,
                    as: "quotedMessageDetailData",
                    required: false,
                    attributes: ['id', 'quotedMessageId']
                },
            ],
            require : true,
            order: [["createdAt", "ASC"]],
            distinct: true
        })
        return messageList;
    } catch (error) {
        throw error;
    }
}
exports.messageCountBetweenRange = async (data) => {
    try {
        const messageList = await MessageModel.count({
            where: {
                chatId: data.chatId,
                [Sequelize.Op.and]: [
                    { id: { [Op.lte]: data.currentMessageId } },
                    { id: { [Op.gte]: data.rquestedMessageId } },
                ]
            }
        });
        return messageList;
    } catch (error) {
        throw error;
    }
}

exports.chatGallaryMedia = async (dataToList, loginUser) => {
    try {
        const filter = (dataToList.search && dataToList.search !== "") ? { fileName: { [Op.iLike]: '%' + dataToList.search + '%' } } : {};
    
        const messageList = await MessageModel.findAndCountAll({
            where: {
                chatId: dataToList.chatId,
                [Op.or]: (dataToList.type === "media") ? [
                    { mediaType: { [Op.iLike]: '%image%' } },
                    { mediaType: { [Op.iLike]: '%video%' } }
                ] : [{ mediaType: { [Op.iLike]: '%application%' } }],
                ...filter
            },
            attributes: ['id', 'mediaType', 'mediaUrl', 'fileName', 'createdAt', 'sendBy'],
            include: [
                {
                    model: UserModel, as: "sendByDetail", attributes: ['name']
                }
            ],
            order: [["createdAt", "DESC"]],
            limit: dataToList.limit, offset: dataToList.offset
        })
        return messageList;
    } catch (error) {
        throw error;
    }
}

/**
 * @description : searching name, subject, in chat module (API)
 */

exports.searchMessagesAndChats = async (dataToList, loginUser) => {
    try {
        let chatListQuery = {};
        if(!dataToList.offset) dataToList.offset = 0;
        if(!dataToList.limit) dataToList.limit = MESSAGE_LIMIT_SEARCH;
        let search = dataToList.search?.length ? dataToList.search.map(ele => `%${ele?.trim()}%`) : [];
        let queryFilter = search.map(field => {
            return { 
                [Op.or] : [ 
                    {plain_message: { [Op.iLike]:  field  }}, 
                    {plain_subject: { [Op.iLike]:  field  }},  
                    {ccText: { [Op.iLike]:  field  }} ,
                    {fileName: { [Op.iLike]:  field  }}, 
          
                ]}
        });
        // if(dataToList.ghostStatus && loginUser.ghostUser && loginUser.isGhostActive ){
        if(loginUser.ghostUser && loginUser.isGhostActive ){
            chatListQuery = {};
        }
        else {
            chatListQuery = {
                ...chatListQuery,
                users: {
                    [Op.contains]: [loginUser.id],
                }
            }
        }
        if(dataToList.hasOwnProperty('chatId') && dataToList.chatId){
            chatListQuery = {
                ...chatListQuery,
                id: dataToList.chatId
            }
        }
        let chats = await ChatModel.findAll({
            where: {
                ...chatListQuery,
            },
            attributes: ['id', 'name', 'image', 'type', 'users', 'updatedAt'],
            include: [
                {
                    model: ChatUserModel,
                    attributes:  ['chatId', 'userId', ],
                    include: [
                        {
                            model: UserModel,
                            attributes: USER_FIELDS_FORMAT[loginUser.roleData.dataValues.name],
                            order: [['id', 'DESC']],
                        }
                    ],
                },
                {
                    model: MessageModel,
                    attributes: ['id', 'sendBy', 'createdAt'],
                    include: [
                        {
                            model: UserModel,
                            attributes: ['id', 'name'],
                            as: 'sendByDetail'
                        },
                    ],
                    order: [['createdAt', 'DESC']],
                    required: false,
                    limit: 1
                }
            ],
            order: [['updatedAt', 'DESC']]
        });
    
        const chatIds = chats.map(chat => chat.id)
        chats = chats?.map((chat)=>{
            if(chat.dataValues.type === CHAT_TYPE.GROUP){
                return {
                    ...chat.dataValues,
                    chatusers: chat.dataValues.chatusers.filter(chatusr =>{ 
                        return chatusr.dataValues.userId === loginUser.id
                    })
                }
            }
            return chat.dataValues;
        })   
        
     
        if(dataToList.hasOwnProperty('subject') && dataToList.subject){
            queryFilter.push({
                [Op.and] :  { plain_subject: { [Op.iLike]: "%"+dataToList.subject+"%" }}
            })
        }
    
        let filterMethod = {};
        if(dataToList.filterMethod === "AND"){
            filterMethod = {
                [Op.and]: queryFilter
            }
        }else{
            filterMethod = {
                [Op.or]: queryFilter
            }
        }
    
        if(dataToList.hasOwnProperty('date') && dataToList.date && dataToList.date.length == 2){
            filterMethod = {
                ...filterMethod,
                createdAt : {
                    [Op.between]: [
                        momentTimezone(new Date(dataToList.date[0])).format(),
                        momentTimezone(new Date(dataToList.date[1])).format()
                    ]
                } 
            }
        }
        
        let messages = await MessageModel.findAndCountAll({
            where: {
                chatId: {
                    [Op.in]: chatIds,
                },
                isDeleted: false,
                // [Op.and]: queryFilter
                ...filterMethod
            },
            include: [
                {
                    model: MentionUserModel,
                    attributes: ['id', 'userId', 'type'],
                    include: [{ model: UserModel, attributes: ['name'] }],
                    required: false,
                },
                {
                    model: UserModel, as: "sendByDetail", attributes: ['name']
                }
            ],
            order: [['createdAt', 'DESC']],
            distinct: true,
            limit: dataToList.limit,
            offset: dataToList.offset
        });
        messages.rows = messages.rows.map(message => {
            const chat = chats.find(chatData => chatData.id === message.dataValues.chatId)
            return { ...message.dataValues, chatDetails: chat }
        })
        return messages;
    } catch (error) {
        throw error;
    }
}

/**
 * @description : this function get all unread message of current active chat when user reconnect to the server. 
 */

exports.checkUserLastMessage = async (dataToList, loginUser) => {
    try {
        const data = dataToList;
        const existMessage = await MessageModel.findAndCountAll({
            where : {
                chatId: data.chatId,
                createdAt: {
                    [Op.gte]: momentTimezone(new Date(data.lastConnectedTime)).format()
                }
            },
            include: [
                {
                    model: UserModel,  
                    attributes: ['id', 'profilePicture', 'name', 'companyName', 'mainDesignation'],
                    as: "sendByDetail",
                },
                {
                    model: MessageRecipientModel, attributes: ['id', 'messageId', 'recipientId', 'isRead', 'updatedAt'],
                        include: [{
                            model: UserModel, attributes: ['profilePicture', 'name'],
                            required: false
                        }],
                    required: false
                },
                {
                    model: MessageModel,
                    include: [
                        {
                            model: UserModel, 
                            as: "sendByDetail", 
                            attributes: ['id', 'name', 'companyName', 'mainDesignation'],
                        },
                        {
                            model : ChatModel,
                            attributes : ['name'],
                            as : 'userChat'
                        }
                    ],
                    required: false,
                    as: "quotedMessageDetail",
                },
                {
                    model: MentionUserModel,
                    attributes: ['id', 'userId', 'type'],
                    include: [{ model: UserModel, attributes: ['name'] }],
                    required: false,
                },
                {
                    model: ImportantMessageModel,
                    where: { userId: loginUser.id },
                    attributes: ['id', 'userId'],
                    required: false,
                },
                {
                    model: ChatLogs,
                    include: [{
                        model: UserModel,
                        as: 'user'
                    },
                    {
                        model: UserModel,
                        as: 'addedBy'
    
                    }]
                },
            ],
            order: [["createdAt", "DESC"]],
            distinct: true
        })
        return existMessage;
    } catch (error) {
        throw error;
    }
}

exports.getMessageRecipient = async (dataToList, loginUser) => {
    try {
        if(!dataToList.id) return;
        let data = await MessageModel.findOne({
            where :{
                id : dataToList.id
            },
            attributes:{ exclude : ["bccText", "threadId"]},
            include : [{
                model: MessageRecipientModel, attributes: ['id', 'messageId', 'recipientId', 'isRead', 'updatedAt'],
                    include: [{
                        model: UserModel, attributes: ['profilePicture', 'name'],
                        required: false
                    }],
                required: false
            },{
                model: UserModel,
                attributes : ['profilePicture', 'name', 'mainDesignation', 'companyName'],
                as: "sendByDetail"
            }]
        })
        return data;
    } catch (error) {
        throw error;
    }
}

exports.sendMessage = async (data) =>{
    try {
        const { savedMessage } = await this.create(data);
        data.id = savedMessage.id;
        data.createdAt = savedMessage.createdAt;
        data.isEdited = savedMessage.isEdited;
        // data.messagerecipient = messageRecipientData;
        data.quotedMessageDetail = savedMessage.quotedMessageDetail;
        data.mentionusers = savedMessage.mentionusers;
        data.messagerecipients = savedMessage.recipents;
        data.messageIsRead = false;
        data.sendByDetail = { 
            profilePicture: data.loginUser.profilePicture, 
            name: data.loginUser.name, 
            companyName: data.loginUser.companyName, 
            mainDesignation: data.loginUser.mainDesignation, 
            userDesignations: savedMessage.userDesignations 
        };
        data.categoryChat = savedMessage.categoryChat || [];
        data.messageEmojis = [];
        data.task = savedMessage.task ? {
            ...savedMessage.task,
             comments: [],
             watchList: null,
             attachments: data.attachments
            } : null;
        data.messageTaskCategories = savedMessage.messageTaskCategories?.length ? savedMessage.messageTaskCategories : [];
        await this.firebaseNotificationMessageHandler({...savedMessage, loginUser: data.loginUser, chatType: data.chatType});
        const result = await singleChat({
            ...data,
            chatId: savedMessage.chatId,
            messageId: savedMessage.id,
            loginUser: data.loginUser
        });
        const [doc] = result.data
        delete data.loginUser;
        return { data, singleMessage : doc?.dataValues }
    } catch (error) {
        console.log('error :>> ', error);
    }
}

exports.firebaseNotificationMessageHandler = async (savedMessage) =>{
    try {
        let loginUserInfo =savedMessage.loginUser.dataValues ? savedMessage.loginUser.dataValues : savedMessage.loginUser; 
        // message notifications 
        if (savedMessage && savedMessage.FCMTokens && savedMessage.FCMTokens.length) {
            let body = createNotificationMessage({...savedMessage, chatType: savedMessage.chatType, loginUserName: loginUserInfo.name});
            let NotificationData = {
                notification: {title: savedMessage.chatName, body},
                registerToken: savedMessage.FCMTokens,
                profilePicture: loginUserInfo.profilePicture,
                chatId: savedMessage.chatId
            };
            await SendFirebaseNotification(NotificationData);
        }
    } catch (error) {
        console.log('error :>> ', error);
    }
}

// using messageId and userId get all infomation of message and transfer copy payload of message socket
// if manage message payload to multiple chats forwardsChatInfo (chatId, type and sendTo (it may be Group/ private) )
exports.getMessageFormatUsingMessageId = async(messageId, usrId, forwardsChatInfo = [], isFollowupTask) => {
    try {
        let messageData = {};
        const message = await MessageModel.findOne({
            where : { id: messageId }, 
            include:[{
                model: ChatModel,
                as: 'userChat',
                include: { model: ChatUserModel}
            }]
        });
        let deleteFields = ['id', 'updatedAt','createdAt', 'isImportant','isEdited'];
        deleteFields.forEach(e => delete message.dataValues[e]);
        let ccMentionArray = message.dataValues?.ccText?.match(/<@(\d+)>/g)
        ccMentionArray = ccMentionArray?.map((mention) => {
            const matches = mention.match(/\d+/);
            if (matches) { return { id: parseInt(matches[0], 10)}; }
            return null;
        });

        let singleChatData = message.dataValues?.userChat?.dataValues?.chatusers.find(ele => ele.dataValues.userId !== usrId);
        // generate object with message socket payload
        messageData = {
            followupTaskMessageId : isFollowupTask ? messageId : undefined,
            followupTaskId : message.dataValues?.task?.dataValues?.id,
            chatType: message.dataValues?.userChat?.type,
            chatId: message.dataValues?.chatId,
            message: message.dataValues?.message,
            type: message.dataValues?.type,
            sendTo: message.dataValues?.userChat?.type === CHAT_TYPE.GROUP ? message.dataValues?.userChat?.dataValues?.chatusers?.map(ele => ele.dataValues.userId) : singleChatData.dataValues.userId ,
            sendBy: usrId,
            quotedMessageId: message.dataValues?.quotedMessageId,
            subject: message.dataValues?.subject,
            dueDate: message.dataValues?.taskDueDate,
            isMessage: message.dataValues?.isMessage,
            ccText: message.dataValues?.ccText,
            ccMentions: ccMentionArray,
            bccText: message.dataValues?.bccText,
            bccMentions: message.dataValues?.bccMentions,
            assignedUsers: message.dataValues?.task?.dataValues?.taskmembers?.map(ele => ele.dataValues.userId),
            attachments: message.dataValues?.task?.dataValues?.attachments?.map(ele => {return { fileName :ele.dataValues.fileName, mediaType: ele.dataValues.mediaType, mediaUrl:ele.dataValues.mediaUrl} } ),
            isTeam: message.dataValues?.task?.dataValues?.isTeam,
            isDepartment: message.dataValues?.task?.dataValues?.isDepartment,
        }
        if(forwardsChatInfo.length){
            messageData = forwardsChatInfo.map(chatInfo => {
                return {
                        ...messageData,
                        chatType: chatInfo.type,
                        chatId: chatInfo.chatId,
                        sendTo: chatInfo.sendTo,
                        isForwarded: true,
                        subtasks: message.dataValues?.task?.dataValues?.subtasks.map(ele => ({chatId:chatInfo.chatId, title: ele.title})) || undefined,
                        assignedUsers: messageData.assignedUsers ? messageData.assignedUsers.filter(x => chatInfo.type === CHAT_TYPE.PRIVATE ? [chatInfo.sendTo, ...[usrId]].includes(x) : [...chatInfo.sendTo, ...[usrId]].includes(x) ) : undefined
                    }
            })
        }else{
            messageData = [messageData];
        }
        return messageData;

    } catch (error) {
        console.log('error :>> ', error);
    }
}