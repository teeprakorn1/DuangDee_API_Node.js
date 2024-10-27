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
const { v4: uuidv4 } = require('uuid');
const validator = require('validator');
const multer = require('multer');
const sharp = require('sharp');
const https = require('https');
const path = require('path');
const xss = require('xss');
const fs = require('fs');
const app = express()

require('dotenv').config();

const cors = require('cors')

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

const uploadDir = path.join(__dirname, 'images');
const uploadDir_Profile = path.join(__dirname, 'images/profile-images');
const uploadDir_Zodiac = path.join(__dirname, 'images/zodiac-images');
const uploadDir_Card = path.join(__dirname, 'images/card-images');
const uploadDir_Hand = path.join(__dirname, 'palmprint-api-python/uploads');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

if (!fs.existsSync(uploadDir_Profile)) {
  fs.mkdirSync(uploadDir_Profile);
}

if (!fs.existsSync(uploadDir_Zodiac)) {
  fs.mkdirSync(uploadDir_Zodiac);
}

if (!fs.existsSync(uploadDir_Card)) {
  fs.mkdirSync(uploadDir_Card);
}

if (!fs.existsSync(uploadDir_Hand)) {
  fs.mkdirSync(uploadDir_Hand);
}

const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // จำกัดขนาดไฟล์ที่ 2MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new Error('ประเภทไฟล์ไม่ถูกต้อง'), false);
    }
    cb(null, true);
  }
});

db.connect();
app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use('/images/profile-images', express.static(uploadDir_Profile));
app.use('/images/zodiac-images', express.static(uploadDir_Zodiac));
app.use('/images/card-images', express.static(uploadDir_Card));
app.use('/palmprint-api-python/uploads', express.static(uploadDir_Hand));
app.use(cors())

const saltRounds = 14;
let otpStorage_Resets = {};
let otpStorage_Register = {};

//////////////////////////////////Tokens API///////////////////////////////////////
//Verify Tokens API
app.post('/api/VerifyToken',VerifyTokens, function(req, res){
  const regisType = req.users_decoded.RegisType_ID;

  if(regisType == 1){
    res.send({
      Users_ID:req.users_decoded.Users_ID,
      Users_Username:req.users_decoded.Users_Username,
      Users_Email:req.users_decoded.Users_Email,
      UsersType_ID:req.users_decoded.UsersType_ID,
      RegisType_ID:req.users_decoded.RegisType_ID,
      status: true
    });
  }else if(regisType == 2){
    res.send({
      Users_ID:req.users_decoded.Users_ID,
      Users_Google_Uid:req.users_decoded.Users_Google_Uid,
      Users_Email:req.users_decoded.Users_Email,
      UsersType_ID:req.users_decoded.UsersType_ID,
      RegisType_ID:req.users_decoded.RegisType_ID,
      status: true
    });
  }else{
    res.status(404).send({
      status: false
    });
  }
});

//////////////////////////////////Check API///////////////////////////////////////
//API Email Check 
app.post('/api/check-email', async (req, res) => {
  let { Users_Email } = req.body;

  if (!Users_Email || typeof Users_Email !== 'string') {
    return res.send({ message: 'จำเป็นต้องมี Email และต้องเป็นรูปแบบสตริงเท่านั้น', status: false });
  }

  if (!validator.isEmail(Users_Email)) {
    return res.send({ message: 'รูปแบบ Email ไม่ถูกต้อง', status: false });
  }

  Users_Email = xss(validator.normalizeEmail(Users_Email));

  const sql_check_email = "SELECT COUNT(*) AS count FROM users WHERE Users_Email = ?";
  db.query(sql_check_email, [Users_Email], (err, result) => {
    if (err) { return res.status(500).send({ message: 'เกิดข้อผิดพลาดในเซิร์ฟเวอร์', status: false });}

    if (result.length > 0 && result[0].count > 0) {
      res.send({ message: "อีเมลนี้มีการลงทะเบียนแล้ว", status: false });
    } else {
      res.send({ message: "อีเมลนี้ยังไม่มีการลงทะเบียน", status: true });
    }
  });
});


//API Username Check 
app.post('/api/check-username', async (req, res) => {
  let { Users_Username } = req.body;

  if (!Users_Username || typeof Users_Username !== 'string') {
    return res.status(404).send({ message: 'กรุณากรอกชื่อผู้ใช้ที่เป็นสตริงเท่านั้น', status: false });
  }

  Users_Username = xss(validator.escape(Users_Username));

  const sql_check_username = "SELECT COUNT(*) AS count FROM users WHERE Users_Username = ?";
  db.query(sql_check_username, [Users_Username], (err, result) => {
    if (err) { return res.status(500).send({ message: 'เกิดข้อผิดพลาดในเซิร์ฟเวอร์', status: false });}

    if (result.length > 0 && result[0].count > 0) {
      res.send({ message: "ชื่อผู้ใช้นี้มีการลงทะเบียนแล้ว", status: false });
    } else {
      res.send({ message: "ชื่อผู้ใช้นี้ยังไม่มีการลงทะเบียน", status: true });
    }
  });
});

//API UID Check 
app.post('/api/check-uid' , async (req, res) => {
  let { Users_Google_Uid } = req.body;

  if(!Users_Google_Uid || typeof Users_Google_Uid !== 'string'){
    res.status(404).send({ message: 'กรุณากรอก UID', status: false });
  }

  Users_Google_Uid = xss(validator.escape(Users_Google_Uid));

  const sql_check_username = "SELECT COUNT(*) AS count FROM users WHERE Users_Google_Uid = ?";
  db.query(sql_check_username, [Users_Google_Uid], async (err, result) => {
    if (err) { return res.status(500).send({ message: 'เกิดข้อผิดพลาดในเซิร์ฟเวอร์', status: false });}

    if (result.length > 0 && result[0].count > 0) {
      res.send({ message: "UID มีการลงทะเบียนแล้ว",status: false });
    }else{
      res.send({ message: "UID ยังไม่มีการลงทะเบียน",status: true });
    }
  });
});

//////////////////////////////////Register API///////////////////////////////////////
//API Register General
app.post('/api/register', async (req, res) => {
  let { Users_Email,Users_Username, Users_Password} = req.body;

  if (!Users_Email || !Users_Username || !Users_Password ||
    typeof Users_Email !== 'string' || typeof Users_Username !== 'string' || typeof Users_Password !=='string') {
    return res.status(404).send({ message: 'กรอกข้อมูลพารามิเตอร์ให้ถูกต้องตามที่กำหนด.', status: false });
  }

  Users_Email = xss(validator.normalizeEmail(Users_Email));
  Users_Username = xss(validator.escape(Users_Username));
  Users_Password = xss(validator.escape(Users_Password));

  const sql_check_username = "SELECT COUNT(*) AS count FROM users WHERE Users_Username = ? OR Users_Email = ?";
  db.query(sql_check_username, [Users_Username,Users_Email], async (err, result) => {
    if (err) { return res.status(500).send({ message: 'เกิดข้อผิดพลาดในเซิร์ฟเวอร์', status: false });}

    if (result[0].count > 0) {
      res.status(404).send({ message: "Username หรือ Email มีการลงทะเบียนแล้ว",status: false });
    }else{
      const NewPassword = await bcrypt.hash(Users_Password, saltRounds);

      const sql = "INSERT INTO users (Users_Email,Users_Username,Users_DisplayName,Users_Password)VALUES(?,?,?,?)";

      db.query(sql, [Users_Email, Users_Username, Users_Username, NewPassword], (err) => {
        if (err) { return res.status(500).send({ message: 'เกิดข้อผิดพลาดในเซิร์ฟเวอร์', status: false });}

        res.send({ message: "ลงทะเบียนสำเร็จ",status: true });
      });
    }
  });
});

//////////////////////////////////Login API///////////////////////////////////////
//API Login General
app.post('/api/login', loginRateLimiter , async (req, res) => {
  let { Users_Username, Users_Password } = req.body;

  if (!Users_Username || !Users_Password ||
     typeof Users_Username !== 'string' || typeof Users_Password !== 'string') {
    return res.status(404).send({ message: 'กรุณากรอกข้อมูลพารามิเตอร์ให้ถูกต้องตามที่กำหนด.', status: false });
  }

  Users_Username = xss(validator.escape(Users_Username));
  Users_Password = xss(validator.escape(Users_Password));

  const sql_check_username = "SELECT COUNT(*) AS count FROM users WHERE Users_Username = ? OR Users_Email = ? AND RegisType_ID = 1 AND Users_IsActive = 1";
  db.query(sql_check_username, [Users_Username,Users_Username], async (err, result) => {
  if (err) { return res.status(500).send({ message: 'เกิดข้อผิดพลาดในเซิร์ฟเวอร์', status: false });}

    if (result[0].count > 0) {
      const sql_get_password = "SELECT Users_Password FROM users WHERE Users_Username = ? OR Users_Email = ? AND RegisType_ID = 1 AND Users_IsActive = 1";
      db.query(sql_get_password, [Users_Username,Users_Username], async (err, result) => {
        if (err) { return res.status(500).send({ message: 'เกิดข้อผิดพลาดในเซิร์ฟเวอร์', status: false });}
        
        const isCorrect = await bcrypt.compare(Users_Password, result[0].Users_Password);
        if (isCorrect) {
          const sql = "SELECT * FROM users WHERE Users_Username = ? OR Users_Email = ? AND RegisType_ID = 1 AND Users_IsActive = 1";
          db.query(sql, [Users_Username,Users_Username], async (err, result) => {
            if (err) { return res.status(500).send({ message: 'เกิดข้อผิดพลาดในเซิร์ฟเวอร์', status: false });}

            const user = result[0];
            const Tokens = GenerateTokens(user.Users_ID, user.Users_Username,user.Users_Email, user.UsersType_ID, 1);

            user['token'] = Tokens;
            user['message'] = "รหัสผ่านถูกต้อง"
            user['status'] = true
            res.send(user);
          });
        } else {
          res.status(404).send({ message: "รหัสผ่านถูกต้อง",status: false });
        }
      });
    } else {
      res.status(404).send({ message: "ไม่พบบัญชีผู้ใช้นี้",status: false });
    }
  });
});

