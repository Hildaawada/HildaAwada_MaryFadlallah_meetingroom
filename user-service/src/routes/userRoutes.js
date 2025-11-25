const express = require("express");
const router = express.Router();

const controller = require("../controllers/userController");

// Middleware
const auth = require("../middleware/auth");
const adminAuth = require("../middleware/adminAuth");
const managerAuth = require("../middleware/managerAuth");
const moderatorAuth = require("../middleware/moderatorAuth");
const auditorAuth = require("../middleware/auditorAuth");
const { loginLimiter } = require("../middleware/rateLimiter");


//Routes
router.post("/register", controller.register);

router.post("/login", loginLimiter, controller.login);

router.get("/", auth, auditorAuth, controller.getAllUsers);       // Admin + Auditor
router.get("/:username", auth, controller.getUserByUsername);    // Any logged-in user
router.put("/:username", auth, controller.updateUser);           // Self or admin
router.delete("/:username", auth, adminAuth, controller.deleteUser); // Admin only

// BOOKING HISTORY (requires login)
router.get("/:username/bookings", auth, controller.getUserBookingHistory);

module.exports = router;
