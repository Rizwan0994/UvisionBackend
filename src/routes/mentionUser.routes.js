'use strict'
const dbService = require('../util/dbServices');
const MentionUserModel = require("../models/index").mentionUser;
const router = require('express').Router();
const catchAsync = require("../util/catchAsync").catchAsync;

router.post('/list',catchAsync(async function _mentionList(req,res){
    let data = await dbService.list(MentionUserModel, req.body, "mentionuser.id");
    res.success(data);
}))

.post('/create', catchAsync(async function _mentionCreate(req,res){
    req.body.createdBy = req.loginUser.id;
    let createdData = await dbService.create(MentionUserModel,req.body);
    res.success({ data: createdData});
}))

.post('/update',catchAsync(async function _mentionUpdate(req, res) {
    req.body.createdBy = req.loginUser.id;
    let updatedData = await dbService.update(MentionUserModel,req.body);
    res.success({data: updatedData});
}))

.post('/delete',catchAsync(async function _mentionDelete(req,res){
    let DeletedData = await dbService.delete(MentionUserModel, req.body.id);
    res.success({data: DeletedData});
}));
module.exports = router;