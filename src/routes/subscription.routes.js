'use strict';
const express = require('express');
const router = express.Router();
const {
    createSubscriptionCheckout,
    handleStripeWebhook,
    getSubscriptionStatus,
    cancelUserSubscription,
    createManualSubscription,
    // Payment Management
    createPaymentAccount,
    getPaymentAccountStatus,
    getPaymentDashboardLink,
    removePaymentAccount
} = require('../controllers/subscription.controller');
const { jwtValidation } = require('../middleware/authentication');
const catchAsync = require("../util/catchAsync").catchAsync;

// Create Stripe Checkout Session
router.post('/create-checkout-session', jwtValidation, catchAsync(async function _createCheckoutSession(req, res) {
    let data = await createSubscriptionCheckout(req, res);
    return res.success(data);
}));

// Stripe Webhook (no auth required) - needs raw body for signature verification
router.post('/webhook', express.raw({ type: 'application/json' }), catchAsync(async function _stripeWebhook(req, res) {
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

// Manual Subscription Creation (for testing)
router.post('/create-manual', jwtValidation, catchAsync(async function _createManualSubscription(req, res) {
    let data = await createManualSubscription(req, res);
    res.success(data);
}));

// PAYMENT MANAGEMENT ROUTES
// Create Payment Account
router.post('/payments/connect', jwtValidation, catchAsync(async function _createPaymentAccount(req, res) {
    let data = await createPaymentAccount(req, res);
    res.success(data);
}));

// Get Payment Account Status
router.get('/payments/status', jwtValidation, catchAsync(async function _getPaymentAccountStatus(req, res) {
    let data = await getPaymentAccountStatus(req, res);
    res.success(data);
}));

// Get Dashboard Link
router.get('/payments/dashboard', jwtValidation, catchAsync(async function _getPaymentDashboardLink(req, res) {
    let data = await getPaymentDashboardLink(req, res);
    res.success(data);
}));

// Remove Payment Account
router.delete('/payments/remove', jwtValidation, catchAsync(async function _removePaymentAccount(req, res) {
    let data = await removePaymentAccount(req, res);
    res.success(data);
}));

module.exports = router;
