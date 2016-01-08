#!/usr/bin/node
// Usage: scripts/claimontology.js ontologyname username
var databank = require('databank').Databank,
    _ = require('underscore')._,
    oName = process.argv[2],
    uName = process.argv[3];

var params = {
    'schema': {},
    'port': 6379
};
var db = databank.get('redis', params);
db.connect({}, function(err) {
  if(err) {
    throw new Error('Could not connect to database');
  }
}.bind(this));

db.read('ontologies', oName, function(err, ontology) {
  if(err || !ontology) {
    return quit('Could not find ontology!');
  }
  db.read('users', uName, function(err, user) {
    if(err || !user) {
      return quit('Could not find user!');
    }

    if(!_.has(ontology, 'owners') || (_.has(ontology, 'owners') && !_.isArray(ontology.owners))) {
      ontology.owners = [];
    }
    ontology.owners.push(uName);

    db.save('ontologies', oName, ontology, function() {
      return quit('Added ' + uName + ' to owners of ' + oName);  
    });
  });
});

var quit = function(msg) {
  console.log(msg);
  db.disconnect(function(){});
}
