var express = require('express');
var router = express.Router();
var Moniker = require('moniker');
var names = Moniker.generator([Moniker.noun]);
var pluralise = require('pluralize');
var _ = require('underscore')._;

/* GET users listing. */
router.get('/:username', function(req, res) {
    req.db.read('users', req.params.username, function(err, user) {
      var ontologies = [];
      req.db.scan('ontologies', function(ontology) {
        if(_.include(user.owns, ontology.id)) {
          ontologies.push(ontology);
        }
      }, function() {
	res.render('user_page', {
	    'ontologies': ontologies,
	    'random_noun': pluralise(names.choose()),
	    'target_user': user
	});
      });
    });
});

module.exports = router;
