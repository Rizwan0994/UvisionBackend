/**
 * This file contains the routing configuration for the application.
 */

'use strict';
const router = require('express').Router();
const { queryGenerator } = require("../util/dbServices");
const { jwtValidation, excelDownloadLog } = require('../middleware/authentication');

/**
 * @swagger
 * /query:
 *   post:
 *     summary: Execute database query
 *     description: Execute a generic database query (Admin only)
 *     tags: [Database]
 *     security:
 *       - bearerAuth: []
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               query:
 *                 type: string
 *                 description: SQL query to execute
 *                 example: "SELECT * FROM users LIMIT 10"
 *               params:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Query parameters
 *     responses:
 *       200:
 *         description: Query executed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: integer
 *                   example: 1
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Insufficient permissions
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// Route for executing a generic query
router.post('/query', async function(req,res){
    let data = await queryGenerator(req.body);
    res.status(200).json({ status: 1, data });
});

/**
 * @swagger
 * /health-check:
 *   get:
 *     summary: Health check endpoint
 *     description: Check if the API is running and healthy
 *     tags: [Health]
 *     security: []
 *     responses:
 *       200:
 *         description: API is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: integer
 *                   example: 200
 *                 message:
 *                   type: string
 *                   example: "Health Check Successful"
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                   example: "2024-01-01T12:00:00.000Z"
 *                 uptime:
 *                   type: number
 *                   example: 12345.67
 *                   description: "Server uptime in seconds"
 */
// Health check route
router.use("/health-check", (req, res) => {
    res.json({
        status: 200,
        message: "Health Check Successful",
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    })
});

// Authentication routes
router.use('/auth', require("./auth.routes"));

// Cron routes
router.use('/cron', require("./cron.routes"));

// Middleware for JWT validation and Excel download log
router.use(jwtValidation);
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
module.exports = router;
