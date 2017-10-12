const crypto = require('crypto');

const config = require('../config/config');

module.exports = {

    encryptPassword: pw => {
        return crypto.createHash(config.algorithm).update(pw + config.salt).digest('base64');
    },

    isLogined: (req, res) => {
        if (req.user) return true;
        res.status(401).json({
            status: { success: false, message: '로그인이 필요한 서비스입니다.' }
        }).end();
        return;
    },
    isAdmin: (req, res) => {
        if (req.user.isAdmin === true) return true;
        res.status(403).json({
            status: { success: false, message: '관리자 권한이 필요한 서비스입니다.' }
        }).end();
        return;
    },
    isNotDenied: (req, res) => {
        if (req.user.isDenied === false) return true;
        res.status(403).json({
            status: { success: false, message: '사용 정지된 계정입니다.' }
        }).end();
        return;
    },

};