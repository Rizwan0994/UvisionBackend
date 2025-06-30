'use strict';
const router = require('express').Router();
const { list, update } = require('../controllers/chatUser.controller');
const { catchAsync } = require('../util/catchAsync');

router.post('/list', catchAsync(async function _chatUserList(req, res){
    let data = await list(req.body, req.loginUser);
    res.success(data);
}))
.post('/update', catchAsync(async function _chatUserUpdate(req, res) {
    let data = await update(req.body, req.loginUser);
    res.success(data);
}));

module.exports = router;                                             