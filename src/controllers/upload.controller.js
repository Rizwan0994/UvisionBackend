const { generateS3PresignURL, deleteMediaFromS3 } = require('../services/s3');
const createError = require('http-errors');
const path = require('path');

/**
 * Upload Controller for S3 Direct Upload
 * 
 * Available file categories:
 * - profiles: Profile pictures and cover images
 * - portfolio: Portfolio images and videos
 * - documents: PDF, DOC files
 * - general: Other files
 * 
 * File organization in S3:
 * bucket/category/year/month/day/uuid-filename.ext
 * 
 * Example: bucket/profiles/2025/07/23/uuid-avatar.jpg
 */

/**
 * Get S3 presigned URL for direct upload
 */
const getPresignedUrl = async (data) => {
    try {
        const { fileName, fileType, fileCategory = 'general' } = data;

        // Validate required fields
        if (!fileName || !fileType) {
            throw new createError["BadRequest"]('fileName and fileType are required');
        }

        // Validate file type
        const allowedTypes = [
            // Images
            'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
            // Videos
            'video/mp4', 'video/mpeg', 'video/quicktime', 'video/x-msvideo', 'video/webm',
            // Documents (if needed)
            'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ];

        if (!allowedTypes.includes(fileType)) {
            throw new createError["BadRequest"]('File type not supported. Supported types: Images (JPEG, PNG, GIF, WebP, SVG), Videos (MP4, MPEG, QuickTime, AVI, WebM), Documents (PDF, DOC, DOCX)');
        }

        // Validate file extension matches content type
        const fileExt = path.extname(fileName).toLowerCase();
        const typeExtMap = {
            'image/jpeg': ['.jpg', '.jpeg'],
            'image/jpg': ['.jpg', '.jpeg'], 
            'image/png': ['.png'],
            'image/gif': ['.gif'],
            'image/webp': ['.webp'],
            'image/svg+xml': ['.svg'],
            'video/mp4': ['.mp4'],
            'video/mpeg': ['.mpeg', '.mpg'],
            'video/quicktime': ['.mov'],
            'video/x-msvideo': ['.avi'],
            'video/webm': ['.webm'],
            'application/pdf': ['.pdf'],
            'application/msword': ['.doc'],
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
        };

        if (!typeExtMap[fileType] || !typeExtMap[fileType].includes(fileExt)) {
            throw new createError["BadRequest"]('File extension does not match the provided file type');
        }

        // Generate presigned URL
        const s3Response = await generateS3PresignURL({
            fileName: fileName,
            fileType: fileType,
            fileCategory: fileCategory
        });

        return {
            data: {
                presignedUrl: s3Response.presignedUrl,
                s3Key: s3Response.s3Key,
                fileName: s3Response.fileName,
                originalFileName: s3Response.originalFileName,
                publicUrl: s3Response.publicUrl,
                fileType: fileType,
                fileCategory: fileCategory,
                expiresIn: '10 hours' // 60 * 600 seconds = 10 hours
            },
            message: 'Presigned URL generated successfully'
        };

    } catch (error) {
        console.error('Error in getPresignedUrl:', error);
        throw error;
    }
};

/**
 * Upload file directly to S3 using multipart form data
 * This is an alternative method if you want to handle upload through your server
 */
const uploadToS3 = async (file, data = {}) => {
    try {
        if (!file) {
            throw new createError["BadRequest"]('No file provided');
        }

        const { fileCategory = 'general' } = data;

        // Validate file type
        const allowedMimeTypes = [
            'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
            'video/mp4', 'video/mpeg', 'video/quicktime', 'video/x-msvideo', 'video/webm'
        ];

        if (!allowedMimeTypes.includes(file.mimetype)) {
            throw new createError["BadRequest"]('File type not supported');
        }

        // Validate file size (50MB max)
        const maxSize = 50 * 1024 * 1024; // 50MB
        if (file.size > maxSize) {
            throw new createError["BadRequest"]('File size too large. Maximum size is 50MB');
        }

        // Generate presigned URL for upload
        const s3Response = await generateS3PresignURL({
            fileName: file.name,
            fileType: file.mimetype,
            fileCategory: fileCategory
        });

        return {
            data: {
                presignedUrl: s3Response.presignedUrl,
                s3Key: s3Response.s3Key,
                fileName: s3Response.fileName,
                originalFileName: s3Response.originalFileName,
                publicUrl: s3Response.publicUrl,
                fileType: file.mimetype,
                fileSize: file.size,
                fileCategory: fileCategory
            },
            message: 'File upload URL generated successfully'
        };

    } catch (error) {
        console.error('Error in uploadToS3:', error);
        throw error;
    }
};

/**
 * Delete file from S3
 */
const deleteFromS3 = async (data) => {
    try {
        const { s3Key, fileName } = data;

        if (!s3Key && !fileName) {
            throw new createError["BadRequest"]('Either s3Key or fileName is required');
        }

        const result = await deleteMediaFromS3({
            fileName: s3Key || fileName
        });

        return {
            data: {
                deleted: true,
                s3Key: s3Key || fileName
            },
            message: 'File deleted successfully'
        };

    } catch (error) {
        console.error('Error in deleteFromS3:', error);
        throw error;
    }
};

/**
 * Get file info and public URL
 */
const getFileInfo = async (data) => {
    try {
        const { s3Key } = data;

        if (!s3Key) {
            throw new createError["BadRequest"]('s3Key is required');
        }

        // Generate public URL (if bucket is public) or signed URL for viewing
        const bucketName = process.env.S3_BUCKET_NAME;
        const region = process.env.S3_BUCKET_REGION;
        
        // For public buckets
        const publicUrl = `https://${bucketName}.s3.${region}.amazonaws.com/${s3Key}`;

        return {
            data: {
                s3Key: s3Key,
                publicUrl: publicUrl,
                region: region,
                bucket: bucketName
            },
            message: 'File info retrieved successfully'
        };

    } catch (error) {
        console.error('Error in getFileInfo:', error);
        throw error;
    }
};

module.exports = {
    getPresignedUrl,
    uploadToS3,
    deleteFromS3,
    getFileInfo
};
