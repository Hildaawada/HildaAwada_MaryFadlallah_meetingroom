/**
 * @module ReviewController
 * @description
 * Handles all operations related to room reviews.
 *  
 * It manages:
 *  - Submitting reviews
 *  - Updating/deleting personal reviews
 *  - Admin/moderator auditing actions (hide, unhide, flag, unflag)
 *  - Fetching review data
 *
 * All functions propagate errors to the global error handler.
 */

const axios = require("axios");//TO CONNCT SERVICES 
const Review = require("../models/review");

/**
 * @function isPrivilegedReviewer
 * @description
 * Checks whether a user role is allowed to see hidden reviews.
 *  To be used in other functions below.
 */


function isPrivilegedReviewer(role) {
  return ["admin", "moderator", "auditor"].includes(role);
}

/**
 * @function getReviewIdFromParams
 * @description
 * Utility function to support both reviewID and reviewId parameter naming (handle errors).
 */

function getReviewIdFromParams(params) {
  return params.reviewID || params.reviewId;
}

/**
 * @function verifyRoomExists
 * @description
 * Internal service-to-service validation to ensure a room exists
 *
 * @param {String} roomID - ID of the room  
 * @returns {Boolean} true if room exists  
 */

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

/**
 * @function SubmitReview
 * @description
 * Submit a review for a specific room (ensure it exists before).
 * Ensures rating validity.
 *
 * @example
 * {
 *   "roomID": "OXY-502",
 *   "rating": 5,
 *   "comment": "Amazing room, very clean"
 * }
 */

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

/**
 * @function getMyReview
 * @description
 * Retrieve all reviews submitted by the user sorted by their creation time  
 */

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

/**
 * @function updateMyReview
 * @description
 * Allows a user to edit their own review (they can edit both rating and comment).
 *
 */

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

/**
 * @function DeleteMyReview
 * @description
 * Delete a review permanently.
 * Users are allowed to deleted their own reviews only.
 *
 * @param {String} reviewID.params.required  
 */

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


/**
 * @function getRoomReviews
 * @description
 * Retrieve all reviews (except hidden ones) for a specific room.
 * Hidden reviews are visible only to admin, moderator, and auditor roles.
 *
 */

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

/**
 * @function getAllReviews
 * @description
 * This function is only for admin/auditor purposes.
 * Retrieve all available reviews in the database.
 */

exports.getAllReviews = async (req, res,next) => {
  try {
    const reviews = await Review.find({}).sort({ createdAt: -1 });
    return res.json(reviews);
  } catch (err) {
    next(err);
  }
};

/**
 * @function DeleteReview
 * @description
 * This is only for admins to delete any review.
 *
 * @param {String} reviewID.params.required  
 */

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

/**
 * @function flagReview
 * @description
 * Admins/Moderators can flag a review for inappropriate content.
 *
 * @param {String} reviewID.params.required  
 * @param {String} why.body.optional - Reason for flagging  
 */

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

/**
 * @function unflagReview
 * @description
 * Remove a flag from a review.
 */

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

/**
 * @function getFlaggedReviews
 * @description
 * Retrieve all reviews that have been flagged.
 */

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

/**
 * @function HideReview
 * @description
 * Hide a review from public visibility.
 * Visible only to admins/managers/auditors.
 */

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

/**
 * @function UnhideReview
 * @description
 * Restore visibility of a previously hidden review.
 */

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

/**
 * @function InternalGetRoomReviews
 * @description
 * Internal endpoint to fetch:
 *  - Visible reviews 
 *  - Count of reviews
 *  - Average rating
 *
 * @param {String} roomID.params.required  
 */

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