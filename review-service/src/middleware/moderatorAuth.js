// Allows admin or moderator
module.exports = function (req, res, next) {
  if (req.user.role !== "moderator" && req.user.role !== "admin")
    return res.status(403).json({ message: "This is for Moderators only" });

  next();
};
