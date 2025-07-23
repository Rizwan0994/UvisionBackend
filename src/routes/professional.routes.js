'use strict';
const router = require('express').Router();
const { 
    createOrUpdateProfile, 
    getProfile, 
    getMyProfile, 
    searchProfessionals, 
    updateAvailability,
    recalculateMetrics 
} = require('../controllers/professionalProfile.controller');
const { 
    createService, 
    getMyServices, 
    updateService, 
    deleteService 
} = require('../controllers/professionalServices.controller');
const { 
    getProfessionalBookings, 
    updateBookingStatus, 
    getProfessionalBookingDetails, 
    getBookingStats, 
    getUpcomingBookings 
} = require('../controllers/professionalBookingManagement.controller');
const { 
    addPortfolioItem, 
    getMyPortfolio, 
    getPortfolioByProfessionalId, 
    updatePortfolioItem, 
    deletePortfolioItem, 
    updatePortfolioOrder, 
    getPortfolioCategories, 
    incrementViewCount 
} = require('../controllers/professionalPortfolio.controller');
const { jwtValidation } = require('../middleware/authentication');
const catchAsync = require("../util/catchAsync").catchAsync;

// Professional Profile Routes
router.post('/profile', jwtValidation, catchAsync(async function _createOrUpdateProfile(req, res) {
    let data = await createOrUpdateProfile(req.body, req.loginUser);
    return res.success({ data });
}))
.get('/profile/me', jwtValidation, catchAsync(async function _getMyProfile(req, res) {
    let data = await getMyProfile(req.loginUser);
    res.success(data);
}))
.patch('/availability', jwtValidation, catchAsync(async function _updateAvailability(req, res) {
    let data = await updateAvailability(req.body.isAvailable, req.loginUser);
    res.success(data);
}))
.post('/metrics/recalculate', jwtValidation, catchAsync(async function _recalculateMetrics(req, res) {
    let data = await recalculateMetrics(req.loginUser);
    res.success(data);
}))

// Professional Services Routes
.post('/services', jwtValidation, catchAsync(async function _createService(req, res) {
    let data = await createService(req.body, req.loginUser);
    return res.success({ data });
}))
.get('/services/me', jwtValidation, catchAsync(async function _getMyServices(req, res) {
    let data = await getMyServices(req.loginUser);
    res.success(data);
}))
.put('/services/:serviceId', jwtValidation, catchAsync(async function _updateService(req, res) {
    let data = await updateService(req.params.serviceId, req.body, req.loginUser);
    res.success(data);
}))
.delete('/services/:serviceId', jwtValidation, catchAsync(async function _deleteService(req, res) {
    let data = await deleteService(req.params.serviceId, req.loginUser);
    res.success(data);
}))

// Professional Booking Management Routes
.get('/bookings', jwtValidation, catchAsync(async function _getProfessionalBookings(req, res) {
    let data = await getProfessionalBookings(req.loginUser);
    res.success(data);
}))
.get('/bookings/stats', jwtValidation, catchAsync(async function _getBookingStats(req, res) {
    let data = await getBookingStats(req.loginUser);
    res.success(data);
}))
.get('/bookings/upcoming', jwtValidation, catchAsync(async function _getUpcomingBookings(req, res) {
    let data = await getUpcomingBookings(req.loginUser);
    res.success(data);
}))
.get('/bookings/:bookingId', jwtValidation, catchAsync(async function _getProfessionalBookingDetails(req, res) {
    let data = await getProfessionalBookingDetails(req.params.bookingId, req.loginUser);
    res.success(data);
}))
.patch('/bookings/:bookingId/status', jwtValidation, catchAsync(async function _updateBookingStatus(req, res) {
    let data = await updateBookingStatus(req.params.bookingId, req.body.status, req.loginUser);
    res.success(data);
}))

// Professional Portfolio Routes
.post('/portfolio', jwtValidation, catchAsync(async function _addPortfolioItem(req, res) {
    let data = await addPortfolioItem(req, res);
    return data;
}))
.get('/portfolio/me', jwtValidation, catchAsync(async function _getMyPortfolio(req, res) {
    let data = await getMyPortfolio(req, res);
    return data;
}))
.get('/portfolio/:professionalId', catchAsync(async function _getPortfolioByProfessionalId(req, res) {
    let data = await getPortfolioByProfessionalId(req, res);
    return data;
}))
.put('/portfolio/:portfolioId', jwtValidation, catchAsync(async function _updatePortfolioItem(req, res) {
    let data = await updatePortfolioItem(req, res);
    return data;
}))
.delete('/portfolio/:portfolioId', jwtValidation, catchAsync(async function _deletePortfolioItem(req, res) {
    let data = await deletePortfolioItem(req, res);
    return data;
}))
.patch('/portfolio/order', jwtValidation, catchAsync(async function _updatePortfolioOrder(req, res) {
    let data = await updatePortfolioOrder(req, res);
    return data;
}))
.get('/portfolio/categories', catchAsync(async function _getPortfolioCategories(req, res) {
    let data = await getPortfolioCategories(req, res);
    return data;
}))
.patch('/portfolio/:portfolioId/view', catchAsync(async function _incrementViewCount(req, res) {
    let data = await incrementViewCount(req, res);
    return data;
}));

module.exports = router;
