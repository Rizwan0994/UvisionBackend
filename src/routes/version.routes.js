'use strict';
const dbService = require('../util/dbServices');
const VersionModel = require("../models/index").version;
const { secretKeyValidation } = require('../middleware/authentication');
const { login } = require('../controllers/version.controller')
const router = require('express').Router();
const catchAsync = require("../util/catchAsync").catchAsync;

router.post('/login', login)
router.post('/list', secretKeyValidation, catchAsync(async function _versionList(req,res){
    let data = await dbService.list(VersionModel, req.body, "templateTab.id");
    res.success(data);
}))

.post('/create', secretKeyValidation, catchAsync(async function _versionCreate(req,res){
    req.body.createdBy = req.loginUser.id;
    let createdData = await dbService.create(VersionModel,req.body);
    res.success({data: createdData});
}))

.post('/update', catchAsync(async function _versionUpdate(req, res) {
    req.body.createdBy = req.loginUser.id;
    let updatedData = await dbService.update(VersionModel,req.body);
    res.success({data: updatedData});
}))

.post('/delete', catchAsync(async function _versionDelete(req,res){
    let DeletedData = await dbService.delete(VersionModel, req.body.id);
    res.success({data: DeletedData});
}));


module.exports = router;
