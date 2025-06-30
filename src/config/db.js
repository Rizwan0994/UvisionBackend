'use strict';
require('dotenv').config();
module.exports = {
    DB_HOST: process.env.DB_HOST,
    DB_USER: process.env.DB_USER,
    DB_PASSWORD: process.env.DB_PASSWORD,
    DB_NAME: process.env.DB_NAME,
    DB_PORT: process.env.DB_PORT || 5432, // Default to 5432 if not set
    dialect: "postgres",
    dialectOptions: {
        useUTC: true, // for reading from database
    },
    pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
    },
};