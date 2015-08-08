// test/object-update-hook.js
//
// Testing DatabankObject update() hooks
//
// Copyright 2012, E14N https://e14n.com/
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

var assert = require('assert'),
    vows = require('vows'),
    Step = require('step'),
    databank = require('../databank'),
    Databank = databank.Databank,
    DatabankObject = require('../databankobject').DatabankObject;

var objectUpdateHookContext = function(driver, params) {

    var context = {};

    context["When we create a " + driver + " databank"] = {

        topic: function() {
            if (!params.hasOwnProperty('schema')) {
                params.schema = {};
            }
            params.schema.species = {
                pkey: 'binomial',
                fields: ['common']
            };
            return Databank.get(driver, params);
        },
        'We can connect to it': {
            topic: function(bank) {
                bank.connect(params, this.callback);
            },
            teardown: function(bank) {
                Step(
                    function() {
                        bank.del("species", "Canis lupus", this);
                    },
                    function(err) {
                        if (err) throw err;
                        bank.disconnect(this);
                    },
                    this.callback
                );
            },
            'without an error': function(err) {
                assert.ifError(err);
            },
            'and we can initialize the Species class': {
                topic: function(bank) {
                    var Species = DatabankObject.subClass('species');
                    Species.bank = function() {
                        return bank;
                    };
                    return Species;
                },
                'which is valid': function(Species) {
                    assert.isFunction(Species);
                },
                'and we can create and update a Species': {
                    topic: function(Species) {

                        var cb = this.callback,
                            called = {
                                before: false,
                                after: false,
                                species: null
                            };

                        Species.prototype.beforeUpdate = function(props, callback) {
                            called.before = true;
                            props.addedByBefore = 42;
                            callback(null, props);
                        };

                        Species.prototype.afterUpdate = function(callback) {
                            called.after = true;
                            this.addedByAfter = 23;
                            callback(null, this);
                        };

                        Species.create({binomial: "Canis lupus"}, function(err, species) {
                            if (err) {
                                cb(err, null);
                            } else {
                                species.update({binomial: "Canis lupus", common: "Gray wolf"}, function(err, newSpecies) {
                                    if (err) {
                                        cb(err, null);
                                    } else {
                                        called.species = newSpecies;
                                        // note: not the species
                                        cb(null, called);
                                    }
                                });
                            }
                        });
                    },
                    'without an error': function(err, called) {
                        assert.ifError(err);
                        assert.isObject(called);
                    },
                    'and the before hook is called': function(err, called) {
                        assert.isObject(called);
                        assert.isTrue(called.before);
                    },
                    'and the after hook is called': function(err, called) {
                        assert.isTrue(called.after);
                    },
                    'and the before hook modification happened': function(err, called) {
                        assert.equal(called.species.addedByBefore, 42);
                    },
                    'and the after hook modification happened': function(err, called) {
                        assert.equal(called.species.addedByAfter, 23);
                    }
                }
            }
        }
    };

    return context;
};

module.exports = objectUpdateHookContext;
