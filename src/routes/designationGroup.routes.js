'use strict';
const dbService = require('../util/dbServices');
const DesignationGroupModel = require("../models/index").designationGroup;
const router = require('express').Router();
const catchAsync = require("../util/catchAsync").catchAsync;

router.post('/list',catchAsync(async function _designationGroupList(req,res){
    let data = await dbService.list(DesignationGroupModel, req.body);
    res.success(data);
}))
.post('/create',catchAsync(async function _designationGroupCreate(req,res){
    req.body.createdBy = req.loginUser.id;
    let createdData = await dbService.create(DesignationGroupModel,req.body);
    res.success({data: createdData});
}))
.post('/update',catchAsync(async function _designationUpdate(req, res) {
    req.body.createdBy = req.loginUser.id;
    let updatedData = await dbService.update(DesignationGroupModel,req.body);
    res.success({data: updatedData});
}))
.post('/delete',catchAsync(async function _designationDelete(req,res){
    let DeletedData = await dbService.delete(DesignationGroupModel, req.body.id);
    res.success({data: DeletedData});
}));

module.exports = router;
