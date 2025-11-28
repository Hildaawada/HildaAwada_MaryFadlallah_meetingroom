// src/server.js
require("dotenv").config();
const app = require("./app");
const { connectDB } = require("./database");

connectDB().then(() => {
  app.listen(process.env.PORT, () => {
    console.log(`Room Service is running on port ${process.env.PORT}`);
  });
});
