// src/server.js
require("dotenv").config();
const app = require("./app");
const { connectDB } = require("./database");

connectDB().then(() => {
  app.listen(process.env.PORT, () => {
    console.log(`Review Service is running on port ${process.env.PORT}`);
  });
});
