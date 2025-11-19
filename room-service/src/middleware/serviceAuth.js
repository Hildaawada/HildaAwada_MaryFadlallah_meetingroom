module.exports = function (req, res, next) {
  if (req.user.role !== "service") {
    return res.status(403).json({ error: "Service account only." });
  }
  next();
};
