// Allows internal service accounts only
module.exports = function (req, res, next) {
  if (req.user.role !== "service")
    return res.status(403).json({ message: "Service accounts only" });

  next();
};
