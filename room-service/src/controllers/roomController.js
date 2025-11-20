const Room = require("../models/Room");



exports.checkRoomExistsInternal = async (req, res) => {
  try {
      const roomID = req.params.roomID || req.params.roomId || req.params.id;

    if (!roomID) {
      return res.status(400).json({ message: "roomID is required" });
    }

    const room = await Room.findOne({ roomID }); 

    return res.json({
      exists: !!room,
      room: room || null,
    });
  } catch (err) {
    console.error("checkRoomExistsInternal error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

exports.internalChangeStatus = async (req, res) => {
  try {
    const { roomID } = req.params;
    const { status } = req.body;

    if (!roomID || !status) {
      return res.status(400).json({ message: "roomID and status are required" });
    }

    const room = await Room.findOneAndUpdate(
      { roomID },
      { status },
      { new: true }
    );

    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    return res.json(room);
  } catch (err) {
    console.error("internalChangeStatus error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};


// ADD ROOM (Admin + Manager only)
exports.addRoom = async (req, res) => {
  try {
    // Only admin or manager allowed
    if (!["admin", "manager"].includes(req.user.role)) {
      return res.status(403).json({ error: "You are not allowed to add rooms." });
    }

    const room = await Room.create(req.body);
    return res.status(201).json(room);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


// UPDATE ROOM (Admin + Manager only)

exports.updateRoom = async (req, res) => {
  try {
    if (!["admin", "manager"].includes(req.user.role)) {
      return res.status(403).json({ error: "You are not allowed to update rooms." });
    }

    const updated = await Room.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!updated) return res.status(404).json({ error: "Room not found" });

    return res.json(updated);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


// DELETE ROOM (Admin only)

exports.deleteRoom = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Only admin can delete rooms." });
    }

    const deleted = await Room.findByIdAndDelete(req.params.id);

    if (!deleted) return res.status(404).json({ error: "Room not found" });

    return res.json({ message: "Room deleted successfully" });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


// GET ALL ROOMS (Everyone)

exports.getAllRooms = async (req, res) => {
  try {
    const rooms = await Room.find();
    return res.json(rooms);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET ONE ROOM (Everyone)

exports.getRoomById = async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);

    if (!room) return res.status(404).json({ error: "Room not found" });

    return res.json(room);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// SEARCH ROOMS (Everyone)
// Users can search by: capacity, location, equipment, status

exports.searchRooms = async (req, res) => {
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

    return res.json(rooms);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// CHANGE ROOM STATUS (Admin + Manager)
// ex: available / booked / out-of-service

exports.changeStatus = async (req, res) => {
  try {
    if (!["admin", "manager"].includes(req.user.role)) {
      return res.status(403).json({ error: "You cannot change room status." });
    }

    const room = await Room.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true }
    );

    if (!room) return res.status(404).json({ error: "Room not found" });

    return res.json(room);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }


};

