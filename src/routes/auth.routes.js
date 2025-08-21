'use strict';
const router = require('express').Router();
const { 
    signUp, 
    login, 
    verfiyToken, 
    changePassword,
    sendVerificationOTP,
    verifyEmail,
    resendVerificationOTP,
    forgotPassword,
    verifyForgotOTP,
    resetPassword
} = require('../controllers/auth.contoller');
const { jwtValidation } = require('../middleware/authentication');
const catchAsync = require("../util/catchAsync").catchAsync;
const addUserLog = require("../controllers/userLogs.controller").addUserLog;

router.post('/signup', catchAsync(async function _signUp(req, res){
    let data = await signUp(req.body);
    return res.success({data});
}))
.post('/login', catchAsync(async function _login(req, res){
    let data = await login({ email: req.body.email, password: req.body.password});
    if(data.hasOwnProperty("user")) await addUserLog({userId: data.user.id, type: 'login' })
    res.success(data);
}))
.get('/verifyToken', catchAsync( async function _verifyToken(req, res) {
    let data = await verfiyToken(req.headers["x-access-token"]);
    res.success(data);
}))
.post('/changePassword',jwtValidation, catchAsync( async function _chnagePassword(req, res) {
    let data = await changePassword(req.body.currentPassword, req.body.newPassword, req.body.confirmPassword, req.loginUser);
    res.success(data);
}))
// OTP Routes
.post('/send-verification-otp', catchAsync(async function _sendVerificationOTP(req, res) {
    let data = await sendVerificationOTP(req.body);
    res.success(data);
}))
.post('/verify-email', catchAsync(async function _verifyEmail(req, res) {
    let data = await verifyEmail(req.body);
    res.success(data);
}))
.post('/resend-verification-otp', catchAsync(async function _resendVerificationOTP(req, res) {
    let data = await resendVerificationOTP(req.body);
    res.success(data);
}))
.post('/forgot-password', catchAsync(async function _forgotPassword(req, res) {
    let data = await forgotPassword(req.body);
    res.success(data);
}))
.post('/verify-forgot-otp', catchAsync(async function _verifyForgotOTP(req, res) {
    let data = await verifyForgotOTP(req.body);
    res.success(data);
}))
.post('/reset-password', catchAsync(async function _resetPassword(req, res) {
    let data = await resetPassword(req.body);
    res.success(data);
}));

module.exports = router;