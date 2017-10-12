const express = require('express');
const mkdirp = require('mkdirp');
const rimraf = require('rimraf');

const ac = require('../tools/account');
const models = require('../models');

const router = express.Router();

const checklist = [
    { property: 'category', message: '30글자 이내의 내용을 입력해주세요.', reg: /^(?=.*).{1,30}$/ }
];

router.post('/', (req, res) => {
    if (ac.isLogined(req, res) && ac.isNotDenied(req, res)) {
        for (let c of checklist) {
            if (!(req.body[c.property] && c.reg.test(req.body[c.property]))) {
                return res.status(400).json({
                    status: { success: false, message: c.message }
                }).end();
            }
        }

        req.body.userId = req.user.id;
        req.body.creationDate = new Date();

        models.Category
            .findAll({ where: { category: req.body.category } })
            .then(category => {
                if (!category) return models.create(req.body);
                res.status(409);
                throw new Error('이미 존재하는 카테고리입니다.');
            })
            .then(category => {
                res.status(200).json({
                    status: { success: true, message: '카테고리가 등록되었습니다.' }
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
    if (req.query.userId) query.$and.push({ userId: req.query.userId });

    models.Category
        .findAll({
            where: query,
            limit: Number(req.query.limit),
            offset: Number(req.query.offset),
            order: [['creationDate', 'DESC']]
        })
        .then(categories => {
            if (categories) return categories;
            res.status(404);
            throw new Error('조회된 카테고리가 없습니다.');
        })
        .then(categories => {
            res.status(200).json({
                status: { success: true, message: '조회에 성공하였습니다.' },
                categories: categories
            }).end();
        })
        .catch(err => {
            res.json({
                status: { success: false, message: err.message }
            }).end();
        });
});

router.get('/:category', (req, res) => {
    models.Category
        .findOne({ where: { category: req.params.category } })
        .then(category => {
            if (category) return category;
            res.status(404);
            throw new Error('조회된 카테고리가 없습니다.');
        })
        .then(category => {
            res.status(200).json({
                status: { success: true, message: '조회에 성공하였습니다.' },
                category: category
            }).end();
        })
        .catch(err => {
            res.json({
                status: { success: false, message: err.message }
            }).end();
        });
});

router.delete(':category', (req, res) => {
    if (ac.isLogined(req, res) && ac.isNotDenied(req, res)) {
        models.Category
            .findOne({ where: { category: req.params.category } })
            .then(category => {
                if (category) return category;
                res.status(404);
                throw new Error('조회된 코멘트가 없습니다.');
            })
            .then(category => {
                if (category.userId === req.user.id) return category.destroy();
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