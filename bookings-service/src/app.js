const express = require("express");
const app = express();
require("dotenv").config();

// middleware
app.use(express.json());
const apiLimiter = require("./middleware/rateLimiter");
app.use(apiLimiter);
const logMiddlewareAuth = require("./middleware/logauth");
app.use(logMiddlewareAuth);

// routes
const bookingsRoutes = require("./routes/bookingRoutes");
app.use('/test', require('./routes/testRoutes'));
app.use("/v1/Bookings", bookingsRoutes);
app.use("/api/Bookings", bookingsRoutes);

// error handler
const errorHandler = require("./middleware/errorHandler");
app.use(errorHandler);

// health route
app.get("/health", (req, res) => {
  res.json({ service: "bookings", status: "ok" });
});

module.exports = app;
