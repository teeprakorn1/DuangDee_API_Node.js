const rateLimit = require('express-rate-limit');

//Login Limit
const loginRateLimiter = rateLimit({
    windowMs: 1 * 60 * 1000,// 1 minute
    max: 5,// limit
    message: { message: "Many login attempt from this IP, Please try again after 1 minute",status: false }
});

module.exports = loginRateLimiter;