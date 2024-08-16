const express = require('express')
const mysql = require('mysql2')
const bcrypt = require('bcrypt')
const loginRateLimiter = require('./Rate_Limiter/Limit_Time');
const OTP_Timelimiter = require('./OTP_Email/OTP_Timelimiter');
const generateOTP = require('./OTP_Email/OTP_Generator');
const sendOTPEmail = require('./OTP_Email/SendEmail');
const GenerateTokens = require('./Jwt_Tokens/Tokens_Generator');
const VerifyTokens = require('./Jwt_Tokens/Tokens_Verification');
const GoogleIdentity = require('./OAuth_Firebase/Google_Verify_Identity');
const app = express()

require('dotenv').config();

const db = mysql.createConnection(
  {
    host: process.env.DATABASE_HOST,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASS,
    database: process.env.DATABASE_NAME,
  }
);

db.connect();
app.use(express.json());
app.use(express.urlencoded({extended: true}));
const saltRounds = process.env.HASHING_ROUND;

let otpStorage_Resets = {};
let otpStorage_Register = {};

//Hello World API
app.post('/api/hello',VerifyTokens, function(req, res){
  res.send({
    users_decoded:req.users_decoded,
    message: 'Hello World!',
    status: true
  });
});

//API Register General
app.post('/api/register', async (req, res) => {
  const { Users_Email,Users_Username, Users_Password} = req.body;

  if (!Users_Email || !Users_Username || !Users_Password ) {
    return res.send({ message: 'Fill in the parameter data correctly as specified.', status: false });
  }

  const sql_check_username = "SELECT COUNT(*) AS count FROM Users WHERE Users_Username = ? OR Users_Email = ?";
  db.query(sql_check_username, [Users_Username,Users_Email], async (err, result) => {
    if (err) throw err;

    if (result[0].count > 0) {
      res.send({ message: "Username or Email already exists",status: false });
    }else{
      const NewPassword = await bcrypt.hash(Users_Password, saltRounds);

      const sql = "INSERT INTO Users (Users_Email,Users_Username,Users_DisplayName,Users_Password)VALUES(?,?,?,?)";

      db.query(sql, [Users_Email, Users_Username, Users_Username, NewPassword], (err) => {
        if (err) throw err;

        res.send({ message: "User registered successfully",status: true });

      });
    }
  });
});

//API Login General
app.post('/api/login',loginRateLimiter, async (req, res) => {
  const { Users_Username, Users_Password } = req.body;

  if (!Users_Username || !Users_Password) {
    return res.send({ message: 'Username and Password are required', status: false });
  }

  const sql_check_username = "SELECT COUNT(*) AS count FROM Users WHERE Users_Username = ? OR Users_Email = ? AND Users_IsActive = 1";
  db.query(sql_check_username, [Users_Username,Users_Username], async (err, result) => {
  if (err) throw err;

    if (result[0].count > 0) {
      const sql_get_password = "SELECT Users_Password FROM Users WHERE Users_Username = ? OR Users_Email = ? AND Users_IsActive = 1";
      db.query(sql_get_password, [Users_Username,Users_Username], async (err, result) => {
        if (err) throw err;
        
        const isCorrect = await bcrypt.compare(Users_Password, result[0].Users_Password);
        if (isCorrect) {
          const sql = "SELECT * FROM Users WHERE Users_Username = ? OR Users_Email = ? AND Users_IsActive = 1";
          db.query(sql, [Users_Username,Users_Username], async (err, result) => {
            if (err) throw err;

            const user = result[0];
            const Tokens = GenerateTokens(user.Users_ID, user.Users_Username,user.Users_DisplayName, 1);

            user['Token'] = Tokens;
            user['message'] = "Password Is Success"
            user['status'] = true
            res.send(user);
          });
        } else {
          res.send({ message: "Incorrect password",status: false });
        }
      });
    } else {
      res.send({ message: "User not found",status: false });
    }
  });
});

//API Send OTP
app.post('/api/send-otp', async (req, res) => {
  const { Users_Email } = req.body;
  
  if (!Users_Email) {
    return res.send({ message:'Email is required',status: false });
  }

  const currentOTP = generateOTP();
  otpStorage_Register[Users_Email] = {
    otp: currentOTP,
    timestamp: Date.now()
  };

  try {
    await sendOTPEmail(Users_Email, currentOTP);
    res.send({ message:'OTP sent successfully to ' + Users_Email,status: true });
  } catch (error) {
    res.send({ message:'Failed to send OTP',status: false });
  }
});

//API Verify OTP
app.post('/api/verify-otp', (req, res) => {
  const { Users_Email, OTP } = req.body;
  const OTP_Check = OTP_Timelimiter(otpStorage_Register,Users_Email);

  if (!Users_Email || !OTP) {
    return res.send({ message: 'Email and OTP are required', status: false });
  }

  if(!OTP_Check){
    return res.send({ message:'No OTP found for this email',status: false });
  }

  if (OTP_Check == -1) {
    delete otpStorage_Register[Users_Email];
    return res.send({ message:'OTP Expired',status: false });
  }

  if (OTP_Check == OTP) {
    delete otpStorage_Register[Users_Email];
    res.send({ message:'OTP Verified Successfully',status: true });
  } else {
    res.send({ message:'Invalid OTP',status: false });
  }
});

