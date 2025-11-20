module.exports = function (req, res, next) {
  if (req.user.role !== "manager" && req.user.role !== "admin") {
    return res.status(403).json({ error: "Manager or Admin required." });
  }
  next();
};
