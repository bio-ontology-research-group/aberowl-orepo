// test/object-get-hook.js
//
// Test get hooks for Databank objects
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
    Databank = databank.Databank,
    DatabankObject = require('../databankobject').DatabankObject;

var objectGetHookContext = function(driver, params) {

    var context = {};

    context["When we create a " + driver + " databank"] = {

        topic: function() {
            if (!params.hasOwnProperty('schema')) {
                params.schema = {};
            }
            params.schema.stock = {
                pkey: 'ticker'
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
                        bank.del('stock', "GOOG", this);
                    },
                    function(err) {
                        if (err) throw err;
                        bank.disconnect(this);
                    },
                    callback
                );
            },
            'without an error': function(err) {
                assert.ifError(err);
            },
            'and we can initialize the Stock class': {
                topic: function(bank) {
                    var Stock = DatabankObject.subClass('stock');
                    Stock.bank = function() {
                        return bank;
                    };
                    return Stock;
                },
                'which is valid': function(Stock) {
                    assert.isFunction(Stock);
                },
                'and we can create and get a Stock': {
                    topic: function(Stock) {

                        var cb = this.callback,
                            called = {
                                before: false,
                                after: false,
                                stock: null
                            };

                        Stock.beforeGet = function(ticker, callback) {
                            called.before = true;
                            callback(null, ticker);
                        };

                        Stock.prototype.afterGet = function(callback) {
                            called.after = true;
                            this.addedByAfter = 23;
                            callback(null, this);
                        };

                        Stock.create({ticker: "GOOG"}, function(err, stock) {
                            if (err) {
                                cb(err, null);
                            } else {
                                Stock.get("GOOG", function(err, newStock) {
                                    if (err) {
                                        cb(err, null);
                                    } else {
                                        called.stock = newStock;
                                        // note: not the stock
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
                        assert.isObject(called);
                        assert.isTrue(called.before);
                    },
                    'and the after hook is called': function(err, called) {
                        assert.isTrue(called.after);
                    },
                    'and the after hook modification happened': function(err, called) {
                        assert.equal(called.stock.addedByAfter, 23);
                    }
                }
            }
        }
    };

    return context;
};

module.exports = objectGetHookContext;
