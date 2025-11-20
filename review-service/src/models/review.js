const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    //reviewer and room ID
    username: { type: String, required: true },
    userID: { type: String, required: true },
    roomID: { type: String, required: true },

    // rating /5 and cmnts
    rating: { type: Number, min: 1, max: 5, required: true },
    comment: { type: String },

    
    flagged: { type: Boolean, default: false },
    WHYflagged: { type: String, default: null },
    flaggedBy: { type: String, default: null },

    hidden: { type: Boolean, default: false },
    hiddenBy: { type: String, default: null }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Review", reviewSchema);
