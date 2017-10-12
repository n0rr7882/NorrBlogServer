const express = require('express');
const mkdirp = require('mkdirp');
const rimraf = require('rimraf');

const ac = require('../tools/account');
const models = require('../models');

const router = express.Router();

const checklist = [
    { property: 'content', message: '256글자 이내의 내용을 입력해주세요.', reg: /^(?=.*).{1,256}$/ }
];

router.post('/:postId', (req, res) => {
    if (ac.isLogined(req, res) && ac.isNotDenied(req, res)) {
        for (let c of checklist) {
            if (!(req.body[c.property] && c.reg.test(req.body[c.property]))) {
                return res.status(400).json({
                    status: { success: false, message: c.message }
                }).end();
            }
        }

        req.body.userId = req.user.id;
        req.body.postId = req.params.postId;

        models.Comment
            .create(req.body)
            .then(comment => {
                res.status(201).json({
                    status: { success: true, message: '코멘트가 등록되었습니다.' }
                }).end();
            })
            .catch(err => {
                res.json({
                    status: { success: false, message: err.message }
                }).end();
            });
    }
});

router.get('/', (req, res) => {
    let query = { $and: [] };
    if (req.query.postId) query.$and.push({ postId: req.query.postId });
    if (req.query.userId) query.$and.push({ userId: req.query.userId });

    models.Comment
        .findAll({
            where: query,
            limit: Number(req.query.limit),
            offset: Number(req.query.offset),
            order: [['creationDate', 'DESC']]
        })
        .then(comments => {
            if (comments) return comments;
            res.status(404);
            throw new Error('조회된 코멘트가 없습니다.');
        })
        .then(comments => {
            res.status(200).json({
                status: { success: true, message: '조회에 성공하였습니다.' },
                comments: comments
            }).end();
        })
        .catch(err => {
            res.json({
                status: { success: false, message: err.message }
            }).end();
        });
});

router.get('/:id', (req, res) => {
    models.Comment
        .findOne({ where: { id: req.params.id } })
        .then(comment => {
            if (comment) return comment;
            res.status(404);
            throw new Error('조회된 코멘트가 없습니다.');
        })
        .then(comment => {
            res.status(200).json({
                status: { success: true, message: '조회에 성공하였습니다.' },
                comment: comment
            }).end();
        })
        .catch(err => {
            res.json({
                status: { success: false, message: err.message }
            }).end();
        });
});

router.put('/:id', (req, res) => {
    if (ac.isLogined(req, res) && ac.isNotDenied(req, res)) {
        models.Comment
            .findOne({ where: { id: req.params.id } })
            .then(comment => {
                if (comment) return comment;
                res.status(404);
                throw new Error('조회된 코멘트가 없습니다.');
            })
            .then(comment => {
                if (comment.userId === req.user.id) return comment;
                res.status(403);
                throw new Error('수정할 수 있는 권한이 없습니다.');
            })
            .then(comment => {
                for (let c of checklist) {
                    if (!(!req.body[c.property] || c.reg.test(req.body[c.property]))) {
                        res.status(400);
                        throw new Error(c.message);
                    } else {
                        comment[c.property] = req.body[c.property];
                    }
                }
                return comment.save();
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
        models.Comment
            .findOne({ where: { id: req.params.id } })
            .then(comment => {
                if (comment) return comment;
                res.status(404);
                throw new Error('조회된 코멘트가 없습니다.');
            })
            .then(comment => {
                if (comment.userId === req.user.id) return comment.destroy();
                res.status(403);
                throw new Error('수정할 수 있는 권한이 없습니다.');
            })
            .then(() => {
                res.status(200).json({
                    status: { success: true, message: '코멘트 삭제에 성공하였습니다.' }
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