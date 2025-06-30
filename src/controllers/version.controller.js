'use strict';
const VersionModel = require("../models/index").version;
const { 
    decryptData
} = require("../helpers/common");
const { OK_STATUS, BAD_REQUEST, BCRYPT_PASSWORD_VALUE } = require("../constants/auth.constant");
const catchAsync = require('../util/catchAsync').catchAsync;

exports.login = catchAsync(async (req, res) => {
    const { password } = req.body
    if (!password) {
        res.status(BAD_REQUEST).send("input is required");
        return;
    }
    const pswd = await decryptData(password, BCRYPT_PASSWORD_VALUE);
    if (pswd != process.env.DEVELOPER_SECRET_KEY) {
        res.status(OK_STATUS).json({ status: 0, message: "password is incorrect" });
        return;
    }   
    res.success({ secretToken: password, message: "Logged in successfully." });
})

exports.publishVersion = async (data) => {
    return new Promise(async (resolve, reject) => {
        try {
            let obj = { ...data || {} };
            if(Object.keys(obj).length === 0){
                reject({ status: 0, error });
            }
            const formUpdated = await VersionModel.update({ publishAStatus : true },{ where: { id : data.id }, returning: true });
            resolve({ status: 1, message: "create version Successfully", data: formUpdated[1][0] })
        } catch (error) {
            reject({ status: 0, error })
        }
    })
}