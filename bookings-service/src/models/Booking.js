const mongoose = require("mongoose");
const { encrypt, decrypt } = require("../utils/crypto");


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
    //this is to allow admins and managers to block room bookings even if it is available.
    BlockBooking: { type: Boolean, default: false },          
    blockReason: { type: String, default: null, set: encrypt, get: decrypt } 
  },
  {
    timestamps: true,
    toJSON: { getters: true },
    toObject: { getters: true }
   }
);

module.exports = mongoose.model("Bookings", bookingsSchema);
