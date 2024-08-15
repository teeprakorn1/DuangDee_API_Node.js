function OTP_Timelimiter(OtpStorage, Users_Email) {
    const Data_Storage = OtpStorage[Users_Email];
    const otpExpiryMinutes = 15;

    if (Data_Storage) {
        const { otp, timestamp } = Data_Storage;
        const currentTime = Date.now();

        if (currentTime - timestamp > otpExpiryMinutes * 60 * 1000) {
            return 2;
        }

        return otp;
    }

    return false;
}

module.exports = OTP_Timelimiter;
