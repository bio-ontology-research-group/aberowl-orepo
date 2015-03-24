var express = require('express');
var router = express.Router();
var request = require('request');
var passHash = require('password-hash');

/* GET home page. */
router.get('/', function(req, res) {
  request.get(req.aberowl + 'getStats.groovy', {
      'json': true
    }, function(request, response, body) {
      res.render('index', {
        'stats': body
      });
    });
});

router.get('/register', function(req, res) {
  res.render('register', {});
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
