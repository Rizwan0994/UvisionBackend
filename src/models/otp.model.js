'use strict';
const {
    Model, DataTypes
} = require('sequelize');

module.exports = (sequelize) => {
    class OTP extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
            // define association here
        }
    }
    
    OTP.init({
        userId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'users',
                key: 'id'
            }
        },
        email: {
            type: DataTypes.STRING,
            allowNull: false
        },
        otp: {
            type: DataTypes.STRING(6),
            allowNull: false
        },
        type: {
            type: DataTypes.ENUM('email_verification', 'password_reset'),
            allowNull: false
        },
        expiresAt: {
            type: DataTypes.DATE,
            allowNull: false
        },
        isUsed: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        },
        attempts: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        }
    }, {
        sequelize,
        modelName: 'otp',
        tableName: 'otps',
        timestamps: true,
        indexes: [
            {
                fields: ['email', 'type', 'isUsed']
            },
            {
                fields: ['expiresAt']
            }
        ]
    });
    
    return OTP;
};
