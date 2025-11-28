const axios = require("axios");
const breaker = require("../utils/circuitBreaker");
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

//verify that the room to be reserved is already in our room database(connected to room service) 
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


// when testing if services are connected, we noticed that bookings status for rooms is not linked
//this function is to ensure when a room is booked from this service, it will be changed in the room-service
// after testing, I noticed that the status should be like that: if blocked shows the block+date, show the upcoming nearesr booking and if available
//that's why I also change the room schema
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


//The admins can block users from booking the room even if it is available
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

//CHECK ROOM AVAILABIITY 
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
// THE USER BOOKING FN THAT ALSO TAKE INTO ACCOUNT IF THE ROOM IS BLOCKED OR ALREADY BOOKED
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

//shows users booking history
exports.getMyBookings = async (req, res,next) => {
  try {
    const username = req.user?.username;

    const bookings = await Bookings.find({ username }).sort({ checkin: 1 });
    res.json(bookings);
  } catch (err) {
    next(err);
  }
};

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
    const roomID = booking.roomID;
    await updateRoomStatusBasedOnBookings(roomID);
    res.json(booking);
  } catch (err) {
    next(err);
  }
};

exports.cancelMyBooking = async (req, res,next) => {
  try {
    const id = getBookingIdFromParams(req.params);
    const username = req.user?.username;

    const booking = await Bookings.findById(id);
    if (!booking) throw new Error("Booking not found");

    if (booking.username !== username) throw new Error("Not allowed to cancel this booking" );

    booking.status = "cancelled";
    await booking.save();

    const roomID = booking.roomID;

    await updateRoomStatusBasedOnBookings(roomID);
    res.json({ message: "Booking cancelled", booking });
  } catch (err) {
    next(err)
  }
};

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

exports.cancelBooking = async (req, res, next) => {
  try {
    const id = getBookingIdFromParams(req.params);

    const booking = await Bookings.findById(id);
    if (!booking) throw new Error("Booking not found");

    const roomID = booking.roomID; 

    booking.status = "cancelled";
    await booking.save();
    
    await updateRoomStatusBasedOnBookings(roomID);
    return res.json({ message: "Booking cancelled by admin", booking });

  } catch (err) {
    next(err);
  }
};


exports.overrideCancelBooking = async (req, res, next) => {
  try {
    const id = getBookingIdFromParams(req.params);

    const booking = await Bookings.findById(id);
    if (!booking) throw new Error("Booking not found");

    const roomID = booking.roomID; 

    booking.status = "cancelled";
    await booking.save();

    await updateRoomStatusBasedOnBookings(roomID);
    return res.json({ message: "Booking force-cancelled by admin", booking });

  } catch (err) {
    next(err);
  }
};


exports.getBookingsByRoom = async (req, res,next) => {
  try {
    const { roomID } = req.params;
    const bookings = await Bookings.find({ roomID }).sort({ checkin: 1 });
    res.json(bookings);
  } catch (err) {
    next(err);}
};

exports.getAllBookingsHistory = async (req, res,next) => {
  try {
    const bookings = await Bookings.find().sort({ roomID: 1, checkin: 1 });
    const formatted = bookings.map(formatBooking);
    res.json(formatted);
  } catch (err) {
    next(err);
  }
};


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
