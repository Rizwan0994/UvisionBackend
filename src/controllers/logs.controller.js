'use strict';
const {
    user: UserModel,
    logs: Logs,
} = require("../models/index");
/**
 * @description : handle user CURD logs
 */
exports.createUserLog = async (userId, eventType, eventDescription, updatedBy) => {
    return new Promise(async (resolve, reject) => {
        try {
            await Logs.create({ userId, eventType, eventDescription, updatedBy });
            resolve({
                status: 1,
                message: "Log added successfully."
            });
        } catch (error) {
            reject({ status: 0, message: "Something went wrong.", error });
        }
    });
};

exports.listLog = async (userId) => {
    return new Promise(async (resolve, reject) => {
        try {
            const list = await Logs.findAll({ 
                where : { userId : userId },
                include : [{
                    model: UserModel,
                    attributes: ["id", "name"],
                    as: "logs"
                },
                {
                    model: UserModel,
                    attributes: ["id", "name"],
                    as: "updatedBylogs"
                },
            ]    
            });
            resolve({
                status: 1,
                message: "Log list successfully.",
                data: list
            });
        } catch (error) {
            reject({ status: 0, message: "Something went wrong.", error });
        }
    });
};