const mongoose = require("mongoose");
const { encrypt, decrypt } = require("../utils/crypto");


const reviewSchema = new mongoose.Schema(
  {
    //reviewer and room ID
    username: { type: String, required: true },
    userID: { type: String, required: true },
    roomID: { type: String, required: true },

    // rating /5 and cmnts
    rating: { type: Number, min: 1, max: 5, required: true },
      comment: {
        type: String,
        set: encrypt,   // encrypt when saving
        get: decrypt    // decrypt when reading
      },

    
    flagged: { type: Boolean, default: false },
    WHYflagged: { 
      type: String,
      set: encrypt,
      get: decrypt
    },
    flaggedBy: { type: String, default: null },

    hidden: { type: Boolean, default: false },
    hiddenBy: { type: String, default: null }
  },
  { 
    timestamps: true,
    toJSON: { getters: true },   // decrypting the output
    toObject: { getters: true }
   }
);

module.exports = mongoose.model("Review", reviewSchema);
