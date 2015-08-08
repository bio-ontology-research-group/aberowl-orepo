// test/object-del-hook.js
//
// Test del hooks for Databank objects
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
    Databank = databank.Databank,
    DatabankObject = require('../databankobject').DatabankObject;

var objectDelHookContext = function(driver, params) {

    var context = {};

    context["When we create a " + driver + " databank"] = {

        topic: function() {
            if (!params.hasOwnProperty('schema')) {
                params.schema = {};
            }
            params.schema.flight = {
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
            'and we can initialize the Flight class': {
                topic: function(bank) {
                    var Flight = DatabankObject.subClass('flight');
                    Flight.bank = function() {
                        return bank;
                    };
                    return Flight;
                },
                'which is valid': function(Flight) {
                    assert.isFunction(Flight);
                },
                'and we can create and delete a Flight': {
                    topic: function(Flight) {

                        var cb = this.callback,
                            called = {
                                before: false,
                                after: false
                            };

                        Flight.prototype.beforeDel = function(callback) {
                            called.before = true;
                            callback(null);
                        };

                        Flight.prototype.afterDel = function(callback) {
                            called.after = true;
                            callback(null);
                        };

                        Flight.create({number: "AC761"}, function(err, flight) {
                            if (err) {
                                cb(err, null);
                            } else {
                                flight.del(function(err) {
                                    if (err) {
                                        cb(err, null);
                                    } else {
                                        // note: not the flight
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
                        assert.isTrue(called.before);
                    },
                    'and the after hook is called': function(err, called) {
                        assert.isTrue(called.after);
                    }
                }
            }
        }
    };

    return context;
};

module.exports = objectDelHookContext;
