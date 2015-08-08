// test/save.js
//
// Testing save() method
//
// Copyright 2011,2012 E14N https://e14n.com/
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
    databank = require('../databank'),
    Databank = databank.Databank;

var saveContext = function(driver, params) {

    var context = {};

    context["When we create a " + driver + " databank"] = {

        topic: function() {
            if (!params.hasOwnProperty('schema')) {
                params.schema = {};
            }
            params.schema.grape = {
                pkey: 'name',
                fields: ['color', 'flavor']
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
            'and we can save an item': {
                topic: function(bank) {
                    bank.save('grape', 'merlot', {'color': 'red', 'flavor': 'rich'}, this.callback); 
                },
                'without an error': function(err, value) {
                    assert.ifError(err);
                    assert.ok(value);
                    assert.isObject(value);
                    assert.equal(value.color, 'red');
                    assert.equal(value.flavor, 'rich');
                },
                'and we can fetch it': {
                    topic: function(created, bank) {
                        bank.read('grape', 'merlot', this.callback);
                    },
                    'without an error': function(err, value) {
                        assert.ifError(err);
                        assert.isObject(value);
                        assert.equal(value.color, 'red');
                        assert.equal(value.flavor, 'rich');
                    },
                    'and we can save it again': {
                        topic: function(read, created, bank) {
                            bank.save('grape', 'merlot', {'color': 'red', 'flavor': 'lush'}, this.callback);
                        },
                        'without an error': function(err, value) {
                            assert.ifError(err);
                            assert.ok(value);
                            assert.equal(typeof value, 'object');
                            assert.equal(value.color, 'red');
                            assert.equal(value.flavor, 'lush');
                        },
                        'and we can read it again': {
                            topic: function(updated, read, created, bank) {
                                bank.read('grape', 'merlot', this.callback);
                            },
                            'without an error': function(err, value) {
                                assert.ifError(err);
                                assert.ok(value);
                                assert.equal(typeof value, 'object');
                                assert.equal(value.color, 'red');
                                assert.equal(value.flavor, 'lush');
                            },
                            'and we can delete it': {
                                topic: function(readAgain, updated, read, created, bank) {
                                    bank.del('grape', 'merlot', this.callback);
                                },
                                'without an error': function(err) {
                                    assert.ifError(err);
                                },
                                'and we can disconnect': {
                                    topic: function(readAgain, updated, read, created, bank) {
                                        bank.disconnect(this.callback);
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
    };

    return context;
};

module.exports = saveContext;
