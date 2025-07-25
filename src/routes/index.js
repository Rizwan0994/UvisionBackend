/**
 * This file contains the routing configuration for the application.
 */

'use strict';
const router = require('express').Router();
const { queryGenerator } = require("../util/dbServices");
const { jwtValidation, excelDownloadLog } = require('../middleware/authentication');

// Route for executing a generic query
router.post('/query', async function(req,res){
    let data = await queryGenerator(req.body);
    res.status(200).json({ status: 1, data });
});

// Health check route
router.use("/health-check", (req, res) => {
    res.json({
        status: 200,
        message: "Health Check Successful"
    })
});

// Authentication routes
router.use('/auth', require("./auth.routes"));

// Categories routes (public)
router.use('/categories', require("./categories.routes"));

// Public professional routes (search and profiles)
router.use('/professional', require("./professionalSearch.routes"));

// Upload routes (has both public and protected endpoints)
router.use('/upload', require("./upload.routes"));

// Cron routes
router.use('/cron', require("./cron.routes"));

// Middleware for JWT validation and Excel download log
// router.use(jwtValidation);
router.use(excelDownloadLog);
router.use('/user', require("./user.routes"));
router.use('/profile', require("./profile.routes"));
router.use('/chat', require("./chat.routes"));
router.use('/chat/user', require("./chatUser.routes"));
router.use('/message', require("./message.routes"));
router.use('/note', require("./note.routes"));
router.use('/fcmtoken', require("./fcmToken.routes"));
router.use('/log', require('./log.routes'));
router.use('/designation', require("./designation.routes"));
router.use('/version', require("./version.routes"));
router.use('/organization', require("./organization.routes"));
router.use('/messageEmoji', require("./messageEmoji.routes"));
router.use('/companyRole', require("./companyRole.routes"));
router.use('/designationGroup', require("./designationGroup.routes"));
router.use('/professional-dashboard', require("./professional.routes"));
router.use('/booking', require("./booking.routes"));
module.exports = router;
