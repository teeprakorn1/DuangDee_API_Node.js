const express = require('express')
const mysql = require('mysql2')
const bcrypt = require('bcrypt')
const app = express()
const port = 3000

const db = mysql.createConnection(
    {
        host: "localhost",
        user: "root",
        password: "1234",
        database: "DuangDee"
    }
)
db.connect();
app.use(express.json())
app.use(express.urlencoded({extended: true}))

//register
app.post('/api/register', async (req, res) => {
  const { username, password } = req.body;

  const sql_check_username = "SELECT * FROM Users WHERE Users_Username = ?";
  db.query(sql_check_username, [username], async (err, result) => {
    if (err) throw err;

    if (result.length > 0) {
      res.send({ message: "Username already exists",status: false });
    }else{
        const saltRounds = 10;
        const NewPassword = await bcrypt.hash(password, saltRounds);

        const sql = "INSERT INTO Users (Users_Username, Users_Password) VALUES (?, ?)";
        db.query(sql, [username, NewPassword], (err, result) => {
        if (err) throw err;
            res.send({ message: "User registered successfully",status: true });
        });
    }});
});

//login
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;

  const sql = "SELECT * FROM Users WHERE Users_Username = ?";
  db.query(sql, [username], async (err, result) => {
    if (err) throw err;

    if (result.length > 0) {
      const user = result[0];
      const isCorrect = await bcrypt.compare(password, user.Users_Password);

      if (isCorrect) {
        user['message'] = "Password Is Success"
        user['status'] = true
        res.send(user);
      } else {
        res.send({ message: "Incorrect password",status: false });
      }
    } else {
      res.send({ message: "User not found",status: false });
    }
  });
});

//Add Admin APL
/*
app.post('/api/test', async (req, res) => {
  const { password } = req.body;

  const saltRounds = 10;
  const NewPassword = await bcrypt.hash(password ,saltRounds);

  const sql = "INSERT INTO Users(Users_Username,Users_Password,Users_FirstName,Users_LastName,Users_Email,UsersGender_ID,UsersType_ID)VALUES('Admin',?,'Admin_First','Admin_Last','DuangDee.Admin@gmail.com','3','2');";
        db.query(sql, [NewPassword], async(err, result) => {
        if (err) throw err;
            res.send({ message: "User registered successfully",status: true });
        });
});
*/
//yam

app.listen(port, function() {
    console.log(`Example app listening on port ${port}`)
})
