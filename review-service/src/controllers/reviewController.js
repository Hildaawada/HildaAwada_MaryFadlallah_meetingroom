const axios = require("axios");//TO CONNCT SERVICES 
const Review = require("../models/review");

// To be used in other functions below.
function isPrivilegedReviewer(role) {
  return ["admin", "moderator", "auditor"].includes(role);
}

// to handle ID and Id errors
function getReviewIdFromParams(params) {
  return params.reviewID || params.reviewId;
}

// To ensure room exsits before reviewing
async function verifyRoomExists(roomID) {
  try {
    const res = await axios.get(
      `${process.env.ROOM_SERVICE_URL}/internal/${roomID}`,
      {
        headers: {
          "x-service-key": process.env.SERVICE_KEY
        }
      }
    );
    return res.data.exists === true;
  } catch (err) {
    return false;
  }
}

// SUBMITTING A REVIEW 
exports.SubmitReview = async (req, res, next) => {
  try {
    const { roomID, rating, comment } = req.body;

    if (!roomID || rating == null) {
      const error = new Error("Please provide the roomID and the rating");
      error.statusCode = 400;
      throw error;
    }

    const exists = await verifyRoomExists(roomID);
    if (!exists) {
      const error = new Error("You cannot review a room that does not exist!");
      error.statusCode = 404;
      throw error;
    }

    if (rating < 1 || rating > 5) {
      const error = new Error("Choose a number between 1 and 5");
      error.statusCode = 400;
      throw error;
    }

    const review = await Review.create({
      username: req.user.username,
      userID: req.user.id,
      roomID,
      rating,
      comment
    });

    return res.status(201).json(review);
  } catch (err) {
    next(err);
  }
};


//it shows all reviews by the user
exports.getMyReview = async (req, res,next) => {
  try {
    const reviews = await Review.find({ username: req.user.username }).sort({
      createdAt: -1
    });
    return res.json(reviews);
  } catch (err) {
    next(err);
  }
};


exports.updateMyReview = async (req, res,next) => {
  try {
    const reviewID = getReviewIdFromParams(req.params);
    const { rating, comment } = req.body;

    const review = await Review.findById(reviewID);
    if (!review) {
      const error = new Error("ERROR! Review not found");
      error.statusCode = 404;
      throw error;
    }

    if (review.username !== req.user.username) {
      const error = new Error("ERROR, wrong user");
      error.statusCode = 403;
      throw error;
    }

    if (rating != null) {
      if (rating < 1 || rating > 5) {
        const error = new Error("choose a number between 1 and 5");
        error.statusCode = 400;
        throw error;
      }
      review.rating = rating;
    }
    if (comment != null) {
      review.comment = comment;
    }

    await review.save();

    return res.json(review);
  } catch (err) {
   next(err);
  }
};


exports.DeleteMyReview = async (req, res,next) => {
  try {
    const reviewID = getReviewIdFromParams(req.params);
    const username = req.user?.username;

    if (!reviewID) {
      const error = new Error("Review ID is required");
      error.statusCode = 400;
      throw error;
    }

    if (!username) {
      const error = new Error("Invalid username");
      error.statusCode = 401;
      throw error;
    }

    const review = await Review.findById(reviewID);
    if (!review) {
      const error = new Error("This review does not exist");
      error.statusCode = 404;
      throw error;
    }

    if (review.username !== username) {
      const error = new Error("You can only delete your own reviews");
      error.statusCode = 403;
      throw error;
    }

    await Review.findByIdAndDelete(reviewID);

    return res.json({ message: "Review deleted successfully" });
  } catch (err) {
    next(err);
  }
};


//everyone is allowed to see unhidden 
exports.getRoomReviews = async (req, res, next) => {
  try {
    const { roomID } = req.params;
    const role = req.user.role;

    const exists = await verifyRoomExists(roomID);
    if (!exists) {
      const error = new Error("This room does not exist");
      error.statusCode = 404;
      throw error;
    }

    const filter = { roomID };
    if (!isPrivilegedReviewer(role)) filter.hidden = false;

    const reviews = await Review.find(filter).sort({ createdAt: -1 });

    return res.json(reviews);
  } catch (err) {
    next(err);
  }
};


