'use strict';
const {
    Op,
    FCMToken: FCMTokenModel
} = require("../models/index");
const { upsert } = require("../helpers/common");
const { queryGenerator } = require("../util/dbServices");

exports.list = async (dataToList, loginUser) => {
    try {
        // const dataToList = { ...req.body || {} };;
        const {queryGenerate, populate} = await queryGenerator(dataToList);
        if(dataToList.isCountOnly){
            let data = await FCMTokenModel.count(queryGenerate)
            return { data };   
        }
        if(dataToList.isCount){
            let data = await FCMTokenModel.scope(populate).findAndCountAll(queryGenerate);
            return { data };   
        }
        const data = await FCMTokenModel.scope(populate).findAll(queryGenerate);
        return {data};
    } catch (error) {
        throw error;
    }
}

exports.create = async (dataToCreate, loginUser) => {
    try {
        // let dataToCreate = { ...req.body || {} };
        dataToCreate.userId = loginUser.id;
        let createdData =  await upsert(FCMTokenModel, dataToCreate, { userId : loginUser.id, deviceType : dataToCreate.deviceType, browserType : dataToCreate.browserType });
        return { data: createdData };
    } catch (error) {
        throw error;
    }
}

// exports.sendNotification = catchAsync(async (req, res) => {
//     admin.messaging().sendToDevice(registerToken, payload, options)
//     // admin.messaging().sendToDeviceGroup()
//     .then(function(res){
//         console.log("successfully sent message", res)
//     })
//     .catch(function(error){
//         console.log("error sending message ",error);    
//     })
// })

exports.removeFCMToken = async (fcmToken) => {
    return new Promise( async (resolve, reject) => {
        try {
            await FCMTokenModel.destroy({
                where :{
                    deviceKey: fcmToken
                }
            })
            resolve({ status: 1, message: "FCMToken delete successfully." });

        } catch (error) {
            console.log(error)
            reject({ status: 0, message: "Something went wrong." });
        }
    })
}


exports.getTokens = async(data) => {
    return new Promise( async (resolve, reject) => {
        try {
            if(data.length){
                let userTokens = await FCMTokenModel.findAll({  where :{ userId : { [Op.in] : data}}, raw: true});
                userTokens = userTokens.map(ele => ele.deviceKey);
                resolve(userTokens);
            }
            resolve();
        } catch (error) {
            console.log('error :>> ', error);
            reject(error);
        }
    })
}


