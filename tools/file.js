const crypto = require('crypto');

const config = require('../config/config');

module.exports = {

    isFileExist: (req, propertyName) => {
        if (req.files && req.files[propertyName]) return true;
        else return false;
    },

    isFileValidType: (file) => {
        if (RegExp(config.accessType).test(file.name)) return true;
        else return false;
    },

};