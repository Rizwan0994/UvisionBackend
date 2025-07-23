'use strict';
const router = require('express').Router();
const { 
    getPresignedUrl,
    uploadToS3,
    deleteFromS3,
    getFileInfo
} = require('../controllers/upload.controller');
const { jwtValidation } = require('../middleware/authentication');
const catchAsync = require("../util/catchAsync").catchAsync;

// Get presigned URL for direct S3 upload (most common method)
router.post('/presigned-url', jwtValidation, catchAsync(async function _getPresignedUrl(req, res) {
    let data = await getPresignedUrl(req.body);
    res.success(data);
}));

// Alternative: Upload file through server to S3 (if you want server-side handling)
router.post('/direct', jwtValidation, catchAsync(async function _uploadToS3(req, res) {
    // This expects multipart/form-data with file field
    const file = req.files && req.files.file ? req.files.file : null;
    let data = await uploadToS3(file, req.body);
    res.success(data);
}));

// Delete file from S3
router.delete('/delete', jwtValidation, catchAsync(async function _deleteFromS3(req, res) {
    let data = await deleteFromS3(req.body);
    res.success(data);
}));

// Get file information and public URL
router.post('/info', jwtValidation, catchAsync(async function _getFileInfo(req, res) {
    let data = await getFileInfo(req.body);
    res.success(data);
}));

// Public route to get presigned URL (if you want to allow public uploads)
router.post('/public/presigned-url', catchAsync(async function _getPublicPresignedUrl(req, res) {
    let data = await getPresignedUrl(req.body);
    res.success(data);
}));

module.exports = router;
