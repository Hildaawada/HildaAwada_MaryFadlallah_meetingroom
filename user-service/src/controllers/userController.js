const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");


// REGISTER USER

exports.register = async (req, res) => {
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

    res.status(201).json({
      message: "User registered successfully",
      user
    });

  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};


// LOGIN USER

exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = await User.findOne({ username });
    if (!user)
      return res.status(404).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(401).json({ message: "Incorrect password" });

    // Generate JWT token
    const token = jwt.sign(
      {
        id: user._id,
        username: user.username,
        role: user.role
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({
      message: "Login successful",
      token,
      role: user.role
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


// GET ALL USERS (ADMIN, MANAGER, AUDITOR)

exports.getAllUsers = async (req, res) => {
  const users = await User.find();
  res.json(users);
};


// GET SPECIFIC USER BY USERNAME

exports.getUserByUsername = async (req, res) => {
  const user = await User.findOne({ username: req.params.username });
  res.json(user);
};

//UPDATE USER (SELF, ADMIN, MANAGER)

exports.updateUser = async (req, res) => {

  if (req.body.password) {
    req.body.password = await bcrypt.hash(req.body.password, 10);
  }

  const updatedUser = await User.findOneAndUpdate(
    { username: req.params.username },
    req.body,
    { new: true }
  );

  res.json({
    message: "User updated successfully",
    updatedUser
  });
};


// DELETE USER (ADMIN ONLY)

exports.deleteUser = async (req, res) => {
  await User.deleteOne({ username: req.params.username });

  res.json({
    message: "User deleted successfully"
  });
};


// USER BOOKING HISTORY (PLACEHOLDER)
// Will be implemented when Bookings Service is ready

exports.getUserBookingHistory = async (req, res) => {
  res.json({
    message: "Booking history placeholder. Will fetch from Bookings Service later.",
    username: req.params.username
  });
};
