'use strict'
const dbService = require('../util/dbServices');
const MessageEmojiModel = require("../models/index").messageEmoji;
const router = require('express').Router();
const { createOrUpdateMessageEmoji } = require('../controllers/messageEmoji.controller');
const catchAsync = require("../util/catchAsync").catchAsync;

router.post('/list',catchAsync(async function _messageEmojiList(req,res){
    let data = await dbService.list(MessageEmojiModel, req.body);
    res.success(data);
}))

.post('/create', catchAsync(async function _messageEmojiCreate(req,res){
    const formCreated = await createOrUpdateMessageEmoji({...req.body, loginUser: req.loginUser});
    res.success({ message: `Message Emoji created successfully.`, data: formCreated });
}))

.post('/update',catchAsync(async function _messageEmojiUpdate(req, res) {
    req.body.createdBy = req.loginUser.id;
    let updatedData = await dbService.update(MessageEmojiModel,req.body);
    res.success({data: updatedData});
}))

.post('/delete',catchAsync(async function _messageEmojiDelete(req,res){
    let DeletedData = await dbService.delete(MessageEmojiModel, req.body.id);
    res.success({data: DeletedData});
}));
module.exports = router;