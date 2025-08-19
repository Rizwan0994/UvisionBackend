'use strict';
const express = require('express');
const router = express.Router();
const { handleStripeWebhook } = require('../controllers/subscription.controller');
const catchAsync = require("../util/catchAsync").catchAsync;

// Stripe Webhook (no auth required) - needs raw body for signature verification
// Note: This route is registered separately in app.js with express.raw middleware
router.post('/', catchAsync(async function _stripeWebhook(req, res) {
    let data = await handleStripeWebhook(req, res);
    return res.success(data);
}));

module.exports = router;
