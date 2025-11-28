/**
 * @module RoomController
 * @description
 * Handles all operations related to rooms: Room creation,
 * Room deletion, Room availability, Room update....
 * It also supports internal service-to-service communication
 * to update room status and extract room availability.
 *
 * All errors are passed to the global error.
 */

const Room = require("../models/Room");
const cache = require("../utils/cache");

/**
 * @function checkRoomExistsInternal
 * @description
 * Internal endpoint used by other microservices
 * to validate whether a room exists.
 *
 *
 * @returns Whether room exists  
 * @returns Room details if found  
 */

exports.checkRoomExistsInternal = async (req, res,next) => {
  try {
      const roomID = req.params.roomID || req.params.roomId || req.params.id;

    if (!roomID) {
      const err = new Error("roomID is required");
      err.statusCode = 400;
      throw err;
    }

    const room = await Room.findOne({ roomID }); 

    return res.json({
      success: true,
      exists: !!room,
      room: room || null
    });
  } catch (err) {
    next(err);
  }
};


/**
 * @function internalChangeStatus
 * @description
 * Internal endpoint used by Bookings Service to update room status
 * (ex: "booked (...) ", "out-of-service (...)", "available").
 *
 * @returns {Object} updated room status
 */


exports.internalChangeStatus = async (req, res,next) => {
  try {
    const { roomID } = req.params;
    const { status } = req.body;

    if (!roomID || !status) {
      const error = new Error("roomID and status are required");
      error.statusCode = 400;
      throw error;
    }

    const room = await Room.findOneAndUpdate(
      { roomID },
      { status },
      { new: true }
    );

    if (!room) {
      const error = new Error("Room not found");
      error.statusCode = 404;
      throw error;
    }

    return res.json(room);
  } catch (err) {
    next(err);
  }
};

/**
 * @function addRoom
 * @description
 * Add a new room to the system.  
 * Only administrators and managers are allowed to perform this action.
 *
 * @param {Object} body.required - Room details  
 */


exports.addRoom = async (req, res,next) => {
  try {
    // Only admin or manager allowed
    if (!["admin", "manager"].includes(req.user.role))  {
      const error = new Error("You are not allowed to add rooms.");
      error.statusCode = 403;
      throw error;
    }

    const room = await Room.create(req.body);
    return res.status(201).json({
      success: true,
      message: "Room added successfully",
      room
    });

  } catch (err) {
    next(err);
  }
};

/**
 * @function updateRoom
 * @description
 * This function is for the admins/managers
 * to update room details (capacity, equipment, location, etc.).  
 *
 */



exports.updateRoom = async (req, res,next) => {
  try {
    if (!["admin", "manager"].includes(req.user.role)) {
      const error = new Error("You are not allowed to update rooms.");
      error.statusCode = 403;
      throw error;
    }

    const updated = await Room.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!updated) {
      const error = new Error("Room not found");
      error.statusCode = 404;
      throw error;
    }

    return res.json(updated);

  } catch (err) {
    next(err);
  }
};

/**
 * @function deleteRoom
 * @description
 * Delete a room from the database.  
 * Only admins may perform this action.
 * @param {String} id.params.required - Room document ID  
 */


exports.deleteRoom = async (req, res,next) => {
  try {
    if (req.user.role !== "admin") {
      const error = new Error("Only admin can delete rooms.");
      error.statusCode = 403;
      throw error;
    }

    const deleted = await Room.findByIdAndDelete(req.params.id);

    if (!deleted) {
      const error = new Error("Room not found");
      error.statusCode = 404;
      throw error;
    }

    return res.json({ message: "Room deleted successfully" });

  } catch (err) {
     next(err);
  }
};

/**
 * @function getAllRooms
 * @description
 * Retrieve all rooms in the system.  
 * Responses are cached for improved performance.
 *
 * @returns {Array} list of rooms  
 * @returns {String} source - cache | database  
 */


exports.getAllRooms = async (req, res, next) => {
  try {
    // Check cache first
    const cachedRooms = cache.get("allRooms");

    if (cachedRooms) {
      return res.json({
        success: true,
        source: "cache",
        rooms: cachedRooms
      });
    }

    // If not in cache we fetch from DB
    const rooms = await Room.find();

    // Save to cache
    cache.set("allRooms", rooms);

    return res.json({
        success: true,
        source: "database",
        rooms
    });

  } catch (err) {
    next(err);
  }
};


/**
 * @function getRoomById
 * @description
 * Fetch room detailed information.
 * This can be performed by admins/managers.
 * 
 *
 * @param {String} id.params.required - Room document ID  
 */



exports.getRoomById = async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);

    if (!room) {
      const error = new Error("Room not found");
      error.statusCode = 404;
      throw error;
    }

    return res.json(room);

  } catch (err) {
    next(err);
  }
};


/**
 * @function searchRooms
 * @description
 * Search for rooms based on multiple filters:  
 * capacity, location, equipment list, and status.
 *
 * @example /search?capacity=20&equipment=Projector,Microphone
 */

exports.searchRooms = async (req, res,next) => {
  try {
    const query = {};

    if (req.query.capacity) query.capacity = { $gte: req.query.capacity };
    if (req.query.location) query.location = req.query.location;
    if (req.query.status) query.status = req.query.status;

    if (req.query.equipment) {
      const items = req.query.equipment.split(",");
      query.equipment = { $all: items };
    }

    const rooms = await Room.find(query);

    return res.json({ success: true, rooms });

  } catch (err) {
     next(err);
  }
};


/**
 * @function changeStatus
 * @description
 * Change room availability status manually (admin/manager only).
 *
 */



exports.changeStatus = async (req, res,next) => {
  try {
    if (!["admin", "manager"].includes(req.user.role)) {
      const error = new Error("You cannot change room status.");
      error.statusCode = 403;
      throw error;
    }

    const room = await Room.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true }
    );

    if (!room) {
      const error = new Error("Room not found");
      error.statusCode = 404;
      throw error;
    }

    return res.json({ success: true, room });

  } catch (err) {
    next(err);
  }


};

