'use strict';
const {
    Model, DataTypes
} = require('sequelize');
const { PROFILE_STATUS } = require('../constants/user.constant');

module.exports = (sequelize) => {

    class Users extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
            // User has one professional profile
            // Users.hasOne(models.professionalProfile, {
            //     foreignKey: 'userId',
            //     as: 'professionalProfile'
            // });

            // // User has many professional reviews (as client)
            // Users.hasMany(models.professionalReviews, {
            //     foreignKey: 'clientId',
            //     as: 'reviewsGiven'
            // });

            // // User has many professional bookings (as client)
            // Users.hasMany(models.professionalBookings, {
            //     foreignKey: 'clientId',
            //     as: 'bookings'
            // });

            // // User belongs to role
            // Users.belongsTo(models.roles, {
            //     foreignKey: 'role',
            //     as: 'userRole'
            // });
        }
    }
    Users.init({
        email:{
            type: DataTypes.STRING,
            allowNull: false,
            unique: true
        },
        userName:{
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
            validate: {
                is: /^[a-zA-Z0-9._-]+$/i, // Regex to allow alphanumeric characters, dots, underscores, and hyphens
                len: [3, 20] // Length between 3 and 20 characters
            }
        },
        fullName: DataTypes.STRING,
        lastName: DataTypes.STRING,
        password: DataTypes.STRING,
        forgotPasswordToken: DataTypes.STRING,
        slug: DataTypes.STRING,
        role: {
            type: DataTypes.INTEGER,
        },
        isEmailVerified: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },
        profilePicture: {
            type: DataTypes.STRING(1000),
            defaultValue: "https://chatapp-storage-2022.s3.us-west-2.amazonaws.com/user_pic.jpg"
        },
        isDeleted: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        },
        lastSeen: {
            type: DataTypes.DATE,
        },
        profileStatus: {
            type: DataTypes.ENUM,
            values: [PROFILE_STATUS.WORKING, PROFILE_STATUS.BUSY, PROFILE_STATUS.ONLINE, PROFILE_STATUS.VACATION, PROFILE_STATUS.AVAILABLE, PROFILE_STATUS.ONCALL, PROFILE_STATUS.BREAK, PROFILE_STATUS.OFFLINE],
            defaultValue: PROFILE_STATUS.OFFLINE
        },
        isActive: {
            type: DataTypes.BOOLEAN,
            defaultValue: true
        },
        mainDesignation: DataTypes.STRING,
        address: DataTypes.STRING,
        phone: DataTypes.STRING,
        isSilentMode: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        },


    }, {
        defaultScope: {
            attributes: { exclude: ['password'] },
        },
        sequelize,
        modelName: 'users',
        timestamps: true,
    });
    return Users;
};