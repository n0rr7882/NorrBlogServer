const jwt = require('jsonwebtoken');
const models = require('../models/index');
const config = require('../config/config');

function authentication(req, res, next) {
    if (req.headers.authorization) {
        jwt.verify(req.headers.authorization, config.salt, (err, decoded) => {
            if (!err && decoded) {
                req.user = decoded;
            }
        });
    }
    next();
}

module.exports = authentication;