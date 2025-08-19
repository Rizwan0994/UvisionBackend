'use strict';
const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
global.__basedir = __dirname;
const db = require("./models/index");
const rateLimit = require('express-rate-limit');
require('./crons/index');
// require('./helpers/DatabaseBackup');
db.sequelize.sync();
const app = express();
const limiter = rateLimit(require("./config/rateLimit"));
// Test Firebase Notifications
// require("./services/test-notification");
app.use(require("morgan")(':remote-addr - :remote-user - [:date[clf]] - ":method :url HTTP/:http-version" - :status - :res[content-length] B -  :response-time ms'))

// Stripe webhook route - MUST be before body parsing middleware
app.post('/subscription/webhook', express.raw({ type: 'application/json' }), require("./util/response/responseHandler"), require("./util/catchAsync").catchAsync(async function _stripeWebhook(req, res) {
    const { handleStripeWebhook } = require('./controllers/subscription.controller');
    let data = await handleStripeWebhook(req, res);
    return res.success(data);
}));

app.use(bodyParser.urlencoded({ limit: "500mb", extended: false }));
app.use(bodyParser.json({ limit: "500mb" }));
app.use(bodyParser.text({ limit: "500mb" }));
app.use(require("cors")());
app.use(limiter);
app.use(require("helmet")());
app.use(require("compression")())
app.use(require("./util/response/responseHandler"));
app.use(require("./middleware/cacheControl"));
app.use(require("./middleware/decryptResponse"));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(require("express-fileupload")());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(require('cookie-parser')());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/', require('./routes/index'));
app.use((req, res, next) => { next(require('http-errors')["NotFound"](`can't find ${req.url} on this server!`))});
app.use(require('./middleware/errorHandler'));

module.exports = app;
