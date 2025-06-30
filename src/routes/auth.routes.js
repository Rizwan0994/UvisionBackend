'use strict';
const router = require('express').Router();
const { signUp, login, verfiyToken, changePassword } = require('../controllers/auth.contoller');
const { jwtValidation } = require('../middleware/authentication');
const catchAsync = require("../util/catchAsync").catchAsync;
const addUserLog = require("../controllers/userLogs.controller").addUserLog;

/**
 * @swagger
 * components:
 *   schemas:
 *     LoginRequest:
 *       type: object
 *       required:
 *         - email
 *         - password
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           description: User's email address
 *           example: "user@example.com"
 *         password:
 *           type: string
 *           format: password
 *           description: User's password
 *           example: "password123"
 *     
 *     SignUpRequest:
 *       type: object
 *       required:
 *         - email
 *         - name
 *         - password
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           description: User's email address
 *           example: "newuser@example.com"
 *         name:
 *           type: string
 *           description: User's full name
 *           example: "John Doe"
 *         profilePicture:
 *           type: string
 *           description: URL to user's profile picture
 *           example: "https://example.com/profile.jpg"
 *         password:
 *           type: string
 *           format: password
 *           description: User's password
 *           example: "password123"
 *     
 *     ChangePasswordRequest:
 *       type: object
 *       required:
 *         - currentPassword
 *         - newPassword  
 *         - confirmPassword
 *       properties:
 *         currentPassword:
 *           type: string
 *           format: password
 *           description: User's current password
 *           example: "oldpassword123"
 *         newPassword:
 *           type: string
 *           format: password
 *           description: User's new password
 *           example: "newpassword123"
 *         confirmPassword:
 *           type: string
 *           format: password
 *           description: Confirmation of new password
 *           example: "newpassword123"
 *     
 *     AuthResponse:
 *       type: object
 *       properties:
 *         status:
 *           type: integer
 *           example: 1
 *         message:
 *           type: string
 *           example: "Success"
 *         data:
 *           type: object
 *           properties:
 *             user:
 *               $ref: '#/components/schemas/User'
 *             token:
 *               type: string
 *               description: JWT access token
 *               example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 */

/**
 * @swagger
 * /auth/signup:
 *   post:
 *     summary: Register a new user
 *     description: Create a new user account with email, name, and password
 *     tags: [Authentication]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SignUpRequest'
 *     responses:
 *       200:
 *         description: User successfully registered
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       409:
 *         description: User already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               status: 0
 *               message: "User already exists with this email"
 */
router.post('/signup', catchAsync(async function _signUp(req, res){
    let data = await signUp(req.body.email, req.body.name, req.body.profilePicture, req.body.password);
    return res.success({data});
}))

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: User login
 *     description: Authenticate user with email and password
 *     tags: [Authentication]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               status: 0
 *               message: "Invalid email or password"
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 */
.post('/login', catchAsync(async function _login(req, res){
    let data = await login({ email: req.body.email, password: req.body.password});
    if(data.hasOwnProperty("user")) await addUserLog({userId: data.user.id, type: 'login' })
    res.success(data);
}))

/**
 * @swagger
 * /auth/verifyToken:
 *   get:
 *     summary: Verify JWT token
 *     description: Validate the provided JWT token and return user information
 *     tags: [Authentication]
 *     security: []
 *     parameters:
 *       - in: header
 *         name: x-access-token
 *         required: true
 *         schema:
 *           type: string
 *         description: JWT token to verify
 *         example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *     responses:
 *       200:
 *         description: Token is valid
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: integer
 *                   example: 1
 *                 message:
 *                   type: string
 *                   example: "Token is valid"
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *                     tokenValid:
 *                       type: boolean
 *                       example: true
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       400:
 *         description: Token missing or malformed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
.get('/verifyToken', catchAsync( async function _verifyToken(req, res) {
    let data = await verfiyToken(req.headers["x-access-token"]);
    res.success(data);
}))

/**
 * @swagger
 * /auth/changePassword:
 *   post:
 *     summary: Change user password
 *     description: Change the password for an authenticated user
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ChangePasswordRequest'
 *     responses:
 *       200:
 *         description: Password changed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: integer
 *                   example: 1
 *                 message:
 *                   type: string
 *                   example: "Password changed successfully"
 *                 data:
 *                   type: object
 *       400:
 *         description: Password validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               status: 0
 *               message: "Current password is incorrect"
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
.post('/changePassword',jwtValidation, catchAsync( async function _chnagePassword(req, res) {
    let data = await changePassword(req.body.currentPassword, req.body.newPassword, req.body.confirmPassword, req.loginUser);
    res.success(data);
}));

module.exports = router;