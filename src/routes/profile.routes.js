'use strict';
const { me } = require('../controllers/profile.controller');
const { jwtValidation } = require('../middleware/authentication');
const { catchAsync } = require('../util/catchAsync');
const router = require('express').Router();

// router.get('/me',jwtValidation, me);
router.get('/me',jwtValidation, catchAsync(async function _me(req, res){
    let data = await me(req.loginUser);
    res.success(data);
}));

module.exports = router;
