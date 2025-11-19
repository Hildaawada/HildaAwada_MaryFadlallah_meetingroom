const mongoose = require("mongoose");

const bookingsSchema = new mongoose.Schema(
  { 
    username: {
      type: String,
      required: true,
    },
    roomID: {
      type: String,//for simplicity
      required: true,
    },
    checkin: {
      type: Date,
      required: true,
    },
    checkout: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ["confirmed", "cancelled"],
      default: "confirmed",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Bookings", bookingsSchema);
