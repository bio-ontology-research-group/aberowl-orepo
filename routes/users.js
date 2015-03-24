var express = require('express');
var router = express.Router();
var Moniker = require('moniker');
var names = Moniker.generator([Moniker.noun]);
var pluralise = require('pluralize');

/* GET users listing. */
router.get('/:username', function(req, res) {
  req.db.read('users', req.params.username, function(err, user) {
    res.render('user_page', {
      'ontologies': null,
      'random_noun': pluralise(names.choose()),
      'target_user': user
    });
  });
});

module.exports = router;
