// Allows admin or auditor (read-only role)
module.exports = function (req, res, next) {
  if (req.user.role !== "auditor" && req.user.role !== "admin")
    return res.status(403).json({ message: "Auditors only" });

  next();
};
