'use strict';
const jwt = require('jsonwebtoken');
const UserModel = require("../models/index").user;
const { createUserLog } = require("../controllers/logs.controller");
const { LOGS } = require("../constants/user.constant");
const { JWT_SECRET_KEY, BCRYPT_PASSWORD_VALUE } = require("../constants/auth.constant");
const { DISPLAY_RECORDS } = require("../constants/limit.constant");
const { 
    decryptData
} = require("../helpers/common");

exports.me = (req, res, next) => { 
    req.body.query = {
        ...req.body.query, 
        id: req.loginUser.id 
    }; 
    next(); 
}

exports.excelDownloadLog = async (req, res, next) => {
    try {
        if(req && req.body && req.body.hasOwnProperty("exportExcel")) await createUserLog(req.loginUser.id, LOGS.DOWNLOAD, "EXCEL_DOWNLOAD", req.loginUser.id);
        next();
    } catch (error) {
        console.log('error :>> ', error);
    }
}

exports.own = (req, res, next) => { 
    if(!req.body.query.userId){
        req.body.query = {
            ...req.body.query, 
            userId: req.loginUser.id 
        };       
    }
    next(); 
}

exports.jwtValidation = async (req, res, next) => {
    const token = req.headers['x-access-token'];
    if (token) {
        jwt.verify(token, JWT_SECRET_KEY, async function (err, decoded) {
            if (err) {
                return res.status(401).json({
                    message: err.message
                });
            } else {
                const findUser = await UserModel.scope(['defaultScope','roleData']).findOne({ 
                    where: { id: decoded.id }
                });
                if (findUser) {
                    req.loginUser = findUser.dataValues;
                    next();
                } else {
                    return res.status(401).json({
                        message: 'Unauthorized access'
                    });
                }
            }
        });
    } else {
        return res.status(401).json({
            message: 'Unauthorized access'
        });
    }
}

exports.secretKeyValidation = async (req, res, next) =>{
    const key = req.headers['secret-key'];
    if (key) {
        const pswd = await decryptData(key, BCRYPT_PASSWORD_VALUE);
        if (pswd === process.env.DEVELOPER_SECRET_KEY) {
            next()
        } else {
            return res.status(401).json({
                message: 'Unauthorized access to developer mode'
            });
        }
    } else {
        return res.status(401).json({
            message: 'Unauthorized access to developer mode'
        });
    }
}

exports.isGhostUser = async (req, res, next) => {
    if (req.loginUser.ghostUser && req.loginUser.isGhostActive) {
        console.log("Ghost Api called...");
    }
    next();
}

exports.getDefaultCronQuery = (req, res, next) => {
    try {
        let query = {
            order: [['createdAt','DESC']]
        };
        query.limit = req.query.limit ? req.query.limit : DISPLAY_RECORDS;
        if(req.query.hasOwnProperty('offset')){
            query.offset = req.query.offset
        }
        else if(req.query.hasOwnProperty('page')){
            query.offset = (req.query.page - 1) * req.query.limit;
        }
        req.query = query;
        next()
    } catch (error) {
        console.log('error :>> ', error);
    }
}
