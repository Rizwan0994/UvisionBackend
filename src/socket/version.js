'use strict';
const { publishVersion } = require("../controllers/version.controller");
const { decryptData } = require("../helpers/common");
const { BCRYPT_PASSWORD_VALUE } = require("../constants/auth.constant");
module.exports = (io, socket) => {
    socket.on("version-publish", async (data) => {
        try {
            const token = await decryptData(data.secretKey, BCRYPT_PASSWORD_VALUE);
            if(data.hasOwnProperty('secretKey') && data.secretKey && token && token == process.env.DEVELOPER_SECRET_KEY){
                const result = await publishVersion(data);
                io.emit('res-version-publish', result); 
            }else{
                io.to(socket.id).emit('res-version-publish', { status: 0, message: "Please enter valid secret key" });
            }
        } catch (error) {
            console.log("error: ", error);
        }
    })
}