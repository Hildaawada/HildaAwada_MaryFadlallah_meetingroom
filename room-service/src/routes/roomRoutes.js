const express = require('express');
const router = express.Router();

const {
    addRoom,
    updateRoom,
    deleteRoom,
    getAllRooms,
    getRoomById,
    searchRooms,
    changeStatus
} = require('../controllers/roomController');

// RBAC Middleware
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');
const managerAuth = require('../middleware/managerAuth');


// ALL ROUTES REQUIRE AUTH (recommended)

router.use(auth);   // protects everything


// PUBLIC (ANY AUTHENTICATED ROLE)

router.get("/", getAllRooms); 
router.get("/search", searchRooms);
router.get("/:id", getRoomById);

// ADMIN + MANAGER

router.post("/", managerAuth, addRoom);
router.put("/:id", managerAuth, updateRoom);
router.patch("/:id/status", managerAuth, changeStatus);

// ADMIN ONLY

router.delete("/:id", adminAuth, deleteRoom);

module.exports = router;
