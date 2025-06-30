'use strict';
const {
    cronReport: CronReport
} = require("../models/index");

/**
 * @description : handle cron CURD 
 */

exports.create = async (data) => {
    return new Promise(async (resolve, reject) => {
        try {
            await CronReport.create(data);
            resolve({ status: 1, message: "Log added successfully." });
        } catch (error) {
            reject({ status: 0, message: "Something went wrong.", error });
        }
    });
};

exports.update = async (data) => {
    return new Promise(async (resolve, reject) => {
        try {
            const list = await CronReport.update(data,{ 
                where : { id : data.id }
            });
            resolve({ status: 1, message: "Log list successfully.", data: list });
        } catch (error) {
            reject({ status: 0, message: "Something went wrong.", error });
        }
    });
};



