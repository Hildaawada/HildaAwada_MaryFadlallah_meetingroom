// src/app.js
require("dotenv").config();
const express = require("express");
const app = express();

app.use(express.json());

// rate limiter
const apiLimiter = require("./middleware/rateLimiter");
app.use(apiLimiter);

// logging
const logMiddlewareAuth = require("./middleware/logauth");
app.use(logMiddlewareAuth);

// routes
app.use('/test', require('./routes/testRoutes'));
app.use("/v1/Review", require("./routes/reviewRoutes"));
app.use("/api/Review", require("./routes/reviewRoutes"));

// error handler
const errorHandler = require("./middleware/errorHandler");
app.use(errorHandler);

module.exports = app;
