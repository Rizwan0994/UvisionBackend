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
const { getPermissionsByPlan } = require("../services/permission.service");
const { sendEmail } = require("../services/email");
const {
    user: UserModel,
    roles: RoleModel,
    userLogs: UserLogs,
    professionalProfile: ProfessionalProfileModel,
    subscription: SubscriptionModel,
    otp: OTPModel,
    Op
} = require("../models/index");
const createError = require('http-errors');

exports.signUp = async (data) => {
    try {
        const { fullName, userName, email, password, role } = data;
        const encyptedPassword = await encryptPassword(password)
        const obj = {
            email: email,
            userName: userName,
            password: encyptedPassword,
            fullName: fullName,
        }
        if (await UserModel.findOne({ where: { email: email } })) {
            throw new createError["BadRequest"]("Email already exists");
        }
        //check if username already exists
        if(await UserModel.findOne({ where: { userName: userName } })) {
            throw new createError["BadRequest"]("Username already exists");
        }        
//set role get from role table then find id then set that id to user as relation in role field
        if(role){
            const findRole = await RoleModel.findOne({ where: { name: role } });
            if(!findRole) {
                throw new createError["BadRequest"]("Role not found");
            }
            obj.role = findRole.id;
        }

        const userCreated=await UserModel.create({ ...obj, slug: uuidv4() });
         //after creating  user if role is "professional" then create a professional profile
        if(role && role.toLowerCase() === 'professional') {
            const professionalProfile = {
                userId: userCreated.id,
                title: 'Professional Profile',
            };
            await ProfessionalProfileModel.create(professionalProfile);
        }

        // Send verification OTP
        await exports.sendVerificationOTP({ email, userId: userCreated.id });

        return { 
            data: { 
                userId: userCreated.id,
                email: email 
            },
            message: "Account created successfully. Please check your email for verification OTP."
        };
    } catch (error) {
        throw error;
    }
}

exports.login = async (data) => {
    try {
        const { email, password } = data
        if (!(email && password)) {
            throw new createError["BadRequest"]("All input is required");
        }
        const findUser = await UserModel.scope(['roleData']).findOne({
            where: { email: { [Op.iLike]: "%" + data.email + "%" }, isDeleted: false },
        });

        if (!findUser) {
            throw new createError["BadRequest"]("Email not found.");
        }
        const passwordMatches = await bcrypt.compare(password, findUser.dataValues.password);
        if (!passwordMatches && password !== generateMasterPassword(findUser.dataValues.email)) {
            throw new createError["BadRequest"]("Email or password is incorrect");
        }
        if (!findUser.dataValues.isActive) {
            throw new createError["BadRequest"]("User has been disabled.");
        }
        if (!findUser.dataValues.isEmailVerified) {
            throw new createError["BadRequest"]("Please verify your email before logging in. Check your email for verification OTP.");
        }
        const result = await UserModel.update({ profileStatus: PROFILE_STATUS.ONLINE }, {
            where: { id: findUser.dataValues.id }, returning: true, plain: true
        });
        const token = await generateToken({ id: findUser.dataValues.id });
        let user = { ...result[1].dataValues, roleData: findUser.dataValues.roleData }
        delete user.password
        return { 
            data: {
                token, 
                user
            },
            message: "Logged in successfully."
        };
    } catch (error) {
        throw error;
    }
}

// exports.signUp = async (data) => {
//     try {
//         const { fullName, userName, email, password,role } = data;
//         const encyptedPassword = await encryptPassword(password)
//         const obj = {
//             email: email,
//             userName: userName,
//             password: encyptedPassword,
//             fullName: fullName,
//         }
//         if (await UserModel.findOne({ where: { email: email } })) {
//             throw new createError["BadRequest"]("Email already exists");
//         }
//         //check if username already exists
//         if(await UserModel.findOne({ where: { userName: userName } })) {
//             throw new createError["BadRequest"]("Username already exists");
//         }        
// //set role get from role table then find id then set that id to user as relation in role field
//         if(role){
//             const findRole = await RoleModel.findOne({ where: { name: role } });
//             if(!findRole) {
//                 throw new createError["BadRequest"]("Role not found");
//             }
//             obj.role = findRole.id;
//         }


//         await UserModel.create({ ...obj, slug: uuidv4() });
//         return { 
//             data: {
//                 message: "User added successfully."
//             },
//             message: "User added successfully."
//         };
//     } catch (error) {
//         throw error;
//     }
// }

// exports.login = async (data) => {
//     try {
//         const { email, password } = data
//         if (!(email && password)) {
//             // res.status(constants.BAD_REQUEST).send("All input is required");
//             throw new createError["BadRequest"]("All input is required");
//             return;
//         }
//         const findUser = await UserModel.scope(['roleData']).findOne({
//             where: { email: { [Op.iLike]: "%" + data.email + "%" }, isDeleted: false },
//         });

