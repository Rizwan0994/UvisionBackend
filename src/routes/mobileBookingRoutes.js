'use strict';

const router = require('express').Router();
const { 
    createMobileCheckoutSession, 
    verifyMobilePayment, 
    getPaymentStatus 
} = require('../controllers/mobileBookingController');
const catchAsync = require("../util/catchAsync").catchAsync;

// Create mobile checkout session
router.post('/checkout-session', catchAsync(async function _createMobileCheckoutSession(req, res) {
    let data = await createMobileCheckoutSession(req.body, req.loginUser);
    res.success(data);
}));

// Verify mobile payment
router.post('/verify-payment',  catchAsync(async function _verifyMobilePayment(req, res) {
    let data = await verifyMobilePayment(req.body, req.loginUser);
    res.success(data);
}));

// Get payment status
router.get('/payment-status/:sessionId',catchAsync(async function _getPaymentStatus(req, res) {
    let data = await getPaymentStatus(req.params.sessionId, req.loginUser);
    res.success(data);
}));

module.exports = router;
