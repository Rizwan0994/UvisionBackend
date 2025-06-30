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
            const url = await s3bucket.getSignedUrlPromise("putObject", {
                Bucket: S3_BUCKET_NAME,
                Key: `${uuidv4()}.${data.fileName.split(".").pop()}`,
                ContentType: data.fileType,
                // Acl: "public-read",
                Expires: 60 * 600
            });
            resolve(url);
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