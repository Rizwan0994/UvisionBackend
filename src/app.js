'use strict';
const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
global.__basedir = __dirname;
const db = require("./models/index");
const rateLimit = require('express-rate-limit');
require('./crons/index');

// Swagger configuration
const { specs, swaggerUi, swaggerOptions } = require('./config/swagger');

// require('./helpers/DatabaseBackup');
db.sequelize.sync();
const app = express();
const limiter = rateLimit(require("./config/rateLimit"));

// Test Firebase Notifications
// require("./services/test-notification");

app.use(require("morgan")(':remote-addr - :remote-user - [:date[clf]] - ":method :url HTTP/:http-version" - :status - :res[content-length] B -  :response-time ms'))
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

// Swagger Documentation Routes
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, swaggerOptions));

// API Documentation JSON endpoint
app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(specs);
});

// Redoc Documentation (Alternative to Swagger UI)
app.get('/redoc', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Uvision API Documentation - ReDoc</title>
            <meta charset="utf-8"/>
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <link href="https://fonts.googleapis.com/css?family=Montserrat:300,400,700|Roboto:300,400,700" rel="stylesheet">
            <style>
                body { margin: 0; padding: 0; }
            </style>
        </head>
        <body>
            <redoc spec-url='/api-docs.json'></redoc>
            <script src="https://cdn.jsdelivr.net/npm/redoc@2.1.3/bundles/redoc.standalone.js"></script>
        </body>
        </html>
    `);
});

app.use('/', require('./routes/index'));
app.use((req, res, next) => { next(require('http-errors')["NotFound"](`can't find ${req.url} on this server!`))});
app.use(require('./middleware/errorHandler'));

module.exports = app;
