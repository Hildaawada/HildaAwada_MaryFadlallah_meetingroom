const mongoose = require("mongoose");
const { encrypt, decrypt } = require("../utils/crypto"); //for encryption


const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },//to be encrypted
  password: { type: String, required: true },//this is hashed
  
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

//to be encrypted before db save
UserSchema.pre("save", function (next) {
  if (this.isModified("email")) {
    this.email = encrypt(this.email);
  }
  next();
});


// to be decrypted before returning to user
UserSchema.methods.toJSON = function () {
  const obj = this.toObject();

  if (obj.email) obj.email = decrypt(obj.email);
  return obj;
};
//only email is to be encrypted here

//adding the indices for optimized queries
// For login / lookups
UserSchema.index({ username: 1 });

// For email-based lookups
UserSchema.index({ email: 1 });

// Useful for filtering users by role
UserSchema.index({ role: 1 });


module.exports = mongoose.model("User", UserSchema);
