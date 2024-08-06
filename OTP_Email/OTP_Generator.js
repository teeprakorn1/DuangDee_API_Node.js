// OTP_Generator.js
function generateOTP(length = 6) {
    const charset = '0123456789';
    let otp = '';
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * charset.length);
      otp += charset[randomIndex];
    }
    return otp;
  }
  
  module.exports = generateOTP;
  