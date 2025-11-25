const express = require('express');
const app = express();
const DB = require('./database').connectDB;
app.use(express.json());
const apiLimiter = require("./middleware/rateLimiter");
app.use(apiLimiter);

const bookingsRoutes = require('./routes/bookingRoutes');

app.use('/v1/Bookings', bookingsRoutes);
app.use('/api/Bookings', bookingsRoutes);
const logMiddlewareAuth = require("./middleware/logauth");
app.use(logMiddlewareAuth);

require('dotenv').config();  

const errorHandler = require("./middleware/errorHandler");
app.use(errorHandler);

DB();

app.listen(process.env.PORT, () => {
    console.log(`Bookings Service is running on port ${process.env.PORT}`);

app.get("/health", (req, res) => {
  res.json({ service: "bookings", status: "ok" });
});

});
