// test/readall.js
//
// Testing readAll() method
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
    Databank = databank.Databank;

var readAllContext = function(driver, params) {

    var context = {};

    context["When we create a " + driver + " databank"] = {

        topic: function() {
            if (!params.hasOwnProperty('schema')) {
                params.schema = {};
            }
            params.schema.task = {
                pkey: 'number'
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
                        var i, group = this.group();
                        for (i = 0; i < 10; i++) {
                            bank.del('task', i, group());
                        }
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
            'and we can create a bunch of items': {
                topic: function(bank) {
                    var cb = this.callback;
                    Step(
                        function() {
                            var i, group = this.group();
                            for (i = 0; i < 10; i++) {
                                bank.create('task', i, {number: i, complete: false, priority: 5}, group());
                            }
                        },
                        cb
                    );
                },
                'without an error': function(err, tasks) {
                    var i;
                    assert.ifError(err);
                    assert.isArray(tasks);
                    assert.lengthOf(tasks, 10);
                    for (i = 0; i < 10; i++) {
                        assert.isObject(tasks[i]);
                    }
                },
                'and we can read some back': {
                    topic: function(tasks, bank) {
                        bank.readAll('task', [2, 3, 4, 'nonexistent'], this.callback);
                    },
                    'without an error': function(err, results) {
                        assert.ifError(err);
                    },
                    'with the correct data': function(err, results) {
                        var i;
                        assert.ifError(err);
                        assert.isObject(results);
                        for (i = 2; i <= 4; i++) {
                            assert.isObject(results[i]);
                            assert.equal(results[i].number, i);
                            assert.isFalse(results[i].complete);
                            assert.equal(results[i].priority, 5);
                        }
                        assert.isNull(results['nonexistent']);
                    }
                }
            }
        }
    };

    return context;
};

module.exports = readAllContext;
