'use strict';
const router = require('express').Router();
const { list, create, deleteCategory, updateCategory } = require('../controllers/labelSubCategory.controller');
const { catchAsync } = require('../util/catchAsync');

router.post('/list', catchAsync(async function _labelSubCategoryList(req, res) {
    let data = await list(req.body, req.loginUser);
    res.success(data);
}))
.post('/create', catchAsync(async function _labelSubCategoryCreate(req, res) {
    let data = await create(req.body, req.loginUser);
    res.success({ message: "Note created successfully.", data});
}))
.post('/delete', catchAsync(async function _labelSubCategorydeleteCategory(req, res) {
    let data = await deleteCategory(req.body);
    res.success({ message: "Label Subcategory deleted successfully.", data});
}))
.post('/update', catchAsync(async function _labelSubCategoryUpdate(req, res){
    let data = await updateCategory(req.body, req.loginUser);
    res.success({ message: "label sub category updated successfully.", data});
}))

module.exports = router;