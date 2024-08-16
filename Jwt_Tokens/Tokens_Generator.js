const jwt = require('jsonwebtoken')

//Generator Token
function Tokens_Generator(Users_ID, Some_Username, Users_DisplayName, value) {
    if(!Users_ID || !Some_Username || !value ){ return 0;}else{
        let Token;
        if(value === 1){
            Token = jwt.sign(
            {
              Users_ID:Users_ID,
              Users_Username:Some_Username,
              Users_DisplayName:Users_DisplayName,
              RegisType_ID:1
            },
            process.env.PRIVATE_TOKEN_KEY,{ expiresIn: '24h'}
          );
        }
        if(value === 2){
            Token = jwt.sign(
            {Users_ID:Users_ID,
               Users_Google_Uid:Some_Username,
               Users_DisplayName:Users_DisplayName,
               RegisType_ID:2
            },
            process.env.PRIVATE_TOKEN_KEY,{ expiresIn: '24h'}
          );
        }
        return Token;
    }
  }

  module.exports = Tokens_Generator;