const express = require('express');
const router = express.Router();

const {
    addRoom,
    updateRoom,
    deleteRoom,
    getAllRooms,
    getRoomById,
    searchRooms,
    changeStatus,
    internalChangeStatus,
} = require('../controllers/roomController');

const controller = require('../controllers/roomController');

// RBAC Middleware
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');
const managerAuth = require('../middleware/managerAuth');
const serviceAuth = require("../middleware/serviceAuth");
router.get("/internal/:roomID",serviceAuth,controller.checkRoomExistsInternal);
router.patch("/internal/:roomID/status", serviceAuth, internalChangeStatus);

router.use(auth);   // protects everything

router.get("/", getAllRooms); 
router.get("/search", searchRooms);
router.get("/:id", getRoomById);

// functions only for admin and manager

router.post("/", managerAuth, addRoom);
router.put("/:id", managerAuth, updateRoom);
router.patch("/:id/status", managerAuth, changeStatus);

// function only for admin

router.delete("/:id", adminAuth, deleteRoom);

module.exports = router;
