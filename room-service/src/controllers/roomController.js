const Room = require("../models/Room");



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


// ADD ROOM (Admin + Manager only)
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


// UPDATE ROOM (Admin + Manager only)

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


// DELETE ROOM (Admin only)

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


// GET ALL ROOMS (Everyone)

exports.getAllRooms = async (req, res,next) => {
  try {
    const rooms = await Room.find();
    return res.json({ success: true, rooms });

  } catch (err) {
    next(err);
  }
};

// GET ONE ROOM (Everyone)

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

// SEARCH ROOMS (Everyone)
// Users can search by: capacity, location, equipment, status

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

// CHANGE ROOM STATUS (Admin + Manager)
// ex: available / booked / out-of-service

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

