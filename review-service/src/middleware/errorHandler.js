//Task2_7
function errorHandler(err, req, res, next) {
  console.error("GLOBAL ERROR:", err);

  const status = err.status || 500;

  res.status(status).json({
    success: false,
    error: err.message || "Internal Server Error",
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined
  });
}

module.exports = errorHandler;
