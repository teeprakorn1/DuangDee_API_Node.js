//Send OTP
require('dotenv').config();
const e = require('express');
const nodemailer = require('nodemailer');

async function sendOTPEmail(toEmail,OTP,Value) {
  let mailOptions;
  let transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  //Check From Email
  if(Value == 0){//send Password Has Reset
    mailOptions = {
      from: `"DuangDee Service" <${process.env.EMAIL_USER}>`,
      to: toEmail,
      subject: 'Your Password Has Reset',
      text: `Your Password Has Reset Email is ${toEmail}`,
      html: `<b>Your Password Has Reset Email is ${toEmail}</b>`
    };
  }else if(Value == 1){//send OTP Register
    mailOptions = {
      from: `"DuangDee Service" <${process.env.EMAIL_USER}>`,
      to: toEmail,
      subject: 'Your OTP Code',
      text: `Your OTP code is ${OTP}`,
      html: `<b>Your OTP For Register code is ${OTP}</b>`
    };
  }else if(Value == 2){//send OTP ResetPassword
    mailOptions = {
      from: `"DuangDee Service" <${process.env.EMAIL_USER}>`,
      to: toEmail,
      subject: 'Your OTP Code',
      text: `Your OTP code is ${OTP}`,
      html: `<b>Your OTP For Password Reset code is ${OTP}</b>`
    };
  }else{
    return false;
  }

  try {
    await transporter.sendMail(mailOptions);
    return true;
    
  } catch (error) {
    return false;
  }
}

module.exports = sendOTPEmail;
