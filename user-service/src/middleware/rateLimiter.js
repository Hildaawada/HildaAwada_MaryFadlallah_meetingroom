const rateLimit = require("express-rate-limit");

const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per window
    message: {
        status: 429,
        message: "Too many requests. Please try again later."
    },
    standardHeaders: true,
    legacyHeaders: false
});
const loginLimiter = rateLimit({
    windowMs: 60 * 1000, 
    max: 5,
    message: { error: "Too many failed login attempts. Try again in 1 minute." }
});

module.exports = { apiLimiter, loginLimiter };


