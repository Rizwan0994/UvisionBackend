/** 
 * Service.js
 * @description :: exports function used in sending mails 
 */
'use strict';
const dotenv = require('dotenv');
dotenv.config({ path: '.env' });
const nodemailer = require('nodemailer');
const ejs = require('ejs');
const { SERVICE } = require('../constants/service.constant');

const transport = nodemailer.createTransport({
    host: "smtp.mailtrap.io",
    port: 2525,
    auth: {
      user: "c269a6c9e7589f",
      pass: "f55adaad36a5c4"
    }
  });

exports.sendEmail = async (obj) => {
    if(!SERVICE.EMAIL) return;
    let htmlText = '';
    if (obj.template){
        htmlText = await ejs.renderFile(`${__basedir}${obj.template}.ejs`, obj.data || null);
    }
    let params = {
        from: 'test@no-reply.com',
        to : obj.to, 
        subject: obj.subject,
        html: htmlText,
    };
    await transport.sendMail(params);
}

// var AWS = require('aws-sdk');
// const IAM_USER_KEY = process.env.IAM_USER_KEY;
// const IAM_USER_SECRET = process.env.IAM_USER_SECRET;
// const S3_BUCKET_REGION = process.env.S3_BUCKET_REGION;

// const SES_CONFIG = {
//  accessKeyId: IAM_USER_KEY,
//  secretAccessKey: IAM_USER_SECRET,
//  region: S3_BUCKET_REGION,
// };

// const AWS_SES = new AWS.SES(SES_CONFIG);

// exports.sendEmails = async (obj) => {
//  try {
//    if(!SERVICE.EMAIL) return;
//    let htmlText = '';
//    if (obj.template){
//      htmlText = await ejs.renderFile(`${__basedir}${obj.template}/html.ejs`, obj.data || null);
//    }
//    let params = {
//      Source: 'ykp@narola.email',
//      Destination: {
//        ToAddresses: [obj.to]
//      },
//      ReplyToAddresses: [],
//      Message: {
//        Body: {
//          Html: {
//            Charset: 'UTF-8',
//            Data: htmlText,
//          },
//        },
//        Subject: {
//          Charset: 'UTF-8',
//          Data: obj.subject,
//        }
//      },
//    };
//    return AWS_SES.sendEmail(params).promise();
//    return {}
//  } catch (error) {
//    console.log(error);
//  }
 
// };