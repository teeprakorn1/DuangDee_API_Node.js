const jwt = require('jsonwebtoken')

//Verify Token
const Tokens_Verification = (req, res, next) =>{
    const token = req.body.token || req.query.token || req.headers['x-access-token']

    if(!token){
        return res.send({message:'A token is required for authentication', status: false});
    }
    try{
        const decode = jwt.verify(token ,process.env.PRIVATE_TOKEN_KEY);
        req.users_decoded = decode;
    }catch(err){
        return res.send({message:'Invalid token', status: false});
    }
    return next();
}

module.exports = Tokens_Verification;