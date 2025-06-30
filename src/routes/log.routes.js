'use strict';
const { list } = require('../controllers/userLogs.controller');
const router = require('express').Router();

router.post('/list', list);

module.exports = router;
