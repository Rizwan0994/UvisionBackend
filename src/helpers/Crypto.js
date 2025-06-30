'use strict';

const encryptedAES = (plainText, key) =>{ return require('crypto-js').AES.encrypt(plainText, key).toString(); }

const decryptAES = (encData, key) =>{ return require('crypto-js').AES.decrypt(encData, key).toString(require('crypto-js').enc.Utf8); }

// secret key 
// let requestPayload = { 
//     query: { userId : 10 }, 
//     options: { populate : ["userInformation"] } 
// };
// let encryptRes =  encryptedAES(JSON.stringify(requestPayload), key);
// console.log('encryptRes :>> ', encryptRes);
// let decryptRes =  decryptAES(encryptRes, key);
// console.log('decryptRes :>> ', decryptRes);

module.exports = { encryptedAES, decryptAES };