const express = require('express')
const mysql = require('mysql2')
const bcrypt = require('bcrypt')
const rateLimit = require('express-rate-limit');
const app = express()
const port = 3000

const db = mysql.createConnection(
    {
        host: "localhost",
        user: "root",
        password: "Cs12345678",
        database: "DuangDee"
    }
)
db.connect();
app.use(express.json())
app.use(express.urlencoded({extended: true}))

//Login Limit
const loginRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,// 1 minute
  max: 5,// limit
  message: { message: "Many Login",status: false }
});

//register
app.post('/api/register', async (req, res) => {
  const { Users_Email,Users_Username, Users_Password, Users_FirstName,
     Users_LastName, Users_Phone, Users_BirthDate,
     UsersGender_ID,RegisType_ID} = req.body;

  const sql_check_username = "SELECT COUNT(*) AS count FROM Users WHERE Users_Username = ? OR Users_Email = ?";
  db.query(sql_check_username, [Users_Username,Users_Email], async (err, result) => {
    if (err) throw err;

    if (result[0].count > 0) {
      res.send({ message: "Username or Email already exists",status: false });
    }else{
      const saltRounds = 10;
      const NewPassword = await bcrypt.hash(Users_Password, saltRounds);

      const sql = "INSERT INTO Users (Users_Email,Users_Username,Users_Password,Users_FirstName,"+
        "Users_LastName,Users_Phone,Users_BirthDate,"+
        "UsersGender_ID,RegisType_ID)"+
        "VALUES(?,?,?,?,?,?,?,?,?);";

      db.query(sql, [Users_Email, Users_Username, NewPassword, Users_FirstName,
        Users_LastName, Users_Phone, Users_BirthDate,
        UsersGender_ID,RegisType_ID], (err) => {
        if (err) throw err;

        res.send({ message: "User registered successfully",status: true });
      });
    }
  });
});

//login
app.post('/api/login',loginRateLimiter, async (req, res) => {
  const { Users_Username, Users_Password } = req.body;

  const sql_check_username = "SELECT COUNT(*) AS count FROM Users WHERE Users_Username = ? OR Users_Email = ?";
  db.query(sql_check_username, [Users_Username,Users_Username], async (err, result) => {
  if (err) throw err;

    if (result[0].count > 0) {
      const sql_get_password = "SELECT Users_Password FROM Users WHERE Users_Username = ? OR Users_Email = ?";
      db.query(sql_get_password, [Users_Username,Users_Username], async (err, result) => {
        if (err) throw err;
        
        const isCorrect = await bcrypt.compare(Users_Password, result[0].Users_Password);
        if (isCorrect) {
          const sql = "SELECT * FROM Users WHERE Users_Username = ? OR Users_Email = ?";
          db.query(sql, [Users_Username,Users_Username], async (err, result) => {
            if (err) throw err;

            const user = result[0];
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

//Add Admin APL
// app.post('/api/test', async (req, res) => {
//   const { Users_Password } = req.body;

//   const saltRounds = 10;
//   const NewPassword = await bcrypt.hash(Users_Password ,saltRounds);

//   const sql = "INSERT INTO Users(Users_Username,Users_Password,Users_FirstName,Users_LastName,Users_Email,UsersGender_ID,UsersType_ID)VALUES('Admin',?,'Admin_First','Admin_Last','DuangDee.Admin@gmail.com','3','2');";
//         db.query(sql, [NewPassword], async(err) => {
//         if (err) throw err;
//             res.send({ message: "User registered successfully",status: true });
//         });
// });

app.listen(port, function() {
    console.log(`Example app listening on port ${port}`)
})
