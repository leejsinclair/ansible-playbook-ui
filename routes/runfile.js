var express = require('express');
var fs = require('fs');
var ansible = require('./ansible');

var router = express.Router();

/* GET home page. */
router.get('/*', function(req, res, next) {
    // var baseUrl = req.url;

    // ansible.run(__dirname + '/../playbook'+baseUrl);
    // res.send('ok');
    var params = req.params;
    var query = req.query;

    var file = params[0];
    // var tag = query.tag;

    console.log( file );

    ansible.run(__dirname + '/../playbook/'+file, query);
    res.send('ok');
});

module.exports = router;
