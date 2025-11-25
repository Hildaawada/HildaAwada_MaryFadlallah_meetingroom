require('dotenv').config();  
const express = require('express');
const app = express();
const DB = require('./database').connectDB;
app.use(express.json());
const apiLimiter = require("./middleware/rateLimiter");
app.use(apiLimiter);

const reviewRoutes = require('./routes/reviewRoutes');

app.use('/v1/Review', reviewRoutes);
app.use('/api/Review', reviewRoutes);

const logMiddlewareAuth = require("./middleware/logauth");
app.use(logMiddlewareAuth);

const errorHandler = require("./middleware/errorHandler");
app.use(errorHandler);
DB();

app.listen(process.env.PORT, () => {
    console.log(`Review Service is running on port ${process.env.PORT}`);


});
