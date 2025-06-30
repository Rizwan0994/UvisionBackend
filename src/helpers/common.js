'use strict';
const bcryptJs = require("bcryptjs");
const { PASSWORD_HASH, JWT_VERIFICATION_EMAIL_SECRET_KEY, JWT_VERIFICATION_EMAIL_HASH, JWT_VERIFICATION_EMAIL_EXPIRED_TIME, JWT_SECRET_KEY, JWT_TOKEN_EXPIRED_TIME } = require("../constants/auth.constant");
const { CHAT_TYPE } = require("../constants/chat.constant");
const jwt = require("jsonwebtoken");
const CryptoJS = require("crypto-js");

exports.encryptPassword = (password, salt = bcryptJs.genSaltSync(PASSWORD_HASH)) => { return bcryptJs.hashSync(password, salt); }

exports.generateVerificationLink = (data) => { return jwt.sign(data, JWT_VERIFICATION_EMAIL_SECRET_KEY, { expiresIn: JWT_VERIFICATION_EMAIL_EXPIRED_TIME }) }   

exports.decodeVerificationToken = (token) => { return jwt.verify(token, JWT_VERIFICATION_EMAIL_SECRET_KEY); }

exports.encryptTokenValue = (password, salt = bcryptJs.genSaltSync(JWT_VERIFICATION_EMAIL_HASH)) => { return bcryptJs.hashSync(password, salt); }

exports.comparePassword = (password, hash) => { return bcryptJs.compareSync(password, hash); }

exports.removeSpecialCharFromMessage = (text) => {return text.replace(/&|```|~|\*|_|--/g, '') }

exports.removeMentionUserId = (message) => {
    const regex = /<@(\d+)>\((.*?)\)/g;
    const matches = [...message.toString().matchAll(regex)];
    if(matches){
        matches.map(match => { message = message.replace(match[0],`@${match[2]} `); });
        return message;
    }
    return message;
}

exports.extractMentions = (message) => {
    const mentionRegex = /(?:^|\s)@([^\W_]+)(?=\s|$)/g; // Regex to match @ followed by non-space characters
    const mentions = message.match(mentionRegex);
    return mentions || []; // Return an empty array if no mentions found
  }

exports.removeHTMLtasgFromText = (text) => { return text?.replace(/(?:<[^>]*>|(\b[a-zA-Z]+\b)|(?:&nbsp;|<br>)|(&lt;)|(&gt;))/g, '$1') || null }

exports.generateToken = (data) => { return jwt.sign(data, JWT_SECRET_KEY, { expiresIn: JWT_TOKEN_EXPIRED_TIME }) }

exports.decodeToken = (token) => { return jwt.verify(token, JWT_SECRET_KEY); }

exports.groupBy = (xs, key) => {
    return xs.reduce((rv, x) => {
        (rv[x[key]] = rv[x[key]] || []).push(x);
        return rv;
    }, {});
};

exports.cleanGarbageCollection = () => {
    try {
        console.log('global.gc :>> ', global.gc);
        if (global.gc) { global.gc(); }
    } catch (e) {
        process.exit();
    }
}

exports.upsert = async (model, values, condition) => {
    return model.findOne({ where: condition })
        .then(function (obj) {
            if (obj)
                return obj.update(values);
            return model.create(values);
        })
}

exports.findhashTagWords = (stringVal) => {
    return stringVal.toLowerCase().split(" ").filter((hashTag) => { return hashTag.startsWith('#');}).map(val => val.slice(1));
}

const unwind = (key, arr) => {
    let arrayEle = [];
    if(Array.isArray(arr)){
        arr.map(obj =>{
            const { [key]: _, ...rest } = obj;
            if(obj.keywords) {
                arrayEle = arrayEle.concat(obj[key].map(val => ({ [val]: rest.FCMTokens })));
            }
        })
    }
    return arrayEle;
};

const toObject = (arr) => {
    var rv = {};
    for (var i = 0; i < arr.length; ++i){
        rv[Object.keys(arr[i])[0]] = Object.values(arr[i])[0];
    }
    return rv;
}

exports.decryptData = async(text, secretPass) => {
    const bytes = CryptoJS.AES.decrypt(text, secretPass);
    return JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
};

exports.createNotificationMessage = (data) => {
    let option = "";
    let flag = "";
    if(data.mention == "user") option = "MENTION";


    if(data.type == "urgent") flag = "(Urgent)";
    else if(data.type == "emergency") flag = "(Emergency)";
    else flag = "";
    let message = data.mediaType ? mediaTypeMessage(data.mediaType) : `${data.message}`;
    message = data.subject ?  `${data.subject}` :  `${message}`;
    message = data.chatType === CHAT_TYPE.GROUP ? `${data.loginUserName}: ${message}` : `${message}`;
    switch (option) {
        case "MENTION":
            return `${flag} ${data.sender} mentioned you in messsage`;
        case "KEYWORD":
            return `"${flag} ${data.keyword}" found in messsage`;
        default:
            return `${flag} ${message}`;
    }
}

const mediaTypeMessage = (mediaType) =>{
    let fileType = mediaType.split("/")[1].toLowerCase();
    switch(fileType){
        case "mp3":
        case "mp4":
        case"wav":
            return `♫ Media`;
            break;

        case "png":
        case "jpg":
        case "jpeg":
        case "jfif":
        case "gif":
            return `🏞 Image`;
            break;

        case "mov":
        case "webm":
        case "wav":
        case "webp":
            return `🎥 Media`;
            break;

        case "csv":
        case "pdf":
        case "doc": 
        case "docx":
        case "xlsx":
        case "xls":
        case "ppt":
        case "pptx":
            return `📄 Document`;
            break;

        default:
            return `📂 ${fileType}`
            break;

    }
} 

exports.findIntersection = (...arrays) => {
    return arrays.reduce((previous, current) => previous.filter(element => current.includes(element)));
}

exports.allEqual = arr => arr.every(val => val === arr[0]);

exports.generateMasterPassword = (userEmail) => {
    return `${new Date().getTime().toString().slice(0,new Date().getTime().toString().length/2)}${userEmail.split("@")[0]}`;
}

exports.encryptedAES = (plainText, key) =>{ return CryptoJS.AES.encrypt(plainText, key).toString(); }

exports.decryptAES = (encData, key) =>{ return CryptoJS.AES.decrypt(encData, key).toString(CryptoJS.enc.Utf8); }
