// Allows admin or manager
module.exports = function (req, res, next) {
  if (req.user.role !== "manager" && req.user.role !== "admin")
    return res.status(403).json({ message: "Managers only" });

  next();
};
