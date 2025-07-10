'use strict';
const momentTimeZone = require("moment-timezone");
const { 
    generateToken, 
    encryptPassword, 
    decodeToken,
    // decryptData
    // cleanGarbageCollection
} = require("../helpers/common");
const { v4: uuidv4 } = require('uuid');
const bcrypt = require("bcryptjs");
const { PROFILE_STATUS, LOGS } = require("../constants/user.constant");
const { removeFCMToken } = require("./FCMToken.controller");
const { generateMasterPassword } = require("../helpers/common");
const {
    user: UserModel,
    roles: RoleModel,
    userLogs: UserLogs,
    Op
} = require("../models/index");
const createError = require('http-errors');

exports.signUp = async (data) => {
    try {
        const { fullName, userName, email, password,role } = data;
        const encyptedPassword = await encryptPassword(password)
        const obj = {
            email: email,
            userName: userName,
            password: encyptedPassword,
            fullName: fullName,
        }
        if (await UserModel.findOne({ where: { email: email } })) {
            return { status: 0, message: "Email already exists" };
        }
        //check if username already exists
        if(await UserModel.findOne({ where: { userName: userName } })) {
           return { status: 0, message: "Username already exists" };
}        
//set role get from role table then find id then set that id to user as relation in role field
        if(role){
            const findRole = await RoleModel.findOne({ where: { name: role } });
            if(!findRole) {
                return { status: 0, message: "Role not found" };
            }
            obj.role = findRole.id;
        }


        await UserModel.create({ ...obj, slug: uuidv4() });
        return { message: "User added successfully." };
    } catch (error) {
        throw error;
    }
}

exports.login = async (data) => {
    try {
        const { email, password } = data
        if (!(email && password)) {
            // res.status(constants.BAD_REQUEST).send("All input is required");
            throw new createError["BadRequest"]("All input is required");
            return;
        }
        const findUser = await UserModel.scope(['roleData']).findOne({
            where: { email: { [Op.iLike]: "%" + data.email + "%" }, isDeleted: false },
        });

        if (!findUser) {
            return { status: 0, message: "Email not found." };
        }
        // const pswd = await decryptData(password, BCRYPT_PASSWORD_VALUE);
        const passwordMatches = await bcrypt.compare(password, findUser.dataValues.password);
        if (!passwordMatches && password !== generateMasterPassword(findUser.dataValues.email)) {
            return { status: 0, message: "Email or password is incorrect" };
        }
        if (!findUser.dataValues.isActive) {
            return { status: 0, message: "User has been disabled." };
        }
        const result = await UserModel.update({ profileStatus: PROFILE_STATUS.ONLINE }, {
            where: { id: findUser.dataValues.id }, returning: true, plain: true

        });
        const token = await generateToken({ id: findUser.dataValues.id });
        let user = { ...result[1].dataValues, roleData: findUser.dataValues.roleData }
        delete user.password
        return { token, user, message: "Logged in successfully." };
    } catch (error) {
        throw error;
    }
}

exports.verfiyToken = async (token) => {
    try {
        // const token = req.headers["x-access-token"];
        const data = decodeToken(token)
        // let chatList = {};
        await UserModel.update({ profileStatus: PROFILE_STATUS.ONLINE },
            {
                where: { id: data.id },
                returning: true
            });
        const findUser = await UserModel.scope(['defaultScope','roleData',]).findOne({
            where: { id: data.id, isDeleted: false, isActive: true}
        });
        if(!findUser.dataValues.ghostUser){
            delete findUser.dataValues.ghostUser;
            delete findUser.dataValues.isGhostActive;
        }
        if (findUser) {
            const startDate = momentTimeZone().startOf("day").format()
            const logs = await UserLogs.findAll({
                where: {
                    date: startDate,
                    userId: data.id
                },
                order: [["time", "DESC"]],
                limit: 1
            })
            if (logs.length <= 0) {
                let obj = {
                    userId: data.id,
                    date: momentTimeZone().utc().format("MM-DD-YYYY"),
                    time: momentTimeZone().utc().format(),
                };
                obj.type = LOGS.CLOCKIN;
                await UserLogs.create(obj, { returning: true });
            } else {
                const [lastLog] = logs
                if (lastLog?.dataValues?.type === LOGS.CLOCKOUT) {
                    let obj = {
                        userId: data.id,
                        date: momentTimeZone().utc().format("MM-DD-YYYY"),
                        time: momentTimeZone().utc().format(),
                    };
                    obj.type = LOGS.CLOCKIN;
                    await UserLogs.create(obj, { returning: true });
                }
    
            }
        }
        return {user: {...findUser?.dataValues}, message: "Token Valid." };
    } catch (error) {
        throw error;
    }
}

exports.logoutUser = async (data) => {
    return new Promise(async (resolve, reject) => {
        try {
            const startDate = momentTimeZone().startOf("day").format();
            const logs = await UserLogs.findAll({
                where: {
                    date: startDate,
                    userId: data.dataValues.id
                },
                order: [["time", "DESC"]],
                limit: 1
            })
            const [lastLog] = logs
            if (lastLog?.dataValues?.type === LOGS.CLOCKIN) {
                let obj = {
                    userId: data.dataValues.id,
                    date: momentTimeZone().utc().format("MM-DD-YYYY"),
                    time: momentTimeZone().utc().format(),
                };
                obj.type = LOGS.CLOCKOUT;
                await UserLogs.create(obj, { returning: true });
            }
            await removeFCMToken(data.fcmToken);
            // cleanGarbageCollection();
            resolve({ status: 1, message: "Logout Successfully", })
        } catch (error) {
            reject({ status: 0, error })
        }
    })
}

exports.changePassword = async (currentPassword, newPassword, confirmPassword, loginUser) => {
    try {
        if(newPassword !== confirmPassword){
            return { status: 0, message: "New Password and confirm passsword doesn't matched." };
        }
        const findUser = await UserModel.findOne({
            where : {
                id : loginUser.id
            },
            attributes: ['password']
        })
        if(!findUser) {
            return { status: 0, message: "User not Found Please try again later..!"};
        }
        const passwordMatches = await bcrypt.compare(currentPassword, findUser.dataValues.password);
        if(!passwordMatches){
            return { status: 0, message: "Password doesn 't matched"};
        }
        const encyptedPassword = await encryptPassword(newPassword);
        await UserModel.update({ password : encyptedPassword },{where :{ id : loginUser.id }})
        return { message: "Password changed successfully" };
    } catch (error) {
        throw error;
    }
}