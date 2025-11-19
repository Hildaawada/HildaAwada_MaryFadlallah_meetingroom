const express = require("express");
const app = express();
const { connectDB } = require("./database");
require("dotenv").config();

// Middleware to read JSON body
app.use(express.json());

// Connect to DB
connectDB();

// Routes
app.use("/api/rooms", require("./routes/roomRoutes"));

// Start server
app.listen(process.env.PORT, () => {
  console.log(`Room Service running on port ${process.env.PORT}`);
});
