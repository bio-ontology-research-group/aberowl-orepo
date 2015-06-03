var express = require('express');
var request = require('request');
var router = express.Router();
var Moniker = require('moniker');
var names = Moniker.generator([Moniker.noun]);
var pluralise = require('pluralize');
var _ = require('underscore')._;
var passport = require('passport');
var fs = require('fs');

/** Ontology Listing and display. **/

router.get('/', function(req, res) {
  var ontologies = {};

  req.db.scan('ontologies', function(ontology) {
    ontologies[ontology.id] = ontology; 
  }, function() {
    request.get(req.aberowl + 'getStatuses.groovy', {
      'json': true
    }, function(request, response, body) {
      res.render('ontologies', {
        'title': 'Ontology List',
        'ontologies': _.sortBy(ontologies, 'id'),
        'stati': body
      });
    });
  });
});

/** Ontology Uploading **/

router.get('/upload', function(req,res) {
  if(req.isAuthenticated()) {
    res.render('upload_new', {
        'noun': pluralise(names.choose())
    });
  } else {
    req.flash('error', 'Please log in to upload ontologies');
    res.redirect('/login');
  }
});

router.post('/upload', function(req, res) {
  if(req.isAuthenticated()) {
    req.db.read('ontologies', req.body.acronym, function(err, exOnt) { 
      if(!exOnt) { 
        fs.readFile(req.files.ontology.path, function (err, data) {
          var newName = req.body.acronym + '_1.ont',
              newPath = __dirname + '/../public/onts/' + newName;

          fs.writeFile(newPath, data, function (err) {
            // Create ontology in DB
            var time = Date.now();
            var ont = {
              'id': req.body.acronym,
              'name': req.body.name,
              'description': req.body.description,
              'lastSubDate': time,
              'submissions': {
                
              },
              'status': 'untested',
              'source': 'manual',
              'owners': [ req.user.username ]
            };
            ont.submissions[time] = newName;

            req.db.save('ontologies', req.body.acronym, ont, function(err) {
              request.get(req.aberowl + 'reloadOntology.groovy', {
                'qs': {
                  'name': req.body.acronym 
                } // Later this will need API key
              }, function() {}); // we don't actually care about the response

              req.flash('info', 'Ontology uploaded successfully. Depending on the size of your ontology, you may want to grab a cup of tea while it\'s reasoning')
              res.redirect('/ontology/' + req.body.acronym);
            });
          });
        });
      } else {
        req.flash('error', 'Ontology with acronym ' + req.body.acronym + ' already exists!');
        res.redirect('/ontology/upload')
      }
    });
  } else {
      req.flash('error', 'Please log in to upload ontologies');
      res.redirect('/login');
  }
});

router.post('/:id/upload', function(req, res) {
  if(req.isAuthenticated()) {
    req.db.read('ontologies', req.params.id, function(err, exOnt) { 
      if(exOnt && (_.include(exOnt.owners, req.user.username) || req.user.admin == true)) { 
        fs.readFile(req.files.ontology.path, function (err, data) {
          var newName = req.params.id + '_' + (_.size(exOnt.submissions) + 1) + '.ont',
              newPath = __dirname + '/../public/onts/' + newName;

          fs.writeFile(newPath, data, function (err) {
            var time = Date.now();
            exOnt.submissions[time] = newName;
            exOnt.lastSubDate = time;
            exOnt.status = 'untested';

            req.db.save('ontologies', req.params.id, exOnt, function(err) {
              request.get(req.aberowl + 'reloadOntology.groovy', {
                'qs': {
                  'name': req.params.id
                } // Later this will need API key
              }, function() {}); // we don't actually care about the response

              req.flash('info', 'Ontology updated successfully. Depending on the size of your ontology, you may want to grab a cup of tea while it\'s reasoning')
              res.redirect('/ontology/' + req.params.id + '/');
            });
          });
        });
      } else {
        req.flash('error', req.params.id + ' does not exist.');
        res.redirect('/ontology')
      }
    });
  } else {
      req.flash('error', 'Please log in to upload ontologies');
      res.redirect('/login');
  }
});


router.get('/:id', function(req, res) {
  req.db.read('ontologies', req.params.id, function(err, ontology) {
    if(err || !ontology) {
      req.flash('error', 'No such ontology');
      return res.redirect('/ontology');
    }
    request.get(req.aberowl + 'getStats.groovy', {
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

router.get('/:id/manage', function(req, res) {
  req.db.read('ontologies', req.params.id, function(err, ontology) {
    if(req.user && (req.user.admin || (req.user.owns && _.include(req.user.owns, ontology.id)))) {
      res.render('ontology_manage', {
        'ontology': ontology
      });
    } else {
      req.flash('error', 'Please log in to manage this ontology');
      res.redirect('/login');
    }
  });
});

router.get('/:id/query', function(req, res) {
  req.db.read('ontologies', req.params.id, function(err, ontology) {
    res.render('ontology_query', {
      'ontology': ontology
    });
  });
});

router.get('/:id/browse', function(req, res) {
  req.db.read('ontologies', req.params.id, function(err, ontology) {
    res.render('ontology_browse', {
      'ontology': ontology
    });
  });
});

/** Ontology Modification **/

router.post('/:id/update', function(req, res) { // this is just to update the deets
  req.db.read('ontologies', req.params.id, function(err, ontology) {
    if(req.user && (req.user.admin || (req.user.owns && _.include(req.user.owns, ontology.id)))) {
      ontology.name = req.body.name;
      ontology.description = req.body.description;
      req.db.save('ontologies', ontology.id, ontology, function() {
        req.flash('info', 'Ontology Updated');
        res.redirect('/ontology/'+ontology.id+'/');
      });
    } else {
      req.flash('error', 'Please log in to manage this ontology');
      res.redirect('/login');
    }
  });
});

router.post('/:id/updatesyncmethod', function(req, res) { // this is just to update the deets
  req.db.read('ontologies', req.params.id, function(err, ontology) {
    if(req.user && (req.user.admin || (req.user.owns && _.include(req.user.owns, ontology.id)))) {
      if(req.body.method == 'Bioportal') {
        ontology.source = 'bioportal';
      } else if(req.body.method == 'Manual update only') {
        ontology.source = 'manual';
      } else {
        ontology.source = req.body.sourcetext;
      }
      console.log(req.body.method);

      req.db.save('ontologies', ontology.id, ontology, function() {
        req.flash('info', 'Sync Method Updated');
        res.redirect('/ontology/'+ontology.id+'/');
      });
    } else {
      req.flash('error', 'Please log in to manage this ontology');
      res.redirect('/login');
    }
  });
});

router.post('/:id/delete', function(req, res) {
  req.db.read('ontologies', req.params.id, function(err, ontology) {
    if(req.user && (req.user.admin || (req.user.owns && _.include(req.user.owns, ontology.id)))) {
      req.db.del('ontologies', ontology.id, function() {
        req.flash('info', 'Ontology deleted');
        res.redirect('/ontology');
      });
    } else {
      req.flash('error', 'Please log in to manage this ontology');
      res.redirect('/login');
    }
  });
});

// Reloaded event
// Note sure this is the best way to do this but eh
router.get('/:id/reloaded', function(req, res) {
  var success = req.params.result;

  // Send an email or whatever

  // If no success then BALEET
});

module.exports = router;