exports.getAllReviews = async (req, res,next) => {
  try {
    const reviews = await Review.find({}).sort({ createdAt: -1 });
    return res.json(reviews);
  } catch (err) {
    next(err);
  }
};


//just for admins
exports.DeleteReview = async (req, res, next) => {
  try {
    const reviewID = getReviewIdFromParams(req.params);

    if (!reviewID) {
      const error = new Error("Review ID is missing");
      error.statusCode = 400;
      throw error;
    }

    const review = await Review.findById(reviewID);
    if (!review) {
      const error = new Error("ERROR! Review not found");
      error.statusCode = 404;
      throw error;
    }

    await Review.findByIdAndDelete(reviewID);

    return res.json({ message: "Review deleted successfully" });
  } catch (err) {
    next(err);
  }
};

//flagged reviews can be seen by regular users when searching room reviews but they are marked as flagged
exports.flagReview = async (req, res, next) => {
  try {
    const { reviewID } = req.params;
    const { why } = req.body;

    const review = await Review.findById(reviewID);
    if (!review) {
      const error = new Error("Error! Review not found");
      error.statusCode = 404;
      throw error;
    }

    review.flagged = true;
    review.flaggedReason = why || "Inappropriate Language";
    review.flaggedBy = req.user.username;

    await review.save();

    return res.json({ message: "Review Flagged!", review });
  } catch (err) {
    next(err);
  }
};

exports.unflagReview = async (req, res, next) => {
  try {
    const { reviewID } = req.params;

    const review = await Review.findById(reviewID);
    if (!review) {
      const error = new Error("This review is not found");
      error.statusCode = 404;
      throw error;
    }

    review.flagged = false;
    review.flaggedReason = null;
    review.flaggedBy = null;

    await review.save();

    return res.json({ message: "Review is successfully unflagged", review });
  } catch (err) {
    next(err);
  }
};

exports.getFlaggedReviews = async (req, res, next) => {
  try {
    const reviews = await Review.find({ flagged: true }).sort({
      createdAt: -1
    });
    return res.json(reviews);
  } catch (err) {
    next(err);
  }
};


exports.HideReview = async (req, res, next) => {
  try {
    const { reviewID } = req.params;

    const review = await Review.findById(reviewID);
    if (!review) {
      const error = new Error("ERROR! Review not found");
      error.statusCode = 404;
      throw error;
    }

    review.hidden = true;
    review.hiddenBy = req.user.username;

    await review.save();

    return res.json({ message: " The review is hidden successfully", review });
  } catch (err) {
    next(err);
  }
};

exports.UnhideReview = async (req, res, next) => {
  try {
    const { reviewID } = req.params;

    const review = await Review.findById(reviewID);
    if (!review) {
      const error = new Error("ERROR! Review not found");
      error.statusCode = 404;
      throw error;
    }

    review.hidden = false;
    review.hiddenBy = null;

    await review.save();

    return res.json({ message: "The review is unhidden now", review });
  } catch (err) {
    next(err);
  }
};

exports.InternalGetRoomReviews = async (req, res, next) => {
  try {
    const { roomID } = req.params;

    const exists = await verifyRoomExists(roomID);
    if (!exists) {
      const error = new Error("This room does not exist");
      error.statusCode = 404;
      throw error;
    }

    const reviews = await Review.find({
      roomID,
      hidden: false
    }).sort({ createdAt: -1 });

    const x = reviews.length;
    const RatingAvg =
      x === 0 ? null : reviews.reduce((sum, r) => sum + r.rating, 0) / x;

    return res.json({
      roomID,
      x,
      averageRating: RatingAvg,
      reviews
    });
  } catch (err) {
    next(err);
  }
};