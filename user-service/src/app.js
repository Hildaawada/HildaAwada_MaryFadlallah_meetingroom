const express = require('express');
const app = express();
const DB = require('./database').connectDB;

app.use(express.json());


const userRoutes = require('./routes/userRoutes');

app.use('/v1/users', userRoutes);
app.use('/api/users', userRoutes);// backward support

const logMiddlewareAuth = require("./middleware/logauth");
app.use(logMiddlewareAuth);
const errorHandler = require("./middleware/errorHandler");
app.use(errorHandler);

require('dotenv').config();  



DB();

app.listen(process.env.PORT, () => {
    console.log(`User Service is running on port ${process.env.PORT}`);
});
