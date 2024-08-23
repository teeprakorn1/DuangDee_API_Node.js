const express = require('express')
const mysql = require('mysql2')
const bcrypt = require('bcrypt')
const loginRateLimiter = require('./Rate_Limiter/LimitTime_Login');
const sendEmailRateLimiter = require('./Rate_Limiter/LimitTime_SendEmail');
const OTP_Timelimiter = require('./OTP_Email/OTP_Timelimiter');
const generateOTP = require('./OTP_Email/OTP_Generator');
const sendOTPEmail = require('./OTP_Email/SendEmail');
const GenerateTokens = require('./Jwt_Tokens/Tokens_Generator');
const VerifyTokens = require('./Jwt_Tokens/Tokens_Verification');
const GoogleIdentity = require('./OAuth_Firebase/Google_Verify_Identity');
const https = require('https');
const fs = require('fs');
const app = express()

require('dotenv').config();

const privateKey = fs.readFileSync('privatekey.pem', 'utf8');
const certificate = fs.readFileSync('certificate.pem', 'utf8');
const credentials = { key: privateKey, cert: certificate };

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
const saltRounds = 14;

let otpStorage_Resets = {};
let otpStorage_Register = {};

//Hello World API
app.post('/api/VerifyToken',VerifyTokens, function(req, res){
  const regisType = req.users_decoded.RegisType_ID;

  if(regisType == 1){
    res.send({
      Users_ID:req.users_decoded.Users_ID,
      Users_Username:req.users_decoded.Users_Username,
      Users_Email:req.users_decoded.Users_Email,
      RegisType_ID:req.users_decoded.RegisType_ID,
      status: true
    });
  }else if(regisType == 2){
    res.send({
      Users_ID:req.users_decoded.Users_ID,
      Users_Google_Uid:req.users_decoded.Users_Google_Uid,
      Users_Email:req.users_decoded.Users_Email,
      RegisType_ID:req.users_decoded.RegisType_ID,
      status: true
    });
  }else{
    res.send({
      status: false
    });
  }
});

//API Email Check 
app.post('/api/check-email', async (req, res) => {
  const { Users_Email } = req.body;

  if(!Users_Email){
    res.send({ message: 'จำเป็นต้องมี Email', status: false });
  }

  const sql_check_email = "SELECT COUNT(*) AS count FROM Users WHERE Users_Email = ?";
  db.query(sql_check_email, [Users_Email], async (err, result) => {
    if (err) throw err;

    if (result[0].count > 0) {
      res.send({ message: "อีเมลนี้มีการลงทะเบียนแล้ว",status: false });
    }else{
      res.send({ message: "อีเมลนี้ยังไม่มีการลงทะเบียน",status: true });
    }
  });
});

//API Username Check 
app.post('/api/check-username', async (req, res) => {
  const { Users_Username } = req.body;

  if(!Users_Username){
    res.send({ message: 'กรุณากรอกชื่อผู้ใช้', status: false });
  }

  const sql_check_username = "SELECT COUNT(*) AS count FROM Users WHERE Users_Username = ?";
  db.query(sql_check_username, [Users_Username], async (err, result) => {
    if (err) throw err;

    if (result[0].count > 0) {
      res.send({ message: "ชื่อผู้ใช้นี้มีการลงทะเบียนแล้ว",status: false });
    }else{
      res.send({ message: "ชื่อผู้ใช้นี้ยังไม่มีการลงทะเบียน",status: true });
    }
  });
});

//API UID Check 
app.post('/api/check-uid', async (req, res) => {
  const { Users_Google_Uid } = req.body;

  if(!Users_Google_Uid){
    res.send({ message: 'กรุณากรอก UID', status: false });
  }

  const sql_check_username = "SELECT COUNT(*) AS count FROM Users WHERE Users_Google_Uid = ?";
  db.query(sql_check_username, [Users_Google_Uid], async (err, result) => {
    if (err) throw err;

    if (result[0].count > 0) {
      res.send({ message: "UID มีการลงทะเบียนแล้ว",status: false });
    }else{
      res.send({ message: "UID ยังไม่มีการลงทะเบียน",status: true });
    }
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
      res.send({ message: "Username หรือ Email มีการลงทะเบียนแล้ว",status: false });
    }else{
      const NewPassword = await bcrypt.hash(Users_Password, saltRounds);

      const sql = "INSERT INTO Users (Users_Email,Users_Username,Users_DisplayName,Users_Password)VALUES(?,?,?,?)";

      db.query(sql, [Users_Email, Users_Username, Users_Username, NewPassword], (err) => {
        if (err) throw err;

        res.send({ message: "ลงทะเบียนสำเร็จ",status: true });

      });
    }
  });
});

