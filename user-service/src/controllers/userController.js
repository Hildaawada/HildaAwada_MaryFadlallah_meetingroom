const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const axios = require("axios");

// REGISTER USER
exports.register = async (req, res, next) => {
  try {
    const { name, username, email, password, role } = req.body;

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      username,
      email,
      password: hashedPassword,
      role
    });

    return res.status(201).json({
      success: true,
      message: "User registered successfully",
      user
    });

  } catch (err) {
    next(err);  // Send error to global handler
  }
};


// LOGIN USER
exports.login = async (req, res, next) => {
  try {
    const { username, password } = req.body;

    const user = await User.findOne({ username });
    if (!user) {
      const error = new Error("User not found");
      error.statusCode = 404;
      throw error;
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      const error = new Error("Incorrect password");
      error.statusCode = 401;
      throw error;
    }

    const token = jwt.sign(
      {
        id: user._id,
        username: user.username,
        role: user.role
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    return res.json({
      success: true,
      message: "Login successful",
      token,
      role: user.role
    });

  } catch (err) {
    next(err);
  }
};


// GET ALL USERS
exports.getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find();
    return res.json({ success: true, users });
  } catch (err) {
    next(err);
  }
};


// GET USER BY USERNAME
exports.getUserByUsername = async (req, res, next) => {
  try {
    const user = await User.findOne({ username: req.params.username });

    if (!user) {
      const error = new Error("User not found");
      error.statusCode = 404;
      throw error;
    }

    return res.json({ success: true, user });

  } catch (err) {
    next(err);
  }
};


// UPDATE USER
exports.updateUser = async (req, res, next) => {
  try {
    if (req.body.password) {
      req.body.password = await bcrypt.hash(req.body.password, 10);
    }

    const updatedUser = await User.findOneAndUpdate(
      { username: req.params.username },
      req.body,
      { new: true }
    );

    if (!updatedUser) {
      const error = new Error("User not found");
      error.statusCode = 404;
      throw error;
    }

    return res.json({
      success: true,
      message: "User updated successfully",
      updatedUser
    });

  } catch (err) {
    next(err);
  }
};


// DELETE USER
exports.deleteUser = async (req, res, next) => {
  try {
    const result = await User.deleteOne({ username: req.params.username });

    if (result.deletedCount === 0) {
      const error = new Error("User not found");
      error.statusCode = 404;
      throw error;
    }

    return res.json({
      success: true,
      message: "User deleted successfully"
    });

  } catch (err) {
    next(err);
  }
};


// USER BOOKING HISTORY
exports.getUserBookingHistory = async (req, res) => {
  try {
    const username = req.params.username;

    const response = await axios.get(
      `http://localhost:5003/api/bookings/history/user/${username}`,
      {
        headers: { Authorization: req.headers.authorization }
      }
    );

    return res.json({
      username,
      bookings: response.data
    });

  } catch (err) {
    console.error("Error fetching booking history:", err.toString());

    return res.status(500).json({
      error: "Failed to fetch booking history from bookings-service"
    });
  }
};