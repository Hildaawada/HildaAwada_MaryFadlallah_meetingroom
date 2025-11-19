const express = require("express");
const router = express.Router();

const controller = require("../controllers/bookingsController");

// Middleware
const auth = require("../middleware/auth");
const adminAuth = require("../middleware/adminAuth");
const managerAuth = require("../middleware/managerAuth");
const auditorAuth = require("../middleware/auditorAuth");
const serviceAuth = require("../middleware/serviceAuth");
const moderatorAuth = require("../middleware/moderatorAuth");

//Routes
// Any user can create a booking and check for availability
router.post("/Book", auth, controller.createBooking);
router.get("/availability", auth, controller.checkforAvailability);


// user own actions
router.get("/me", auth, controller.getMyBookings);
router.put("/:bookingID", auth, controller.updateMyBooking);
router.delete("/:bookingID", auth, controller.cancelMyBooking);

// Admin, Manager and Auditor can see all bookings
router.get("/", auth, adminAuth, managerAuth, auditorAuth,moderatorAuth, controller.getAllBookings);


//admin specific roles
router.put("/admin/:bookingId", auth, adminAuth, controller.updateBooking);
router.delete("/admin/:bookingId", auth, adminAuth, controller.cancelBooking);
router.post("/:bookingId/override-cancel",auth,adminAuth,controller.overrideCancelBooking);

// View a specific room booking
router.get("/rooms/:roomId", auth, adminAuth, managerAuth, moderatorAuth,auditorAuth, controller.getBookingsByRoom);

module.exports = router;
