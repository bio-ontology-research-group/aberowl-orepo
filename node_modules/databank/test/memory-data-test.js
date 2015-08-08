// Testing DatabankObject basic functionality

var assert = require('assert'),
    vows = require('vows'),
    Step = require('step'),
    databank = require('../lib/databank'),
    Databank = databank.Databank,
    NoSuchThingError = databank.NoSuchThingError;

var suite = vows.describe('memory data param');

suite.addBatch({
    "When we connect with no data param": {
        topic: function() {
            var cb = this.callback,
                db = Databank.get("memory", {});
            db.connect({}, function(err) {
                cb(err, db);
            });
        },
        "it works": function(err, db) {
            assert.ifError(err);
        },
        "and we try to read some data": {
            topic: function(db) {
                var cb = this.callback;
                db.read("person", "evan", function(err, person) {
                    if (err && err instanceof NoSuchThingError) {
                        cb(null);
                    } else if (err) {
                        cb(err);
                    } else {
                        cb(new Error("Unexpected success"));
                    }
                });
            },
            "it fails correctly": function(err) {
                assert.ifError(err);
            }
        }
    },
    "When we connect with an empty data param": {
        topic: function() {
            var cb = this.callback,
                db = Databank.get("memory", {data: {}});
            db.connect({}, function(err) {
                cb(err, db);
            });
        },
        "it works": function(err, db) {
            assert.ifError(err);
        },
        "and we try to read some data": {
            topic: function(db) {
                var cb = this.callback;
                db.read("person", "evan", function(err, person) {
                    if (err && err instanceof NoSuchThingError) {
                        cb(null);
                    } else if (err) {
                        cb(err);
                    } else {
                        cb(new Error("Unexpected success"));
                    }
                });
            },
            "it fails correctly": function(err) {
                assert.ifError(err);
            }
        }
    },
    "When we connect with an non-empty data param": {
        topic: function() {
            var cb = this.callback,
                data = {
                    person: {
                        "evan": {name: "evan", age: 43},
                        "amita": {name: "amita", age: 6}
                    }
                },
                db = Databank.get("memory", {data: data});
            db.connect({}, function(err) {
                cb(err, db);
            });
        },
        "it works": function(err, db) {
            assert.ifError(err);
        },
        "and we try to read uninitialized data": {
            topic: function(db) {
                var cb = this.callback;
                db.read("person", "boris", function(err, person) {
                    if (err && err instanceof NoSuchThingError) {
                        cb(null);
                    } else if (err) {
                        cb(err);
                    } else {
                        cb(new Error("Unexpected success"));
                    }
                });
            },
            "it fails correctly": function(err) {
                assert.ifError(err);
            }
        },
        "and we try to read an uninitialized type": {
            topic: function(db) {
                var cb = this.callback;
                db.read("house", "4690 rue Pontiac", function(err, person) {
                    if (err && err instanceof NoSuchThingError) {
                        cb(null);
                    } else if (err) {
                        cb(err);
                    } else {
                        cb(new Error("Unexpected success"));
                    }
                });
            },
            "it fails correctly": function(err) {
                assert.ifError(err);
            }
        },
        "and we try to read initialized data": {
            topic: function(db) {
                db.read("person", "evan", this.callback);
            },
            "it works": function(err, person) {
                assert.ifError(err);
            },
            "data is correct": function(err, person) {
                assert.ifError(err);
                assert.isObject(person);
                assert.include(person, "name");
                assert.equal(person.name, "evan");
                assert.include(person, "age");
                assert.equal(person.age, 43);
            }
        }
    }
});

suite.export(module);
