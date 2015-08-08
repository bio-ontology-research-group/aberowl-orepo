// test/object.js
//
// Testing DatabankObject basic functionality
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
    si = require('set-immediate'),
    databank = require('../databank'),
    Step = require('step'),
    Databank = databank.Databank,
    NoSuchThingError = databank.NoSuchThingError,
    DatabankObject = require('../databankobject').DatabankObject;

var objectContext = function(driver, params) {

    var context = {};

    context["When we create a " + driver + " databank"] = {

        topic: function() {
            if (!params.hasOwnProperty('schema')) {
                params.schema = {};
            }
            params.schema.person = {
                pkey: 'username',
                fields: ['name'],
                indices: ['name.last']
            };
            return Databank.get(driver, params);
        },
        'We can connect to it': {
            topic: function(bank) {
                bank.connect(params, this.callback);
            },
            teardown: function(bank) {
                var callback = this.callback;
                // Workaround for vows bug
                setImmediate(function() {
                    bank.disconnect(function(err) {
                        callback();
                    });
                });
            },
            'without an error': function(err) {
                assert.ifError(err);
            },
            'and we can initialize the Person class': {
                topic: function(bank) {
                    var Person = DatabankObject.subClass('person');
                    Person.bank = function() {
                        return bank;
                    };
                    return Person;
                },
                'which is valid': function(Person) {
                    assert.ok(Person);
                    assert.ok(Person.get);
                    assert.ok(Person.search);
                    assert.ok(Person.scan);
                    assert.ok(Person.pkey);
                    assert.ok(Person.create);
                    assert.ok(Person.bank());
                    assert.equal(Person.type, 'person');
                    assert.equal(Person.pkey(), 'username');
                },
                'and we can instantiate a new Person': {
                    topic: function(Person, bank) {
                        return new Person({username: 'evanp', name: {last: 'Prodromou', first: 'Evan'}, age: 42});
                    },
                    'which is valid': function(evan) {
                        assert.ok(evan);
                        assert.ok(evan.del);
                        assert.ok(evan.save);
                        assert.ok(evan.update);
                        assert.equal(evan.username, 'evanp');
                        assert.ok(evan.name);
                        assert.equal(evan.name.last, 'Prodromou');
                        assert.equal(evan.name.first, 'Evan');
                        assert.equal(evan.age, 42);
                    },
                    'and we can save that person': {
                        topic: function(evan, Person, bank) {
                            evan.save(this.callback);
                        },
                        'which is valid': function(err, person) {
                            assert.ifError(err);
                            assert.ok(person);
                            assert.equal(person.username, 'evanp');
                            assert.ok(person.name);
                            assert.equal(person.name.last, 'Prodromou');
                            assert.equal(person.name.first, 'Evan');
                            assert.equal(person.age, 42);
                        },
                        'and we can read that person': {
                            topic: function(saved, evan, Person, bank) {
                                Person.get('evanp', this.callback);
                            },
                            'which is valid': function(err, person) {
                                assert.ifError(err);
                                assert.ok(person);
                                assert.equal(person.username, 'evanp');
                                assert.ok(person.name);
                                assert.equal(person.name.last, 'Prodromou');
                                assert.equal(person.name.first, 'Evan');
                                assert.equal(person.age, 42);
                            },
                            'and we can save a changed person': {
                                topic: function(person, saved, evan, Person, bank) {
                                    person.age = 43;
                                    person.save(this.callback);
                                },
                                'which is valid': function(err, person) {
                                    assert.ifError(err);
                                    assert.ok(person);
                                    assert.equal(person.username, 'evanp');
                                    assert.ok(person.name);
                                    assert.equal(person.name.last, 'Prodromou');
                                    assert.equal(person.name.first, 'Evan');
                                    assert.equal(person.age, 43);
                                },
                                'and we can fetch the saved person': {
                                    topic: function(changed, read, saved, evan, Person, bank) {
                                        Person.get('evanp', this.callback);
                                    },
                                    'which is valid': function(err, person) {
                                        assert.ifError(err);
                                        assert.ok(person);
                                        assert.equal(person.username, 'evanp');
                                        assert.ok(person.name);
                                        assert.equal(person.name.last, 'Prodromou');
                                        assert.equal(person.name.first, 'Evan');
                                        assert.equal(person.age, 43);
                                    },
                                    'and we can delete the fetched, saved person': {
                                        topic: function(reread, changed, read, saved, evan, Person, bank) {
                                            reread.del(this.callback);
                                        },
                                        'without an error': function(err) {
                                            assert.ifError(err);
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    };

    return context;
};

module.exports = objectContext;
