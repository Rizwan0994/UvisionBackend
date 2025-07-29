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
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 465,
    auth: {
      user: process.env.SMTP_USER || '',
      pass: process.env.SMTP_PASSWORD || ''
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
