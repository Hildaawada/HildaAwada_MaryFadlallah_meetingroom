const Bookings = require("../models/Booking");

// this is to handle both :bookingID and :bookingId 
function getBookingIdFromParams(params) {
  return params.bookingID || params.bookingId;
}


exports.createBooking = async (req, res) => {
  try {
    const { roomID, checkin, checkout } = req.body;
    const username = req.user?.username; 

    if (!roomID || !checkin || !checkout) {
      return res
        .status(400)
        .json({ message: "roomId, checkin and checkout dates are required" });
    }

    if (!username) {
      return res
        .status(401)
        .json({ message: "User info missing" });
    }

    const start = new Date(checkin);
    const end = new Date(checkout);

    if (isNaN(start) || isNaN(end) || start >= end) {
      return res.status(400).json({ message: "Invalid time range" });
    }

    // Check for booking conflicts
    const conflict = await Bookings.findOne({
      roomID,
      checkin: { $lt: end },
      checkout: { $gt: start },
      status: "confirmed",
    });

    if (conflict) {
      return res
        .status(409)
        .json({ message: "This room is already booked for this time slot" });
    }

    const booking = await Bookings.create({
      username,
      roomID,
      checkin: start,
      checkout: end,
      status: "confirmed",
    });

    return res.status(201).json(booking);
  } catch (err) {
    console.error("createBooking error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};


exports.checkforAvailability = async (req, res) => {
  try {
    const { roomID, checkin, checkout } = req.query;

    if (!roomID|| !checkin || !checkout) {
      return res
        .status(400)
        .json({ message: "roomId, checkin and checkout dates are required" });
    }

    const start = new Date(checkin);
    const end = new Date(checkout);

    if (isNaN(start) || isNaN(end) || start >= end) {
      return res.status(400).json({ message: "Invalid time range" });
    }

    const conflict = await Bookings.findOne({
      roomID,
      checkin: { $lt: end },
      checkout: { $gt: start },
      status: "confirmed",
    });

    const available = !conflict;
    res.json({ roomID, available });
  } catch (err) {
    console.error("checkforAvailability error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};


exports.getMyBookings = async (req, res) => {
  try {
    const username = req.user?.username;
    if (!username) {
      return res
        .status(401)
        .json({ message: "User info missing" });
    }

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
      return res.status(403).json({ message: "Not allowed to update this booking" });
    }

    if (checkin) booking.checkin = new Date(checkin);
    if (checkout) booking.checkout = new Date(checkout);

    if (booking.checkin >= booking.checkout) {
      return res.status(400).json({ message: "Invalid time range" });
    }


    await booking.save();
    res.json(booking);
  } catch (err) {
    console.error("updateMyBooking error:", err);
    res.status(500).json({ message: "Internal server error" });
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

    res.json({ message: "Booking cancelled", booking });
  } catch (err) {
    console.error("cancel My Booking error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};


exports.getAllBookings = async (req, res) => {
  try {
    const bookings = await Bookings.find().sort({ checkin: 1 });
    res.json(bookings);
  } catch (err) {
    console.error("get All Bookings error:", err);
    res.status(500).json({ message: "Internal server error" });
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
    res.json(booking);
  } catch (err) {
    console.error("update Booking error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};


exports.cancelBooking = async (req, res) => {
  try {
    const id = getBookingIdFromParams(req.params);

    const booking = await Bookings.findById(id);
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    booking.status = "cancelled";
    await booking.save();

    res.json({ message: "Booking cancelled by admin", booking });
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

    res.json({ message: "Booking force-cancelled by admin", booking });
  } catch (err) {
    console.error("overrideCancelBooking error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};


exports.getBookingsByRoom = async (req, res) => {
  try {
    const { roomID} = req.params;
    const bookings = await Bookings.find({ roomID }).sort({ checkin: 1 });
    res.json(bookings);
  } catch (err) {
    console.error("getBookingsByRoom error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};
