const express = require('express');
const mkdirp = require('mkdirp');
const rimraf = require('rimraf');
var hljs = require('highlight.js');
var MarkdownIt = require('markdown-it');

const ac = require('../tools/account');
const fc = require('../tools/file');
const models = require('../models');

const router = express.Router();

const checklist = [
    { property: 'title', message: '2 ~ 50글자 이내의 제목을 입력해주세요.', reg: /^(?=.*).{2,50}$/ },
    { property: 'category', message: '카테고리 형식에 일치하지 않습니다.', reg: /^(?=.*).{2,15}$/ },
    { property: 'content', message: '내용을 입력해주세요', reg: /./gm }
];

const md = MarkdownIt({
    highlight: function (str, lang) {
        if (lang && hljs.getLanguage(lang)) {
            try {
                return '<pre><code class="hljs">' +
                    hljs.highlight(lang, str, true).value +
                    '</code></pre>';
            } catch (__) { }
        }

        return '<pre><code class="hljs">' + md.utils.escapeHtml(str) + '</code></pre>';
    }
});

router.post('/', (req, res) => {

    if (ac.isLogined(req, res) && ac.isNotDenied(req, res)) {
        for (let c of checklist) {
            if (!(req.body[c.property] && c.reg.test(req.body[c.property]))) {
                return res.status(400).json({
                    status: { success: false, message: c.message }
                }).end();
            }
        }
        if (fc.isFileExist(req, 'previewImage')) {
            return res.status(400).json({
                status: { success: false, message: '포스트 배너 이미지가 필요합니다.' }
            }).end();
        }
        if (!fc.isFileValidType(req.files.previewImage)) {
            return res.status(400).json({
                status: { success: false, message: '허용하지 않는 파일 형식입니다.' }
            }).end();
        }

        req.body.userId = req.user.id;
        req.body.views = 0;
        req.body.numOfComments = 0;
        req.body.creationDate = new Date();

        models.Post
            .create(req.body)
            .then(post => {
                mkdirp(`${__dirname}/../public/posts/${post.id}`);
                if (fc.isFileExist(req, 'previewImage')) {
                    return req.files.previewImage.mv(`${__dirname}/../public/posts/${post.id}/preview-image.jpg`);
                }
            })
            .then(() => {
                res.status(201).json({
                    status: { success: true, message: '포스트 업로드에 성공하였습니다.' }
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
    if (req.query.category) query.$and.push({ category: req.query.category });
    if (req.query.userId) query.$and.push({ userId: req.query.userId });

    models.Post
        .findAll({
            where: query,
            limit: Number(req.query.limit),
            offset: Number(req.query.offset),
            order: [['creationDate', 'DESC']]
        })
        .then(posts => {
            if (posts.length) return posts;
            res.status(404);
            throw new Error('조회된 포스트가 없습니다.');
        })
        .then(posts => {
            for (let i in posts) {
                posts[i].content = md.render(posts[i].content).replace(/(<([^>]+)>)/gi, '').substring(0, 150);
            }
            return posts;
        })
        .then(posts => {
            res.status(200).json({
                status: { success: true, message: '조회에 성공하였습니다.' },
                posts: posts
            }).end();
        })
        .catch(err => {
            res.json({
                status: { success: false, message: err.message }
            }).end();
        });
});

router.get('/:id', (req, res) => {
    models.Post
        .findOne({ where: { id: req.params.id } })
        .then(post => {
            if (post) return post;
            res.status(404);
            throw new Error('조회된 포스트가 없습니다.');
        })
        .then(post => {
            post.content = md.render(post.content);
            return post;
        })
        .then(post => {
            res.status(200).json({
                status: { success: true, message: '조회에 성공하였습니다.' },
                post: post
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

        if (fc.isFileExist(req, 'previewImage') && !fc.isFileValidType(req.files.previewImage)) {
            res.status(400).json({
                status: { success: false, message: '허용하지 않는 파일 형식입니다.' }
            }).end();
        }

        models.Post
            .findOne({ where: { id: req.params.id } })
            .then(post => {
                if (post) return post;
                res.status(404);
                throw new Error('조회된 포스트가 없습니다.');
            })
            .then(post => {
                if (post.userId === req.user.id) return post;
                res.status(403);
                throw new Error('수정할 수 있는 권한이 없습니다.');
            })
            .then(post => {
                if (fc.isFileExist(req, 'previewImage')) {
                    req.files.previewImage.mv(`${__dirname}/../public/posts/${post.id}/preview-image.jpg`);
                }
                return post;
            })
            .then(post => {
                for (let c of checklist) {
                    if (!(!req.body[c.property] || c.reg.test(req.body[c.property]))) {
                        res.status(400);
                        throw new Error(c.message);
                    } else {
                        post[c.property] = req.body[c.property];
                    }
                }
                return post.save();
            })
            .then(() => {
                res.status(200).json({
                    status: { success: true, message: '포스트 업데이트에 성공하였습니다.' }
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
        models.Post
            .findOne({ where: { id: req.params.id } })
            .then(post => {
                if (post) return post;
                res.status(404);
                throw new Error('조회된 포스트가 없습니다.');
            })
            .then(post => {
                if (post.userId === req.user.id) return post;
                res.status(403);
                throw new Error('삭제할 수 있는 권한이 없습니다.');
            })
            .then(post => {
                rimraf(`${__dirname}/../public/posts/${post.id}`, err => {
                    if (err) throw err;
                });
                return post.destroy();
            })
            .then(() => {
                res.status(200).json({
                    status: { success: true, message: '포스트 삭제에 성공하였습니다.' }
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