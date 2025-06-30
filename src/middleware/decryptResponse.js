'use strict';
// secret key 
const decryptResponse = (req, res, next) =>{ 
    try {
        if(!req.headers['encrypt_request'] || process.env["NODE_ENV"] === "development") return next();
        if(req.body){
            req.body = JSON.parse(require("../helpers/common").decryptAES(req.body, process.env.REQUEST_RESPONSE_SECRET_KEY));
            next();
        }
        // next(); // it will be remove because if req.body.encQuery not found it will be continue further processing
    } catch (error) {
        console.log('error :>> ', error);
        throw error;
    }
}
module.exports = decryptResponse;
