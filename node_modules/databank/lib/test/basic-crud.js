// test/basic-crud.js
//
// Builds a test context for basic CRUD functionality for a databank
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
    Databank = databank.Databank;

var basicCrudContext = function(driver, params) {

    var context = {};

    context["When we create a " + driver + " databank"] = {
        topic: function() {
            if (!params.hasOwnProperty('schema')) {
                params.schema = {};
            }
            params.schema.test = {
                    pkey: 'number'
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
            'and we can create an item': {
                topic: function(bank) {
                    bank.create('test', 1, {'pass': true, 'iters': 42}, this.callback);
                },
                'without an error': function(err, value) {
                    assert.ifError(err);
                },
                'with an object return value': function(err, value) {
                    assert.ifError(err);
                    assert.isObject(value);
                },
                'with a valid value': function(err, value) {
                    assert.ifError(err);
                    assert.isObject(value);
                    assert.equal(value.pass, true);
                    assert.equal(value.iters, 42);
                },
                'and we can read it back from the databank': {
                    topic: function(created, bank) {
                        bank.read('test', 1, this.callback);
                    },
                    'without an error': function(err, value) {
                        assert.ifError(err);
                    },
                    'with an object return value': function(err, value) {
                        assert.isObject(value);
                    },
                    'with a valid value': function(err, value) {
                        assert.equal(value.pass, true);
                        assert.equal(value.iters, 42);
                    },
                    'and we can update it in the databank': {
                        topic: function(read, created, bank) {
                            bank.update('test', 1, {'pass': true, 'iters': 43}, this.callback);
                        },
                        'without an error': function(err, value) {
                            assert.ifError(err);
                        },
                        'with an object return value': function(err, value) {
                            assert.isObject(value);
                        },
                        'with an updated value': function(err, value) {
                            assert.equal(value.pass, true);
                            assert.equal(value.iters, 43);
                        },
                        'and we can delete the entry': {
                            topic: function(updated, read, created, bank) {
                                bank.del('test', 1, this.callback);
                            },
                            'without an error': function(err) {
                                assert.ifError(err);
                            }
                        }
                    }
                }
            }
        }
    };

    return context;
};

module.exports = basicCrudContext;
