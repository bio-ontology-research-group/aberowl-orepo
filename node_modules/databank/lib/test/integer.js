// test/integer.js
//
// Test CRUD for integer scalars
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

var integerContext = function(driver, params) {

    var context = {};

    context["When we create a " + driver + " databank"] = {

        topic: function() {
            if (!params.hasOwnProperty('schema')) {
                params.schema = {};
            }
            params.schema['computer-count'] = {
                pkey: 'username'
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
            'and we can insert an integer': {
                topic: function(bank) {
                    bank.create('computer-count', 'evanp', 3, this.callback); 
                },
                'without an error': function(err, value) {
                    assert.ifError(err);
                    assert.isNumber(value);
                    assert.equal(value, 3);
                },
                'and we can fetch it': {
                    topic: function(created, bank) {
                        bank.read('computer-count', 'evanp', this.callback);
                    },
                    'without an error': function(err, value) {
                        assert.ifError(err);
                        assert.isNumber(value);
                        assert.equal(value, 3);
                    },
                    'and we can update it': {
                        topic: function(read, created, bank) {
                            bank.update('computer-count', 'evanp', 5, this.callback);
                        },
                        'without an error': function(err, value) {
                            assert.ifError(err);
                            assert.isNumber(value);
                            assert.equal(value, 5);
                        },
                        'and we can read it again': {
                            topic: function(updated, read, created, bank) {
                                bank.read('computer-count', 'evanp', this.callback);
                            },
                            'without an error': function(err, value) {
                                assert.ifError(err);
                                assert.isNumber(value);
                                assert.equal(value, 5);
                            },
                            'and we can increment it': {
                                topic: function(readAgain, updated, read, created, bank) {
                                    bank.incr('computer-count', 'evanp', this.callback);
                                },
                                'without an error': function(err, value) {
                                    assert.ifError(err);
                                    assert.isNumber(value);
                                    assert.equal(value, 6);
                                },
                                'and we can decrement it': {
                                    topic: function(incremented, readAgain, updated, read, created, bank) {
                                        bank.decr('computer-count', 'evanp', this.callback);
                                    },
                                    'without an error': function(err, value) {
                                        assert.ifError(err);
                                        assert.isNumber(value);
                                        assert.equal(value, 5);
                                    },
                                    'and we can delete it': {
                                        topic: function(decremented, incremented, readAgain, updated, read, created, bank) {
                                            bank.del('computer-count', 'evanp', this.callback);
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

module.exports = integerContext;
