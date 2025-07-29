'use strict';
const router = require('express').Router();
const { 
    createBooking, 
    updateBookingDetails, 
    processPayment, 
    confirmBooking, 
    getMyBookings, 
    getBookingDetails, 
    cancelBooking,
    getAvailableSlots,
    // New payment functions
    processUpfrontPayment,
    confirmUpfrontPayment,
    processRemainingPayment,
    getBookingPayments
} = require('../controllers/professionalBookings.controller');
const { jwtValidation } = require('../middleware/authentication');
const catchAsync = require("../util/catchAsync").catchAsync;

// Create new booking (Step 1 - Service Selection)
router.post('/create', jwtValidation, catchAsync(async function _createBooking(req, res) {
    let data = await createBooking(req.body, req.loginUser);
    return res.success({ data });
}))

// Update booking details (Step 2 - Event Details)
.put('/:bookingId/details', jwtValidation, catchAsync(async function _updateBookingDetails(req, res) {
    let data = await updateBookingDetails(req.params.bookingId, req.body, req.loginUser);
    res.success(data);
}))

// Process payment (Step 3 - Payment)
.post('/:bookingId/payment', jwtValidation, catchAsync(async function _processPayment(req, res) {
    let data = await processPayment(req.params.bookingId, req.body, req.loginUser);
    res.success(data);
}))

// Confirm booking (Step 4 - Confirmation)
.post('/:bookingId/confirm', jwtValidation, catchAsync(async function _confirmBooking(req, res) {
    let data = await confirmBooking(req.params.bookingId, req.body.confirmationCode, req.loginUser);
    res.success(data);
}))

// Get client's bookings
.get('/me', jwtValidation, catchAsync(async function _getMyBookings(req, res) {
    let data = await getMyBookings(req.loginUser);
    res.success(data);
}))

// Get specific booking details
.get('/:bookingId', jwtValidation, catchAsync(async function _getBookingDetails(req, res) {
    let data = await getBookingDetails(req.params.bookingId, req.loginUser);
    res.success(data);
}))

// Cancel booking
.patch('/:bookingId/cancel', jwtValidation, catchAsync(async function _cancelBooking(req, res) {
    let data = await cancelBooking(req.params.bookingId, req.body.reason, req.loginUser);
    res.success(data);
}))

// Get available time slots for a professional on a specific date
.get('/availability/:professionalId/:date', catchAsync(async function _getAvailableSlots(req, res) {
    let data = await getAvailableSlots(req.params.professionalId, req.params.date);
    res.success(data);
}))

// ================ NEW PAYMENT ROUTES ================

// Process upfront payment (30%) for booking
.post('/:bookingId/payment/upfront', jwtValidation, catchAsync(async function _processUpfrontPayment(req, res) {
    let data = await processUpfrontPayment({ ...req.body, bookingId: req.params.bookingId }, req.loginUser);
    res.success(data);
}))

// Confirm upfront payment after payment method confirmation
.post('/payment/confirm-upfront', jwtValidation, catchAsync(async function _confirmUpfrontPayment(req, res) {
    let data = await confirmUpfrontPayment(req.body, req.loginUser);
    res.success(data);
}))

// Process remaining payment (70%) with confirmation code
.post('/:bookingId/payment/remaining', jwtValidation, catchAsync(async function _processRemainingPayment(req, res) {
    let data = await processRemainingPayment({ ...req.body, bookingId: req.params.bookingId }, req.loginUser);
    res.success(data);
}))

// Get booking payment details
.get('/:bookingId/payments', jwtValidation, catchAsync(async function _getBookingPayments(req, res) {
    let data = await getBookingPayments(req.params.bookingId, req.loginUser);
    res.success(data);
}));

module.exports = router;
