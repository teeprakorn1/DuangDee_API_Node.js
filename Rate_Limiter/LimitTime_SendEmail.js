const rateLimit = require('express-rate-limit');

//Login Limit
const SendEmailRateLimiter = rateLimit({
    windowMs: 1 * 60 * 1000,// 1 minute
    max: 10,// limit
    message: { message: "Many send email attempt from this IP, Please try again after 1 minute",status: false }
});

module.exports = SendEmailRateLimiter;