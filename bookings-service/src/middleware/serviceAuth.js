module.exports = (req, res, next) => {
  const key = req.headers["x-service-key"];//this is to allow inter-service communication when merged together

  if (!key || key !== process.env.SERVICE_KEY) {
    return res.status(401).json({ message: "Unauthorized service" });
  }

  next();
};
