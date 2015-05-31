var express = require('express');
var router = express.Router();
var request = require('request');
var passHash = require('password-hash');
var _ = require('underscore')._;

/* GET home page. */
router.get('/', function(req, res) {
  request.get(req.aberowl + 'getStats.groovy', {
      'json': true
    }, function(request, response, body) {
      if(response.statusCode = 200 && _.isObject(body)) {
        body.oCount = body.oCount.toString().replace(/(\d)(?=(\d\d\d)+(?!\d))/g, "$1,");
        body.cCount = body.cCount.toString().replace(/(\d)(?=(\d\d\d)+(?!\d))/g, "$1,");
        body.aCount = body.aCount.toString().replace(/(\d)(?=(\d\d\d)+(?!\d))/g, "$1,");
      }
      res.render('index', {
        'stats': body
      });
    });
});

router.get('/register', function(req, res) {
  res.render('register', {});
});

router.get('/help', function(req, res) {
  res.render('help', {});
});

router.post('/register', function(req, res) {
  var username = req.body.username,
      email = req.body.email,
      password = passHash.generate(req.body.password);

  if(username && email && password) {
    req.db.read('users', username, function(err, user) {
      if(!user) {
        req.db.save('users', username, {
          'username': username,
          'email': email,
          'password': password
        }, function() {
          res.render('login', {'msg': 'Registration complete, now log in.'}) 
        }); 
      } else {
        res.render('register', {'msg': 'Username exists'});
      }
    });
  } else {
    res.render('register', {'msg': 'Incomplete fields'});
  }
});

router.get('/login', function(req, res) {
  res.render('login', {});
});

module.exports = router;
