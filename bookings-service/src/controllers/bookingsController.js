const axios = require("axios");
const Bookings = require("../models/Booking");

// this is to handle both bookingID and bookingId 
function getBookingIdFromParams(params) {
  return params.bookingID || params.bookingId;
}

//when testing in postmann I noticed the roomID is not displayed first, so this is to align display
function formatBooking(b) {
  if (!b) return null;
  return {
    roomID: b.roomID,
    username: b.username,
    checkin: b.checkin,
    checkout: b.checkout,
    status: b.status,
    BlockBooking: b.BlockBooking,
    blockReason: b.blockReason,
    _id: b._id,
    createdAt: b.createdAt,
    updatedAt: b.updatedAt
  };
}

async function verifyRoomExists(roomID) {
  try {
    const res = await axios.get(
      `${process.env.ROOM_SERVICE_URL}/internal/${roomID}`,
      {
        headers: {
          "x-service-key": process.env.SERVICE_KEY
        }
      }
    );

    return res.data.exists === true;
  } catch (err) {
    console.error("verifyRoomExists error:", err.message);
    return false;
  }
}

// NEW: USES INTERNAL STATUS UPDATE ENDPOINT
async function updateRoomStatusBasedOnBookings(roomID) {
  try {
    const futureActive = await Bookings.findOne({
      roomID,
      BlockBooking: false,
      status: "confirmed",
      checkout: { $gt: new Date() }
    });

    const blocked = await Bookings.findOne({
      roomID,
      BlockBooking: true,
      status: "confirmed",
      checkout: { $gt: new Date() }
    });

    let newStatus = "available";
    if (blocked) newStatus = "out-of-service";
    else if (futureActive) newStatus = "booked";

    // 🔥 IMPORTANT: USE INTERNAL ENDPOINT
    await axios.patch(
      `${process.env.ROOM_SERVICE_URL}/internal/${roomID}/status`,
      { status: newStatus },
      {
        headers: {
          "x-service-key": process.env.SERVICE_KEY
        }
      }
    );

  } catch (err) {
    console.error("updateRoomStatusBasedOnBookings error:", err.message);
  }
}

