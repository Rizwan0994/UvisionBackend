'use strict';
const dbService = require('../util/dbServices');
const DesignationModel = require("../models/index").designations;
const { create, update } = require("../controllers/designations.controller");
const router = require('express').Router();
const catchAsync = require("../util/catchAsync").catchAsync;

router.post('/list',catchAsync(async function _designationList(req,res){
    let data = await dbService.list(DesignationModel, req.body, "designations.id");
    res.success(data);
}))
.post('/create', catchAsync(async function _designationCreate(req,res){
    let data = await create(req.body, req.loginUser);
    res.success(data);
}))
.post('/update', catchAsync(async function _designationUpdate(req,res){
    let data = await update(req.body,req.loginUser);
    res.success(data);
}))
.post('/delete', catchAsync(async function _designationDelete(req,res){
    let DeletedData = await dbService.delete(DesignationModel, req.body.id);
    res.success({data: DeletedData});
}));

module.exports = router;
