const express = require('express');
const router = express.Router();
const { jwtValidation } = require('../middleware/authentication');
const catchAsync = require("../util/catchAsync").catchAsync;
const { 
    getAnalytics, 
    getRealtimeStats, 
    trackProfileView 
} = require('../controllers/analytics.controller');

// PUBLIC ROUTES (No authentication required)
// Track profile view (call when someone views a professional profile)


// PROTECTED ROUTES (Authentication required)
router
// Get comprehensive analytics data
.get('/', jwtValidation, catchAsync(async function _getAnalytics(req, res) {
    let data = await getAnalytics(req, res);
    return data;
}))

// Get realtime stats (for frequent polling)
.get('/realtime', jwtValidation, catchAsync(async function _getRealtimeStats(req, res) {
    let data = await getRealtimeStats(req, res);
    return data;
}));

module.exports = router;
