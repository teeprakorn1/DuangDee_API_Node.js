const admin = require('./Google_SSO');

async function GoogleVerify_Identity(Users_Google_Uid) {
    try {
        const Storage = await admin.auth().getUser(Users_Google_Uid);
        return Storage;
    }catch (error) {
        return false;
    }
};

module.exports = GoogleVerify_Identity;