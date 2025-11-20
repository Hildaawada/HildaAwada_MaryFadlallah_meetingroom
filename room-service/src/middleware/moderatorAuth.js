module.exports = function (req, res, next) {
  if (req.user.role !== "moderator" && req.user.role !== "admin") {
    return res.status(403).json({ error: "Moderator or Admin required." });
  }
  next();
};
