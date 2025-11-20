require("dotenv").config();
const jwt = require("jsonwebtoken");

const token = jwt.sign(
  { type: "service" },
  process.env.SERVICE_JWT,
  { expiresIn: "365d" }
);

console.log("\nSERVICE TOKEN:\n", token, "\n");
