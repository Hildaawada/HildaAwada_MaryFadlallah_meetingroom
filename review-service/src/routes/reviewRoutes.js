const express = require("express");
const router = express.Router();

const controller = require("../controllers/reviewController");

// Middleware
const auth = require("../middleware/auth");
const adminAuth = require("../middleware/adminAuth");
const managerAuth = require("../middleware/managerAuth");
const auditorAuth = require("../middleware/auditorAuth");
const serviceAuth = require("../middleware/serviceAuth");
const moderatorAuth = require("../middleware/moderatorAuth");

//Routes
//for all users
router.post("/review", auth, controller.SubmitReview);

// regular users 
router.delete("/:reviewID", auth, controller.DeleteMyReview);
router.get("/me", auth, controller.getMyReview);
router.put("/:reviewID", auth, controller.updateMyReview);
router.get("/room/:roomID", auth, controller.getRoomReviews);

//only admins
router.post("/:reviewID/flag",auth,adminAuth,moderatorAuth, controller.flagReview);
router.post("/:reviewID/unflag",auth,adminAuth,moderatorAuth,controller.unflagReview);
router.delete("/admin/:reviewID",auth,adminAuth,controller.DeleteReview);
router.patch("/:reviewID/hide",auth,adminAuth,moderatorAuth,controller.HideReview);
router.patch("/:reviewID/unhide",auth,adminAuth,moderatorAuth,controller.UnhideReview);


// GET ALL FLAGGED AND NORMAL REVIEWS
router.get("/",auth,adminAuth,moderatorAuth,auditorAuth ,controller.getAllReviews);
router.get("/flagged/all",auth,adminAuth,moderatorAuth,auditorAuth,controller.getFlaggedReviews);

//Service Account
router.get("/internal/room/:roomID",auth,serviceAuth,controller.InternalGetRoomReviews);


module.exports = router;
