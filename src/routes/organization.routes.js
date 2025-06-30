'use strict'
const dbService = require('../util/dbServices');
const OrganizationModel = require('../models/index').organization;
const router = require("express").Router();
const catchAsync = require("../util/catchAsync").catchAsync;

router.post('/list',catchAsync(async function _organizationList(req,res){
    let data = await dbService.list(OrganizationModel, req.body);
    res.success(data);
}))

.post('/create', catchAsync(async function _organizationCreate(req,res){
    req.body.createdBy = req.loginUser.id;
    let createdData = await dbService.create(OrganizationModel,req.body);
    res.success({data: createdData});
}))

.post('/update', catchAsync(async function _organizationUpdate(req, res) {
    req.body.createdBy = req.loginUser.id;
    let updatedData = await dbService.update(OrganizationModel,req.body);
    res.success({data: updatedData});
}))

.post('/delete',catchAsync(async function _organizationDelete(req,res){
    let DeletedData = await dbService.delete(OrganizationModel, req.body.id);
    res.success({data: DeletedData});
}));

module.exports = router;
