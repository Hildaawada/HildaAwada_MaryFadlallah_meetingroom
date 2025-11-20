module.exports = function (req, res, next) {
  if (
    req.user.role !== "auditor" &&
    req.user.role !== "admin" &&
    req.user.role !== "manager"
  ) {
    return res.status(403).json({ error: "Auditor/Read-only role required." });
  }
  next();
};
