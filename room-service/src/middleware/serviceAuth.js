module.exports = (req, res, next) => {
  const key = req.headers["x-service-key"];

  if (!key || key !== process.env.SERVICE_KEY) {
    return res.status(401).json({ message: "Unauthorized service" });
  }

  next();
};
