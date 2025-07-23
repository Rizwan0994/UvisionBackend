'use strict';
const dbConfig = require("../config/db");

const fs = require('fs');
const path = require('path');
const Sequelize = require("sequelize");
const basename = path.basename(__filename);
const sequelize = new Sequelize(dbConfig.DB_NAME, dbConfig.DB_USER, dbConfig.DB_PASSWORD, {
    host: dbConfig.DB_HOST,
    port: dbConfig.DB_PORT,
    dialect: dbConfig.dialect,
    operatorsAliases: 0,

    pool: {
        max: dbConfig.pool.max,
        min: dbConfig.pool.min,
        acquire: dbConfig.pool.acquire,
        idle: dbConfig.pool.idle
    },
    logging: false,
});

const db = {};
sequelize.authenticate()
    .then(() => {
        // console.log('Connection has been established successfully.');
    })
    .catch(err => {
        console.error('Unable to connect to the database:', err);
    });
fs
    .readdirSync(__dirname)
    .filter(file => {
        return (file.indexOf('.') !== 0) && (file !== basename) && (file.slice(-3) === '.js');
    })
    .forEach(file => {
        const model = require(path.join(__dirname, file))(sequelize, Sequelize.DataTypes);
        db[model.name] = model;
    });
    
Object.keys(db).forEach(modelName => {
    if (db[modelName].associate) {
        db[modelName].associate(db);
    }
});

db.Sequelize = Sequelize;
db.sequelize = sequelize;
db.Op = Sequelize.Op;

db.user = require('./user.model')(sequelize);
db.category = require('./category.model')(sequelize);
db.chat = require('./chat.model')(sequelize);
db.message = require('./message.model')(sequelize);
db.chatUser = require('./chatUser.model')(sequelize);
db.messageRecipient = require('./messageRecipient.model')(sequelize);
db.note = require('./notes.model')(sequelize);
db.mentionUser = require('./mentionUser.model')(sequelize);
db.importantMessage = require('./importantMessage.model')(sequelize);
db.attachment = require('./attachment.model')(sequelize);
db.comment = require('./comment.model')(sequelize);
db.userLogs = require('./userLogs.model')(sequelize);
db.roles = require('./roles.model')(sequelize);
db.designations = require('./designations.model')(sequelize);
db.chatLogs = require('./chatLogs.model')(sequelize);


db.userDesignations =  require('./userDesignations.model')(sequelize);
db.commentRecipient = require('./commentRecipient.model')(sequelize);
db.logs = require('./logs.model')(sequelize);
db.FCMToken = require('./FCMToken.model')(sequelize);
db.version = require('./version.model')(sequelize);
db.organization = require('./organization.model')(sequelize);
db.messageEmoji = require('./messageEmoji.model')(sequelize);
db.cron = require('./cron.model')(sequelize);
db.cronReport = require('./cronReport.model')(sequelize);
db.companyRole = require('./companyRole.model')(sequelize);
db.designationGroup = require('./designationGroup.model')(sequelize);
db.categoryChat = require("./categoryChat.model")(sequelize);

// Professional models
db.professionalProfile = require('./professionalProfile.model')(sequelize);
db.professionalServices = require('./professionalServices.model')(sequelize);
db.professionalPortfolio = require('./professionalPortfolio.model')(sequelize);
db.professionalReviews = require('./professionalReviews.model')(sequelize);
db.professionalBookings = require('./professionalBookings.model')(sequelize);
db.professionalAvailability = require('./professionalAvailability.model')(sequelize);
db.professionalCategory = require('./professionalCategory.model')(sequelize);




require("./associate")(db);

module.exports = db;
