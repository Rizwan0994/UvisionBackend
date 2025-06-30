'use strict';
const router = require('express').Router();
const dbService = require('../util/dbServices');
const { create, chatDetail, updateMuteNotification, chatListDashboard, getAllGroupsList, list,createAnnouncement,getAllAnnouncement} = require('../controllers/chat.controller');
const { catchAsync } = require('../util/catchAsync');
const ChatModel = require("../models/index").chat;
const { CHAT_TYPE } = require('../constants/chat.constant');

router.post('/create', catchAsync(async function _createChat(req, res){
    let data = await create(req.body, req.loginUser);
    res.success(data);
}))
.post('/list', catchAsync(async function _listChat(req, res){
    let data = await list(req.body, req.loginUser);
    res.success(data);
}))
.post('/detail/list', catchAsync(async function _chatDetailList(req,res){
    let data = await dbService.list(ChatModel, req.body, "chat.id");
    res.success(data);
}))
.post('/grouplist', catchAsync(async function _grouplist(req, res){
    // let data = await getAllGroupsList();
    req.body.query.type = CHAT_TYPE.GROUP;
    let data = await dbService.list(ChatModel, req.body, "chat.id");
    res.success(data);
}))
.post('/dashboard/list', catchAsync(async function _chatListDashboard(req, res) {
    let data = await chatListDashboard(req.body, req.loginUser);
    res.success(data);
}))
.post('/updateMuteNotification', catchAsync(async function _updateMuteNotification(req, res){
    let data = await updateMuteNotification(req.body, req.loginUser);
    res.success(data);
}))
.post('/info', catchAsync(async function _chatDetails(req, res){
    let data = await chatDetail(req.body, req.loginUser);
    res.success(data);
}))
.post('/announcement', catchAsync(async function _createAnnouncement(req, res){  //by rizwan..
    let data = await createAnnouncement(req.body, req.loginUser);
    res.success(data);
}))
.post('/announcement/list', catchAsync(async function _getAllAnnouncement(req, res){  //by rizwan..
    let data = await getAllAnnouncement(req.loginUser);
    res.success(data);
}))

module.exports = router;