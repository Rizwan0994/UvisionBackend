'use strict';
const router = require('express').Router();
const { create, list,updateNote, deleteNote } = require('../controllers/note.controller');
const { catchAsync } = require('../util/catchAsync');

router.post('/create', catchAsync(async function _noteCreate(req, res){
    let data = await create(req.body, req.loginUser);
    res.success({ message: "Note created successfully.", data});
}))
.post('/list', catchAsync(async function _noteList(req, res){
    let data = await list(req.body, req.loginUser);
    res.success(data);
}))
.post('/update', catchAsync(async function _noteUpdate(req, res){
    let data = await updateNote(req.body, req.loginUser);
    res.success({ message: "Note update successfully", data});
}))
.post('/delete', catchAsync(async function _noteDelete(req, res){
    let data = await deleteNote(req.body);
    res.success({ message: "Note delete successfully", data});
}))

module.exports = router;