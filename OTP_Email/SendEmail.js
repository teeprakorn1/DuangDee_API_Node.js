// sendEmail.js
require('dotenv').config();
const nodemailer = require('nodemailer');

async function sendOTPEmail(toEmail,OTP) {
  let transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  let mailOptions = {
    from: `"DuangDee Service" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: 'Your OTP Code',
    text: `Your OTP code is ${OTP}`,
    html: `<b>Your OTP code is ${OTP}</b>`
  };

  try {
    let info = await transporter.sendMail(mailOptions);
    console.log('Message sent: %s', info.messageId);
  } catch (error) {
    console.error('Error sending email:', error);
  }
}

module.exports = sendOTPEmail;
