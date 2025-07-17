'use strict';
const router = require('express').Router();
const { 
    getAllCategories, 
    getCategoryById, 
    getMainCategories, 
    getSubcategories, 
    searchCategories 
} = require('../controllers/categories.controller');
const catchAsync = require("../util/catchAsync").catchAsync;

// Get all categories
router.get('/', catchAsync(async function _getAllCategories(req, res) {
    const data = await getAllCategories(req.query);
    res.success(data);
}))

// Get main categories only
.get('/main', catchAsync(async function _getMainCategories(req, res) {
    const data = await getMainCategories();
    res.success(data);
}))

// Search categories
.post('/search', catchAsync(async function _searchCategories(req, res) {
    const data = await searchCategories(req.body);
    res.success(data);
}))

// Get subcategories for a parent category
.get('/:parentId/subcategories', catchAsync(async function _getSubcategories(req, res) {
    const data = await getSubcategories(req.params.parentId);
    res.success(data);
}))

// Get category by ID or slug
.get('/:identifier', catchAsync(async function _getCategoryById(req, res) {
    const data = await getCategoryById(req.params.identifier);
    res.success(data);
}));

module.exports = router;
