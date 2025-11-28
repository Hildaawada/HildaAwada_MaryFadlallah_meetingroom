/**
 * @module BookingsController
 * @description
 * Manages all operations related to meeting room reservations, including:
 *
 *  - Standard user bookings
 *  - Date-conflict validation
 *  - Automatic room state synchronization with Room Service
 *  - Admin/Manager forced blocks & unblocks
 *  - Circuit breaker protected service-to-service communication
 *  - User and room based filtering
 *
 * This controller is critical in the microservices architecture:
 * it is the only service allowed to modify room status through
 * internal authenticated service calls.
 */

const axios = require("axios");
const breaker = require("../utils/circuitBreaker");
const Bookings = require("../models/Booking");

/**
 * @function getBookingIdFromParams
 * @description
 * Support both `bookingID` and `bookingId` parameter variations.(avoid unwanted errors) 
 */
function getBookingIdFromParams(params) {
  return params.bookingID || params.bookingId;
}

/**
 * @function formatBooking
 * @description
 * Normalizes display format for consistent API responses.
 *
 */

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
/**
 * @function verifyRoomExists
 * @description
 * Validates a roomID by calling the Room Service internally.
 *
 * This function uses the **circuit breaker**, ensuring:
 *  - immediate fallback when Room Service is overloaded
 *  - protection of this service from cascading failures
 *
 */
async function verifyRoomExists(roomID) {
  try {
    const response = await breaker.fire({
      method: "GET",
      url: `${process.env.ROOM_SERVICE_URL}/internal/${String(roomID)}`,
      headers: { "x-service-key": process.env.SERVICE_KEY }
    });

    // Circuit breaker fallback:
    if (response.fallback === true) {
      return { exists: false, error: response.message, breaker: true };
    }

    return { exists: response.data.exists === true, breaker: false };

  } catch (err) {
    return { exists: false, error: err.message, breaker: true };
  }
}
/**
 * @function updateRoomStatusBasedOnBookings
 * @description
 * Updates a room’s status in the Room Service based on:
 *  - Upcoming confirmed bookings  
 *  - Automatic cleanup of expired bookings  
 *  - Default fallback => "available"
 *
 * This method is executed:
 *  - after bookings  
 *  - after block/unblock  
 *  - after booking cancel  
 *
 * @param {String} roomID  
 */

async function updateRoomStatusBasedOnBookings(roomID) {
  try {
    const now = new Date();

    await Bookings.deleteMany({
      roomID,
      checkout: { $lt: now }
    });

    const blocked = await Bookings.findOne({
      roomID,
      BlockBooking: true,
      status: "confirmed",
      checkout: { $gt: now }
    }).sort({ checkin: 1 });

    if (blocked) {
      const range = `from ${blocked.checkin.toISOString()} to ${blocked.checkout.toISOString()}`;
      const statusText = `out-of-service (${range})`;

      await axios.patch(
        `${process.env.ROOM_SERVICE_URL}/internal/${roomID}/status`,
        { status: statusText },
        {
          headers: { "x-service-key": process.env.SERVICE_KEY }
        }
      );
      return;
    }

    const nextBooking = await Bookings.findOne({
      roomID,
      BlockBooking: false,
      status: "confirmed",
      checkout: { $gt: now }
    }).sort({ checkin: 1 });

    if (nextBooking) {
      const range = `from ${nextBooking.checkin.toISOString()} to ${nextBooking.checkout.toISOString()}`;
      const statusText = `booked (${range})`;

      await axios.patch(
        `${process.env.ROOM_SERVICE_URL}/internal/${roomID}/status`,
        { status: statusText },
        {
          headers: { "x-service-key": process.env.SERVICE_KEY }
        }
      );
      return;
    }

    await axios.patch(
      `${process.env.ROOM_SERVICE_URL}/internal/${roomID}/status`,
      { status: "available" },
      {
        headers: { "x-service-key": process.env.SERVICE_KEY }
      }
    );
  } catch (err) {
    console.error("Error:", err.message);
  }
}

/**
 * @function blockRoom
 * @description
 * Admin/Manager-only feature to block a room for a specific time range.
 * A block is treated as a booking but marked with BlockBooking: true.
 *
 */


exports.blockRoom = async (req, res,next) => {
  try {
    const { roomID, checkin, checkout, blockReason } = req.body;

    if (!roomID || !checkin || !checkout) 
      throw new Error("roomID, checkin, checkout are required");

    const start = new Date(checkin);
    const end = new Date(checkout);

    if (isNaN(start) || isNaN(end) || start >= end) 
        throw new Error("Invalid time range");

    

  async function verifyRoomExists(roomID) {
  try {
    const response = await breaker.fire({
      method: "GET",
      url: `${process.env.ROOM_SERVICE_URL}/internal/${String(roomID)}`,
      headers: { "x-service-key": process.env.SERVICE_KEY }
    });

    // If fallback returned:
    if (response.fallback === true) {
      return { exists: false, error: response.message, breaker: true };
    }

    return { exists: response.data.exists === true, breaker: false };

  } catch (err) {
    return { exists: false, error: err.message, breaker: true };
  }
}

    const overlapping = await Bookings.findOne({
      roomID,
      status: { $ne: "cancelled" },
      checkin: { $lt: end },
      checkout: { $gt: start }
    });

    if (overlapping) throw new Error("Cannot block: room already booked/blocked");

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
    res.status(201).json({ message: "Room blocked", block });
      } catch (err) {
        next(err);
      }
    };

