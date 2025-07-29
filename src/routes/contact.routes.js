/**
 * contact.routes.js
 * @description :: CRUD API routes for contact
 */

const express = require('express');
const router = express.Router();
const { submitContactForm } = require('../controllers/contact.controller');
const catchAsync = require("../util/catchAsync").catchAsync;
// Public route - no authentication required


router.post('/submit', catchAsync(async function _contactUs(req, res){
    let data = submitContactForm();
    return res.success({data});
}))

module.exports = router;
