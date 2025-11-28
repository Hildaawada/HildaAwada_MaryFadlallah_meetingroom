/**
 * @module UserController
 * @description
 * User Service Controller  
 * Handles all operations related to user authentication, authorization,
 * profile management, and booking history retrieval.
 *
 * This module provides:
 *  - User registration  
 *  - User login  
 *  - Update user profile 
 *  - Delete user accounts  
 *  - Retrieve all users (only admins)  
 *  - Retrieve specific users (only admins)  
 *  - Fetch booking history from Bookings Service (only admins) 
 *
 * All endpoints return standardized JSON responses and propagate
 * errors to the global error handler.
 */


const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const axios = require("axios");



/**
 * @function register
 * @description
 * Register a new user in the system and return a newly created user record.  
 *
 *To register, the following information are required: 
 * @param {String} name.body.required - Full name of the user and it must be unique
 * @param {String} email.body.required - Email address  
 * @param {String} password.body.required - Password (it will be hashed when saved)  
 * @param {String} role.body.optional - User role (default: "user")
 * @example
 * {
 *  "name": "Mary Fadlallah",
 *  "username": "mary_fad",
 *  "email": "mary@gmail.com",
 *  "password": "Finallygraduated2025"
 * }
 */


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


/**
 * @function login
 * @description
 * Authenticate a user and return a token.
 *
 * @param {String} username.body.required - Username of the user  
 * @param {String} password.body.required - password  
 *
 * @example
 * {
 *   "username": "mary_fad",
 *   "password": "Finallygraduated2025"
 * }
 */


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

/**
 * @function getAllUsers
 * @description
 * Retrieve a list of all users in the system for the admin review (&auditing purposes...).
 *
 */




exports.getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find();
    return res.json({ success: true, users });
  } catch (err) {
    next(err);
  }
};

/**
 * @function getUserByUsername
 * @description
 * Fetch user details by username.
 * 
 * @param {String} username.params.required - Username to search for  
 */



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


/**
 * @function updateUser
 * @description
 * Update user information. 
 *
 * @param {String} username.params.required - Username of the user  
 * Note that passwords are re-hashed before saving.
 */



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

/**
 * @function deleteUser
 * @description
 * Remove a user account from the system.
 *
 * @returns Success deletion message or an error message.  
 */


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

/**
 * @function getUserBookingHistory
 * @description
 * By connecting to the bookings service, this function retrieves booking history for a specific user.
 * @returns List of bookings belonging to the user or an error. 
 */


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




