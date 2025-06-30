'use strict';
const Cron = require("../models/index").cron;
const CronReport = require("../models/index").cronReport;
const getDefaultCronQuery  = require("../middleware/authentication").getDefaultCronQuery;
const router = require('express').Router();
const catchAsync = require("../util/catchAsync").catchAsync;

router.get('/list',getDefaultCronQuery, catchAsync(async function _cronList(req,res){
    let data = await Cron.findAll({ raw: true, ...req.query});
    res.render('cron', { status: 'Cron information', data });
}))
.get('/report/list',getDefaultCronQuery,catchAsync(async function _cronReportList(req,res){
    let data = await CronReport.findAll({ raw: true, ...req.query});
    res.render('cronReport', { status: 'Cron information', data });
}));


module.exports = router;
