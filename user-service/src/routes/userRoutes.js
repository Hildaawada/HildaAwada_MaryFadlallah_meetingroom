const express = require("express");
const router = express.Router();

const controller = require("../controllers/userController");

router.get('/', (req, res) => {
  res.json({ service: "user-service", status: "running" });
});
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

//adding every function with its auth middleware
router.get("/", auth, auditorAuth, controller.getAllUsers);      
router.get("/:username", auth, controller.getUserByUsername);   
router.put("/:username", auth, controller.updateUser);           
router.delete("/:username", auth, adminAuth, controller.deleteUser); 

// booking history route
router.get("/:username/bookings", auth, controller.getUserBookingHistory);

module.exports = router;
