'use strict';
const {
    Model, DataTypes
} = require('sequelize');

module.exports = (sequelize) => {

    class ProfileView extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
            // Associations are managed in /models/associate/config.js
        }
    }

    ProfileView.init({
        professionalId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'professionalProfiles',
                key: 'id'
            }
        },
        viewerId: {
            type: DataTypes.INTEGER,
            allowNull: true, // Allow anonymous views
            references: {
                model: 'users',
                key: 'id'
            }
        },
        viewerIp: {
            type: DataTypes.STRING,
            allowNull: true,
            comment: 'Viewer IP address for anonymous tracking'
        },
        userAgent: {
            type: DataTypes.TEXT,
            allowNull: true,
            comment: 'Browser user agent'
        },
        referrer: {
            type: DataTypes.STRING,
            allowNull: true,
            comment: 'Source of the view (direct, search, social, etc.)'
        },
        viewDate: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
            comment: 'Date and time of profile view'
        },
        sessionId: {
            type: DataTypes.STRING,
            allowNull: true,
            comment: 'Session identifier to prevent duplicate counting'
        }
    }, {
        sequelize,
        modelName: 'profileView',
        tableName: 'profileViews',
        timestamps: true,
        paranoid: false,
        indexes: [
            {
                unique: false,
                fields: ['professionalId']
            },
            {
                unique: false,
                fields: ['viewDate']
            },
            {
                unique: false,
                fields: ['professionalId', 'viewDate']
            }
        ]
    });

    return ProfileView;
};