//API Login General
app.post('/api/login',loginRateLimiter, async (req, res) => {
  const { Users_Username, Users_Password } = req.body;

  if (!Users_Username || !Users_Password) {
    return res.send({ message: 'กรุณากรอก Username และ Password', status: false });
  }

  const sql_check_username = "SELECT COUNT(*) AS count FROM Users WHERE Users_Username = ? OR Users_Email = ? AND RegisType_ID = 1 AND Users_IsActive = 1";
  db.query(sql_check_username, [Users_Username,Users_Username], async (err, result) => {
  if (err) throw err;

    if (result[0].count > 0) {
      const sql_get_password = "SELECT Users_Password FROM Users WHERE Users_Username = ? OR Users_Email = ? AND RegisType_ID = 1 AND Users_IsActive = 1";
      db.query(sql_get_password, [Users_Username,Users_Username], async (err, result) => {
        if (err) throw err;
        
        const isCorrect = await bcrypt.compare(Users_Password, result[0].Users_Password);
        if (isCorrect) {
          const sql = "SELECT * FROM Users WHERE Users_Username = ? OR Users_Email = ? AND RegisType_ID = 1 AND Users_IsActive = 1";
          db.query(sql, [Users_Username,Users_Username], async (err, result) => {
            if (err) throw err;

            const user = result[0];
            const Tokens = GenerateTokens(user.Users_ID, user.Users_Username,user.Users_Email, 1);

            user['token'] = Tokens;
            user['message'] = "Password ถูกต้อง"
            user['status'] = true
            res.send(user);
          });
        } else {
          res.send({ message: "Password ไม่ถูกต้อง",status: false });
        }
      });
    } else {
      res.send({ message: "ไม่พบบัญชีผู้ใช้นี้",status: false });
    }
  });
});

//API Request Register
app.post('/api/request-register',sendEmailRateLimiter, async (req, res) => {
  const { Users_Email, Value } = req.body;
  
  if (!Users_Email) {
    return res.send({ message:'กรุณากรอก Email',status: false });
  }

  const currentOTP = generateOTP();
  
  if(Value == 0){
    otpStorage_Register[Users_Email] = {
      otp: currentOTP,
      timestamp: Date.now()
    };
    try {
      await sendOTPEmail(Users_Email, currentOTP, 1);
      res.send({ message:'ส่ง OTP สำเร็จ ไปยัง ' + Users_Email,status: true });
    } catch (error) {
      res.send({ message:'ส่ง OTP ไม่สำเร็จ',status: false });
    }
  }else if(Value == 1){
    delete otpStorage_Register[Users_Email];
    otpStorage_Register[Users_Email] = {
      otp: currentOTP,
      timestamp: Date.now()
    };
    try {
      await sendOTPEmail(Users_Email, currentOTP, 1);
      res.send({ message:'ส่ง OTP สำเร็จ ไปยัง ' + Users_Email,status: true });
    } catch (error) {
      res.send({ message:'ส่ง OTP ไม่สำเร็จ',status: false });
    }
  }else{
    res.send({ message:'ไม่พบ Value',status: false });
  }
});

