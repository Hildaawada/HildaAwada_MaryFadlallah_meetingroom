// Checks if user is logged in (JWT valid)
const jwt = require("jsonwebtoken");

module.exports = function (req, res, next) {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ message: "No token" });

  const token = header.split(" ")[1];

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET); 
    next();
  } catch {
    return res.status(403).json({ message: "Invalid token" });
  }
};
