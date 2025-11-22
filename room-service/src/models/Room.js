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
//shows if blocked by admins, next booking or if it is available, adjusted when all project is combined 
    status: {
      type: String,
      default: "available" 
    },

  },
  { timestamps: true }
);

module.exports = mongoose.model("Room", roomSchema);
