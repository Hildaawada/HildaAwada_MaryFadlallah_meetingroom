const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  
  role: {
    type: String,
    enum: [
      "admin",    // full system control
      "user",     // regular user
      "manager",  // facility manager
      "moderator",// review moderator
      "auditor",  // read-only
      "service"   // microservice API account
    ],
    default: "user"
  }
});

module.exports = mongoose.model("User", UserSchema);
