const Review = require("../models/review");

// To be used in other functions below.
function isPrivilegedReviewer(role) {
  return ["admin", "moderator", "auditor"].includes(role);
}
// to handle ID and Id errors
function getReviewIdFromParams(params) {
  return params.reviewID || params.reviewId;
}

exports.SubmitReview = async (req, res) => {
  try {
    const { roomID, rating, comment } = req.body;

    if (!roomID || rating == null) {
      return res
        .status(400)
        .json({ message: "Please provide the roomID and the rating" });
    }

    if (rating < 1 || rating > 5) {
      return res
        .status(400)
        .json({ message: " Choose a number between 1 and 5" });
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
    console.error("Submit Review error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};


//it shows all reviews by the user
exports.getMyReview = async (req, res) => {
  try {
    const reviews = await Review.find({ username: req.user.username }).sort({
      createdAt: -1
    });
    return res.json(reviews);
  } catch (err) {
    console.error("Error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};


exports.updateMyReview = async (req, res) => {
  try {
    const { reviewID } = req.params;
    const { rating, comment } = req.body;

    const review = await Review.findById(reviewID);
    if (!review) {
      return res.status(404).json({ message: "ERROR! Review not found" });
    }

    if (review.username !== req.user.username) {
      return res
        .status(403)
        .json({ message: "ERROR, wrong user" });
    }

    if (rating != null) {
      if (rating < 1 || rating > 5) {
        return res
          .status(400)
          .json({ message: "choose a number between 1 and 5" });
      }
      review.rating = rating;
    }
    if (comment != null) {
      review.comment = comment;
    }

    await review.save();

    return res.json(review);
  } catch (err) {
    console.error("Error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};


exports.DeleteMyReview = async (req, res) => {
  try {
    const reviewID = getReviewIdFromParams(req.params);
    const username = req.user?.username;

    if (!reviewID) {
      return res.status(400).json({ message: "Review ID is required" });
    }
    if (!username) {
      return res.status(401).json({ message: "Invalid username" });
    }

    const review = await Review.findById(reviewID);
    if (!review) {
      return res.status(404).json({ message: "This review does not exist" });
    }

    if (review.username !== username) {
      return res
        .status(403)
        .json({ message: "You can only delete your own reviews" });
    }

    await Review.deleteOne();

    return res.json({ message: "Review deleted successfully" });
  } catch (err) {
    console.error("Delete MyReview error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

//everyone is allowed to see unhidden 
exports.getRoomReviews = async (req, res) => {
  try {
    const { roomID } = req.params;
    const role = req.user.role;
    //to ensure regular users don't see hidden reviews
    const filter = { roomID };
    if (!isPrivilegedReviewer(role)) {
      filter.hidden = false;
    }

    const reviews = await Review.find(filter).sort({ createdAt: -1 });

    return res.json(reviews);
  } catch (err) {
    console.error("Error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};



exports.getAllReviews = async (req, res) => {
  try {
    const reviews = await Review.find({}).sort({ createdAt: -1 });
    return res.json(reviews);
  } catch (err) {
    console.error("Error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};
//just for admins
exports.DeleteReview = async (req, res) => {
  try {
    const reviewID = getReviewIdFromParams(req.params);

    if (!reviewID) {
      return res.status(400).json({ message: "Review ID is missing" });
    }

    const review = await Review.findById(reviewID);
    if (!review) {
      return res.status(404).json({ message: "ERROR! Review not found" });
    }

    await review.deleteOne();
    return res.json({ message: "Review deleted successfully" });
  } catch (err) {
    console.error("Error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};


//flagged reviews can be seen by regular users when searching room reviews but they are marked as flagged
exports.flagReview = async (req, res) => {
  try {
    const { reviewID } = req.params;
    const { why } = req.body;

    const review = await Review.findById(reviewID);
    if (!review) {
      return res.status(404).json({ message: "Error! Review not found" });
    }

    review.flagged = true;
    review.flaggedReason = why || "Inappropriate Language";
    review.flaggedBy = req.user.username;

    await review.save();

    return res.json({ message: "Review Flagged!", review });
  } catch (err) {
    console.error("Error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

exports.unflagReview = async (req, res) => {
  try {
    const { reviewID } = req.params;

    const review = await Review.findById(reviewID);
    if (!review) {
      return res.status(404).json({ message: "This review is not found" });
    }

    review.flagged = false;
    review.flaggedReason = null;
    review.flaggedBy = null;

    await review.save();

    return res.json({ message: "Review is successfully unflagged", review });
  } catch (err) {
    console.error("Error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

exports.getFlaggedReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ flagged: true }).sort({
      createdAt: -1
    });
    return res.json(reviews);
  } catch (err) {
    console.error("error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};


exports.HideReview = async (req, res) => {
  try {
    const { reviewID } = req.params;

    const review = await Review.findById(reviewID);
    if (!review) {
      return res.status(404).json({ message: "ERROR! Review not found" });
    }

    review.hidden = true;
    review.hiddenBy = req.user.username;

    await review.save();

    return res.json({ message: " The review is hidden successfully", review });
  } catch (err) {
    console.error("Error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

exports.UnhideReview = async (req, res) => {
  try {
    const { reviewID } = req.params;

    const review = await Review.findById(reviewID);
    if (!review) {
      return res.status(404).json({ message: "ERROR! Review not found" });
    }

    review.hidden = false;
    review.hiddenBy = null;

    await review.save();

    return res.json({ message: "The review is unhidden now", review });
  } catch (err) {
    console.error("Error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};




exports.InternalGetRoomReviews = async (req, res) => {
  try {
    const { roomID } = req.params;

    const reviews = await Review.find({
      roomID,
      hidden: false
    }).sort({ createdAt: -1 });

    const x = reviews.length;
    const RatingAvg =
      x === 0
        ? null
        : reviews.reduce((sum, r) => sum + r.rating, 0) / x;

    return res.json({
      roomID,
      x,
      averageRating: RatingAvg,
      reviews
    });
  } catch (err) {
    console.error("Error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};
