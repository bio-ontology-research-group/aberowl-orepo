// test/bank-instance.js
//
// Builds a test context for new databank instances
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
    databank = require('../databank'),
    Databank = databank.Databank;

var bankInstanceContext = function(driver, params) {

    var context = {};

    context["When we create a " + driver + " databank"] = {
        topic: function() {
            return Databank.get(driver, params);
        },
        'it is a databank': function(bank) {
            assert.isObject(bank);
            assert.instanceOf(bank, Databank);
        },
        'it has a connect method': function(bank) {
            assert.isFunction(bank.connect);
        },
        'it has a disconnect method': function(bank) {
            assert.isFunction(bank.disconnect);
        },
        'it has a create method': function(bank) {
            assert.isFunction(bank.create);
        },
        'it has a read method': function(bank) {
            assert.isFunction(bank.read);
        },
        'it has a update method': function(bank) {
            assert.isFunction(bank.update);
        },
        'it has a del method': function(bank) {
            assert.isFunction(bank.del);
        },
        'it has a save method': function(bank) {
            assert.isFunction(bank.save);
        },
        'it has a readAll method': function(bank) {
            assert.isFunction(bank.readAll);
        },
        'it has an incr method': function(bank) {
            assert.isFunction(bank.incr);
        },
        'it has a decr method': function(bank) {
            assert.isFunction(bank.decr);
        },
        'it has an append method': function(bank) {
            assert.isFunction(bank.append);
        },
        'it has a prepend method': function(bank) {
            assert.isFunction(bank.prepend);
        },
        'it has an item method': function(bank) {
            assert.isFunction(bank.item);
        },
        'it has a slice method': function(bank) {
            assert.isFunction(bank.slice);
        }
    };

    return context;
};

module.exports = bankInstanceContext;
