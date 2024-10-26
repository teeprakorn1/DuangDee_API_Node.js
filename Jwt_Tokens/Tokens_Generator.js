const jwt = require('jsonwebtoken')

//Generator Token
function Tokens_Generator(Users_ID, Some_Username, Users_Email, UsersType_ID, value) {
    if(!Users_ID || !Some_Username || !Users_Email || !UsersType_ID || !value ){ return 0;}else{
        let Token;
        if(value === 1){
            Token = jwt.sign(
            {
              Users_ID:Users_ID,
              Users_Username:Some_Username,
              Users_Email:Users_Email,
              UsersType_ID:UsersType_ID,
              RegisType_ID:1
            },
            process.env.PRIVATE_TOKEN_KEY,{ expiresIn: '24h'}
          );
        }
        if(value === 2){
            Token = jwt.sign(
            {Users_ID:Users_ID,
               Users_Google_Uid:Some_Username,
               Users_Email:Users_Email,
               UsersType_ID:UsersType_ID,
               RegisType_ID:2
            },
            process.env.PRIVATE_TOKEN_KEY,{ expiresIn: '24h'}
          );
        }
        return Token;
    }
  }

  module.exports = Tokens_Generator;