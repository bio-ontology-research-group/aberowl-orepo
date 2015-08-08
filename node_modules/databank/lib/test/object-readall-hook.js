// test/object-readall-hook.js
//
// Testing DatabankObject readAll() hooks
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
    Step = require('step'),
    vows = require('vows'),
    databank = require('../databank'),
    Databank = databank.Databank,
    DatabankObject = require('../databankobject').DatabankObject,
    keys = ['1932 Ford V8',
            '1959 Austin Mini',
            '1955 Chevrolet',
            '1938 Volkswagen Beetle',
            '1964 Porsche 911',
            '1955 Mercedes-Benz 300SL "Gullwing"'];

// http://www.insideline.com/features/the-100-greatest-cars-of-all-time.html

var objectReadallHookContext = function(driver, params) {

    var context = {};

    context["When we create a " + driver + " databank"] = {

        topic: function() {
            if (!params.hasOwnProperty('schema')) {
                params.schema = {};
            }
            params.schema.auto = {
                pkey: 'yearmakemodel'
            };
            return Databank.get(driver, params);
        },
        'We can connect to it': {
            topic: function(bank) {
                bank.connect(params, this.callback);
            },
            teardown: function(bank) {
                var callback = this.callback;
                Step(
                    function() {
                        var i, group = this.group();
                        for (i = 0; i < keys.length; i++) {
                            bank.del('auto', keys[i], group());
                        }
                    },
                    function(err) {
                        if (err) {
                            console.error(err);
                        }
                        bank.disconnect(this);
                    },
                    callback
                );
            },
            'without an error': function(err) {
                assert.ifError(err);
            },
            'and we can initialize the Auto class': {
                topic: function(bank) {
                    var Auto;

                    Auto = DatabankObject.subClass('auto');

                    Auto.bank = function() {
                        return bank;
                    };

                    return Auto;
                },
                'which is valid': function(Auto) {
                    assert.isFunction(Auto);
                },
                'and we can create a few autos': {
                    topic: function(Auto) {
                        var cb = this.callback;

                        Step(
                            function() {
                                var i, group = this.group();
                                for (i = 0; i < keys.length; i++) {
                                    Auto.create({yearmakemodel: keys[i]}, group());
                                }
                            },
                            function(err, autos) {
                                cb(err, autos);
                            }
                        );
                    },
                    'it works': function(err, autos) {
                        assert.ifError(err);
                        assert.isArray(autos);
                    },
                    'and we read a few back': {
                        topic: function(autos, Auto) {
                            var cb = this.callback,
                                called = {
                                    before: 0,
                                    after: 0,
                                    autos: {}
                                };

                            Auto.beforeGet = function(yearmakemodel, callback) {
                                called.before++;
                                callback(null, yearmakemodel);
                            };

                            Auto.prototype.afterGet = function(callback) {
                                called.after++;
                                this.addedByAfter = 23;
                                callback(null, this);
                            };

                            Auto.readAll(keys, function(err, ppl) {
                                called.autos = ppl;
                                cb(err, called);
                            });
                        },
                        'without an error': function(err, called) {
                            assert.ifError(err);
                            assert.isObject(called);
                        },
                        'and the before hook is called': function(err, called) {
                            assert.isObject(called);
                            assert.equal(called.before, keys.length);
                        },
                        'and the after hook is called': function(err, called) {
                            assert.equal(called.after, keys.length);
                        },
                        'and the after hook modification happened': function(err, called) {
                            var nick;
                            for (nick in called.autos) {
                                assert.isObject(called.autos[nick]);
                                assert.equal(called.autos[nick].addedByAfter, 23);
                            }
                        }
                    }
                }
            }
        }
    };

    return context;
};

module.exports = objectReadallHookContext;
