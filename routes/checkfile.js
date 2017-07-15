var express = require('express');
var fs = require('fs');
var ansible = require('./ansible');

var router = express.Router();

/* GET home page. */
router.get('/*', function(req, res, next) {
    var baseUrl = req.url;

    ansible.check(__dirname + '/../playbook'+baseUrl);
    res.send('ok');
});

module.exports = router;
