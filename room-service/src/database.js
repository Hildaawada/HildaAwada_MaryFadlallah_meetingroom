const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.database_url);
    console.log("Room Service: Database connected");
  } catch (err) {
    console.log("DB Connection Error:", err.message);
  }
};

module.exports = { connectDB };
