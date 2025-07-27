const AWS = require("aws-sdk");
// require('aws-sdk/lib/maintenance_mode_message').suppress = true;
const S3_BUCKET_NAME = process.env.S3_BUCKET_NAME;
const IAM_USER_KEY = process.env.IAM_USER_KEY;
const IAM_USER_SECRET = process.env.IAM_USER_SECRET;
const S3_BUCKET_REGION = process.env.S3_BUCKET_REGION;
const { v4: uuidv4 } = require('uuid');

const s3bucket = new AWS.S3({
    accessKeyId: IAM_USER_KEY,
    secretAccessKey: IAM_USER_SECRET,
    region: S3_BUCKET_REGION,
    signatureVersion: "v4"
});

exports.generateS3PresignURL = async (data) => {
    return new Promise(async (resolve, reject) => {
        try {
            const { fileName, fileType, fileCategory = 'general' } = data;
            
            // Generate organized S3 key based on category and date
            const date = new Date();
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            
            const fileExtension = fileName.split(".").pop();
            const uniqueFileName = `${uuidv4()}.${fileExtension}`;
            
            // Organize files by category and date
            const s3Key = `${fileCategory}/${year}/${month}/${day}/${uniqueFileName}`;
            
            const url = await s3bucket.getSignedUrlPromise("putObject", {
                Bucket: S3_BUCKET_NAME,
                Key: s3Key,
                ContentType: fileType,
                // Acl: "public-read", // Uncomment if you want files to be publicly accessible
                Expires: 60 * 600 // 10 hours
            });
            
            resolve({
                presignedUrl: url,
                s3Key: s3Key,
                fileName: uniqueFileName,
                originalFileName: fileName,
                publicUrl: `https://${S3_BUCKET_NAME}.s3.${S3_BUCKET_REGION}.amazonaws.com/${s3Key}`
            });
        } catch (error) {
            reject(error);
        }
    });
}

exports.deleteMediaFromS3 = async (data) => {
    return new Promise(async (resolve, reject) => {
        try {
            // Define the parameters for deleting the object
            const params = {
                Bucket: S3_BUCKET_NAME,
                Key: data.fileName // The key or filename of the object you want to delete
            };
            const url = await s3bucket.deleteObject(params, function(err, data) {
                if (err) {
                  console.log('Error deleting object:', err);
                  reject(error);
                } else {
                  resolve(url);
                }
              });
        } catch (error) {
            console.log("error ==>", error);
        }
    });
}

// Server-side upload to S3
exports.uploadFileToS3 = async (fileBuffer, data) => {
    return new Promise(async (resolve, reject) => {
        try {
            const { fileName, fileType, fileCategory = 'general' } = data;
            
            // Generate organized S3 key based on category and date
            const date = new Date();
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            
            const fileExtension = fileName.split(".").pop();
            const uniqueFileName = `${uuidv4()}.${fileExtension}`;
            
            // Organize files by category and date
            const s3Key = `${fileCategory}/${year}/${month}/${day}/${uniqueFileName}`;
            
            const uploadParams = {
                Bucket: S3_BUCKET_NAME,
                Key: s3Key,
                Body: fileBuffer,
                ContentType: fileType,
                // ACL: 'public-read' // Uncomment if you want files to be publicly accessible
            };
            
            const result = await s3bucket.upload(uploadParams).promise();
            
            resolve({
                s3Key: s3Key,
                fileName: uniqueFileName,
                originalFileName: fileName,
                publicUrl: result.Location || `https://${S3_BUCKET_NAME}.s3.${S3_BUCKET_REGION}.amazonaws.com/${s3Key}`,
                etag: result.ETag
            });
        } catch (error) {
            console.log("S3 upload error ==>", error);
            reject(error);
        }
    });
}