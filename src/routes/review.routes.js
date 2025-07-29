'use strict';
const router = require('express').Router();
const { 
    createReview, 
    getMyReviews,
    getReviewsByProfessional
} = require('../controllers/professionalReviews.controller');
const { jwtValidation } = require('../middleware/authentication');
const catchAsync = require("../util/catchAsync").catchAsync;

// Create new review for a booking
router.post('/create', jwtValidation, catchAsync(async function _createReview(req, res) {
    let data = await createReview(req.body, req.loginUser);
    res.success(data);
}))

// Get client's reviews
.get('/my-reviews', jwtValidation, catchAsync(async function _getMyReviews(req, res) {
    let data = await getMyReviews(req.loginUser);
    res.success(data);
}))

// Get reviews for a specific professional (public endpoint)
.get('/professional/:professionalId', catchAsync(async function _getReviewsByProfessional(req, res) {
    let data = await getReviewsByProfessional(req.params.professionalId);
    res.success(data);
}));

module.exports = router;
