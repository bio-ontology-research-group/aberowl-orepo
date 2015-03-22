var express = require('express');
var request = require('request');
var router = express.Router();

/* GET users listing. */
router.get('/', function(req, res) {
  var ontologies = {};

  req.db.scan('ontologies', function(ontology) {
    ontologies[ontology.id] = ontology; 
  }, function() {
    res.render('ontologies', {
      'title': 'Ontology List',
      'ontologies': ontologies
    });
  });
});

router.get('/:id', function(req, res) {
  req.db.read('ontologies', req.params.id, function(err, ontology) {
    request.get('http://aber-owl.net/aber-owl/service/api/getStats.groovy', {
      'qs': {
        'ontology': ontology.id
      },
      'json': true
    }, function(request, response, body) {
      res.render('ontology', {
        'ontology': ontology,
        'stats': body
      });
    });
  });
});

router.get('/:id/downloads', function(req, res) {
  req.db.read('ontologies', req.params.id, function(err, ontology) {
    res.render('ontology_download', {
      'ontology': ontology
    });
  });
});



module.exports = router;
