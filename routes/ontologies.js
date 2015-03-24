var express = require('express');
var request = require('request');
var router = express.Router();
var Moniker = require('moniker');
var names = Moniker.generator([Moniker.noun]);
var pluralise = require('pluralize');

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

router.get('/upload', function(req,res) {
  res.render('upload_new', {
      'noun': pluralise(names.choose()),
  });
});

router.post('/upload', function(req, res) {
  fs.readFile(req.files.displayImage.path, function (err, data) {
    // ...
    var newPath = __dirname + "/uploads/uploadedFileName";
    fs.writeFile(newPath, data, function (err) {
      req.flash('message', 'Ontology uploaded successfully. Depending on the size of your ontology, you may want to grab a cup of tea while it\'s reasoning')
      res.redirect('/' + req.body.name);
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

router.get('/:id/query', function(req, res) {
  req.db.read('ontologies', req.params.id, function(err, ontology) {
    res.render('ontology_query', {
      'ontology': ontology
    });
  });
});

// Reloaded event
// Note sure this is the best way to do this but eh
router.get('/:id/reloaded', function(req, res) {
  var success = req.params.result;

  // Send an email or whatever
});

module.exports = router;