//API Request Password
app.post('/api/request-password', async (req, res) => {
  const { Users_Email}  = req.body;
  if (!Users_Email) {
    return res.send({ message: 'Email is required', status: false });
  }

  const sql_check_email = "SELECT COUNT(*) AS count FROM Users WHERE Users_Email = ?";
  db.query(sql_check_email, [Users_Email], async (err, result) => {
  if (err) throw err;

    if (result[0].count > 0) {
      const currentOTP = generateOTP();
      otpStorage_Resets[Users_Email] = {
        otp: currentOTP,
        timestamp: Date.now()
      };

      try {
        await sendOTPEmail(Users_Email, currentOTP);
        res.send({ message:'OTP sent successfully to ' + Users_Email,status: true });
      } catch (error) {
        res.send({ message:'Failed to send OTP',status: false });
      }
    }else{
      res.send({ message: "It Email not Register",status: false });
    }
  });
});

//API Reset Password
app.post('/api/reset-password', async (req, res) => {
  const { Users_Email, Users_Password, OTP } = req.body;
  const OTP_Check = OTP_Timelimiter(otpStorage_Resets,Users_Email);

  if (!Users_Email || !Users_Password || !OTP) {
    return res.send({ message: 'Email and Password and OTP are required', status: false });
  }

  if(!OTP_Check){
    return res.send({ message:'No OTP found for this email',status: false });
  }

  if (OTP_Check == -1) {
    delete otpStorage_Resets[Users_Email];
    return res.send({ message:'OTP Expired',status: false });
  }

  if (OTP_Check == OTP) {
    delete otpStorage_Resets[Users_Email];

    const NewPassword = await bcrypt.hash(Users_Password, saltRounds);

    const sql = "UPDATE Users SET Users_Password = ? WHERE Users_Email = ?";
    db.query(sql, [NewPassword,Users_Email], async (err) => {
      if (err) throw err;
      res.send({ message:'Password Reset Successfully',status: true });
    });
  }else{
    res.send({ message:'Invalid OTP',status: false });
  }
});

//API Add Admin 
app.post('/api/admin-add', async (req, res) => {
  const {  Users_Email, Users_Username, Users_Password } = req.body;

  const NewPassword = await bcrypt.hash(Users_Password ,saltRounds);
  const sql = "INSERT INTO Users (Users_Email,Users_Username,Users_DisplayName,Users_Password)VALUES(?,?,?,?)";
  db.query(sql, [Users_Email, Users_Username, Users_Username, NewPassword], async(err) => {
    if (err) throw err;
    res.send({ message: "User registered successfully",status: true });
  });
});

// API Check Firebase UID
app.post('/api/check-uid', async (req, res) => {
  const { Users_Google_Uid } = req.body;

  if (!Users_Google_Uid) {
    return res.send({ message: 'UID is required', status: false });
  }

  const Uid_Storage = await GoogleIdentity(Users_Google_Uid);

  if (!Uid_Storage) {
    return res.send({ message: 'UID is invalid or User not found', status: false });
  }

  if (Uid_Storage) {
    res.send({ 
      uid: Uid_Storage.uid,
      email: Uid_Storage.email,
      displayName: Uid_Storage.displayName,
      message: 'UID is valid', status: true 
    });
  }
});

//API Register UID
app.post('/api/register-uid', async (req, res) => {
  const { Users_Google_Uid, Users_DisplayName } = req.body;

  if (!Users_Google_Uid || !Users_DisplayName) {
    return res.send({ message: 'UID and DisplayName is required', status: false });
  }

  const sql_check_uid = "SELECT COUNT(*) AS count FROM Users WHERE Users_Google_Uid = ?";
  db.query(sql_check_uid, [Users_Google_Uid], async (err, result) => {
    if (err) throw err;

    if (result[0].count > 0) {
      res.send({ message: "UID already exists",status: false });
    }else{
      const sql = "INSERT INTO Users (Users_Google_Uid,Users_DisplayName,RegisType_ID)VALUES(?,?,2)";
      db.query(sql, [Users_Google_Uid, Users_DisplayName], (err) => {
        if (err) throw err;

        res.send({ message: "User registered successfully",status: true });
      });
    }
  });
});

//API Login UID
app.post('/api/login-uid',async (req, res) => {
  const { Users_Google_Uid } = req.body

  if(!Users_Google_Uid){
    res.send({ message: 'UID is required', status: false });
  }

  const sql = "SELECT COUNT(*) AS count FROM Users WHERE Users_Google_Uid = ? AND Users_IsActive = 1";
  db.query(sql, [Users_Google_Uid], async (err, result) => {
    if (err) throw err
    
    if (result[0].count > 0){
      const Uid_Storage = await GoogleIdentity(Users_Google_Uid);

      if (!Uid_Storage) {
        return res.send({ message: 'UID is invalid or User not found', status: false });
      }

      if (Uid_Storage) {
        const sql_select_users = "SELECT Users_ID FROM Users WHERE Users_Google_Uid = ? AND Users_IsActive = 1";
        db.query(sql_select_users, [Users_Google_Uid], async (err, result) => {
          if (err) throw err;

          if (result.length === 0) {
            return res.send({ message: 'User not found', status: false });
          }else{
            const user = result[0];
            const Tokens = GenerateTokens(user.Users_ID, Uid_Storage.uid,Uid_Storage.displayName, 2);

            res.send({
              Tokens: Tokens,
              message: "Login Success",
              status: true
            });
          }
        });
      }
    }else{
      res.send({ message: "User not found",status: false });
    }
  });
});

app.listen(process.env.SERVER_PORT, function() {
    console.log(`Example app listening on port ${process.env.SERVER_PORT}`)
});

