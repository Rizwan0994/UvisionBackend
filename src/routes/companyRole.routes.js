'use strict';
const dbService = require('../util/dbServices');
const CompanyRoleModel = require("../models/index").companyRole;
const router = require('express').Router();
const catchAsync = require("../util/catchAsync").catchAsync;

router.post('/list',catchAsync(async function _companyRoleList(req,res){
    let data = await dbService.list(CompanyRoleModel, req.body);
    res.success(data);
}))

.post('/create',catchAsync(async function _companyRoleCreate(req,res){
    req.body.createdBy = req.loginUser.id;
    let createdData = await dbService.create(CompanyRoleModel,req.body);
    res.success({data: createdData});
}))

.post('/createAll',catchAsync(async function _companyRoleCreateAll(req,res){
    req.body.createdBy = req.loginUser.id;
    let companyRole = ["Admin", "Manager", "Employee", "Intern"];
    let companyRoleData = companyRole.map(ele=>{
        return {
            name: ele,
            createdBy:  req.loginUser.id
        }
    })
    let data = await CompanyRoleModel.bulkCreate(companyRoleData);
    res.success(data);
}))
    

.post('/update', catchAsync(async function _companyRoleUpdate(req, res) {
    req.body.createdBy = req.loginUser.id;
    let updatedData = await dbService.update(CompanyRoleModel,req.body);
    res.success({data: updatedData});
}))

.post('/delete',catchAsync(async function _companyRoleDelete(req,res){
    let DeletedData = await dbService.delete(CompanyRoleModel, req.body.id);
    res.success({data: DeletedData});
}));

module.exports = router;