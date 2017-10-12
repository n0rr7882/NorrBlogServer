const express = require('express');
const mkdirp = require('mkdirp');
const rimraf = require('rimraf');

const ac = require('../tools/account');
const fc = require('../tools/file');
const models = require('../models');

const router = express.Router();

const checklist = [
    { property: 'id', message: 'ID는 6글자 이상의 영문자 + 숫자 입니다.', reg: /^(?=.*)[a-zA-Z0-9]{6,30}$/ },
    { property: 'pw', message: '암호는 8글자 이상의 영문자 + 숫자 + 기호 입니다.', reg: /^(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{8,30}$/ },
    { property: 'name', message: '이름은 공백없이 15글자 미만이어야 합니다.', reg: /^(?=.*)[^\s]{1,15}$/ },
    { property: 'email', message: 'Email 형식에 일치하지 않습니다.', reg: /^[a-zA-Z0-9.!#$%&’*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/ }
];

router.post('/', (req, res) => {

    for (let c of checklist) {
        if (!(req.body[c.property] && c.reg.test(req.body[c.property]))) {
            res.status(400).json({
                status: { success: false, message: c.message }
            }).end();
            return;
        }
    }

    if (fc.isFileExist(req, 'profileImage') && !fc.isFileValidType(req.files.profileImage)) {
        res.status(400).json({
            status: { success: false, message: '허용하지 않는 파일 형식입니다.' }
        }).end();
    }

    req.body.isAdmin = false;
    req.body.pw = ac.encryptPassword(req.body.pw);
    req.body.joinDate = new Date();

    models.User
        .findOne({ where: { id: req.body.id } })
        .then(user => {
            if (!user) return models.User.create(req.body);
            res.status(409);
            throw new Error('이미 존재하는 아이디입니다.');
        })
        .then(user => {
            mkdirp(`${__dirname}/../public/users/${user.id}`);
            if (fc.isFileExist(req, 'profileImage')) {
                return req.files.profileImage.mv(`${__dirname}/../public/users/${user.id}/profile-image.jpg`);
            }
        })
        .then(() => {
            res.status(200).json({
                status: { success: true, message: '회원가입에 성공하였습니다.' }
            }).end();
        })
        .catch(err => {
            res.json({
                status: { success: false, message: err.message }
            }).end();
        });
});

router.get('/', (req, res) => {
    let query = {};
    query.$and = [];

    if (req.query.isAdmin) query.$and.push({ isAdmin: Boolean(req.query.isAdmin) });
    if (req.query.isDenied) query.$and.push({ isDenied: Boolean(req.query.isDenied) });

    models.User
        .findAll({
            where: query,
            offset: Number(req.query.offset),
            limit: Number(req.query.limit),
            order: [['joinDate', 'DESC']]
        })
        .then(users => {
            res.status(200).json({
                status: { success: true, message: '조회에 성공하였습니다.' },
                users: users
            }).end();
        })
        .catch(err => {
            res.status(500).json({
                status: { success: false, message: err.message }
            }).end();
        });
});

router.get('/:id', (req, res) => {
    models.User
        .findOne({ where: { id: req.params.id } })
        .then(user => {
            res.status(200).json({
                status: { success: true, message: '조회에 성공하였습니다.' },
                user: user
            }).end();
        })
        .catch(err => {
            res.status(500).json({
                status: { success: false, message: err.message }
            }).end();
        });
});

router.put('/:id', (req, res) => {

    if (ac.isLogined(req, res) && ac.isNotDenied(req, res)) {
        for (let c of checklist) {
            if (req.body[c.property] && !c.reg.exec(req.body[c.property])) {
                res.status(400).json({
                    status: { success: false, message: c.message }
                }).end();
                return;
            }
        }

        if (fc.isFileExist(req, 'profileImage') && !fc.isFileValidType(req.files.profileImage)) {
            res.status(400).json({
                status: { success: false, message: '허용하지 않는 파일 형식입니다.' }
            }).end();
        }

        models.User
            .findOne({ where: { id: req.params.id } })
            .then(user => {
                if (user) return user;
                res.status(404);
                throw new Error('존재하지 않는 계정입니다.');
            })
            .then(user => {
                if (user.id === req.user.id || req.user.isAdmin) return user;
                res.status(403);
                throw new Error('수정할 수 있는 권한이 없습니다.');
            })
            .then(user => {
                if (fc.isFileExist(req, 'profileImage')) {
                    req.files.profileImage.mv(`${__dirname}/../public/users/${user.id}/profile-image.jpg`);
                }
                return user;
            })
            .then(() => {
                if (req.body.pw) user.pw = t.encryptPassword(req.body.pw);
                if (req.body.name) user.name = req.body.name;
                if (req.body.email) user.email = req.body.email;
                if (req.user.isAdmin) {
                    if (req.body.idAdmin) user.isAdmin = Boolean(req.body.isAdmin);
                    if (req.body.idDenied) user.isDenied = Boolean(req.body.isDenied);
                }
                return user.save();
            })
            .then(() => {
                res.status(200).json({
                    status: { success: true, message: '업데이트에 성공하였습니다.' }
                }).end();
            })
            .catch(err => {
                res.json({
                    status: { success: false, message: err.message }
                }).end();
            });
    }
});

router.delete('/:id', (req, res) => {

    if (ac.isLogined(req, res) && ac.isNotDenied(req, res)) {
        models.User
            .findOne({ where: { id: req.params.id } })
            .then(user => {
                if (user) return user;
                res.status(404);
                throw new Error('존재하지 않는 계정입니다.');
            })
            .then(user => {
                if (user.id === req.user.id || req.user.isAdmin) return user;
                res.status(403);
                throw new Error('삭제할 수 있는 권한이 없습니다.');
            })
            .then(user => {
                rimraf(`${__dirname}/../public/users/${user.id}`, err => {
                    if (err) throw err;
                });
                return user;
            })
            .then(user => {
                user.destroy();
                res.status(200).json({
                    status: { success: true, message: '삭제에 성공하였습니다.' }
                }).end();
            })
            .catch(err => {
                res.json({
                    status: { success: false, message: err.message }
                }).end();
            });
    }
});

module.exports = router;
