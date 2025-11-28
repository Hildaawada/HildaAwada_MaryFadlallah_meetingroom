const express = require('express');
const mongoose = require('mongoose');
const app = express();
const DB = require('./database').connectDB;



app.use(express.json());
const { apiLimiter } = require("./middleware/rateLimiter");
app.use(apiLimiter); 

const userRoutes = require('./routes/userRoutes');

app.use('/v1/users', userRoutes);
app.use('/api/users', userRoutes);  // backward support
app.use('/test', require('./routes/testRoutes'));

const logMiddlewareAuth = require("./middleware/logauth");
app.use(logMiddlewareAuth);

const errorHandler = require("./middleware/errorHandler");
app.use(errorHandler);

require('dotenv').config();  

DB();  // Connect to the database

/*
let server; // Declare the server variable


beforeAll(async () => {
  await DB();  // Connect to DB before running tests
});

afterAll(async () => {
  await mongoose.connection.close();  // Close the connection after tests
  if (server) {
    server.close();  // Close the server to stop it from running
  }
});
*/

// Start the server and export it for use in tests
server = app.listen(process.env.PORT, () => {
    console.log(`User Service is running on port ${process.env.PORT}`);
});

module.exports = server;  // Export the server for testing
