var express = require('express');
var router = express.Router();
var request = require('request');

/* GET home page. */
router.get('/', function(req, res) {
  request.get('http://aber-owl.net/aber-owl/service/api/getStats.groovy', {
      'json': true
    }, function(request, response, body) {
      res.render('index', {
        'stats': body
      });
    });
});

module.exports = router;
