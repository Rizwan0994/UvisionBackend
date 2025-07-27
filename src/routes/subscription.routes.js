'use strict';
const router = require('express').Router();
const {
    createSubscriptionCheckout,
    handleStripeWebhook,
    getSubscriptionStatus,
    cancelUserSubscription
} = require('../controllers/subscription.controller');
const { jwtValidation } = require('../middleware/authentication');
const catchAsync = require("../util/catchAsync").catchAsync;

// Create Stripe Checkout Session
router.post('/create-checkout-session', jwtValidation, catchAsync(async function _createCheckoutSession(req, res) {
    let data = await createSubscriptionCheckout(req, res);
    return res.success(data);
}));

// Stripe Webhook (no auth required)
router.post('/webhook', catchAsync(async function _stripeWebhook(req, res) {
    let data = await handleStripeWebhook(req, res);
    return res.success(data);
}));

// Get User Subscription Status
router.get('/status', jwtValidation, catchAsync(async function _getSubscriptionStatus(req, res) {
    let data = await getSubscriptionStatus(req, res);
    res.success(data);
}));

// Cancel Subscription
router.post('/cancel', jwtValidation, catchAsync(async function _cancelSubscription(req, res) {
    let data = await cancelUserSubscription(req, res);
    res.success(data);
}));

module.exports = router;
