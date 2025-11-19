// Allows only admin
module.exports = function (req, res, next) {
  if (req.user.role !== "admin")
    return res.status(403).json({ message: "This is for Admins only" });

  next();
};
