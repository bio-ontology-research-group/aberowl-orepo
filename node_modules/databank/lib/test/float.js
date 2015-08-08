// test/float.js
//
// Test CRUD for floating-point scalars
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

var floatContext = function(driver, params) {

    var context = {};

    context["When we create a " + driver + " databank"] = {

        topic: function() {
            if (!params.hasOwnProperty('schema')) {
                params.schema = {};
            }
            params.schema.probability = {
                pkey: 'weather'
            };
            return Databank.get(driver, params);
        },
        'We can connect to it': {
            topic: function(bank) {
                bank.connect(params, this.callback);
            },
            'without an error': function(err) {
                assert.ifError(err);
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
            'and we can insert a number': {
                topic: function(bank) {
                    bank.create('probability', 'rain', 0.30, this.callback); 
                },
                'without an error': function(err, value) {
                    assert.ifError(err);
                    assert.isNumber(value);
                    assert.equal(value - 0.30 < 0.0001, true);
                },
                'and we can fetch it': {
                    topic: function(created, bank) {
                        bank.read('probability', 'rain', this.callback);
                    },
                    'without an error': function(err, value) {
			assert.ifError(err);
                        assert.isNumber(value);
                        assert.equal(value - 0.30 < 0.0001, true);
                    },
                    'and we can update it': {
                        topic: function(read, created, bank) {
                            bank.update('probability', 'rain', 0.45, this.callback);
                        },
                        'without an error': function(err, value) {
			    assert.ifError(err);
			    assert.isNumber(value);
                            assert.equal(value - 0.45 < 0.0001, true);
                        },
                        'and we can read it again': {
                            topic: function(updated, read, created, bank) {
				bank.read('probability', 'rain', this.callback);
                            },
                            'without an error': function(err, value) {
				assert.ifError(err);
			        assert.isNumber(value);
                                assert.equal(value - 0.45 < 0.0001, true);
                            },
                            'and we can save it': {
                                topic: function(readAgain, updated, read, created, bank) {
				    bank.save('probability', 'rain', 0.25, this.callback);
                                },
                                'without an error': function(err, value) {
				    assert.ifError(err);
			            assert.isNumber(value);
                                    assert.equal(value - 0.25 < 0.0001, true);
                                },
                                'and we can read it once more': {
                                    topic: function(saved, readAgain, updated, read, created, bank) {
				        bank.read('probability', 'rain', this.callback);
                                    },
                                    'without an error': function(err, value) {
				        assert.ifError(err);
			                assert.isNumber(value);
                                        assert.equal(value - 0.45 < 0.0001, true);
                                    },
			            'and we can delete it': {
				        topic: function(readOnceMore, saved, readAgain, updated, read, created, bank) {
				            bank.del('probability', 'rain', this.callback);
				        },
				        'without an error': function(err) {
				            assert.ifError(err);
				        },
                                        'and we can save to create': {
                                            topic: function(readOnceMore, saved, readAgain, updated, read, created, bank) {
				                bank.save('probability', 'fog', 0.10, this.callback);
                                            },
                                            'without an error': function(err, value) {
				                assert.ifError(err);
			                        assert.isNumber(value);
                                                assert.equal(value - 0.10 < 0.0001, true);
                                            },
			                    'and we can delete it': {
				                topic: function(saveCreated, readOnceMore, saved, readAgain, updated, read, created, bank) {
				                    bank.del('probability', 'fog', this.callback);
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
            }
        }
    };

    return context;
};

module.exports = floatContext;
