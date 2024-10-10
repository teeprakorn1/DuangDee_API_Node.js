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
const multer = require('multer');
const sharp = require('sharp');
const https = require('https');
const path = require('path');
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

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

db.connect();
app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use('/images/profile-images', express.static(uploadDir_Profile));
app.use('/images/zodiac-images', express.static(uploadDir_Zodiac));
app.use('/images/card-images', express.static(uploadDir_Card));
app.use(cors())

const saltRounds = 14;
let otpStorage_Resets = {};
let otpStorage_Register = {};

//Verify Tokens API
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

//API Login admin of Web Reach
app.post('/api/login-admin',loginRateLimiter, async (req, res) => {
  const { Users_Username, Users_Password } = req.body;

  if (!Users_Username || !Users_Password) {
    return res.send({ message: 'กรุณากรอก Username และ Password', status: false });
  }

  const sql_check_username = "SELECT COUNT(*) AS count FROM Users WHERE Users_Username = ? OR Users_Email = ? AND UsersType_ID = 2 AND Users_IsActive = 1";
  db.query(sql_check_username, [Users_Username,Users_Username], async (err, result) => {
  if (err) throw err;

    if (result[0].count > 0) {
      const sql_get_password = "SELECT Users_Password FROM Users WHERE Users_Username = ? OR Users_Email = ? AND UsersType_ID = 2 AND Users_IsActive = 1";
      db.query(sql_get_password, [Users_Username,Users_Username], async (err, result) => {
        if (err) throw err;
        
        const isCorrect = await bcrypt.compare(Users_Password, result[0].Users_Password);
        if (isCorrect) {
          const sql = "SELECT * FROM Users WHERE Users_Username = ? OR Users_Email = ? AND UsersType_ID = 2 AND Users_IsActive = 1";
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

//API Update Profile Image
app.put('/api/update-profile-image/:id', upload.single('Profile_Image') ,async (req, res) => {
  const { id } = req.params;

  if(!id){
    return res.send({ message: "ต้องมี ID", status: false });
  }

  if (!req.file) {
    return res.send({ message: "ต้องมีภาพประกอบ", status: false });
  }

  const sql_check_id = "SELECT COUNT(*) AS count FROM Users WHERE Users_ID = ?";
  db.query(sql_check_id, [id], async (err, result) => {
    if (err) throw err;

    if (result[0].count > 0) {
      const uniqueName = uuidv4();
      const ext = path.extname(req.file.originalname);
      const resizedImagePath = path.join(uploadDir_Profile, `${uniqueName}${ext}`);

      try {
        await sharp(req.file.buffer)
          .resize(1280, 1280) //1280x1280 pixels
          .toFile(resizedImagePath);
        const Profile_ImageURL = `/images/profile-images/${uniqueName}${ext}`;
        const sql = "UPDATE Users SET Users_ImageFile = ? WHERE Users_ID = ?";
        db.query(sql, [Profile_ImageURL, id], (err, result) => {
          if (err) throw err;
          if(result.affectedRows > 0){
            res.send({ message: "อัพเดทรูปภาพสำเร็จ",status: true });
          }else{
            res.send({ message: "ไม่สามารถอัพเดทข้อมูลได้",status: false });
          }
        });
      }catch (error) {
        return res.send({ message: "เกิดข้อผิดพลาดในการประมวลผลภาพ", status: false });
      }
    }else{
      res.send({ message: "ไม่พบผู้ใช้",status: false });
    }
  });
});

//API Delete Profile Image
app.delete('/api/delete-profile-image/:id', async (req, res) => {
  const { id } = req.params;
  const { imagePath } = req.body;

  if(!id){
    return res.send({ message: "ต้องมี ID", status: false });
  }

  if (!imagePath) {
      return res.send({ message: "ต้องมี imagePath", status: false });
  }

  const sql = "SELECT Users_ImageFile FROM Users WHERE Users_ID = ?";
  db.query(sql, [id], async (err, result) => {
    if (err) throw err;
    if(result.length > 0){
      const Users_ImageFile = result[0].Users_ImageFile;

      if(Users_ImageFile == null){
        return res.send({ message: "ไม่พบรูปภาพ", status: false });
      }

      if(Users_ImageFile == imagePath){
        return res.send({ message: "ไม่สามารถลบรูปภาพได้", status: false });
      }

      const sanitizedPath = imagePath.replace(/^\/+/, '');
      const fullPath = path.join(__dirname, sanitizedPath);
  
    fs.access(fullPath, fs.constants.F_OK, (err) => {
      if (err) {
        return res.send({ message: "ไม่พบไฟล์", status: false });
      }
      fs.unlink(fullPath, (err) => {
        if (err) {
            return res.send({ message: "ไม่สามารถลบไฟล์ได้", status: false });
        }
        res.send({ message: "ลบรูปภาพสำเร็จ", status: true });
      });
    });
    }else{
      return res.send({ message: "ไม่พบผู้ใช้", status: false });
    }
  });
});

//API Update Profile
app.put('/api/update-profile/:id',async (req, res) => {
  const { id } = req.params;
  const { Users_DisplayName, Users_FirstName, Users_LastName,
    Users_Phone, Users_BirthDate, UsersGender_ID, } = req.body;

  if(!id){
    return res.send({ message: "ต้องมี ID", status: false });
  }

  if(!Users_DisplayName || !Users_FirstName || 
    !Users_LastName || !Users_Phone || !Users_BirthDate || !UsersGender_ID){
    return res.send({ message: "จำเป็นต้องมีข้อมูล", status: false });
  }

  const sql_check_id = "SELECT COUNT(*) AS count FROM Users WHERE Users_ID = ?";
  db.query(sql_check_id, [id], async (err, result) => {
    if (err) throw err;

    if (result[0].count > 0) {
      const sql = "UPDATE Users SET Users_DisplayName = ?, Users_FirstName = ?, " +
      " Users_LastName = ?, Users_Phone = ?, Users_BirthDate = ?, UsersGender_ID = ?" +
      " WHERE Users_ID = ? AND Users_IsActive = 1";
      db.query(sql, [Users_DisplayName, Users_FirstName ,Users_LastName ,
        Users_Phone ,Users_BirthDate ,UsersGender_ID ,id], async (err, result) => {
        if (err) throw err;

        if(result.affectedRows > 0){
          res.send({ message: "อัพเดทข้อมูลสำเร็จ",status: true });
        }else{
          res.send({ message: "ไม่สามารถอัพเดทข้อมูลได้",status: false });
        }
      });
    }else{
      res.send({ message: "ไม่พบผู้ใช้",status: false });
    }
  });
});
//API Get All Profile
app.get('/api/get-profile',async (req, res) => {
  const sql = "SELECT u.*,g.UsersGender_Name,ut.UsersType_Name,rt.RegisType_Name FROM"+
  "(((Users u INNER JOIN UsersGender g ON u.UsersGender_ID = G.UsersGender_ID)"+
  "INNER JOIN UsersType ut ON u.UsersType_ID = ut.UsersType_ID)INNER JOIN"+
  " RegisType rt ON u.RegisType_ID = rt.RegisType_ID)";
  db.query(sql, (err, results) => {
    if (err) throw err;
    if(results.length > 0){
      const profileData = results
      res.send(profileData);
    }else{
      res.send({ message: "ไม่พบข้อมูล",status: false })
    }
  });
});

//API Get Profile By ID
app.get('/api/get-profile/:id',async (req, res) => {
  const { id } = req.params;
  if(!id){ res.send({ message: "ต้องมี ID", status: false });}

  const sql = "SELECT u.*,g.UsersGender_Name FROM Users u INNER JOIN UsersGender g ON u.UsersGender_ID = G.UsersGender_ID WHERE Users_ID = ?";
  db.query(sql, [id], (err, results) => {
    if (err) throw err;
    if(results.length > 0){
      const UsersData = results[0];
      UsersData['message'] = "ทำรายการสำเร็จ"
      UsersData['status'] = true
      res.send(UsersData);
    }else{
      res.send({ message: "ไม่พบผู้ใช้",status: false });
    }
  });
});

//Insert Zodiac First Data API
app.post('/api/zodiac-first-data', async (req, res) => {
  const {Zodiac_Name, Zodiac_Detail,Zodiac_WorkTopic, Zodiac_FinanceTopic, Zodiac_LoveTopic } = req.body;

  if(!Zodiac_Name || !Zodiac_Detail || !Zodiac_WorkTopic || !Zodiac_FinanceTopic || !Zodiac_LoveTopic ){
    res.send({ message: "จำเป็นต้องมีข้อมูล", status: false });
  }

  const sql = "INSERT INTO Zodiac (Zodiac_Name,Zodiac_Detail,Zodiac_WorkTopic" + 
  ",Zodiac_FinanceTopic ,Zodiac_LoveTopic)VALUES(?,?,?,?,?)";
  db.query(sql,[Zodiac_Name,Zodiac_Detail,Zodiac_WorkTopic,Zodiac_FinanceTopic,Zodiac_LoveTopic], (err,result) => {
    if (err) throw err;
    if(result.affectedRows > 0){
      res.send({ message: "เพิ่มข้อมูลสำเร็จ",status: true });
    }else{
      res.send({ message: "เพิ่มข้อมูลไม่สำเร็จ",status: false });
    }
  });
});

//Update Zodiac API
app.put('/api/update-zodiac/:id',async (req, res) => {
  const { id } = req.params;
  const {Zodiac_Name, Zodiac_Detail, Zodiac_WorkTopic, Zodiac_FinanceTopic, Zodiac_LoveTopic, Zodiac_Score } = req.body;

  if(!id){
    return res.send({ message: "ต้องมี ID", status: false });
  }

  if(!Zodiac_Name || !Zodiac_Detail || !Zodiac_WorkTopic || !Zodiac_FinanceTopic || !Zodiac_LoveTopic || !Zodiac_Score){
    return res.send({ message: "จำเป็นต้องมีข้อมูล", status: false });
  }

  const sql_check_id = "SELECT COUNT(*) AS count FROM Zodiac WHERE Zodiac_ID = ?";
  db.query(sql_check_id, [id], async (err, result) => {
    if (err) throw err;

    if (result[0].count > 0) {
      const sql = "UPDATE Zodiac SET Zodiac_Name = ?, Zodiac_Detail = ?, Zodiac_WorkTopic = ?" +
        ",Zodiac_FinanceTopic = ?, Zodiac_LoveTopic = ?, Zodiac_Score = ? WHERE Zodiac_ID = ?"
      db.query(sql,[Zodiac_Name, Zodiac_Detail, Zodiac_WorkTopic, 
        Zodiac_FinanceTopic, Zodiac_LoveTopic, Zodiac_Score], (err,result)=> {
        if (err) throw err;
        if(result.affectedRows > 0){
          res.send({ message: "เพิ่มข้อมูลสำเร็จ",status: true });
        }else{
          res.send({ message: "เพิ่มข้อมูลไม่สำเร็จ",status: false });
        }
      });
    }else{
      res.send({ message: "ไม่พบข้อมูล",status: false });
    }
  });
});

//API Get Zodiac
app.get('/api/get-zodiac',async (req, res) => {
  const sql = "SELECT * FROM Zodiac";
  db.query(sql, (err, results) => {
    if (err) throw err;
    if(results.length > 0){
      const ZodiacData = results
      res.send(ZodiacData);
    }else{
      res.send({ message: "ไม่พบข้อมูล",status: false })
    }
  
  });
});

//API Get Zodiac By ID
app.get('/api/get-zodiac/:id',async (req, res) => {
  const { id } = req.params;
  if(!id){ res.send({ message: "ต้องมี ID", status: false });}
  const sql = "SELECT * FROM Zodiac WHERE Zodiac_ID = ?";
  db.query(sql, [id], (err, results) => {
    if (err) throw err;
    if(results.length > 0){
      const ZodiacData = results[0];
      ZodiacData['message'] = "ทำรายการสำเร็จ"
      ZodiacData['status'] = true
      res.send(ZodiacData);
    }else{
      res.send({ message: "ไม่พบข้อมูล",status: false });
    }
  });
});

//API Update Zodiac Image
app.put('/api/update-Zodiac-image/:id', upload.single('Zodiac_Image') ,async (req, res) => {
  const { id } = req.params;
  if(!id){ return res.send({ message: "ต้องมี ID", status: false });}
  if (!req.file) { return res.send({ message: "ต้องมีภาพประกอบ", status: false });}

  const sql_check_id = "SELECT COUNT(*) AS count FROM Zodiac WHERE Zodiac_ID = ?";
  db.query(sql_check_id, [id], async (err, result) => {
    if (err) throw err;

    if (result[0].count > 0) {
      const uniqueName = uuidv4();
      const ext = path.extname(req.file.originalname);
      const resizedImagePath = path.join(uploadDir_Zodiac, `${uniqueName}${ext}`);

      try {
        await sharp(req.file.buffer)
          .resize(1280, 1280) //1280x1280 pixels
          .toFile(resizedImagePath);
        const Zodiac_ImageURL = `/images/zodiac-images/${uniqueName}${ext}`;
        const sql = "UPDATE Zodiac SET Zodiac_ImageFile = ? WHERE Zodiac_ID = ?";
        db.query(sql, [Zodiac_ImageURL, id], (err, result) => {
          if (err) throw err;
          if(result.affectedRows > 0){
            res.send({ message: "อัพเดทรูปภาพสำเร็จ",status: true });
          }else{
            res.send({ message: "ไม่สามารถอัพเดทข้อมูลได้",status: false });
          }
        });
      }catch (error) {
        return res.send({ message: "เกิดข้อผิดพลาดในการประมวลผลภาพ", status: false });
      }
    }else{
      res.send({ message: "ไม่พบข้อมูล",status: false });
    }
  });
});

//API Delete Zodiac Image
app.delete('/api/delete-zodiac-image/:id', async (req, res) => {
  const { id } = req.params;
  const { imagePath } = req.body;

  if(!id){
    return res.send({ message: "ต้องมี ID", status: false });
  }

  if (!imagePath) {
      return res.send({ message: "ต้องมี imagePath", status: false });
  }

  const sql = "SELECT Zodiac_ImageFile FROM Zodiac WHERE Zodiac_ID = ?";
  db.query(sql, [id], async (err, result) => {
    if (err) throw err;
    if(result.length > 0){
      const Zodiac_ImageFile = result[0].Zodiac_ImageFile;

      if(Zodiac_ImageFile == null){
        return res.send({ message: "ไม่พบรูปภาพ", status: false });
      }

      if(Zodiac_ImageFile == imagePath){
        return res.send({ message: "ไม่สามารถลบรูปภาพได้", status: false });
      }

      const sanitizedPath = imagePath.replace(/^\/+/, '');
      const fullPath = path.join(__dirname, sanitizedPath);
  
    fs.access(fullPath, fs.constants.F_OK, (err) => {
      if (err) {
        return res.send({ message: "ไม่พบไฟล์", status: false });
      }
      fs.unlink(fullPath, (err) => {
        if (err) {
            return res.send({ message: "ไม่สามารถลบไฟล์ได้", status: false });
        }
        res.send({ message: "ลบรูปภาพสำเร็จ", status: true });
      });
    });
    }else{
      return res.send({ message: "ไม่พบข้อมูล", status: false });
    }
  });
});

//API Check Zodiac of BirthDate
app.post('/api/check-zodiac', async (req, res) => {
  const { Users_BirthDate } = req.body;

  if (!Users_BirthDate) {
    return res.send({ message: "ต้องมีข้อมูลของวันเกิด", status: false });
  }

  // Set Form dd-mm-yyyy
  const [day, month, year] = Users_BirthDate.split('-').map(Number);
  const birthDate = new Date(Date.UTC(year, month - 1, day, 0, 0, 0));
  birthDate.setHours(birthDate.getHours() + 8);

  if (isNaN(birthDate)) {
    return res.send({ message: "รูปแบบวันเกิดไม่ถูกต้อง", status: false });
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

//Insert Card Data API
app.post('/api/card-data', async (req, res) => {
  const {Card_Name, Card_WorkTopic, Card_FinanceTopic, Card_LoveTopic } = req.body;

  if(!Card_Name || !Card_WorkTopic || !Card_FinanceTopic || !Card_LoveTopic ){
    res.send({ message: "จำเป็นต้องมีข้อมูล", status: false });
  }

  const sql = "INSERT INTO Card (Card_Name, Card_WorkTopic, Card_FinanceTopic" + 
  ", Card_LoveTopic)VALUES(?,?,?,?)";
  db.query(sql,[Card_Name,Card_WorkTopic,Card_FinanceTopic,Card_LoveTopic], (err,result) => {
    if (err) throw err;
    if(result.affectedRows > 0){
      res.send({ message: "เพิ่มข้อมูลสำเร็จ",status: true });
    }else{
      res.send({ message: "เพิ่มข้อมูลไม่สำเร็จ",status: false });
    }
  });
});

//Update Card API
app.put('/api/update-card/:id',async (req, res) => {
  const { id } = req.params;
  const {Card_Name, Card_WorkTopic, Card_FinanceTopic, Card_LoveTopic, Card_Score } = req.body;

  if(!id){
    return res.send({ message: "ต้องมี ID", status: false });
  }

  if(!Card_Name || !Card_WorkTopic || !Card_FinanceTopic || !Card_LoveTopic || !Card_Score ){
    return res.send({ message: "จำเป็นต้องมีข้อมูล", status: false });
  }

  const sql_check_id = "SELECT COUNT(*) AS count FROM Card WHERE Card_ID = ?";
  db.query(sql_check_id, [id], async (err, result) => {
    if (err) throw err;

    if (result[0].count > 0) {
      const sql = "UPDATE Card SET Card_Name = ?, Card_WorkTopic = ?, Card_FinanceTopic = ?" +
        ",Card_LoveTopic = ?, Card_Score = ? WHERE Card_ID = ?"
      db.query(sql,[Card_Name, Card_WorkTopic, Card_FinanceTopic, 
        Card_LoveTopic, Card_Score], (err,result)=> {
        if (err) throw err;
        if(result.affectedRows > 0){
          res.send({ message: "เพิ่มข้อมูลสำเร็จ",status: true });
        }else{
          res.send({ message: "เพิ่มข้อมูลไม่สำเร็จ",status: false });
        }
      });
    }else{
      res.send({ message: "ไม่พบข้อมูล",status: false });
    }
  });
});

//API Update Card Image
app.put('/api/update-card-image/:id', upload.single('Card_Image') ,async (req, res) => {
  const { id } = req.params;
  if(!id){ return res.send({ message: "ต้องมี ID", status: false });}
  if (!req.file) { return res.send({ message: "ต้องมีภาพประกอบ", status: false });}

  const sql_check_id = "SELECT COUNT(*) AS count FROM Card WHERE Card_ID = ?";
  db.query(sql_check_id, [id], async (err, result) => {
    if (err) throw err;

    if (result[0].count > 0) {
      const uniqueName = uuidv4();
      const ext = path.extname(req.file.originalname);
      const resizedImagePath = path.join(uploadDir_Card, `${uniqueName}${ext}`);

      try {
        await sharp(req.file.buffer)
          .resize(285, 500) //285x500 pixels
          .toFile(resizedImagePath);
        const Card_ImageURL = `/images/card-images/${uniqueName}${ext}`;
        const sql = "UPDATE Card SET Card_ImageFile = ? WHERE Card_ID = ?";
        db.query(sql, [Card_ImageURL, id], (err, result) => {
          if (err) throw err;
          if(result.affectedRows > 0){
            res.send({ message: "อัพเดทรูปภาพสำเร็จ",status: true });
          }else{
            res.send({ message: "ไม่สามารถอัพเดทข้อมูลได้",status: false });
          }
        });
      }catch (error) {
        return res.send({ message: "เกิดข้อผิดพลาดในการประมวลผลภาพ", status: false });
      }
    }else{
      res.send({ message: "ไม่พบข้อมูล",status: false });
    }
  });
});

//API Delete Card Image
app.delete('/api/delete-card-image/:id', async (req, res) => {
  const { id } = req.params;
  const { imagePath } = req.body;

  if(!id){
    return res.send({ message: "ต้องมี ID", status: false });
  }

  if (!imagePath) {
      return res.send({ message: "ต้องมี imagePath", status: false });
  }

  const sql = "SELECT Card_ImageFile FROM Card WHERE Card_ID = ?";
  db.query(sql, [id], async (err, result) => {
    if (err) throw err;
    if(result.length > 0){
      const Card_ImageFile = result[0].Card_ImageFile;

      if(Card_ImageFile == null){
        return res.send({ message: "ไม่พบรูปภาพ", status: false });
      }

      if(Card_ImageFile == imagePath){
        return res.send({ message: "ไม่สามารถลบรูปภาพได้", status: false });
      }

      const sanitizedPath = imagePath.replace(/^\/+/, '');
      const fullPath = path.join(__dirname, sanitizedPath);
  
    fs.access(fullPath, fs.constants.F_OK, (err) => {
      if (err) {
        return res.send({ message: "ไม่พบไฟล์", status: false });
      }
      fs.unlink(fullPath, (err) => {
        if (err) {
            return res.send({ message: "ไม่สามารถลบไฟล์ได้", status: false });
        }
        res.send({ message: "ลบรูปภาพสำเร็จ", status: true });
      });
    });
    }else{
      return res.send({ message: "ไม่พบข้อมูล", status: false });
    }
  });
});

//API Get count of Card
app.get('/api/get-count-card',async (req, res) => {
  const sql = "SELECT COUNT(*) AS Count FROM Card";
  db.query(sql, (err, results) => {
    if (err) throw err;
      const CardData = results[0];
      CardData['message'] = "ทำรายการสำเร็จ"
      CardData['status'] = true
      res.send(CardData);
  });
});

//API Get Card By ID
app.get('/api/get-card/:id',async (req, res) => {
  const { id } = req.params;
  if(!id){ res.send({ message: "ต้องมี ID", status: false });}
  const sql = "SELECT * FROM Card WHERE Card_ID = ?";
  db.query(sql, [id], (err, results) => {
    if (err) throw err;
    if(results.length > 0){
      const CardData = results[0];
      CardData['message'] = "ทำรายการสำเร็จ"
      CardData['status'] = true
      res.send(CardData);
    }else{
      res.send({ message: "ไม่พบข้อมูล",status: false });
    }
  });
});

//API Get Card
app.get('/api/get-card',async (req, res) => {
  const sql = "SELECT * FROM Card";
  db.query(sql, (err, results) => {
    if (err) throw err;
    if(results.length > 0){
      const CardData = results
      res.send(CardData);
    }else{
      res.send({ message: "ไม่พบข้อมูล",status: false })
    }
  
  });
});

//API Add PlayCard
app.post('/api/add-playcard', async (req, res) => {
  const {Users_ID, Card_ID } = req.body;

  if(!Users_ID || !Card_ID ){
    res.send({ message: "จำเป็นต้องมีข้อมูล", status: false });
  }

  const sql = "INSERT INTO PlayCard( Users_ID, Card_ID)VALUES(?,?)";
  db.query(sql,[Users_ID,Card_ID], (err,result) => {
    if (err) throw err;
    if(result.affectedRows > 0){
      res.send({ message: "จัดการข้อมูลสำเร็จ",status: true });
    }else{
      res.send({ message: "จัดการข้อมูลไม่สำเร็จ",status: false });
    }
  });
});

//API Get count of Users
app.get('/api/get-count-users',async (req, res) => {
  const sql = "SELECT COUNT(*) AS Count FROM Users";
  db.query(sql, (err, results) => {
    if (err) throw err;
      const CardData = results[0];
      CardData['message'] = "ทำรายการสำเร็จ"
      CardData['status'] = true
      res.send(CardData);
  });
});

//API Get count of Users Online
app.get('/api/get-count-users-online',async (req, res) => {
  const sql = "SELECT COUNT(*) AS Count FROM Users WHERE Users_IsActive = 1";
  db.query(sql, (err, results) => {
    if (err) throw err;
      const CardData = results[0];
      CardData['message'] = "ทำรายการสำเร็จ"
      CardData['status'] = true
      res.send(CardData);
  });
});

//API Get count of Users Offline
app.get('/api/get-count-users-offline',async (req, res) => {
  const sql = "SELECT COUNT(*) AS Count FROM Users WHERE Users_IsActive = 0";
  db.query(sql, (err, results) => {
    if (err) throw err;
      const CardData = results[0];
      CardData['message'] = "ทำรายการสำเร็จ"
      CardData['status'] = true
      res.send(CardData);
  });
});


app.listen(process.env.SERVER_PORT, function() {
  console.log(`Example app listening on port ${process.env.SERVER_PORT}`)
});



// const httpsServer = https.createServer(credentials, app);
// httpsServer.listen(process.env.SERVER_HTTPS_PORT, () => {
//     console.log(`HTTPS Server running on port ${process.env.SERVER_HTTPS_PORT}`);
// });