//////////////////////////////////OTP API///////////////////////////////////////
//API Request Register
app.post('/api/request-register' ,sendEmailRateLimiter, async (req, res) => {
  let { Users_Email, Value } = req.body;
  
  if (!Users_Email || typeof Users_Email !== 'string') {
    return res.status(404).send({ message:'กรุณากรอก Email',status: false });
  }

  Users_Email = xss(validator.normalizeEmail(Users_Email));
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
      res.status(404).send({ message:'ส่ง OTP ไม่สำเร็จ',status: false });
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
      res.status(404).send({ message:'ส่ง OTP ไม่สำเร็จ',status: false });
    }
  }else{
    res.status(404).send({ message:'ไม่พบ Value',status: false });
  }
});

//API Request Password
app.post('/api/request-password' ,sendEmailRateLimiter, async (req, res) => {
  let { Users_Email, Value } = req.body;
  
  if (!Users_Email || !Value || typeof Users_Email !== 'string' || typeof Value !== 'string') {
    return res.status(404).send({ message:'กรุณากรอก Email',status: false });
  }

  Users_Email = xss(validator.normalizeEmail(Users_Email));
  Value = xss(validator.escape(Value));

  const sql_check_email = "SELECT COUNT(*) AS count FROM users WHERE Users_Email = ? AND RegisType_ID NOT IN (2)";
  db.query(sql_check_email, [Users_Email], async (err, result) => {
    if (err) { return res.status(500).send({ message: 'เกิดข้อผิดพลาดในเซิร์ฟเวอร์', status: false });}

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
          res.status(404).send({ message:'ส่ง OTP ไม่สำเร็จ',status: false });
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
          res.status(404).send({ message:'ส่ง OTP ไม่สำเร็จ',status: false });
        }
      }else{
        res.status(404).send({ message:'ไม่พบ Value',status: false });
      }
    }else{
      res.status(404).send({ message:'Email ยังไม่มีการลงทะเบียน หรือ ไม่ถูกต้อง',status: false });
    }
  });
});

//API Verify OTP
app.post('/api/verify-otp', (req, res) => {
  let { Users_Email, OTP , Value} = req.body;
  let OTP_Check = 0;

  if (!Users_Email || !OTP || !Value || 
    typeof Users_Email !== 'string' || typeof OTP !== 'string' || typeof Value !== 'string'){
    return res.status(404).send({ message: 'กรุณากรอก Email, OTP และ Value', status: false });
  }

  Users_Email = xss(validator.normalizeEmail(Users_Email));
  OTP = xss(validator.escape(OTP));
  Value = xss(validator.escape(Value));

  if(Value == 0){
    OTP_Check = OTP_Timelimiter(otpStorage_Register,Users_Email);
    if(!OTP_Check){
      return res.status(404).send({ message:'ไม่พบ OTP สำหรับ Email นี้',status: false });
    }
    if (OTP_Check == -1) {
      delete otpStorage_Register[Users_Email];
      return res.status(404).send({ message:'OTP หมดอายุ',status: false });
    }
    if (OTP_Check == OTP) {
      delete otpStorage_Register[Users_Email];
      res.send({ message:'ยืนยัน OTP สำเร็จ',status: true });
    } else {
      res.status(404).send({ message:'OTP หมดอายุ',status: false });
    }

  }else if(Value == 1){
    OTP_Check = OTP_Timelimiter(otpStorage_Resets,Users_Email);
    if(!OTP_Check){
      return res.status(404).send({ message:'ไม่พบ OTP สำหรับ Email นี้',status: false });
    }
    if (OTP_Check == -1) {
      delete otpStorage_Resets[Users_Email];
      return res.status(404).send({ message:'OTP หมดอายุ',status: false });
    }
    if (OTP_Check == OTP) {
      delete otpStorage_Resets[Users_Email];
      res.send({ message:'ยืนยัน OTP สำเร็จ',status: true });
    } else {
      res.status(404).send({ message:'OTP ไม่ถูกต้อง',status: false });
    }
  }
});

//API Reset Password
app.post('/api/reset-password', async (req, res) => {
  let { Users_Email, Users_Password } = req.body;

  if (!Users_Email || !Users_Password ||
    typeof Users_Email !== 'string' || typeof Users_Password !== 'string') {
    return res.status(404).send({ message: 'จำเป็นต้องมี Email และ Password', status: false });
  }

  Users_Email = xss(validator.normalizeEmail(Users_Email));
  Users_Password = xss(validator.escape(Users_Password));

  const NewPassword = await bcrypt.hash(Users_Password, saltRounds);

  const sql = "UPDATE users SET Users_Password = ? WHERE Users_Email = ?";
  db.query(sql, [NewPassword,Users_Email], async (err) => {
    if (err) { return res.status(404).status(500).send({ message: 'เกิดข้อผิดพลาดในเซิร์ฟเวอร์', status: false });}
      await sendOTPEmail(Users_Email, null , 0);
      res.send({ message:'รีเซ็ต Password สำเร็จ',status: true });
  });
});

