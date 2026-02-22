// Allows internal service accounts only
module.exports = function (req, res, next) {
  if (req.user.role !== "service")
    return res.status(403).json({ message: "This is for Service accounts only" });

  next();
};
