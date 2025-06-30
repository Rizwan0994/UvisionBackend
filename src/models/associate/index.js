'use strict';
const tableConfig = require('./config');
const fs = require('fs');

function tableConfiguration(db) {
    const dirs = fs.readdirSync(`${__dirname + "/.."}`);
    dirs.map(dir =>{
        let fileName = dir.split(".")[0];
        if(!(fileName == "index") && tableConfig[`${fileName}Model`]){
            tableConfig[`${fileName}Model`](db)
        }
    });
    // as format loads tables relationship
    // tableConfig.userModel(db);
    // tableConfig.chatModel(db);
    // tableConfig.chatUserModel(db);
}

module.exports = tableConfiguration