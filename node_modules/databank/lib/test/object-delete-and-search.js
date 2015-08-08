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
            params.schema.user = {
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
            'and we can initialize the User class': {
                topic: function(bank) {
                    var User = DatabankObject.subClass('user');
                    User.bank = function() {
                        return bank;
                    };
                    return User;
                },
                'which is valid': function(User) {
                    assert.ok(User);
                },
                'and we create and delete a User': {
                    topic: function(User, bank) {
                        var callback = this.callback,
                            maj = {username: 'maj',
                                   name: {last: 'Jenkins', first: 'Michele'}};

                        Step(
                            function() {
                                User.create(maj, this);
                            },
                            function(err, maj) {
                                if (err) throw err;
                                maj.del(this);
                            },
                            callback
                        );
                    },
                    "it works": function(err) {
                        assert.ifError(err);
                    },
                    "and we try to get the User": {
                        topic: function(User, bank) {
                            var callback = this.callback;
                            User.get("maj", function(err, p) {
                                if (err && err instanceof NoSuchThingError) {
                                    callback(null);
                                } else if (err) {
                                    callback(err);
                                } else {
                                    callback(new Error("Unexpected success"));
                                }
                            });
                        },
                        "it returns a NoSuchThingError": function(err) {
                            assert.ifError(err);
                        }
                    },
                    "and we search for the User": {
                        topic: function(User, bank) {
                            User.search({"name.last": "Jenkins"}, this.callback);
                        },
                        "it works": function(err, results) {
                            assert.ifError(err);
                            assert.isArray(results);
                        },
                        "there are no results": function(err, results) {
                            assert.ifError(err);
                            assert.isArray(results);
                            assert.lengthOf(results, 0);
                        }
                    }
                }
            }
        }
    };

    return context;
};

module.exports = objectContext;