//API Request Password
app.post('/api/request-password', sendEmailRateLimiter, async (req, res) => {
  const { Users_Email, Value } = req.body;
  
  if (!Users_Email) {
    return res.send({ message:'กรุณากรอก Email',status: false });
  }

  const sql_check_email = "SELECT COUNT(*) AS count FROM Users WHERE Users_Email = ? AND RegisType_ID NOT IN (2)";
  db.query(sql_check_email, [Users_Email], async (err, result) => {
    if (err) throw err;

    if (result[0].count > 0) {
      const currentOTP = generateOTP();
  
      if(Value == 0){
        otpStorage_Resets[Users_Email] = {
          otp: currentOTP,
          timestamp: Date.now()
        };
        try {
          await sendOTPEmail(Users_Email, currentOTP, 2);
          res.send({ message:'ส่ง OTP สำเร็จ ไปยัง ' + Users_Email,status: true });
        } catch (error) {
          res.send({ message:'ส่ง OTP ไม่สำเร็จ',status: false });
        }
      }else if(Value == 1){
        delete otpStorage_Resets[Users_Email];
        otpStorage_Resets[Users_Email] = {
          otp: currentOTP,
          timestamp: Date.now()
        };
        try {
          await sendOTPEmail(Users_Email, currentOTP, 2);
          res.send({ message:'ส่ง OTP สำเร็จ ไปยัง ' + Users_Email,status: true });
        } catch (error) {
          res.send({ message:'ส่ง OTP ไม่สำเร็จ',status: false });
        }
      }else{
        res.send({ message:'ไม่พบ Value',status: false });
      }
    }else{
      res.send({ message:'Email ยังไม่มีการลงทะเบียน หรือ ไม่ถูกต้อง',status: false });
    }
  });
});

//API Verify OTP
app.post('/api/verify-otp', (req, res) => {
  const { Users_Email, OTP , Value} = req.body;
  let OTP_Check = 0;

  if (!Users_Email || !OTP || !Value){
    return res.send({ message: 'กรุณากรอก Email, OTP และ Value', status: false });
  }

  if(Value == 0){
    OTP_Check = OTP_Timelimiter(otpStorage_Register,Users_Email);
    if(!OTP_Check){
      return res.send({ message:'ไม่พบ OTP สำหรับ Email นี้',status: false });
    }
    if (OTP_Check == -1) {
      delete otpStorage_Register[Users_Email];
      return res.send({ message:'OTP หมดอายุ',status: false });
    }
    if (OTP_Check == OTP) {
      delete otpStorage_Register[Users_Email];
      res.send({ message:'ยืนยัน OTP สำเร็จ',status: true });
    } else {
      res.send({ message:'OTP หมดอายุ',status: false });
    }

  }else if(Value == 1){
    OTP_Check = OTP_Timelimiter(otpStorage_Resets,Users_Email);
    if(!OTP_Check){
      return res.send({ message:'ไม่พบ OTP สำหรับ Email นี้',status: false });
    }
    if (OTP_Check == -1) {
      delete otpStorage_Resets[Users_Email];
      return res.send({ message:'OTP หมดอายุ',status: false });
    }
    if (OTP_Check == OTP) {
      delete otpStorage_Resets[Users_Email];
      res.send({ message:'ยืนยัน OTP สำเร็จ',status: true });
    } else {
      res.send({ message:'OTP ไม่ถูกต้อง',status: false });
    }
  }
});

//API Reset Password
app.post('/api/reset-password', async (req, res) => {
  const { Users_Email, Users_Password } = req.body;

  if (!Users_Email || !Users_Password) {
    return res.send({ message: 'จำเป็นต้องมี Email และ Password', status: false });
  }

  const NewPassword = await bcrypt.hash(Users_Password, saltRounds);

  const sql = "UPDATE Users SET Users_Password = ? WHERE Users_Email = ?";
  db.query(sql, [NewPassword,Users_Email], async (err) => {
    if (err) throw err;
      await sendOTPEmail(Users_Email, null , 0);
      res.send({ message:'รีเซ็ต Password สำเร็จ',status: true });
  });
});

//API Add Admin 
app.post('/api/admin-add', async (req, res) => {
  const {  Users_Email, Users_Username, Users_Password } = req.body;

  const NewPassword = await bcrypt.hash(Users_Password ,saltRounds);
  const sql = "INSERT INTO Users (Users_Email,Users_Username,Users_DisplayName,Users_Password)VALUES(?,?,?,?)";
  db.query(sql, [Users_Email, Users_Username, Users_Username, NewPassword], async(err) => {
    if (err) throw err;
    res.send({ message: "ลงทะเบียน Admin สำเร็จเรียบร้อยแล้ว",status: true });
  });
});

