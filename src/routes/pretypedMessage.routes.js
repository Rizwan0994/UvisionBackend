'use strict';
const { me } = require('../middleware/authentication');
const { catchAsync } = require('../util/catchAsync');
const dbService = require('../util/dbServices');
const PretypedMessageModel = require("../models/index").pretypedMessage;
const router = require('express').Router();
const { SAVED_MESSAGE_LIMIT } = require("../constants/preTypedMessage.constant")

router.post('/list', catchAsync(async function(req,res){
    req.body.query = {
        ...req.body.query, 
        userId: req.loginUser.id 
    }; 
    let data = await dbService.list(PretypedMessageModel, req.body);
    res.success(data);
}))

.post('/create', catchAsync(async function(req,res){
    let payload = {
        query : { userId: req.loginUser.id },
        isCountOnly: true
    };
    let totalSavedMessages = await dbService.list(PretypedMessageModel, payload);
    if(totalSavedMessages.data >= SAVED_MESSAGE_LIMIT ) return res.badRequest({ message: "Save messages limit is exceeded" })
    req.body.createdBy = req.loginUser.id;
    req.body.userId = req.loginUser.id;
    let createdData = await dbService.create(PretypedMessageModel,req.body);
    res.success({ message: `Pre-Type message details create successfully.`, data: createdData});
}))

.post('/update', catchAsync(async function(req, res) {
    req.body.createdBy = req.loginUser.id;
    let updatedData = await dbService.update(PretypedMessageModel,req.body);
    res.success({ message: `Pre-Type message update successfully.`, data: updatedData});
}))

.post('/delete', catchAsync(async function(req,res){
    let DeletedData = await dbService.delete(PretypedMessageModel, req.body.id);
    res.success({ message: `Pre-Type message delete successfully.`, data: DeletedData});
}));

module.exports = router;