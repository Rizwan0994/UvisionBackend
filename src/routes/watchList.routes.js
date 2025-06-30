'use strict';
const dbService = require('../util/dbServices');
const WatchListModel = require("../models/index").watchList;
const { update } = require("../controllers/watchList.controller")
const router = require('express').Router();
const { own }  = require("../middleware/authentication");
const catchAsync = require("../util/catchAsync").catchAsync;

router.post('/list',own, catchAsync(async function _watchList(req,res){
    let data = await dbService.list(WatchListModel, req.body,'watchList.id');
    res.success(data);
}));

router.post('/update', catchAsync(async function _watchListUpdate(req,res){
    let data = await update(req.body, req.loginUser);
    res.success(data);
}));
module.exports = router;
