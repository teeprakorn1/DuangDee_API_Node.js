const rateLimit = require('express-rate-limit');

//Login Limit
const loginRateLimiter = rateLimit({
    windowMs: 1 * 60 * 1000,// 1 minute
    max: 5,// limit
    message: { message: "โปรดลองอีกครั้งหลังจากผ่านไป 1 นาที",login_status: false ,status: false }
});

module.exports = loginRateLimiter;