const express = require("express");
const app = express();
require("dotenv").config();

app.use(express.json());
const apiLimiter = require("./middleware/rateLimiter");
app.use(apiLimiter);

const logMiddlewareAuth = require("./middleware/logauth");
app.use(logMiddlewareAuth);

// Routes
app.use('/test', require('./routes/testRoutes'));
app.use("/v1/rooms", require("./routes/roomRoutes"));
app.use("/api/rooms", require("./routes/roomRoutes"));

const errorHandler = require("./middleware/errorHandler");
const { db } = require("./models/Room");
app.use(errorHandler);


module.exports = app;