/**
 * @function unblockRoom
 * @description
 * Removes an existing admin block and restores room state.
 *
 * @param {String} blockID.params.required  
 */
exports.unblockRoom = async (req, res,next) => {
  try {
    const { blockID } = req.params;

    if (!blockID) throw new Error("blockID required");


    const block = await Bookings.findById(blockID);
    if (!block || !block.BlockBooking) throw new Error("This block does not exist");

    const roomID = block.roomID;

    await Bookings.findByIdAndDelete(blockID);

    await updateRoomStatusBasedOnBookings(roomID);// TO CHANGE IT IN THE ROOMS DATABASE

    return res.json({ message: "The block is removed successfully" });
  } catch (err) {
    next(err);
  }
};

/**
 * @function checkforAvailability
 * @description
 * Check whether a room is available for a given time range.
 *
 * It uses circuit breaker fallback.
 *
 * @query {String} roomID  
 * @query {Date} checkin  
 * @query {Date} checkout  
 */
exports.checkforAvailability = async (req, res,next) => {
  try {
    const { roomID, checkin, checkout } = req.query;

    if (!roomID || !checkin || !checkout)  throw new Error("roomID, checkin, checkout required");

   const result = await verifyRoomExists(roomID);

if (!result.exists) {
  return res.status(500).json({
    success: false,
    error: result.breaker ? result.error : "This room does not exist"
  });
}

    const start = new Date(checkin);
    const end = new Date(checkout);

    if (isNaN(start) || isNaN(end) || start >= end) throw new Error("Invalid time range");

    const conflict = await Bookings.findOne({
      roomID,
      status: { $ne: "cancelled" },
      checkin: { $lt: end },
      checkout: { $gt: start }
    });
    
    res.json({
      roomID,
      available: !conflict,
      conflict: conflict || null
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @function createBooking
 * @description
 * Creates a standard user booking after checking conflicts(room already booked or blocked).
 * Note:  
 * Admin blocks override user bookings, but user bookings cannot override blocks.

 */
exports.createBooking = async (req, res,next) => {
  try {
    const { roomID, checkin, checkout } = req.body;
    const username = req.user?.username;

    if (!roomID || !checkin || !checkout) throw new Error("roomID, checkin and checkout dates are required");

    if (!username)throw new Error("Error, the username is missing");


    const exists = await verifyRoomExists(roomID);//IMPORTANT
    if (!exists) throw new Error("This room does not exist");

    const start = new Date(checkin);
    const end = new Date(checkout);

    if (isNaN(start) || isNaN(end) || start >= end) throw new Error("Invalid time range");

    const conflict = await Bookings.findOne({
      roomID,
      status: { $ne: "cancelled" },
      checkin: { $lt: end },
      checkout: { $gt: start },
    });

    if (conflict) 
        throw new Error(conflict.BlockBooking ?
        "Room blocked" : "Room already booked");

    const booking = await Bookings.create({
      username,
      roomID,
      checkin: start,
      checkout: end,
      status: "confirmed",
      BlockBooking: false,
    });
    await updateRoomStatusBasedOnBookings(roomID);
    res.status(201).json(booking);
  } catch (err) {
    next(err);
  }
};

/**
 * @function getMyBookings
 * @description
 * Fetch users booking history
 */

exports.getMyBookings = async (req, res,next) => {
  try {
    const username = req.user?.username;

    const bookings = await Bookings.find({ username }).sort({ checkin: 1 });
    res.json(bookings);
  } catch (err) {
    next(err);
  }
};

/**
 * @function updateMyBooking
 * @description
 * This is to allow users to modify their own bookings if the new time slot is valid.
 *
 * @param {String} bookingID.params.required  
 */

exports.updateMyBooking = async (req, res,next) => {
  try {
    const id = getBookingIdFromParams(req.params);
    const username = req.user?.username;
    const { checkin, checkout } = req.body;

    const booking = await Bookings.findById(id);
    if (!booking) throw new Error("Booking not found");

    if (booking.username !== username) 
     throw new Error("Error! you can only update your bookings");

    if (checkin) booking.checkin = new Date(checkin);
    if (checkout) booking.checkout = new Date(checkout);

    if (isNaN(booking.checkin) || isNaN(booking.checkout)) {
      return res.status(400).json({ message: "Invalid time format" });
    }

    if (booking.checkin >= booking.checkout) throw new Error("Invalid time range");



    const conflict = await Bookings.findOne({
      _id: { $ne: booking._id },
      roomID: booking.roomID,
      status: { $ne: "cancelled" },
      checkin: { $lt: booking.checkout },
      checkout: { $gt: booking.checkin },
    });

    if (conflict) throw new Error("This new time is not available for booking");

    await booking.save();
    await updateRoomStatusBasedOnBookings(roomID);
    res.json(booking);
  } catch (err) {
    next(err);
  }
};

/**
 * @function cancelMyBooking
 * @description
 * Allows users to cancel their own bookings.
 *
 * @param {String} bookingID.params.required  
 */

exports.cancelMyBooking = async (req, res,next) => {
  try {
    const id = getBookingIdFromParams(req.params);
    const username = req.user?.username;

    const booking = await Bookings.findById(id);
    if (!booking) throw new Error("Booking not found");

    if (booking.username !== username) throw new Error("Not allowed to cancel this booking" );

    booking.status = "cancelled";
    await booking.save();

    await updateRoomStatusBasedOnBookings(roomID);
    res.json({ message: "Booking cancelled", booking });
  } catch (err) {
    next(err)
  }
};
/**
 * @function getAllBookings
 * @description
 * Admin/Manager/Auditor function: retrieves all **active** bookings.
 */

exports.getAllBookings = async (req, res,next) => {
  try {
    const bookings = await Bookings.find({
      status: { $ne: "cancelled" }
    }).sort({ roomID: 1, checkin: 1 });

    const formatted = bookings.map(formatBooking);
    res.json(formatted);
  } catch (err) {
    next(err);
  }
};


/**
 * @function updateBooking
 * @description
 * Admin-only modification of any booking.
 */

exports.updateBooking = async (req, res,next) => {
  try {
    const id = getBookingIdFromParams(req.params);
    const { checkin, checkout, status } = req.body;

    const booking = await Bookings.findById(id);
    if (!booking) throw new Error("Booking not found");

    if (checkin) booking.checkin = new Date(checkin);
    if (checkout) booking.checkout = new Date(checkout);
    if (status) booking.status = status;

    await booking.save();
    await updateRoomStatusBasedOnBookings(roomID);
    res.json(booking);
  } catch (err) {
    next(err);
  }
};

/**
 * @function cancelBooking
 * @description
 * Admin cancellation of any user's booking.
 */

exports.cancelBooking = async (req, res, next) => {
  try {
    const id = getBookingIdFromParams(req.params);

    const booking = await Bookings.findById(id);
    if (!booking) throw new Error("Booking not found");

    const roomID = booking.roomID; // FIXED

    booking.status = "cancelled";
    await booking.save();

    await updateRoomStatusBasedOnBookings(roomID);
    return res.json({ message: "Booking cancelled by admin", booking });

  } catch (err) {
    next(err);
  }
};

/**
 * @function overrideCancelBooking
 * @description
 * Force-cancels a booking regardless of current state.
 */

exports.overrideCancelBooking = async (req, res, next) => {
  try {
    const id = getBookingIdFromParams(req.params);

    const booking = await Bookings.findById(id);
    if (!booking) throw new Error("Booking not found");

    const roomID = booking.roomID; // FIXED

    booking.status = "cancelled";
    await booking.save();

    await updateRoomStatusBasedOnBookings(roomID);
    return res.json({ message: "Booking force-cancelled by admin", booking });

  } catch (err) {
    next(err);
  }
};

/**
 * @function getBookingsByRoom
 * @description
 * View the booking history of a specific room (admins only).
 *
 * @param {String} roomID.params.required  
 */

exports.getBookingsByRoom = async (req, res,next) => {
  try {
    const { roomID } = req.params;
    const bookings = await Bookings.find({ roomID }).sort({ checkin: 1 });
    res.json(bookings);
  } catch (err) {
    next(err);}
};
/**
 * @function getAllBookingsHistory
 * @description
 * Returns **all bookings**, including cancelled ones.(only specific user roles are allowed to use it)
 * Designed for auditing.
 */

exports.getAllBookingsHistory = async (req, res,next) => {
  try {
    const bookings = await Bookings.find().sort({ roomID: 1, checkin: 1 });
    const formatted = bookings.map(formatBooking);
    res.json(formatted);
  } catch (err) {
    next(err);
  }
};

/**
 * @function getBookingsByUser
 * @description
 * Fetch booking history for a specific user.
 *
 * @param {String} username.params.required  
 */

exports.getBookingsByUser = async (req, res) => {
  try {
    const { username } = req.params;

    const bookings = await Bookings.find({ username }).sort({ checkin: 1 });

    return res.json(bookings);

  } catch (err) {
    console.error("getBookingsByUser error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};
