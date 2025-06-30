'use strict';
const router = require('express').Router();
const { list, create } = require('../controllers/FCMToken.controller');
const { catchAsync } = require('../util/catchAsync');

// router.post('/list', list)
router.post('/list', catchAsync(async function _FCMTokenList(req, res) {
    let data = await list(req.body, req.loginUser);
    res.success(data);
}))
// .post('/create', create);
.post('/create', catchAsync(async function _FCMTokenCreate(req, res) {
    let data = await create(req.body, req.loginUser);
    res.success(data);
}));
module.exports = router;