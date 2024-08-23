const rateLimit = require('express-rate-limit');

//Login Limit
const SendEmailRateLimiter = rateLimit({
    windowMs: 1 * 60 * 1000,// 1 minute
    max: 10,// limit
    message: { message: "โปรดลองอีกครั้งหลังจากผ่านไป 1 นาที",status: false }
});

module.exports = SendEmailRateLimiter;