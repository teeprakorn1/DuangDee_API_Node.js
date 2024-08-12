const rateLimit = require('express-rate-limit');

//Login Limit
const loginRateLimiter = rateLimit({
    windowMs: 1 * 60 * 1000,// 1 minute
    max: 5,// limit
    message: { message: "Many Login",status: false }
});

module.exports = loginRateLimiter;