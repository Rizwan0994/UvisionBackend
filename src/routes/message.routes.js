'use strict';
const router = require('express').Router();
const { 
    messageList,  
    threadMessageList, 
    chatGallaryMedia, 
    searchMessagesAndChats,
    checkUserLastMessage,
    getMessageRecipient,
    messageCountBetweenRange
} = require('../controllers/message.controller');
const {
    message: MessageModel,
} = require("../models/index");
const { generateS3PresignURL, deleteMediaFromS3 } = require("../services/s3");
const dbService = require("../util/dbServices");
const { catchAsync } = require('../util/catchAsync');

router.post('/file', catchAsync(async function _generatePresignURL(req, res) {
    const fileName = await generateS3PresignURL({
        fileName: req.body.fileName,
        fileType: req.body.fileType
    });
    res.success({ message: "Presign URL generated successfully.", data: { url: fileName } });
}))

.post('/file/remove', catchAsync(async function _generatePresignURL(req, res) {
    const reponseData = await deleteMediaFromS3({
        fileName: req.body.fileName
    });
    if(reponseData.hasOwnProperty('response') && reponseData.response) {
        return res.success({ message: "Media Delete successfully.", data: { url: req.body.fileName } });
    }
    res.badRequest({ message: "Something went wrong." });   
}))

.post('/threadMessageList', catchAsync(async function _generateThreadMessageList(req, res) {
    let data = await threadMessageList(req.body, req.loginUser);
    res.success({ message: "Message list get successfully.", data});
}))

.post('/chatGallaryMedia', catchAsync(async function _generateChatGallaryMedia(req,res){
    let data = await chatGallaryMedia(req.body, req.loginUser);
    res.success({ message: "Message list get successfully.", data});
}))

.post('/messageCountRange', catchAsync(async function _messageCountRangeList(req,res){
    let data = await messageCountBetweenRange(req.body);
    res.success({ message: "Message count range get successfully.", data});
}))

.post('/searchMessageAndChat', catchAsync(async function _searchMessageAndChat(req,res){
    let data = await searchMessagesAndChats(req.body, req.loginUser);
    res.success({ message: "Message search by message successfully.", data});
}))
.post('/checkUserLastMessage', catchAsync(async function _checkUserLastMessage(req,res){
    let data = await checkUserLastMessage(req.body, req.loginUser);
    if(data.count > 0){
        return res.success({ message: "Need to reload message List", rows : data.rows, count : data.count });
    }
    res.success({ message: "No need to reload message List", rows : data.rows, count : data.count });
}))

.post('/recipient', catchAsync(async function _getMessageRecipient(req,res){
   // console.log('---------------------<<: req.body :>>----------------- ', req.body);
    let data = await getMessageRecipient(req.body, req.loginUser);
    res.success({ message: "Message recipient list get successfully.", data});
}))

.post('/list', catchAsync(async function _messageList(req,res){
    let data = await dbService.list(MessageModel, req.body, 'message.id');
    res.success(data);
}))

.post('/info', catchAsync(async function _messageList(req, res){
    // let data = await messageList(req.body, req.loginUser, req.headers["initialmessage"], req.params.id, req.query);
    let data = await messageList(req.body, req.loginUser, req.headers["initialmessage"]);
    res.success({ message: "Message list get successfully.", data: { count: data.count, rows: data.rows } });
}))


.get('/sendMessage/:start/:end', catchAsync(async function _messageList(req, res){
    console.log('req.params :>> ', req.params.start);
    console.log('req.params :>> ', req.params.end);
    for (let index = Number(req.params.start); index < Number(req.params.end); index++) {
        let data = {
            chatType: 'group',
            chatId: 275,
            message: `TEST ${index}`,
            type: 'routine',
            sendTo: [ 12, 10, 20, 72 ],
            sendBy: 41,
            quotedMessageId: null,
            subject: null,
            isMessage: true,
            ccText: null,
            ccMentions: [],
            bccText: null,
            bccMentions: [],
            frontMsgId: 4346,
            label: [],
            loginUser: req.loginUser
        }
        await require("../controllers/message.controller").sendMessage(data);
        console.log("message sent successfully ", index);
    }
    res.success({ message: `Message list get successfully ${req.params.end}.` });
}))

module.exports = router;