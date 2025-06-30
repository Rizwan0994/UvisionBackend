'use strict';
const encryptResponse = (data) =>{ 
    try {
        if(process.env['ENCRYPT_REQUEST_RESPONSE'].toLowerCase() == "false" || process.env["NODE_ENV"] === "development")  return data;
        if(process.env['REQUEST_RESPONSE_SECRET_KEY']){
            return require("../helpers/common").encryptedAES(JSON.stringify(data), process.env.REQUEST_RESPONSE_SECRET_KEY);
        }else{
            console.log("REQUEST_RESPONSE_SECRET_KEY not defined");
        }
        
    } catch (error) {
        console.log('error :>> ', error);
    }
}
module.exports = encryptResponse;