// API Check Firebase UID
app.post('/api/check-uid', async (req, res) => {
  const { Users_Google_Uid } = req.body;

  if (!Users_Google_Uid) {
    return res.send({ message: 'จำเป็นต้องมี UID', status: false });
  }

  const Uid_Storage = await GoogleIdentity(Users_Google_Uid);

  if (!Uid_Storage) {
    return res.send({ message: 'UID ไม่ถูกต้องหรือไม่พบผู้ใช้', status: false });
  }

  if (Uid_Storage) {
    res.send({ 
      uid: Uid_Storage.uid,
      email: Uid_Storage.email,
      displayName: Uid_Storage.displayName,
      message: 'UID ถูกต้อง', 
      status: true 
    });
  }
});

//API Register UID
app.post('/api/register-uid', async (req, res) => {
  const { Users_Google_Uid, Users_Email, Users_DisplayName } = req.body;

  if (!Users_Google_Uid || !Users_DisplayName) {
    return res.send({ message: 'จำเป็นต้องมี UID และ DisplayName', status: false });
  }

  const sql_check_uid = "SELECT COUNT(*) AS count FROM Users WHERE Users_Google_Uid = ?";
  db.query(sql_check_uid, [Users_Google_Uid], async (err, result) => {
    if (err) throw err;

    if (result[0].count > 0) {
      res.send({ message: "UID มีอยู่แล้ว",status: false });
    }else{
      const sql_check_email = "SELECT COUNT(*) AS count FROM Users WHERE Users_Email = ?";
      db.query(sql_check_email, [Users_Email], async (err, result) => {
        if (err) throw err;
  
        if (result[0].count > 0) {
          res.send({ message: "Email มีอยู่แล้ว",status: false });
        }else{
          const sql = "INSERT INTO Users (Users_Email,Users_Google_Uid,Users_DisplayName,RegisType_ID)VALUES(?,?,?,2)";
          db.query(sql, [Users_Email, Users_Google_Uid, Users_DisplayName], (err) => {
            if (err) throw err;
    
            res.send({ message: "ลงทะเบียนผู้ใช้เรียบร้อยแล้ว",status: true });
          });
        }
      });
    }
  });
});

//API Login UID
app.post('/api/login-uid',async (req, res) => {
  const { Users_Google_Uid } = req.body

  if(!Users_Google_Uid){
    res.send({ message: 'จำเป็นต้องมี UID', status: false });
  }

  const sql = "SELECT COUNT(*) AS count FROM Users WHERE Users_Google_Uid = ? AND RegisType_ID = 2 AND Users_IsActive = 1";
  db.query(sql, [Users_Google_Uid], async (err, result) => {
    if (err) throw err
    
    if (result[0].count > 0){
      const Uid_Storage = await GoogleIdentity(Users_Google_Uid);

      if (!Uid_Storage) {
        return res.send({ message: 'UID ไม่ถูกต้องหรือไม่พบผู้ใช้', status: false });
      }

      if (Uid_Storage) {
        const sql_select_users = "SELECT Users_ID FROM Users WHERE Users_Google_Uid = ? AND RegisType_ID = 2 AND Users_IsActive = 1";
        db.query(sql_select_users, [Users_Google_Uid], async (err, result) => {
          if (err) throw err;

          if (result.length === 0) {
            return res.send({ message: 'ไม่พบผู้ใช้', status: false });
          }else{
            const user = result[0];
            const Tokens = GenerateTokens(user.Users_ID, Uid_Storage.uid,Uid_Storage.email, 2);

            res.send({
              token: Tokens,
              message: "เข้าสู่ระบบสำเร็จ",
              status: true
            });
          }
        });
      }
    }else{
      res.send({ message: "ไม่พบผู้ใช้",status: false });
    }
  });
});

app.listen(process.env.SERVER_PORT, function() {
  console.log(`Example app listening on port ${process.env.SERVER_PORT}`)
});

// const httpsServer = https.createServer(credentials, app);
// httpsServer.listen(process.env.SERVER_HTTPS_PORT, () => {
//     console.log(`HTTPS Server running on port ${process.env.SERVER_HTTPS_PORT}`);
// });