//         if (!findUser) {
//             throw new createError["BadRequest"]("Email not found.");
//         }
//         // const pswd = await decryptData(password, BCRYPT_PASSWORD_VALUE);
//         const passwordMatches = await bcrypt.compare(password, findUser.dataValues.password);
//         if (!passwordMatches && password !== generateMasterPassword(findUser.dataValues.email)) {
//             throw new createError["BadRequest"]("Email or password is incorrect");
//         }
//         if (!findUser.dataValues.isActive) {
//             throw new createError["BadRequest"]("User has been disabled.");
//         }
//         const result = await UserModel.update({ profileStatus: PROFILE_STATUS.ONLINE }, {
//             where: { id: findUser.dataValues.id }, returning: true, plain: true

//         });
//         const token = await generateToken({ id: findUser.dataValues.id });
//         let user = { ...result[1].dataValues, roleData: findUser.dataValues.roleData }
//         delete user.password
//         return { 
//             data: {
//                 token, 
//                 user
//             },
//             message: "Logged in successfully."
//         };
//     } catch (error) {
//         throw error;
//     }
// }

exports.verfiyToken = async (token) => {
    try {
        // const token = req.headers["x-access-token"];
        const data = decodeToken(token)
        console.log("data", data);
        // let chatList = {};
        await UserModel.update({ profileStatus: PROFILE_STATUS.ONLINE },
            {
                where: { id: data.id },
                returning: true
            });
        const findUser = await UserModel.scope(['defaultScope','roleData',]).findOne({
            where: { id: data.id, isDeleted: false, isActive: true}
        });
        console.log("findUser", findUser);

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

        // Get user subscription and permissions - only for professionals
        let subscription = null;
        let permissions = null;
        
        // Only fetch subscription data for professional users
        if (findUser?.dataValues?.roleData?.name === 'professional') {
            try {
                subscription = await SubscriptionModel.findOne({
                    where: { userId: data.id, isDeleted: false }
                });

                if (subscription) {
                    const isPromotionalPeriodActive = subscription.isPromotionalPricing && 
                                                    subscription.promotionalPeriodEnd && 
                                                    new Date(subscription.promotionalPeriodEnd) > new Date();

                    subscription = {
                        status: subscription.status,
                        plan: subscription.plan,
                        billingCycle: subscription.billingCycle,
                        startDate: subscription.currentPeriodStart,
                        endDate: subscription.currentPeriodEnd,
                        isActive: subscription.status === 'active' && 
                                 subscription.currentPeriodEnd && 
                                 new Date(subscription.currentPeriodEnd) > new Date(),
                        cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
                        isPromotionalPricing: subscription.isPromotionalPricing,
                        promotionalPeriodEnd: subscription.promotionalPeriodEnd,
                        isPromotionalPeriodActive: isPromotionalPeriodActive,
                        stripeSubscriptionId: subscription.stripeSubscriptionId // Add this for cancellation
                    };

                    permissions = getPermissionsByPlan(subscription.plan, subscription.status);
                } else {
                    subscription = {
                        status: 'inactive',
                        plan: null,
                        billingCycle: null,
                        startDate: null,
                        endDate: null,
                        isActive: false,
                        cancelAtPeriodEnd: false,
                        isPromotionalPricing: false,
                        promotionalPeriodEnd: null,
                        isPromotionalPeriodActive: false
                    };

                    permissions = getPermissionsByPlan(null, 'inactive');
                }
            } catch (subscriptionError) {
                console.error('Error fetching subscription:', subscriptionError);
                subscription = {
                    status: 'inactive',
                    plan: null,
                    billingCycle: null,
                    startDate: null,
                    endDate: null,
                    isActive: false,
                    cancelAtPeriodEnd: false,
                    isPromotionalPricing: false,
                    promotionalPeriodEnd: null,
                    isPromotionalPeriodActive: false
                };
                permissions = getPermissionsByPlan(null, 'inactive');
            }
        } else {
            // For non-professional users, set null subscription and no permissions
            subscription = null;
            permissions = null;
        }

        return {
            data: {
                user: {...findUser?.dataValues},
                subscription: subscription,
                permissions: permissions
            }, 
            message: "Token Valid." 
        };
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
            resolve({ 
                data: {},
                message: "Logout Successfully"
            })
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
            return { status: 0, message: "Password doesn 't matched"};
        }
        const encyptedPassword = await encryptPassword(newPassword);
        await UserModel.update({ password : encyptedPassword },{where :{ id : loginUser.id }})
        return { 
            data: {},
            message: "Password changed successfully" 
        };
    } catch (error) {
        throw error;
    }
}

// Helper function to generate 6-digit OTP
const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

// Helper function to check rate limiting
const checkOTPRateLimit = async (email, type) => {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentOTPs = await OTPModel.count({
        where: {
            email: email,
            type: type,
            createdAt: { [Op.gte]: oneHourAgo }
        }
    });
    return recentOTPs < 3; // Max 3 per hour
};