//The admins can block users from booking the room even if it is available
exports.blockRoom = async (req, res) => {
  try {
    const { roomID, checkin, checkout, blockReason } = req.body;

    if (!roomID || !checkin || !checkout) {
      return res.status(400).json({
        message: "Please provide the roomID, checkin and checkout dates"
      });
    }

    const start = new Date(checkin);
    const end = new Date(checkout);

    if (isNaN(start) || isNaN(end) || start >= end) {
      return res.status(400).json({ message: "The time range is invalid" });
    }

    const exists = await verifyRoomExists(roomID);
    if (!exists) {
      return res.status(404).json({ message: "This room does not exist" });
    }

    const overlapping = await Bookings.findOne({
      roomID,
      status: { $ne: "cancelled" },
      checkin: { $lt: end },
      checkout: { $gt: start }
    });

    if (overlapping) {
      return res.status(409).json({
        message: "Cannot block: room already booked/blocked",
        conflict: overlapping
      });
    }

    const actorUsername = req.user?.username || "system";

    const block = await Bookings.create({
      username: actorUsername,
      roomID,
      checkin: start,
      checkout: end,
      status: "confirmed",
      BlockBooking: true,
      blockReason: blockReason || "Room unavailable"
    });

    await updateRoomStatusBasedOnBookings(roomID);

    return res.status(201).json({
      message: "Room blocked successfully",
      block
    });
  } catch (err) {
    console.error("Error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

exports.unblockRoom = async (req, res) => {
  try {
    const { blockID } = req.params;

    if (!blockID) {
      return res.status(400).json({ message: "blockID is required" });
    }

    const block = await Bookings.findById(blockID);
    if (!block || !block.BlockBooking) {
      return res.status(404).json({ message: "Error, this room is not blocked" });
    }

    const roomID = block.roomID;

    await Bookings.findByIdAndDelete(blockID);

    await updateRoomStatusBasedOnBookings(roomID);

    return res.json({ message: "The block is removed successfully" });
  } catch (err) {
    console.error("Error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

//CHECK ROOM AVAILABIITY 
exports.checkforAvailability = async (req, res) => {
  try {
    const { roomID, checkin, checkout } = req.query;

    if (!roomID || !checkin || !checkout) {
      return res.status(400).json({
        message: "Please provide roomID and dates of reservation",
      });
    }

    const exists = await verifyRoomExists(roomID);
    if (!exists) {
      return res.status(404).json({ message: "This room does not exist" });
    }

    const start = new Date(checkin);
    const end = new Date(checkout);

    if (isNaN(start) || isNaN(end) || start >= end) {
      return res.status(400).json({ message: "Invalid time range" });
    }

    const conflict = await Bookings.findOne({
      roomID,
      status: { $ne: "cancelled" },
      checkin: { $lt: end },
      checkout: { $gt: start }
    });

    if (conflict) {
      return res.status(200).json({
        roomID,
        available: false,
        conflict
      });
    }

    return res.status(200).json({
      roomID,
      available: true
    });
  } catch (err) {
    console.error("Error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// THE USER BOOKING FN THAT ALSO TAKE INTO ACCOUNT IF THE ROOM IS BLOCKED OR ALREADY BOOKED
exports.createBooking = async (req, res) => {
  try {
    const { roomID, checkin, checkout } = req.body;
    const username = req.user?.username;

    if (!roomID || !checkin || !checkout) {
      return res.status(400).json({
        message: "roomID, checkin and checkout dates are required",
      });
    }

    if (!username) {
      return res.status(401).json({ message: "Error, the username is missing" });
    }

    const exists = await verifyRoomExists(roomID);
    if (!exists) {
      return res.status(404).json({ message: "This room does not exist" });
    }

    const start = new Date(checkin);
    const end = new Date(checkout);

    if (isNaN(start) || isNaN(end) || start >= end) {
      return res.status(400).json({ message: "Invalid time range" });
    }

    const conflict = await Bookings.findOne({
      roomID,
      status: { $ne: "cancelled" },
      checkin: { $lt: end },
      checkout: { $gt: start },
    });

    if (conflict) {
      const msg = conflict.BlockBooking
        ? "This room is blocked by admin"
        : "This room is already booked for this time slot";

      return res.status(409).json({ message: msg });
    }

    const booking = await Bookings.create({
      username,
      roomID,
      checkin: start,
      checkout: end,
      status: "confirmed",
      BlockBooking: false,
    });

    await updateRoomStatusBasedOnBookings(roomID);

    return res.status(201).json(booking);
  } catch (err) {
    console.error("Error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

//shows users booking history
exports.getMyBookings = async (req, res) => {
  try {
    const username = req.user?.username;

    const bookings = await Bookings.find({ username }).sort({ checkin: 1 });
    res.json(bookings);
  } catch (err) {
    console.error("getMyBookings error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.updateMyBooking = async (req, res) => {
  try {
    const id = getBookingIdFromParams(req.params);
    const username = req.user?.username;
    const { checkin, checkout } = req.body;

    const booking = await Bookings.findById(id);
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    if (booking.username !== username) {
      return res.status(403).json({ message: "Error! you can only update your bookings" });
    }

    if (checkin) booking.checkin = new Date(checkin);
    if (checkout) booking.checkout = new Date(checkout);

    if (isNaN(booking.checkin) || isNaN(booking.checkout)) {
      return res.status(400).json({ message: "Invalid time format" });
    }

    if (booking.checkin >= booking.checkout) {
      return res.status(400).json({ message: "Invalid time range" });
    }

    const conflict = await Bookings.findOne({
      _id: { $ne: booking._id },
      roomID: booking.roomID,
      status: { $ne: "cancelled" },
      checkin: { $lt: booking.checkout },
      checkout: { $gt: booking.checkin },
    });

    if (conflict) {
      return res.status(409).json({
        message: "This new time is not available for booking",
        conflict,
      });
    }

    await booking.save();
    await updateRoomStatusBasedOnBookings(booking.roomID);

    return res.json(booking);
  } catch (err) {
    console.error("updateMyBooking error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

exports.cancelMyBooking = async (req, res) => {
  try {
    const id = getBookingIdFromParams(req.params);
    const username = req.user?.username;

    const booking = await Bookings.findById(id);
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    if (booking.username !== username) {
      return res.status(403).json({ message: "Not allowed to cancel this booking" });
    }

    booking.status = "cancelled";
    await booking.save();

    await updateRoomStatusBasedOnBookings(booking.roomID);

    return res.json({ message: "Booking cancelled", booking });
  } catch (err) {
    console.error("cancel My Booking error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

exports.getAllBookings = async (req, res) => {
  try {
    const bookings = await Bookings.find({
      status: { $ne: "cancelled" }
    }).sort({ roomID: 1, checkin: 1 });

    const formatted = bookings.map(formatBooking);
    return res.json(formatted);
  } catch (err) {
    console.error("Error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

exports.updateBooking = async (req, res) => {
  try {
    const id = getBookingIdFromParams(req.params);
    const { checkin, checkout, status } = req.body;

    const booking = await Bookings.findById(id);
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    if (checkin) booking.checkin = new Date(checkin);
    if (checkout) booking.checkout = new Date(checkout);
    if (status) booking.status = status;

    await booking.save();
    await updateRoomStatusBasedOnBookings(booking.roomID);

    return res.json(booking);
  } catch (err) {
    console.error("update Booking error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

exports.cancelBooking = async (req, res) => {
  try {
    const id = getBookingIdFromParams(req.params);

    const booking = await Bookings.findById(id);
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    booking.status = "cancelled";
    await booking.save();

    await updateRoomStatusBasedOnBookings(booking.roomID);

    return res.json({ message: "Booking cancelled by admin", booking });
  } catch (err) {
    console.error("cancelBooking error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.overrideCancelBooking = async (req, res) => {
  try {
    const id = getBookingIdFromParams(req.params);

    const booking = await Bookings.findById(id);
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    booking.status = "cancelled";
    await booking.save();

    await updateRoomStatusBasedOnBookings(booking.roomID);

    return res.json({ message: "Booking force-cancelled by admin", booking });
  } catch (err) {
    console.error("overrideCancelBooking error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.getBookingsByRoom = async (req, res) => {
  try {
    const { roomID } = req.params;
    const bookings = await Bookings.find({ roomID }).sort({ checkin: 1 });
    return res.json(bookings);
  } catch (err) {
    console.error("getBookingsByRoom error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

exports.getAllBookingsHistory = async (req, res) => {
  try {
    const bookings = await Bookings.find().sort({ roomID: 1, checkin: 1 });
    const formatted = bookings.map(formatBooking);
    return res.json(formatted);
  } catch (err) {
    console.error("Error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};
