const mongoose = require("mongoose");

const roomSchema = new mongoose.Schema(
  {
     roomID: {
      type: String,
      required: true,
      unique: true
    },
    
    name: {
      type: String,
      required: true,
      unique: true
    },

    capacity: {
      type: Number,
      required: true
    },

    equipment: {
      type: [String],    
      default: []
    },

    location: {
      type: String,
      required: true
    },

    status: {
      type: String,
      enum: ["available", "booked", "out-of-service"],
      default: "available"
    },

  },
  { timestamps: true }
);

module.exports = mongoose.model("Room", roomSchema);