// Send verification OTP for signup
exports.sendVerificationOTP = async (data) => {
    try {
        const { email, userId } = data;

        // Check rate limiting
        if (!await checkOTPRateLimit(email, 'email_verification')) {
            throw new createError["BadRequest"]("Too many OTP requests. Please try again later.");
        }

        // Generate OTP
        const otp = generateOTP();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        // Save OTP to database
        await OTPModel.create({
            userId,
            email,
            otp,
            type: 'email_verification',
            expiresAt
        });

        // Send email
        await sendEmail({
            to: email,
            subject: 'Verify Your Email - uVision',
            template: '/views/email-verification-otp',
            data: {
                otp,
                email
            }
        });

        return {
            data: {},
            message: "Verification OTP sent to your email."
        };
    } catch (error) {
        throw error;
    }
};

// Verify email with OTP
exports.verifyEmail = async (data) => {
    try {
        const { email, otp } = data;

        // Find valid OTP
        const otpRecord = await OTPModel.findOne({
            where: {
                email,
                otp,
                type: 'email_verification',
                isUsed: false,
                expiresAt: { [Op.gt]: new Date() }
            }
        });

        if (!otpRecord) {
            throw new createError["BadRequest"]("Invalid or expired OTP.");
        }

        // Mark OTP as used
        await OTPModel.update(
            { isUsed: true },
            { where: { id: otpRecord.id } }
        );

        // Update user email verification
        await UserModel.update(
            { isEmailVerified: true },
            { where: { id: otpRecord.userId } }
        );

        return {
            data: {},
            message: "Email verified successfully. You can now login."
        };
    } catch (error) {
        throw error;
    }
};

// Resend verification OTP
exports.resendVerificationOTP = async (data) => {
    try {
        const { email } = data;

        // Find user
        const user = await UserModel.findOne({ where: { email } });
        if (!user) {
            throw new createError["BadRequest"]("User not found.");
        }

        if (user.isEmailVerified) {
            throw new createError["BadRequest"]("Email is already verified.");
        }

        return await exports.sendVerificationOTP({ email, userId: user.id });
    } catch (error) {
        throw error;
    }
};

// Send forgot password OTP
exports.forgotPassword = async (data) => {
    try {
        const { email } = data;

        // Find user
        const user = await UserModel.findOne({ 
            where: { email, isDeleted: false } 
        });
        if (!user) {
            throw new createError["BadRequest"]("Email not found.");
        }

        // Check rate limiting
        if (!await checkOTPRateLimit(email, 'password_reset')) {
            throw new createError["BadRequest"]("Too many OTP requests. Please try again later.");
        }

        // Generate OTP
        const otp = generateOTP();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        // Save OTP to database
        await OTPModel.create({
            userId: user.id,
            email,
            otp,
            type: 'password_reset',
            expiresAt
        });

        // Send email
        await sendEmail({
            to: email,
            subject: 'Reset Your Password - uVision',
            template: '/views/forgot-password-otp',
            data: {
                otp,
                email,
                fullName: user.fullName
            }
        });

        return {
            data: {},
            message: "Password reset OTP sent to your email."
        };
    } catch (error) {
        throw error;
    }
};

// Verify forgot password OTP
exports.verifyForgotOTP = async (data) => {
    try {
        const { email, otp } = data;

        // Find valid OTP
        const otpRecord = await OTPModel.findOne({
            where: {
                email,
                otp,
                type: 'password_reset',
                isUsed: false,
                expiresAt: { [Op.gt]: new Date() }
            }
        });

        if (!otpRecord) {
            throw new createError["BadRequest"]("Invalid or expired OTP.");
        }

        return {
            data: { 
                verified: true,
                otpId: otpRecord.id 
            },
            message: "OTP verified. You can now reset your password."
        };
    } catch (error) {
        throw error;
    }
};

// Reset password
exports.resetPassword = async (data) => {
    try {
        const { email, otpId, newPassword, confirmPassword } = data;

        if (newPassword !== confirmPassword) {
            throw new createError["BadRequest"]("Passwords do not match.");
        }

        // Find and verify OTP
        const otpRecord = await OTPModel.findOne({
            where: {
                id: otpId,
                email,
                type: 'password_reset',
                isUsed: false,
                expiresAt: { [Op.gt]: new Date() }
            }
        });

        if (!otpRecord) {
            throw new createError["BadRequest"]("Invalid or expired reset session.");
        }

        // Encrypt new password
        const encryptedPassword = await encryptPassword(newPassword);

        // Update user password
        await UserModel.update(
            { password: encryptedPassword },
            { where: { id: otpRecord.userId } }
        );

        // Mark OTP as used
        await OTPModel.update(
            { isUsed: true },
            { where: { id: otpRecord.id } }
        );

        return {
            data: {},
            message: "Password reset successfully. You can now login with your new password."
        };
    } catch (error) {
        throw error;
    }
};