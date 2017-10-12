const express = require('express');
const jwt = require('jsonwebtoken');

const config = require('../config/config');
const models = require('../models');

const ac = require('../tools/account');

const router = express.Router();

// 로그인
router.post('/login', (req, res) => {

    models.User.findOne({ where: { id: req.body.id } })
        .then(user => {
            if (!user) {
                res.status(404);
                throw new Error('존재하지 않는 아이디입니다.');
            }
            if (ac.encryptPassword(req.body.pw) !== user.pw) {
                res.status(403);
                throw new Error('암호가 일치하지 않습니다.');
            }
            let payload = { id: user.id, isAdmin: user.isAdmin, isDenied: user.isDenied };
            let token = jwt.sign(payload, config.salt, { algorithm: 'HS256' });

            res.status(200).json({
                status: { success: true, message: `로그인에 성공하였습니다.` },
                user: user,
                token: token
            }).end();
        })
        .catch(e => {
            res.json({
                status: { success: false, message: e.message }
            }).end();
        });
});

router.get('/me', (req, res) => {
    if (ac.isLogined(req, res)) {
        models.User
            .findOne({ where: { id: req.user.id } })
            .then(user => {
                if (!user) {
                    res.status(404);
                    throw new Error('조회된 계정이 없습니다.');
                }
                res.status(200).json({
                    status: { success: true, message: `조회에 성공하였습니다.` },
                    user: user
                }).end();
            })
            .catch(err => {
                res.json({
                    status: { success: false, message: e.message }
                }).end();
            });
    }
});

module.exports = router;