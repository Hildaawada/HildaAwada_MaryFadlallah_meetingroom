const logger = require("../utils/logger");//take to the path of the logger.js

function logMiddleware(req, res, next) {
  const start = Date.now();

  res.on("finish", () => {
    const duration = Date.now() - start;

    logger.info({
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      responseTime: duration + "ms",
      user: req.user?.username || "anonymous"
    });
  });

  next();
}

module.exports = logMiddleware;
