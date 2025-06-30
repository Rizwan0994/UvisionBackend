'use strict';
const RolesModel = require("../models/index").roles;


exports.rolesList = async (data) => {
    return new Promise(async (resolve, reject) => {
        try {

            const list = await RolesModel.findAll();
            resolve({ status: 1, message: "Roles list get successfully.", data: list });
        } catch (error) {
            console.log(error)
            reject({ status: 0, message: "Something went wrong" });
        }

    })
}