//////////////////////////////////Google OAuth API///////////////////////////////////////
// API Check Firebase UID
app.post('/api/check-uid-firebase', async (req, res) => {
  let { Users_Google_Uid } = req.body;

  if (!Users_Google_Uid || typeof Users_Google_Uid !== 'string') {
    return res.status(404).send({ message: 'จำเป็นต้องมี UID', status: false });
  }

  Users_Google_Uid = xss(validator.escape(Users_Google_Uid));

  const Uid_Storage = await GoogleIdentity(Users_Google_Uid);

  if (!Uid_Storage) {
    return res.status(404).send({ message: 'UID ไม่ถูกต้องหรือไม่พบผู้ใช้', status: false });
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
  let { Users_Google_Uid, Users_Email, Users_DisplayName } = req.body;

  if (!Users_Google_Uid || !Users_DisplayName || !Users_Email ||
    typeof Users_Google_Uid !== 'string' || typeof Users_DisplayName !== 'string' || typeof Users_Email !== 'string') {
    return res.status(404).send({ message: 'จำเป็นต้องมี UID และ DisplayName', status: false });
  }

  Users_Google_Uid = xss(validator.escape(Users_Google_Uid));
  Users_DisplayName = xss(validator.escape(Users_DisplayName));
  Users_Email = xss(validator.normalizeEmail(Users_Email));

  const sql_check_uid = "SELECT COUNT(*) AS count FROM users WHERE Users_Google_Uid = ?";
  db.query(sql_check_uid, [Users_Google_Uid], async (err, result) => {
    if (err) { return res.status(500).send({ message: 'เกิดข้อผิดพลาดในเซิร์ฟเวอร์', status: false });}

    if (result[0].count > 0) {
      res.status(404).send({ message: "UID มีอยู่แล้ว",status: false });
    }else{
      const sql_check_email = "SELECT COUNT(*) AS count FROM users WHERE Users_Email = ?";
      db.query(sql_check_email, [Users_Email], async (err, result) => {
        if (err) { return res.status(500).send({ message: 'เกิดข้อผิดพลาดในเซิร์ฟเวอร์', status: false });}
  
        if (result[0].count > 0) {
          res.status(404).send({ message: "Email มีอยู่แล้ว",status: false });
        }else{
          const sql = "INSERT INTO users (Users_Email,Users_Google_Uid,Users_DisplayName,RegisType_ID)VALUES(?,?,?,2)";
          db.query(sql, [Users_Email, Users_Google_Uid, Users_DisplayName], (err) => {
            if (err) { return res.status(500).send({ message: 'เกิดข้อผิดพลาดในเซิร์ฟเวอร์', status: false });}
    
            res.send({ message: "ลงทะเบียนผู้ใช้เรียบร้อยแล้ว",status: true });
          });
        }
      });
    }
  });
});

//API Login UID
app.post('/api/login-uid',async (req, res) => {
  let { Users_Google_Uid } = req.body

  if(!Users_Google_Uid || typeof Users_Google_Uid !== 'string'){
    res.status(404).send({ message: 'จำเป็นต้องมี UID', status: false });
  }

  Users_Google_Uid = xss(validator.escape(Users_Google_Uid));

  const sql = "SELECT COUNT(*) AS count FROM users WHERE Users_Google_Uid = ? AND RegisType_ID = 2 AND Users_IsActive = 1";
  db.query(sql, [Users_Google_Uid], async (err, result) => {
    if (err) throw err
    
    if (result[0].count > 0){
      const Uid_Storage = await GoogleIdentity(Users_Google_Uid);

      if (!Uid_Storage) {
        return res.status(404).send({ message: 'UID ไม่ถูกต้องหรือไม่พบผู้ใช้', status: false });
      }

      if (Uid_Storage) {
        const sql_select_users = "SELECT Users_ID, UsersType_ID FROM users WHERE Users_Google_Uid = ? AND RegisType_ID = 2 AND Users_IsActive = 1";
        db.query(sql_select_users, [Users_Google_Uid], async (err, result) => {
          if (err) { return res.status(500).send({ message: 'เกิดข้อผิดพลาดในเซิร์ฟเวอร์', status: false });}

          if (result.length === 0) {
            return res.status(404).send({ message: 'ไม่พบผู้ใช้', status: false });
          }else{
            const user = result[0];
            const Tokens = GenerateTokens(user.Users_ID, Uid_Storage.uid, Uid_Storage.email, user.UsersType_ID, 2);

            res.send({
              token: Tokens,
              message: "เข้าสู่ระบบสำเร็จ",
              status: true
            });
          }
        });
      }
    }else{
      res.status(404).send({ message: "ไม่พบผู้ใช้",status: false });
    }
  });
});

//////////////////////////////////Profile API///////////////////////////////////////
//API Update Profile Image
app.put('/api/update-profile-image/:id', VerifyTokens, upload.single('Profile_Image') ,async (req, res) => {
  const { id } = req.params;

  if(!id || typeof id !== 'string'){
    return res.status(404).send({ message: "ต้องมี ID", status: false });
  }

  if (!req.file) {
    return res.status(404).send({ message: "ต้องมีภาพประกอบ", status: false });
  }

  if(req.users_decoded.Users_ID != id){
    return res.status(404).send({ message: 'คุณไม่สิทธ์ทำรายการนี้', status: false });
  }

  const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
  if (!allowedTypes.includes(req.file.mimetype)) {
    return res.status(404).send({ message: 'ประเภทไฟล์ไม่ถูกต้อง', status: false });
  }

  const sql_check_id = "SELECT COUNT(*) AS count FROM users WHERE Users_ID = ?";
  db.query(sql_check_id, [id], async (err, result) => {
    if (err) { return res.status(500).send({ message: 'เกิดข้อผิดพลาดในเซิร์ฟเวอร์', status: false });}

    if (result[0].count > 0) {
      const uniqueName = uuidv4();
      const ext = path.extname(req.file.originalname);
      const resizedImagePath = path.join(uploadDir_Profile, `${uniqueName}${ext}`);

      try {
        await sharp(req.file.buffer)
          .resize(1280, 1280) //1280x1280 pixels
          .toFile(resizedImagePath);
        const Profile_ImageURL = `/images/profile-images/${uniqueName}${ext}`;
        const sql = "UPDATE users SET Users_ImageFile = ? WHERE Users_ID = ?";
        db.query(sql, [Profile_ImageURL, id], (err, result) => {
          if (err) { return res.status(500).send({ message: 'เกิดข้อผิดพลาดในเซิร์ฟเวอร์', status: false });}
          if(result.affectedRows > 0){
            res.send({ message: "อัพเดทรูปภาพสำเร็จ",status: true });
          }else{
            res.status(404).send({ message: "ไม่สามารถอัพเดทข้อมูลได้",status: false });
          }
        });
      }catch (error) {
        return res.status(404).send({ message: "เกิดข้อผิดพลาดในการประมวลผลภาพ", status: false });
      }
    }else{
      res.status(404).send({ message: "ไม่พบผู้ใช้",status: false });
    }
  });
});

//API Delete Profile Image
app.delete('/api/delete-profile-image/:id', VerifyTokens, async (req, res) => {
  const { id } = req.params;
  let { imagePath } = req.body;

  if(!id || typeof id !== 'string'){
    return res.status(404).send({ message: "ต้องมี ID", status: false });
  }

  if (!imagePath || typeof id !== 'string') {
      return res.status(404).send({ message: "ต้องมี imagePath", status: false });
  }

  if(req.users_decoded.Users_ID != id){
    return res.status(404).send({ message: 'คุณไม่สิทธ์ทำรายการนี้', status: false });
  }

  imagePath = xss(validator.escape(imagePath));

  const sql = "SELECT Users_ImageFile FROM users WHERE Users_ID = ?";
  db.query(sql, [id], async (err, result) => {
    if (err) { return res.status(500).send({ message: 'เกิดข้อผิดพลาดในเซิร์ฟเวอร์', status: false });}
    if(result.length > 0){
      const Users_ImageFile = result[0].Users_ImageFile;

      if (!Users_ImageFile || Users_ImageFile !== imagePath) {
        return res.status(404).send({ message: "ไม่พบรูปภาพหรือไม่ตรงกับเส้นทางที่ระบุ", status: false });
      }

      const sanitizedPath = imagePath.replace(/^\/+/, '');
      const fullPath = path.join(__dirname, sanitizedPath);
  
    fs.access(fullPath, fs.constants.F_OK, (err) => {
      if (err) {
        return res.status(404).send({ message: "ไม่พบไฟล์", status: false });
      }
      fs.unlink(fullPath, (err) => {
        if (err) {
            return res.status(404).send({ message: "ไม่สามารถลบไฟล์ได้", status: false });
        }
        res.send({ message: "ลบรูปภาพสำเร็จ", status: true });
      });
    });
    }else{
      return res.status(404).send({ message: "ไม่พบผู้ใช้", status: false });
    }
  });
});

//API Update Profile
app.put('/api/update-profile/:id' , VerifyTokens  ,async (req, res) => {
  const { id } = req.params;
  let { Users_DisplayName, Users_FirstName, Users_LastName,
    Users_Phone, Users_BirthDate, UsersGender_ID, } = req.body;

  if(!id || typeof id !== 'string'){
    return res.status(404).send({ message: "ต้องมี ID", status: false });
  }

  if(!Users_DisplayName || !Users_FirstName || 
    !Users_LastName || !Users_Phone || !Users_BirthDate || !UsersGender_ID ||
    typeof Users_DisplayName !== 'string' || typeof Users_FirstName !== 'string' ||
    typeof Users_LastName !== 'string' || typeof Users_Phone !== 'string' ||
    typeof Users_BirthDate !== 'string' || typeof UsersGender_ID !== 'string'){
    return res.status(404).send({ message: "จำเป็นต้องมีข้อมูล", status: false });
  }

  if(req.users_decoded.Users_ID != id){
    return res.status(404).send({ message: 'คุณไม่สิทธ์ทำรายการนี้', status: false });
  }

  Users_DisplayName = xss(validator.escape(Users_DisplayName));
  Users_FirstName = xss(validator.escape(Users_FirstName));
  Users_LastName = xss(validator.escape(Users_LastName));
  Users_Phone = xss(validator.escape(Users_Phone));
  Users_BirthDate = xss(validator.escape(Users_BirthDate));

  const sql_check_id = "SELECT COUNT(*) AS count FROM users WHERE Users_ID = ?";
  db.query(sql_check_id, [id], async (err, result) => {
    if (err) { return res.status(500).send({ message: 'เกิดข้อผิดพลาดในเซิร์ฟเวอร์', status: false });}

    if (result[0].count > 0) {
      const sql = "UPDATE users SET Users_DisplayName = ?, Users_FirstName = ?, " +
      " Users_LastName = ?, Users_Phone = ?, Users_BirthDate = ?, UsersGender_ID = ?" +
      " WHERE Users_ID = ? AND Users_IsActive = 1";
      db.query(sql, [Users_DisplayName, Users_FirstName ,Users_LastName ,
        Users_Phone ,Users_BirthDate ,UsersGender_ID ,id], async (err, result) => {
        if (err) { return res.status(500).send({ message: 'เกิดข้อผิดพลาดในเซิร์ฟเวอร์', status: false });}

        if(result.affectedRows > 0){
          res.send({ message: "อัพเดทข้อมูลสำเร็จ",status: true });
        }else{
          res.status(404).send({ message: "ไม่สามารถอัพเดทข้อมูลได้",status: false });
        }
      });
    }else{
      res.status(404).send({ message: "ไม่พบผู้ใช้",status: false });
    }
  });
});

//API Get Profile By ID
app.get('/api/get-profile/:id', VerifyTokens, async (req, res) => {
  const { id } = req.params;
  if(!id || typeof id !== 'string'){ res.status(404).send({ message: "ต้องมี ID", status: false });}

  if(req.users_decoded.Users_ID != id){
    return res.status(404).send({ message: 'คุณไม่สิทธ์ทำรายการนี้', status: false });
  }

  const sql = "SELECT u.*,g.UsersGender_Name,ut.UsersType_Name,rt.RegisType_Name FROM"+
  "(((users u INNER JOIN usersgender g ON u.UsersGender_ID = G.UsersGender_ID)"+
  "INNER JOIN userstype ut ON u.UsersType_ID = ut.UsersType_ID)INNER JOIN"+
  " registype rt ON u.RegisType_ID = rt.RegisType_ID) WHERE Users_ID = ?";
  db.query(sql, [id], (err, results) => {
    if (err) { return res.status(500).send({ message: 'เกิดข้อผิดพลาดในเซิร์ฟเวอร์', status: false });}
    if(results.length > 0){
      const UsersData = results[0];
      UsersData['message'] = "ทำรายการสำเร็จ"
      UsersData['status'] = true
      res.send(UsersData);
    }else{
      res.status(404).send({ message: "ไม่พบผู้ใช้",status: false });
    }
  });
});

//////////////////////////////////Zodiac API///////////////////////////////////////
//API Get Zodiac
app.get('/api/get-zodiac', VerifyTokens ,async (req, res) => {
  const sql = "SELECT * FROM zodiac";
  db.query(sql, (err, results) => {
    if (err) { return res.status(500).send({ message: 'เกิดข้อผิดพลาดในเซิร์ฟเวอร์', status: false });}
    if(results.length > 0){
      const ZodiacData = results
      res.send(ZodiacData);
    }else{
      res.status(404).send({ message: "ไม่พบข้อมูล",status: false })
    }
  });
});

//API Get Zodiac By ID
app.get('/api/get-zodiac/:id', VerifyTokens ,async (req, res) => {
  const { id } = req.params;
  if(!id || typeof id !== 'string'){ res.status(404).send({ message: "ต้องมี ID", status: false });}
  const sql = "SELECT * FROM zodiac WHERE Zodiac_ID = ?";
  db.query(sql, [id], (err, results) => {
    if (err) { return res.status(500).send({ message: 'เกิดข้อผิดพลาดในเซิร์ฟเวอร์', status: false });}
    if(results.length > 0){
      const ZodiacData = results[0];
      ZodiacData['message'] = "ทำรายการสำเร็จ"
      ZodiacData['status'] = true
      res.send(ZodiacData);
    }else{
      res.status(404).send({ message: "ไม่พบข้อมูล",status: false });
    }
  });
});

//API Check Zodiac of BirthDate
app.post('/api/check-zodiac', VerifyTokens, async (req, res) => {
  let { Users_BirthDate } = req.body;

  if (!Users_BirthDate || typeof Users_BirthDate !== 'string') {
    return res.status(404).send({ message: "ต้องมีข้อมูลของวันเกิด", status: false });
  }

  Users_BirthDate = xss(validator.escape(Users_BirthDate));

  // Set Form dd-mm-yyyy
  const [day, month, year] = Users_BirthDate.split('-').map(Number);
  const birthDate = new Date(Date.UTC(year, month - 1, day, 0, 0, 0));
  birthDate.setHours(birthDate.getHours() + 8);

  if (isNaN(birthDate)) {
    return res.status(404).send({ message: "รูปแบบวันเกิดไม่ถูกต้อง", status: false });
  }

  const birthDay = birthDate.getUTCDate();
  const birthMonth = birthDate.getUTCMonth() + 1;

  let zodiacData;
  let zodiacNumber;

  //Astrological Signs
  if ((birthMonth === 4 && birthDay >= 13) || (birthMonth === 5 && birthDay <= 14)) { zodiacData = 'ราศีเมษ'; zodiacNumber = 1;
  } else if ((birthMonth === 5 && birthDay >= 15) || (birthMonth === 4 && birthDay <= 14)) { zodiacData = 'ราศีพฤษภ'; zodiacNumber = 2;
  } else if ((birthMonth === 6 && birthDay >= 15) || (birthMonth === 7 && birthDay <= 14)) { zodiacData = 'ราศีเมถุน'; zodiacNumber = 3;
  } else if ((birthMonth === 7 && birthDay >= 15) || (birthMonth === 8 && birthDay <= 15)) { zodiacData = 'ราศีกรกฎ'; zodiacNumber = 4;
  } else if ((birthMonth === 8 && birthDay >= 16) || (birthMonth === 9 && birthDay <= 16)) { zodiacData = 'ราศีสิงห์';zodiacNumber = 5;
  } else if ((birthMonth === 9 && birthDay >= 17) || (birthMonth === 10 && birthDay <= 16)) { zodiacData = 'ราศีกันย์'; zodiacNumber = 6;
  } else if ((birthMonth === 10 && birthDay >= 17) || (birthMonth === 11 && birthDay <= 15)) { zodiacData = 'ราศีตุลย์'; zodiacNumber = 7;
  } else if ((birthMonth === 11 && birthDay >= 16) || (birthMonth === 12 && birthDay <= 15)) { zodiacData = 'ราศีพิจิก'; zodiacNumber = 8;
  } else if ((birthMonth === 12 && birthDay >= 16) || (birthMonth === 1 && birthDay <= 14)) { zodiacData = 'ราศีธนู'; zodiacNumber = 9;
  } else if ((birthMonth === 1 && birthDay >= 15) || (birthMonth === 2 && birthDay <= 12)) {zodiacData = 'ราศีมังกร'; zodiacNumber = 10;
  } else if ((birthMonth === 2 && birthDay >= 13) || (birthMonth === 3 && birthDay <= 14)) {zodiacData = 'ราศีกุมภ์'; zodiacNumber = 11;
  } else if ((birthMonth === 3 && birthDay >= 15) || (birthMonth === 4 && birthDay <= 12)) {zodiacData = 'ราศีมีน'; zodiacNumber = 12; }

  res.send({ Zodiac_ID: zodiacNumber, message: "ราศีของคุณคือ" + zodiacData, status: true });
});

//////////////////////////////////Card API///////////////////////////////////////
//API Get count of Card
app.get('/api/get-count-card', VerifyTokens , async (req, res) => {
  const sql = "SELECT COUNT(*) AS Count FROM card";
  db.query(sql, (err, results) => {
    if (err) { return res.status(500).send({ message: 'เกิดข้อผิดพลาดในเซิร์ฟเวอร์', status: false });}
      const CardData = results[0];
      CardData['message'] = "ทำรายการสำเร็จ"
      CardData['status'] = true
      res.send(CardData);
  });
});

//API Get Card By ID
app.get('/api/get-card/:id', VerifyTokens ,async (req, res) => {
  const { id } = req.params;
  if(!id || typeof id !== 'string'){ res.status(404).send({ message: "ต้องมี ID", status: false });}
  const sql = "SELECT * FROM card WHERE Card_ID = ?";
  db.query(sql, [id], (err, results) => {
    if (err) { return res.status(500).send({ message: 'เกิดข้อผิดพลาดในเซิร์ฟเวอร์', status: false });}
    if(results.length > 0){
      const CardData = results[0];
      CardData['message'] = "ทำรายการสำเร็จ"
      CardData['status'] = true
      res.send(CardData);
    }else{
      res.status(404).send({ message: "ไม่พบข้อมูล",status: false });
    }
  });
});

//////////////////////////////////PlayCard API///////////////////////////////////////
//API Add PlayCard
app.post('/api/add-playcard', VerifyTokens , async (req, res) => {
  let {Users_ID, Card_ID } = req.body;

  if(!Users_ID || !Card_ID ||
    typeof Users_ID !== 'string' || typeof Card_ID !== 'string'){
    res.status(404).send({ message: "จำเป็นต้องมีข้อมูล", status: false });
  }

  if(req.users_decoded.Users_ID != Users_ID){
    return res.status(404).send({ message: 'คุณไม่สิทธ์ทำรายการนี้', status: false });
  }

  Users_ID = xss(validator.escape(Users_ID));
  Card_ID = xss(validator.escape(Card_ID));

  const sql = "INSERT INTO playcard( Users_ID, Card_ID)VALUES(?,?)";
  db.query(sql,[Users_ID,Card_ID], (err,result) => {
    if (err) { return res.status(500).send({ message: 'เกิดข้อผิดพลาดในเซิร์ฟเวอร์', status: false });}
    if(result.affectedRows > 0){
      res.send({ message: "จัดการข้อมูลสำเร็จ",status: true });
    }else{
      res.status(404).send({ message: "จัดการข้อมูลไม่สำเร็จ",status: false });
    }
  });
});

//API Get PlayCard By ID
app.get('/api/get-playcard/:id', VerifyTokens, async (req, res) => {
  const { id } = req.params;
  if(!id || typeof id !== 'string'){ res.status(404).send({ message: "ต้องมี ID", status: false });}
  const sql = "SELECT * FROM playcard WHERE PlayCard_ID = ?";
  db.query(sql, [id], (err, results) => {
    if (err) { return res.status(500).send({ message: 'เกิดข้อผิดพลาดในเซิร์ฟเวอร์', status: false });}
    if(results.length > 0){
      const CardData = results[0];
      CardData['message'] = "ทำรายการสำเร็จ"
      CardData['status'] = true
      res.send(CardData);
    }else{
      res.status(404).send({ message: "ไม่พบข้อมูล",status: false });
    }
  });
});

//////////////////////////////////HandDetail API///////////////////////////////////////
//API Get HandDetail By ID
app.get('/api/get-handdetail/:id', VerifyTokens ,async (req, res) => {
  const { id } = req.params;
  if(!id || typeof id !== 'string'){ res.status(404).send({ message: "ต้องมี ID", status: false });}
  const sql = "SELECT * FROM handdetail WHERE HandDetail_ID = ?";
  db.query(sql, [id], (err, results) => {
    if (err) { return res.status(500).send({ message: 'เกิดข้อผิดพลาดในเซิร์ฟเวอร์', status: false });}
    if(results.length > 0){
      const CardData = results[0];
      CardData['message'] = "ทำรายการสำเร็จ"
      CardData['status'] = true
      res.send(CardData);
    }else{
      res.status(404).send({ message: "ไม่พบข้อมูล",status: false });
    }
  });
});
//////////////////////////////////PlayHand API///////////////////////////////////////
// API Add PlayHand
app.post('/api/add-playhand', VerifyTokens, async (req, res) => {
  try {
    const { Users_ID, HandDetail_ID, PlayHand_Score, PlayHand_ImageFile } = req.body;

    if (!Users_ID || !HandDetail_ID || !PlayHand_Score || !PlayHand_ImageFile ||
      typeof Users_ID !== 'string' || typeof HandDetail_ID !== 'string' ||
      typeof PlayHand_Score !== 'string' || typeof PlayHand_ImageFile !== 'string') {
      return res.status(400).send({ message: "ข้อมูลไม่ถูกต้อง", status: false });
    }

    if (req.users_decoded.Users_ID != Users_ID) {
      return res.status(403).send({ message: 'คุณไม่มีสิทธิ์ทำรายการนี้', status: false });
    }

    const sanitizedData = {
      Users_ID: xss(validator.escape(Users_ID)),
      HandDetail_ID: xss(validator.escape(HandDetail_ID)),
      PlayHand_Score: xss(validator.escape(PlayHand_Score)),
      PlayHand_ImageFile: xss(validator.escape(PlayHand_ImageFile)).replace(/&#x2F;/g, '/')
    };

    const sql = "INSERT INTO playhand (Users_ID, HandDetail_ID, PlayHand_Score, PlayHand_ImageFile) VALUES (?, ?, ?, ?)";
    db.query(sql, Object.values(sanitizedData), (err, result) => {
      if (err) {
        return res.status(500).send({ message: 'เกิดข้อผิดพลาดในเซิร์ฟเวอร์', status: false });
      }
      if (result.affectedRows > 0) {
        res.send({ message: "ทำรายการสำเร็จ", status: true });
      } else {
        res.status(500).send({ message: "ไม่สามารถจัดการข้อมูลได้", status: false });
      }
    });
  } catch (error) {
    res.status(500).send({ message: 'เกิดข้อผิดพลาด', status: false });
  }
});

//////////////////////////////////SummaryDetail API///////////////////////////////////////
//API Get SummaryDetail By ID
app.get('/api/get-summarydetail/:id' , VerifyTokens , async (req, res) => {
  const { id } = req.params;
  if(!id || typeof id !== 'string'){ res.status(404).send({ message: "ต้องมี ID", status: false });}
  const sql = "SELECT * FROM summarydetail WHERE SummaryDetail_ID = ?";
  db.query(sql, [id], (err, results) => {
    if (err) { return res.status(500).send({ message: 'เกิดข้อผิดพลาดในเซิร์ฟเวอร์', status: false });}
    if(results.length > 0){
      const CardData = results[0];
      CardData['message'] = "ทำรายการสำเร็จ"
      CardData['status'] = true
      res.send(CardData);
    }else{
      res.status(404).send({ message: "ไม่พบข้อมูล",status: false });
    }
  });
});

//////////////////////////////////Summary API///////////////////////////////////////
//API Add Summary
app.post('/api/add-summary' , VerifyTokens , async (req, res) => {
  let {Summary_TotalScore, Users_ID, Zodiac_ID, PlayCard_ID, PlayHand_ID } = req.body;

  if(!Summary_TotalScore || !Users_ID || !Zodiac_ID || !PlayCard_ID || !PlayHand_ID ||
    typeof Summary_TotalScore !== 'string' || typeof Users_ID !== 'string' ||
    typeof Zodiac_ID !== 'string' || typeof PlayCard_ID !== 'string' ||
    typeof PlayHand_ID !== 'string'){
    res.status(404).send({ message: "จำเป็นต้องมีข้อมูล", status: false });
  }

  if(req.users_decoded.Users_ID != Users_ID){
    return res.status(404).send({ message: 'คุณไม่สิทธ์ทำรายการนี้', status: false });
  }

  Summary_TotalScore = xss(validator.escape(Summary_TotalScore));
  Users_ID = xss(validator.escape(Users_ID));
  Zodiac_ID = xss(validator.escape(Zodiac_ID));
  PlayCard_ID = xss(validator.escape(PlayCard_ID));
  PlayHand_ID = xss(validator.escape(PlayHand_ID));

  const sql = "INSERT INTO summary( Summary_TotalScore, Users_ID, Zodiac_ID, PlayCard_ID, PlayHand_ID )VALUES(?,?,?,?,?)";
  db.query(sql,[Summary_TotalScore, Users_ID, Zodiac_ID, PlayCard_ID, PlayHand_ID], (err,result) => {
    if (err) { return res.status(500).send({ message: 'เกิดข้อผิดพลาดในเซิร์ฟเวอร์', status: false });}
    if(result.affectedRows > 0){
      res.send({ message: "จัดการข้อมูลสำเร็จ",status: true });
    }else{
      res.status(404).send({ message: "จัดการข้อมูลไม่สำเร็จ",status: false });
    }
  });
});

//////////////////////////////////History Of Android Application///////////////////////////////////////
//API Get PlayHand By Top 7 RegisDate time
app.get('/api/get-playhand-top7/:id', VerifyTokens ,async (req, res) => {
  const { id } = req.params;
  if(!id || typeof id !== 'string'){ res.status(404).send({ message: "ต้องมี ID", status: false });}

  if(req.users_decoded.Users_ID != id){
    return res.status(404).send({ message: 'คุณไม่สิทธ์ทำรายการนี้', status: false });
  }

  const sql = "SELECT * FROM playhand WHERE Users_ID = ? ORDER BY PlayHand_RegisDate DESC LIMIT 7";
  db.query(sql, [id], (err, results) => {
    if (err) { return res.status(500).send({ message: 'เกิดข้อผิดพลาดในเซิร์ฟเวอร์', status: false });}
    if(results.length > 0){
      const playHandData = results
      res.send(playHandData);
    }else{
      res.status(404).send({ message: "ไม่พบข้อมูล",status: false })
    }
  });
});

//API Get PlayCard By Top 7 RegisDate time
app.get('/api/get-playcard-top7/:id', VerifyTokens ,async (req, res) => {
  const { id } = req.params;
  if(!id || typeof id !== 'string'){ res.status(404).send({ message: "ต้องมี ID", status: false });}

  if(req.users_decoded.Users_ID != id){
    return res.status(404).send({ message: 'คุณไม่สิทธ์ทำรายการนี้', status: false });
  }

  const sql = "SELECT * FROM playcard WHERE Users_ID = ? ORDER BY PlayCard_RegisDate DESC LIMIT 7";
  db.query(sql, [id], (err, results) => {
    if (err) { return res.status(500).send({ message: 'เกิดข้อผิดพลาดในเซิร์ฟเวอร์', status: false });}
    if(results.length > 0){
      const PlayCardData = results
      res.send(PlayCardData);
    }else{
      res.status(404).send({ message: "ไม่พบข้อมูล",status: false })
    }
  });
});

//API Get PlayHand By Top 1 RegisDate time
app.get('/api/get-playhand-top1/:id', VerifyTokens ,async (req, res) => {
  const { id } = req.params;
  if(!id || typeof id !== 'string'){ res.status(404).send({ message: "ต้องมี ID", status: false });}

  if(req.users_decoded.Users_ID != id){
    return res.status(404).send({ message: 'คุณไม่สิทธ์ทำรายการนี้', status: false });
  }

  const sql = "SELECT * FROM playhand WHERE Users_ID = ? ORDER BY PlayHand_RegisDate DESC LIMIT 1";
  db.query(sql, [id], (err, results) => {
    if (err) { return res.status(500).send({ message: 'เกิดข้อผิดพลาดในเซิร์ฟเวอร์', status: false });}
    if(results.length > 0){
      const PlayHandData = results[0];
      PlayHandData['message'] = "ทำรายการสำเร็จ"
      PlayHandData['status'] = true
      res.send(PlayHandData);
    }else{
      res.status(404).send({ message: "ไม่พบข้อมูล",status: false });
    }
  });
});

//API Get PlayCard By Top 1 RegisDate time
app.get('/api/get-playcard-top1/:id', VerifyTokens ,async (req, res) => {
  const { id } = req.params;
  if(!id || typeof id !== 'string'){ re.status(404).send({ message: "ต้องมี ID", status: false });}

  if(req.users_decoded.Users_ID != id){
    return res.status(404).send({ message: 'คุณไม่สิทธ์ทำรายการนี้', status: false });
  }

  const sql = "SELECT * FROM playcard WHERE Users_ID = ? ORDER BY PlayCard_RegisDate DESC LIMIT 1";
  db.query(sql, [id], (err, results) => {
    if (err) { return res.status(500).send({ message: 'เกิดข้อผิดพลาดในเซิร์ฟเวอร์', status: false });}
    if(results.length > 0){
      const PlayCardData = results[0];
      PlayCardData['message'] = "ทำรายการสำเร็จ"
      PlayCardData['status'] = true
      res.send(PlayCardData);
    }else{
      res.status(404).send({ message: "ไม่พบข้อมูล",status: false });
    }
  });
});



//////////////////////////////////Dashboard Of Web React///////////////////////////////////////
//API Get count of Users
app.get('/api/get-count-users', VerifyTokens ,async (req, res) => {
  if(req.users_decoded.UsersType_ID != 2){
    return res.status(404).send({ message: 'คุณไม่สิทธ์ทำรายการนี้', status: false });
  }
  const sql = "SELECT COUNT(*) AS Count FROM users";
  db.query(sql, (err, results) => {
    if (err) { return res.status(500).send({ message: 'เกิดข้อผิดพลาดในเซิร์ฟเวอร์', status: false });}
      const CardData = results[0];
      CardData['message'] = "ทำรายการสำเร็จ"
      CardData['status'] = true
      res.send(CardData);
  });
});

//API Get count of Users Online
app.get('/api/get-count-users-online', VerifyTokens ,async (req, res) => {
  if(req.users_decoded.UsersType_ID != 2){
    return res.status(404).send({ message: 'คุณไม่สิทธ์ทำรายการนี้', status: false });
  }
  const sql = "SELECT COUNT(*) AS Count FROM users WHERE Users_IsActive = 1";
  db.query(sql, (err, results) => {
    if (err) { return res.status(500).send({ message: 'เกิดข้อผิดพลาดในเซิร์ฟเวอร์', status: false });}
      const CardData = results[0];
      CardData['message'] = "ทำรายการสำเร็จ"
      CardData['status'] = true
      res.send(CardData);
  });
});

//API Get count of Users Offline
app.get('/api/get-count-users-offline', VerifyTokens ,async (req, res) => {
  if(req.users_decoded.UsersType_ID != 2){
    return res.status(404).send({ message: 'คุณไม่สิทธ์ทำรายการนี้', status: false });
  }

  const sql = "SELECT COUNT(*) AS Count FROM users WHERE Users_IsActive = 0";
  db.query(sql, (err, results) => {
    if (err) { return res.status(500).send({ message: 'เกิดข้อผิดพลาดในเซิร์ฟเวอร์', status: false });}
      const CardData = results[0];
      CardData['message'] = "ทำรายการสำเร็จ"
      CardData['status'] = true
      res.send(CardData);
  });
});

//API Get count of playhand
app.get('/api/count-playhand', VerifyTokens, (req, res) => {
  if(req.users_decoded.UsersType_ID != 2){
    return res.status(404).send({ message: 'คุณไม่สิทธ์ทำรายการนี้', status: false });
  }

  const query = 'SELECT COUNT(PlayHand_ID) AS Count FROM playhand';
  db.query(query, (err, results) => {
    if (err) { return res.status(500).send({ message: 'เกิดข้อผิดพลาดในเซิร์ฟเวอร์', status: false });}
    const playhand = results[0];
    playhand['message'] = "ทำรายการสำเร็จ"
    playhand['status'] = true
    res.send(playhand);
  });
});

//API Get count of playcard
app.get('/api/count-playcard', VerifyTokens, (req, res) => {
  if(req.users_decoded.UsersType_ID != 2){
    return res.status(404).send({ message: 'คุณไม่สิทธ์ทำรายการนี้', status: false });
  }

  const query = 'SELECT COUNT(PlayCard_ID) AS Count FROM playcard';
  db.query(query, (err, results) => {
    if (err) { return res.status(500).send({ message: 'เกิดข้อผิดพลาดในเซิร์ฟเวอร์', status: false });}
    const playcard = results[0];
    playcard['message'] = "ทำรายการสำเร็จ"
    playcard['status'] = true
    res.send(playcard);
  });
});

//API Get count of Summary
app.get('/api/count-playsummary', VerifyTokens, (req, res) => {
  if(req.users_decoded.UsersType_ID != 2){
    return res.status(404).send({ message: 'คุณไม่สิทธ์ทำรายการนี้', status: false });
  }
  
  const query = 'SELECT COUNT(Summary_ID) AS Count FROM summary';
  db.query(query, (err, results) => {
    if (err) { return res.status(500).send({ message: 'เกิดข้อผิดพลาดในเซิร์ฟเวอร์', status: false });}
    const Summary = results[0];
    Summary['message'] = "ทำรายการสำเร็จ"
    Summary['status'] = true
    res.send(Summary);
  });
});

//API Get count of playcard By Date
app.post('/api/count-playcard-date', VerifyTokens,(req, res) => {
  let {Month , Years } = req.body;

  if(!Month || !Years || typeof Month !== 'string' || typeof Years !== 'string'){
    return res.status(404).send({ message: "จำเป็นต้องมีข้อมูล", status: false });
  }

  Month = xss(validator.escape(Month));
  Years = xss(validator.escape(Years));

  if(req.users_decoded.UsersType_ID != 2){
    return res.status(404).send({ message: 'คุณไม่สิทธ์ทำรายการนี้', status: false });
  }

  const query = 'SELECT COUNT(*) AS Count FROM playcard WHERE ' +
  'MONTH(PlayCard_RegisDate) = ? AND YEAR(PlayCard_RegisDate) = ?';
  db.query(query,[ Month, Years], (err, results) => {
    if (err) { return res.status(500).send({ message: 'เกิดข้อผิดพลาดในเซิร์ฟเวอร์', status: false });}
    const playcard = results[0];
    playcard['message'] = "ทำรายการสำเร็จ"
    playcard['status'] = true
    res.send(playcard);
  });
});

//API Get count of playhand By Date
app.post('/api/count-playhand-date', VerifyTokens,(req, res) => {
  let {Month , Years } = req.body;

  if(!Month || !Years || typeof Month !== 'string' || typeof Years !== 'string'){
    return res.status(404).send({ message: "จำเป็นต้องมีข้อมูล", status: false });
  }

  if(req.users_decoded.UsersType_ID != 2){
    return res.status(404).send({ message: 'คุณไม่สิทธ์ทำรายการนี้', status: false });
  }

  Month = xss(validator.escape(Month));
  Years = xss(validator.escape(Years));

  const query = 'SELECT COUNT(*) AS Count FROM playhand WHERE ' +
  'MONTH(PlayHand_RegisDate) = ? AND YEAR(PlayHand_RegisDate) = ?';
  db.query(query,[ Month, Years], (err, results) => {
    if (err) { return res.status(500).send({ message: 'เกิดข้อผิดพลาดในเซิร์ฟเวอร์', status: false });}
    const playhand = results[0];
    playhand['message'] = "ทำรายการสำเร็จ"
    playhand['status'] = true
    res.send(playhand);
  });
});

//API Get count of Summary By Date
app.get('/api/count-summary-date', VerifyTokens ,(req, res) => {
  let {Month , Years } = req.body;

  if(!Month || !Years || typeof Month !== 'string' || typeof Years !== 'string'){
    return res.status(404).send({ message: "จำเป็นต้องมีข้อมูล", status: false });
  }

  if(req.users_decoded.UsersType_ID != 2){
    return res.status(404).send({ message: 'คุณไม่สิทธ์ทำรายการนี้', status: false });
  }

  Month = xss(validator.escape(Month));
  Years = xss(validator.escape(Years));

  const query = 'SELECT COUNT(*) AS Count FROM summary WHERE ' +
  'MONTH(Summary_RegisDate) = ? AND YEAR(Summary_RegisDate) = ?';
  db.query(query,[ Month, Years], (err, results) => {
    if (err) { return res.status(500).send({ message: 'เกิดข้อผิดพลาดในเซิร์ฟเวอร์', status: false });}
    const playhand = results[0];
    playhand['message'] = "ทำรายการสำเร็จ"
    playhand['status'] = true
    res.send(playhand);
  });
});
//////////////////////////////////Admin API///////////////////////////////////////
//API Login admin of Web Reach
app.post('/api/login-admin', loginRateLimiter, async (req, res) => {
  let { Users_Username, Users_Password } = req.body;

  if (!Users_Username || !Users_Password ||
    typeof Users_Username !== 'string' || typeof Users_Password !=='string' ) {
    return res.status(404).send({ message: 'กรุณากรอก Username และ Password', status: false });
  }

  Users_Username = xss(validator.escape(Users_Username))
  Users_Password = xss(validator.escape(Users_Password))

  const sql_check_username = "SELECT COUNT(*) AS count FROM users WHERE Users_Username = ? OR Users_Email = ? AND UsersType_ID = 2 AND Users_IsActive = 1";
  db.query(sql_check_username, [Users_Username,Users_Username], async (err, result) => {
    if (err) { return res.status(500).send({ message: 'เกิดข้อผิดพลาดในเซิร์ฟเวอร์', status: false });}

    if (result[0].count > 0) {
      const sql_get_password = "SELECT Users_Password FROM users WHERE Users_Username = ? OR Users_Email = ? AND UsersType_ID = 2 AND Users_IsActive = 1";
      db.query(sql_get_password, [Users_Username,Users_Username], async (err, result) => {
        if (err) { return res.status(500).send({ message: 'เกิดข้อผิดพลาดในเซิร์ฟเวอร์', status: false });}
        
        const isCorrect = await bcrypt.compare(Users_Password, result[0].Users_Password);
        if (isCorrect) {
          const sql = "SELECT * FROM users WHERE Users_Username = ? OR Users_Email = ? AND UsersType_ID = 2 AND Users_IsActive = 1";
          db.query(sql, [Users_Username,Users_Username], async (err, result) => {
            if (err) {
              return res.status(500).send({ message: 'เกิดข้อผิดพลาดในเซิร์ฟเวอร์', status: false });
            }

            const user = result[0];
            const Tokens = GenerateTokens(user.Users_ID, user.Users_Username,user.Users_Email, user.UsersType_ID, 1);

            user['token'] = Tokens;
            user['message'] = "Password ถูกต้อง"
            user['status'] = true
            res.send(user);
          });
        } else {
          res.status(404).send({ message: "Password ไม่ถูกต้อง",status: false });
        }
      });
    } else {
      res.status(404).send({ message: "ไม่พบบัญชีผู้ใช้นี้",status: false });
    }
  });
});

//API Add Admin of Web Reach
app.post('/api/admin-add' ,VerifyTokens , async (req, res) => {
  let { Users_Email, Users_Username, Users_Password } = req.body;

  if (!Users_Email || !Users_Username || !Users_Password || 
    typeof Users_Username !== "string" || typeof Users_Email !== "string" || typeof Users_Password !== "string") {
    return res.status(404).send({ message: 'จำเป็นต้องมีข้อมูล', status: false });
  }

  if(req.users_decoded.UsersType_ID != 2){
    return res.status(404).send({ message: 'คุณไม่สิทธ์ทำรายการนี้', status: false });
  }

  Users_Email = xss(validator.normalizeEmail(Users_Email))
  Users_Username = xss(validator.escape(Users_Username))
  Users_Password = xss(validator.escape(Users_Password))

  const sql_check_username = "SELECT COUNT(*) AS count FROM users WHERE Users_Username = ? OR Users_Email = ?";
  
  db.query(sql_check_username, [Users_Username, Users_Email], async (err, result) => {
    if (err) { return res.status(500).send({ message: 'เกิดข้อผิดพลาดในเซิร์ฟเวอร์', status: false });}

    if (result[0].count > 0) { 
      return res.status(404).send({ message: "มีชื่อผู้ใช้นี้อยู่ในระบบอยู่แล้ว", status: false });
  } else {
      const NewPassword = await bcrypt.hash(Users_Password, saltRounds);
      const sql = "INSERT INTO users (Users_Email, Users_Username, Users_DisplayName, Users_Password, UsersType_ID) VALUES (?, ?, ?, ?, 2)";
      
      db.query(sql, [Users_Email, Users_Username, Users_Username, NewPassword], (err) => {
        if (err) { return res.status(500).send({ message: 'เกิดข้อผิดพลาดในเซิร์ฟเวอร์', status: false });}
        res.send({ message: "ลงทะเบียน Admin สำเร็จเรียบร้อยแล้ว", status: true });
      });
    }
  });
});

//API Get All Profile web admin
app.get('/api/get-profile', VerifyTokens ,async (req, res) => {
  if(req.users_decoded.UsersType_ID != 2){
    return res.status(404).send({ message: 'คุณไม่สิทธ์ทำรายการนี้', status: false });
  }

  const sql = "SELECT u.*,g.UsersGender_Name,ut.UsersType_Name,rt.RegisType_Name FROM"+
  "(((users u INNER JOIN usersgender g ON u.UsersGender_ID = G.UsersGender_ID)"+
  "INNER JOIN userstype ut ON u.UsersType_ID = ut.UsersType_ID)INNER JOIN"+
  " registype rt ON u.RegisType_ID = rt.RegisType_ID)";
  db.query(sql, (err, results) => {
    if (err) { return res.status(500).send({ message: 'เกิดข้อผิดพลาดในเซิร์ฟเวอร์', status: false });}
    if(results.length > 0){
      const profileData = results
      res.send(profileData);
    }else{
      res.status(404).send({ message: "ไม่พบข้อมูล",status: false })
    }
  });
});

//API Update Profile web admin
app.put('/api/update-profile-web/:id', VerifyTokens ,async (req, res) => {
  const { id } = req.params;
  let { Users_DisplayName, Users_FirstName, Users_LastName,
    Users_Phone, Users_BirthDate, UsersGender_ID, Users_IsActive} = req.body;
 
  if(!id || typeof id !== 'string'){
    return res.status(404).send({ message: "ต้องมี ID", status: false });
  }

  if(!Users_DisplayName || !Users_FirstName || !Users_LastName ||
     !Users_Phone || !Users_BirthDate || !UsersGender_ID || !Users_IsActive ||
    typeof Users_DisplayName !== "string" || typeof Users_FirstName !== "string" ||
    typeof Users_LastName !== "string" || typeof Users_Phone !== "string" ||
    typeof Users_BirthDate !== "string" || typeof UsersGender_ID !== "string" ||
    typeof Users_IsActive !== "string"){
    return res.status(404).send({ message: "จำเป็นต้องมีข้อมูล", status: false });
  }

  Users_DisplayName = xss(validator.escape(Users_DisplayName))
  Users_FirstName = xss(validator.escape(Users_FirstName))
  Users_LastName = xss(validator.escape(Users_LastName))
  Users_Phone = xss(validator.escape(Users_Phone))
  Users_BirthDate = xss(validator.escape(Users_BirthDate))
  UsersGender_ID = xss(validator.escape(UsersGender_ID))
  Users_IsActive = xss(validator.escape(Users_IsActive))

  if(req.users_decoded.UsersType_ID != 2){
    return res.status(404).send({ message: 'คุณไม่สิทธ์ทำรายการนี้', status: false });
  }
 
  const sql_check_id = "SELECT COUNT(*) AS count FROM Users WHERE Users_ID = ?";
  db.query(sql_check_id, [id], async (err, result) => {
    if (err) { return res.status(500).send({ message: 'เกิดข้อผิดพลาดในเซิร์ฟเวอร์', status: false });}
 
    if (result[0].count > 0) {
      const sql = "UPDATE Users SET Users_DisplayName = ?, Users_FirstName = ?, " +
      " Users_LastName = ?, Users_Phone = ?, Users_BirthDate = ?, UsersGender_ID = ?, Users_IsActive = ?" +
      " WHERE Users_ID = ?";
      db.query(sql, [Users_DisplayName, Users_FirstName ,Users_LastName ,
        Users_Phone ,Users_BirthDate ,UsersGender_ID , Users_IsActive ,id], async (err, result) => {
        if (err) { return res.status(500).send({ message: 'เกิดข้อผิดพลาดในเซิร์ฟเวอร์', status: false });}
 
        if(result.affectedRows > 0){
          res.send({ message: "อัพเดทข้อมูลสำเร็จ",status: true });
        }else{
          res.status(404).send({ message: "ไม่สามารถอัพเดทข้อมูลได้",status: false });
        }
      });
    }else{
      res.status(404).send({ message: "ไม่พบผู้ใช้",status: false });
    }
  });
});

//Update Zodiac API web admin
app.put('/api/update-zodiac/:id', VerifyTokens ,async (req, res) => {
  const { id } = req.params;
  let {Zodiac_Name, Zodiac_Detail, Zodiac_WorkTopic, Zodiac_FinanceTopic, Zodiac_LoveTopic, Zodiac_Score } = req.body;

  if(!id || typeof id !== 'string'){
    return res.status(404).send({ message: "ต้องมี ID", status: false });
  }

  if(!Zodiac_Name || !Zodiac_Detail || !Zodiac_WorkTopic || !Zodiac_FinanceTopic || !Zodiac_LoveTopic || !Zodiac_Score ||
    typeof Zodiac_Name !== "string" || typeof Zodiac_Detail !== "string" || typeof Zodiac_WorkTopic !== "string" ||
    typeof Zodiac_FinanceTopic !== "string" || typeof Zodiac_LoveTopic !== "string" || typeof Zodiac_Score !== "string"){
    return res.status(404).send({ message: "จำเป็นต้องมีข้อมูล", status: false });
  }

  Zodiac_Name = xss(validator.escape(Zodiac_Name))
  Zodiac_Detail = xss(validator.escape(Zodiac_Detail))
  Zodiac_WorkTopic = xss(validator.escape(Zodiac_WorkTopic))
  Zodiac_FinanceTopic = xss(validator.escape(Zodiac_FinanceTopic))
  Zodiac_LoveTopic = xss(validator.escape(Zodiac_LoveTopic))
  Zodiac_Score = xss(validator.escape(Zodiac_Score))

  if(req.users_decoded.UsersType_ID != 2){
    return res.status(404).send({ message: 'คุณไม่สิทธ์ทำรายการนี้', status: false });
  }

  const sql_check_id = "SELECT COUNT(*) AS count FROM zodiac WHERE Zodiac_ID = ?";
  db.query(sql_check_id, [id], async (err, result) => {
    if (err) { return res.status(500).send({ message: 'เกิดข้อผิดพลาดในเซิร์ฟเวอร์', status: false });}

    if (result[0].count > 0) {
      const sql = "UPDATE zodiac SET Zodiac_Name = ?, Zodiac_Detail = ?, Zodiac_WorkTopic = ?" +
        ",Zodiac_FinanceTopic = ?, Zodiac_LoveTopic = ?, Zodiac_Score = ? WHERE Zodiac_ID = ?"
      db.query(sql,[Zodiac_Name, Zodiac_Detail, Zodiac_WorkTopic, 
        Zodiac_FinanceTopic, Zodiac_LoveTopic, Zodiac_Score, id], (err,result)=> {
        if (err) { return res.status(500).send({ message: 'เกิดข้อผิดพลาดในเซิร์ฟเวอร์', status: false });}
        if(result.affectedRows > 0){
          res.send({ message: "เพิ่มข้อมูลสำเร็จ",status: true });
        }else{
          res.status(404).send({ message: "เพิ่มข้อมูลไม่สำเร็จ",status: false });
        }
      });
    }else{
      res.status(404).send({ message: "ไม่พบข้อมูล",status: false });
    }
  });
});

//API Update Zodiac Image
app.put('/api/update-Zodiac-image/:id' , VerifyTokens, upload.single('Zodiac_Image') ,async (req, res) => {
  const { id } = req.params;
  if(!id || typeof id !== 'string'){ return res.send({ message: "ต้องมี ID", status: false });}
  if (!req.file) { return res.status(404).send({ message: "ต้องมีภาพประกอบ", status: false });}

  if(req.users_decoded.UsersType_ID != 2){
    return res.status(404).send({ message: 'คุณไม่สิทธ์ทำรายการนี้', status: false });
  }
  
  const sql_check_id = "SELECT COUNT(*) AS count FROM zodiac WHERE Zodiac_ID = ?";
  db.query(sql_check_id, [id], async (err, result) => {
    if (err) { return res.status(500).send({ message: 'เกิดข้อผิดพลาดในเซิร์ฟเวอร์', status: false });}

    if (result[0].count > 0) {
      const uniqueName = uuidv4();
      const ext = path.extname(req.file.originalname);
      const resizedImagePath = path.join(uploadDir_Zodiac, `${uniqueName}${ext}`);

      try {
        await sharp(req.file.buffer)
          .resize(1280, 1280) //1280x1280 pixels
          .toFile(resizedImagePath);
        const Zodiac_ImageURL = `/images/zodiac-images/${uniqueName}${ext}`;
        const sql = "UPDATE zodiac SET Zodiac_ImageFile = ? WHERE Zodiac_ID = ?";
        db.query(sql, [Zodiac_ImageURL, id], (err, result) => {
          if (err) { return res.status(500).send({ message: 'เกิดข้อผิดพลาดในเซิร์ฟเวอร์', status: false });}
          if(result.affectedRows > 0){
            res.send({ message: "อัพเดทรูปภาพสำเร็จ",status: true });
          }else{
            res.status(404).send({ message: "ไม่สามารถอัพเดทข้อมูลได้",status: false });
          }
        });
      }catch (error) {
        return res.status(404).send({ message: "เกิดข้อผิดพลาดในการประมวลผลภาพ", status: false });
      }
    }else{
      res.status(404).send({ message: "ไม่พบข้อมูล",status: false });
    }
  });
});

//API Delete Zodiac Image
app.delete('/api/delete-zodiac-image/:id', VerifyTokens, async (req, res) => {
  const { id } = req.params;
  let { imagePath } = req.body;

  if(!id || typeof id !== 'string'){
    return res.status(404).send({ message: "ต้องมี ID", status: false });
  }

  if (!imagePath || typeof imagePath !== "string") {
      return res.status(404).send({ message: "ต้องมี imagePath", status: false });
  }

  imagePath = xss(validator.escape(imagePath)).replace(/&#x2F;/g, '/')

  if(req.users_decoded.UsersType_ID != 2){
    return res.status(404).send({ message: 'คุณไม่สิทธ์ทำรายการนี้', status: false });
  }

  const sql = "SELECT Zodiac_ImageFile FROM zodiac WHERE Zodiac_ID = ?";
  db.query(sql, [id], async (err, result) => {
    if (err) { return res.status(500).send({ message: 'เกิดข้อผิดพลาดในเซิร์ฟเวอร์', status: false });}
    if(result.length > 0){
      const Zodiac_ImageFile = result[0].Zodiac_ImageFile;

      if(Zodiac_ImageFile == null){
        return res.status(404).send({ message: "ไม่พบรูปภาพ", status: false });
      }

      if(Zodiac_ImageFile == imagePath){
        return res.status(404).send({ message: "ไม่สามารถลบรูปภาพได้", status: false });
      }

      const sanitizedPath = imagePath.replace(/^\/+/, '');
      const fullPath = path.join(__dirname, sanitizedPath);
  
    fs.access(fullPath, fs.constants.F_OK, (err) => {
      if (err) {
        return res.status(404).send({ message: "ไม่พบไฟล์", status: false });
      }
      fs.unlink(fullPath, (err) => {
        if (err) {
            return res.status(404).send({ message: "ไม่สามารถลบไฟล์ได้", status: false });
        }
        res.send({ message: "ลบรูปภาพสำเร็จ", status: true });
      });
    });
    }else{
      return res.status(404).send({ message: "ไม่พบข้อมูล", status: false });
    }
  });
});

//Update Card API
app.put('/api/update-card/:id' , VerifyTokens ,async (req, res) => {
  const { id } = req.params;
  let {Card_Name, Card_WorkTopic, Card_FinanceTopic, Card_LoveTopic, 
    Card_WorkScore, Card_FinanceScore, Card_LoveScore } = req.body;

  if(!id || typeof id !== 'string'){
    return res.status(404).send({ message: "ต้องมี ID", status: false });
  }

  if(!Card_Name || !Card_WorkTopic || !Card_FinanceTopic || !Card_LoveTopic ||
     !Card_WorkScore || !Card_FinanceScore || !Card_LoveScore || 
    typeof Card_Name !== "string" || typeof Card_WorkTopic !== "string" ||
    typeof Card_FinanceTopic !== "string" || typeof Card_LoveTopic !== "string" ||
    typeof Card_WorkScore !== "string" || typeof Card_FinanceScore !== "string" ||
    typeof Card_LoveScore !== "string"){
    return res.status(404).send({ message: "จำเป็นต้องมีข้อมูล", status: false });
  }

  Card_Name = xss(validator.escape(Card_Name));
  Card_WorkTopic = xss(validator.escape(Card_WorkTopic));
  Card_FinanceTopic = xss(validator.escape(Card_FinanceTopic));
  Card_LoveTopic = xss(validator.escape(Card_LoveTopic));
  Card_WorkScore = xss(validator.escape(Card_WorkScore));
  Card_FinanceScore = xss(validator.escape(Card_FinanceScore));
  Card_LoveScore = xss(validator.escape(Card_LoveScore));

  if(req.users_decoded.UsersType_ID != 2){
    return res.status(404).send({ message: 'คุณไม่สิทธ์ทำรายการนี้', status: false });
  }

  const sql_check_id = "SELECT COUNT(*) AS count FROM card WHERE Card_ID = ?";
  db.query(sql_check_id, [id], async (err, result) => {
    if (err) { return res.status(500).send({ message: 'เกิดข้อผิดพลาดในเซิร์ฟเวอร์', status: false });}

    if (result[0].count > 0) {
      const sql = "UPDATE card SET Card_Name = ?, Card_WorkTopic = ?, Card_FinanceTopic = ?" +
        ",Card_LoveTopic = ?, Card_WorkScore = ?, Card_FinanceScore = ?, Card_LoveScore = ? WHERE Card_ID = ?"
      db.query(sql,[Card_Name, Card_WorkTopic, Card_FinanceTopic, 
        Card_LoveTopic, Card_WorkScore, Card_FinanceScore, Card_LoveScore, id], (err,result)=> {
        if (err) { return res.status(500).send({ message: 'เกิดข้อผิดพลาดในเซิร์ฟเวอร์', status: false });}
        if(result.affectedRows > 0){
          res.send({ message: "เพิ่มข้อมูลสำเร็จ",status: true });
        }else{
          res.status(404).send({ message: "เพิ่มข้อมูลไม่สำเร็จ",status: false });
        }
      });
    }else{
      res.status(404).send({ message: "ไม่พบข้อมูล",status: false });
    }
  });
});

//API Update Card Image
app.put('/api/update-card-image/:id', VerifyTokens, upload.single('Card_Image') ,async (req, res) => {
  const { id } = req.params;
  if(!id || typeof id !== 'string'){ return res.send({ message: "ต้องมี ID", status: false });}
  if (!req.file) { return res.send({ message: "ต้องมีภาพประกอบ", status: false });}

  if(req.users_decoded.UsersType_ID != 2){
    return res.status(404).send({ message: 'คุณไม่สิทธ์ทำรายการนี้', status: false });
  }

  const sql_check_id = "SELECT COUNT(*) AS count FROM card WHERE Card_ID = ?";
  db.query(sql_check_id, [id], async (err, result) => {
    if (err) { return res.status(500).send({ message: 'เกิดข้อผิดพลาดในเซิร์ฟเวอร์', status: false });}

    if (result[0].count > 0) {
      const uniqueName = uuidv4();
      const ext = path.extname(req.file.originalname);
      const resizedImagePath = path.join(uploadDir_Card, `${uniqueName}${ext}`);

      try {
        await sharp(req.file.buffer)
          .resize(285, 500) //285x500 pixels
          .toFile(resizedImagePath);
        const Card_ImageURL = `/images/card-images/${uniqueName}${ext}`;
        const sql = "UPDATE card SET Card_ImageFile = ? WHERE Card_ID = ?";
        db.query(sql, [Card_ImageURL, id], (err, result) => {
          if (err) { return res.status(500).send({ message: 'เกิดข้อผิดพลาดในเซิร์ฟเวอร์', status: false });}
          if(result.affectedRows > 0){
            res.send({ message: "อัพเดทรูปภาพสำเร็จ",status: true });
          }else{
            res.status(404).send({ message: "ไม่สามารถอัพเดทข้อมูลได้",status: false });
          }
        });
      }catch (error) {
        return res.status(404).send({ message: "เกิดข้อผิดพลาดในการประมวลผลภาพ", status: false });
      }
    }else{
      res.status(404).send({ message: "ไม่พบข้อมูล",status: false });
    }
  });
});

//API Delete Card Image
app.delete('/api/delete-card-image/:id', VerifyTokens , async (req, res) => {
  const { id } = req.params;
  let { imagePath } = req.body;

  if(!id || typeof id !== 'string'){
    return res.status(404).send({ message: "ต้องมี ID", status: false });
  }

  if (!imagePath || typeof imagePath !== "string") {
      return res.status(404).send({ message: "ต้องมี imagePath", status: false });
  }

  imagePath = xss(validator.escape(imagePath));
  
  if(req.users_decoded.UsersType_ID != 2){
    return res.status(404).send({ message: 'คุณไม่สิทธ์ทำรายการนี้', status: false });
  }

  const sql = "SELECT Card_ImageFile FROM card WHERE Card_ID = ?";
  db.query(sql, [id], async (err, result) => {
    if (err) { return res.status(500).send({ message: 'เกิดข้อผิดพลาดในเซิร์ฟเวอร์', status: false });}
    if(result.length > 0){
      const Card_ImageFile = result[0].Card_ImageFile;

      if(Card_ImageFile == null){
        return res.status(404).send({ message: "ไม่พบรูปภาพ", status: false });
      }

      if(Card_ImageFile == imagePath){
        return res.status(404).send({ message: "ไม่สามารถลบรูปภาพได้", status: false });
      }

      const sanitizedPath = imagePath.replace(/^\/+/, '');
      const fullPath = path.join(__dirname, sanitizedPath);
  
    fs.access(fullPath, fs.constants.F_OK, (err) => {
      if (err) {
        return res.status(404).send({ message: "ไม่พบไฟล์", status: false });
      }
      fs.unlink(fullPath, (err) => {
        if (err) {
            return res.status(404).send({ message: "ไม่สามารถลบไฟล์ได้", status: false });
        }
        res.send({ message: "ลบรูปภาพสำเร็จ", status: true });
      });
    });
    }else{
      return res.status(404).send({ message: "ไม่พบข้อมูล", status: false });
    }
  });
});

//API Get Card
app.get('/api/get-card', VerifyTokens ,async (req, res) => {
  if(req.users_decoded.UsersType_ID != 2){
    return res.status(404).send({ message: 'คุณไม่สิทธ์ทำรายการนี้', status: false });
  }

  const sql = "SELECT * FROM card";
  db.query(sql, (err, results) => {
    if (err) { return res.status(500).send({ message: 'เกิดข้อผิดพลาดในเซิร์ฟเวอร์', status: false });}
    if(results.length > 0){
      const CardData = results
      res.send(CardData);
    }else{
      res.status(404).send({ message: "ไม่พบข้อมูล",status: false })
    }
  
  });
});

//API Get PlayCard
app.get('/api/get-playcard', VerifyTokens ,async (req, res) => {
  if(req.users_decoded.UsersType_ID != 2){
    return res.status(404).send({ message: 'คุณไม่สิทธ์ทำรายการนี้', status: false });
  }

  const sql = "SELECT * FROM playcard";
  db.query(sql, (err, results) => {
    if (err) { return res.status(500).send({ message: 'เกิดข้อผิดพลาดในเซิร์ฟเวอร์', status: false });}
    if(results.length > 0){
      const CardData = results
      res.send(CardData);
    }else{
      res.status(404).send({ message: "ไม่พบข้อมูล",status: false })
    }
  
  });
});

//Update HandDetail API
app.put('/api/update-handdetail/:id', VerifyTokens ,async (req, res) => {
  const { id } = req.params;
  let {HandDetail_Name, HandDetail_Detail, HandDetail_MinPercent } = req.body;

  if(!id || typeof id !== 'string'){
    return res.status(404).send({ message: "ต้องมี ID", status: false });
  }

  if(!HandDetail_Name || !HandDetail_Detail || !HandDetail_MinPercent ||
    typeof HandDetail_Name !== "string" || typeof HandDetail_Detail !== "string" ||
    typeof HandDetail_MinPercent !== "string"){
    return res.status(404).send({ message: "จำเป็นต้องมีข้อมูล", status: false });
  }

  if(req.users_decoded.UsersType_ID != 2){
    return res.status(404).send({ message: 'คุณไม่สิทธ์ทำรายการนี้', status: false });
  }

  const sql_check_id = "SELECT COUNT(*) AS count FROM handdetail WHERE HandDetail_ID = ?";
  db.query(sql_check_id, [id], async (err, result) => {
    if (err) { return res.status(500).send({ message: 'เกิดข้อผิดพลาดในเซิร์ฟเวอร์', status: false });}

    if (result[0].count > 0) {
      const sql = "UPDATE handdetail SET HandDetail_Name = ?, HandDetail_Detail = ?" +
      ", HandDetail_MinPercent = ? WHERE HandDetail_ID = ?"
      db.query(sql,[ HandDetail_Name, HandDetail_Detail, HandDetail_MinPercent, id], (err,result)=> {
        if (err) { return res.status(500).send({ message: 'เกิดข้อผิดพลาดในเซิร์ฟเวอร์', status: false });}
        if(result.affectedRows > 0){
          res.send({ message: "แก้ไขข้อมูลสำเร็จ",status: true });
        }else{
          res.status(404).send({ message: "แก้ไขข้อมูลไม่สำเร็จ",status: false });
        }
      });
    }else{
      res.status(404).send({ message: "ไม่พบข้อมูล",status: false });
    }
  });
});

//API Get HandDetail
app.get('/api/get-handdetail', VerifyTokens ,async (req, res) => {
  if(req.users_decoded.UsersType_ID != 2){
    return res.status(404).send({ message: 'คุณไม่สิทธ์ทำรายการนี้', status: false });
  }
  const sql = "SELECT * FROM handdetail";
  db.query(sql, (err, results) => {
    if (err) { return res.status(500).send({ message: 'เกิดข้อผิดพลาดในเซิร์ฟเวอร์', status: false });}
    if(results.length > 0){
      const CardData = results
      res.send(CardData);
    }else{
      res.status(404).send({ message: "ไม่พบข้อมูล",status: false })
    }
  });
});

//Update SummaryDetail API
app.put('/api/update-summarydetail/:id', VerifyTokens , async (req, res) => {
  const { id } = req.params;
  let {SummaryDetail_Name, SummaryDetail_Detail, SummaryDetail_MinPercent } = req.body;

  if(!id || typeof id !== 'string'){
    return res.status(404).send({ message: "ต้องมี ID", status: false });
  }

  if(!SummaryDetail_Name || !SummaryDetail_Detail || !SummaryDetail_MinPercent ||
    typeof SummaryDetail_Name !== "string" || typeof SummaryDetail_Detail !== "string" ||
    typeof SummaryDetail_MinPercent !== "string"){
    return res.status(404).send({ message: "จำเป็นต้องมีข้อมูล", status: false });
  }

  SummaryDetail_Name = xss(validator.escape(SummaryDetail_Name))
  SummaryDetail_Detail = xss(validator.escape(SummaryDetail_Detail))
  SummaryDetail_MinPercent = xss(validator.escape(SummaryDetail_MinPercent))

  if(req.users_decoded.UsersType_ID != 2){
    return res.status(404).send({ message: 'คุณไม่สิทธ์ทำรายการนี้', status: false });
  }

  const sql_check_id = "SELECT COUNT(*) AS count FROM summarydetail WHERE SummaryDetail_ID = ?";
  db.query(sql_check_id, [id], async (err, result) => {
    if (err) { return res.status(500).send({ message: 'เกิดข้อผิดพลาดในเซิร์ฟเวอร์', status: false });}

    if (result[0].count > 0) {
      const sql = "UPDATE summarydetail SET SummaryDetail_Name = ?, SummaryDetail_Detail = ?" +
      ", SummaryDetail_MinPercent = ? WHERE SummaryDetail_ID = ?"
      db.query(sql,[ SummaryDetail_Name, SummaryDetail_Detail, SummaryDetail_MinPercent, id], (err,result)=> {
        if (err) { return res.status(500).send({ message: 'เกิดข้อผิดพลาดในเซิร์ฟเวอร์', status: false });}
        if(result.affectedRows > 0){
          res.send({ message: "แก้ไขข้อมูลสำเร็จ",status: true });
        }else{
          res.status(404).send({ message: "แก้ไขข้อมูลไม่สำเร็จ",status: false });
        }
      });
    }else{
      res.status(404).send({ message: "ไม่พบข้อมูล",status: false });
    }
  });
});

//API Get SummaryDetail
app.get('/api/get-summarydetail', VerifyTokens ,async (req, res) => {
  if(req.users_decoded.UsersType_ID != 2){
    return res.status(404).send({ message: 'คุณไม่สิทธ์ทำรายการนี้', status: false });
  }
  const sql = "SELECT * FROM summarydetail";
  db.query(sql, (err, results) => {
    if (err) { return res.status(500).send({ message: 'เกิดข้อผิดพลาดในเซิร์ฟเวอร์', status: false });}
    if(results.length > 0){
      const CardData = results
      res.send(CardData);
    }else{
      res.status(404).send({ message: "ไม่พบข้อมูล",status: false })
    }
  
  });
});

///////////////////////////////////////////////////////////////////////////////////////////////


app.listen(process.env.SERVER_PORT, function() {
  console.log(`Example app listening on port ${process.env.SERVER_PORT}`)
});



// const httpsServer = https.createServer(credentials, app);
// httpsServer.listen(process.env.SERVER_HTTPS_PORT, () => {
//     console.log(`HTTPS Server running on port ${process.env.SERVER_HTTPS_PORT}`);
// });

