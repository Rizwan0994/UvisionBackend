'use strict';
const router = require('express').Router();
const { 
    searchProfessionals,
    getProfile
} = require('../controllers/professionalProfile.controller');
const catchAsync = require("../util/catchAsync").catchAsync;

// Public Professional Routes

// Search professionals (public route)
router.post('/search', catchAsync(async function _searchProfessionals(req, res) {
    let data = await searchProfessionals(req.body);
    res.success(data);
}));

// Get public professional profile (public route) 
router.get('/profile/:userId', catchAsync(async function _getProfile(req, res) {
    let data = await getProfile(req.params.userId);
    res.success(data);
}));

module.exports = router;
