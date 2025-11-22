const express = require("express");
const app = express();
const { connectDB } = require("./database");

require("dotenv").config();

// Middleware to read JSON body
app.use(express.json());

const logMiddlewareAuth = require("./middleware/logauth");
app.use(logMiddlewareAuth);


// Connect to DB
connectDB();

// Routes
app.use("/v1/rooms", require("./routes/roomRoutes"));
app.use("/api/rooms", require("./routes/roomRoutes"));

const errorHandler = require("./middleware/errorHandler");
app.use(errorHandler);
// Start server
app.listen(process.env.PORT, () => {
  console.log(`Room Service running on port ${process.env.PORT}`);
});
