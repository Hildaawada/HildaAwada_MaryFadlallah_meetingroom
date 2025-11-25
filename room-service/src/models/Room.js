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
      default: "available"
    },
   },
  { timestamps: true }
);

// Adding indecies for optimized queries
// Search room by name
roomSchema.index({ name: 1 });

// Filter by capacity
roomSchema.index({ capacity: 1 });

// Filter by location
roomSchema.index({ location: 1 });

// Check availability
roomSchema.index({ status: 1 });

module.exports = mongoose.model("Room", roomSchema);
