// test/array.js
//
// Builds a test context for arrays
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

var arrayContext = function(driver, params) {

    var context = {};

    context["When we create a " + driver + " databank"] = {

        topic: function() {
            if (!params.hasOwnProperty('schema')) {
                params.schema = {};
            }
            params.schema.inbox = {
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
            'and we append to an uninitialized array': {
                topic: function(bank) {
                    bank.append('shoes', 'ericm', {size: 14, color: "blue"}, this.callback); 
                },
                teardown: function(bank) {
                    if (bank && bank.del) {
                        bank.del('shoes', 'ericm', function(err) {});
                    }
                },
                "it works": function(err) {
                    assert.ifError(err);
                },
                "and we fetch the array": {
                    topic: function(bank) {
                        bank.read('shoes', 'ericm', this.callback);
                    },
                    "it has the right data": function(err, shoes) {
                        assert.ifError(err);
                        assert.isArray(shoes);
                        assert.lengthOf(shoes, 1);
                        assert.isObject(shoes[0]);
                        assert.equal(shoes[0].size, 14);
                        assert.equal(shoes[0].color, "blue");
                    }
                }
            },
            'and we prepend to an uninitialized array': {
                topic: function(bank) {
                    bank.prepend('friends', 'horaceq', "ericm", this.callback); 
                },
                teardown: function(bank) {
                    if (bank && bank.del) {
                        bank.del('friends', 'horaceq', function(err) {});
                    }
                },
                "it works": function(err) {
                    assert.ifError(err);
                },
                "and we fetch the array": {
                    topic: function(bank) {
                        bank.read('friends', 'horaceq', this.callback);
                    },
                    "it has the right data": function(err, inbox) {
                        assert.ifError(err);
                        assert.isArray(inbox);
                        assert.lengthOf(inbox, 1);
                        assert.equal(inbox[0], "ericm");
                    }
                }
            },
            'and we can insert an array': {
                topic: function(bank) {
                    bank.create('inbox', 'evanp', [1, 2, 3], this.callback); 
                },
                'without an error': function(err, value) {
                    assert.ifError(err);
                    assert.isArray(value);
                    assert.equal(value.length, 3);
		    assert.deepEqual(value, [1, 2, 3]);
                },
                'and we can fetch it': {
                    topic: function(created, bank) {
                        bank.read('inbox', 'evanp', this.callback);
                    },
                    'without an error': function(err, value) {
			assert.ifError(err);
			assert.isArray(value);
			assert.equal(value.length, 3);
			assert.deepEqual(value, [1, 2, 3]);
                    },
                    'and we can update it': {
                        topic: function(read, created, bank) {
                            bank.update('inbox', 'evanp', [1, 2, 3, 4], this.callback);
                        },
                        'without an error': function(err, value) {
			    assert.ifError(err);
			    assert.isArray(value);
			    assert.equal(value.length, 4);
			    assert.deepEqual(value, [1, 2, 3, 4]);
                        },
                        'and we can read it again': {
                            topic: function(updated, read, created, bank) {
				bank.read('inbox', 'evanp', this.callback);
                            },
                            'without an error': function(err, value) {
				assert.ifError(err);
				assert.isArray(value);
				assert.equal(value.length, 4);
				assert.deepEqual(value, [1, 2, 3, 4]);
                            },
                            'and we can prepend to it': {
                                topic: function(readAgain, updated, read, created, bank) {
				    bank.prepend('inbox', 'evanp', 0, this.callback);
                                },
                                'without an error': function(err) {
				    assert.ifError(err);
				},
				'and we can append to it': {
                                    topic: function(readAgain, updated, read, created, bank) {
					bank.append('inbox', 'evanp', 5, this.callback);
                                    },
                                    'without an error': function(err) {
					assert.ifError(err);
				    },
				    'and we can get a single item': {
					topic: function(readAgain, updated, read, created, bank) {
					    bank.item('inbox', 'evanp', 2, this.callback);
					},
					'without an error': function(err, value) {
					    assert.ifError(err);
					    assert.equal(value, 2);
					},
					'and we can get a slice': {
					    topic: function(item, readAgain, updated, read, created, bank) {
					        bank.slice('inbox', 'evanp', 1, 3, this.callback);
					    },
					    'without an error': function(err, value) {
						assert.ifError(err);
					        assert.isArray(value);
					        assert.equal(value.length, 2);
					        assert.deepEqual(value, [1, 2]);
					    },
                                            'and we can get the indexOf an item': {
                                                topic: function(slice, item, readAgain, updated, read, created, bank) {
                                                    bank.indexOf('inbox', 'evanp', 2, this.callback);
                                                },
                                                'without an error': function(err, index) {
                                                    assert.ifError(err);
                                                    assert.equal(index, 2);
                                                },
                                                'and we can remove an item': {
					            topic: function(index, slice, item, readAgain, updated, read, created, bank) {
                                                        bank.remove('inbox', 'evanp', 3, this.callback);
                                                    },
                                                    'without an error': function(err) {
                                                        assert.ifError(err);
                                                    },
                                                    'and we can read again': {
					                topic: function(index, slice, item, readAgain, updated, read, created, bank) {
                                                            bank.read('inbox', 'evanp', this.callback);
                                                        },
                                                        'without an error': function(err, box) {
                                                            assert.ifError(err);
                                                            assert.deepEqual(box, [0, 1, 2, 4, 5]);
                                                        },
					                'and we can delete it': {
					                    topic: function(readAgainAgain, index, slice, item, readAgain, updated, read, created, bank) {
					                        bank.del('inbox', 'evanp', this.callback);
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
                }
            }
        }
    };

    return context;
};

module.exports = arrayContext;
