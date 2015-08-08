// test/extreme-ids.js
//
// Builds a test context for unusual but legal ID values
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

var basicCrudContext = function(driver, params) {

    var context = {};

    context["When we create a " + driver + " databank"] = {

        topic: function() {
            if (!params.hasOwnProperty('schema')) {
                params.schema = {};
            }
            params.schema.locality = {
                    pkey: 'name'
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
                        var i,
                            group = this.group(),
                            items = [
                                'The Hague',
                                "Hale'iwa",
                                "Llanfairpwllgwyngyllgogerychwyrndrobwllllantysiliogogogoch"
                            ];

                        for (i = 0; i < items.length; i++) {
                            bank.del('locality', items[i], group());
                        }
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
            'and we can create an item with a space in the id': {
                topic: function(bank) {
                    bank.create('locality', 'The Hague', {country: 'nl'}, this.callback);
                },
                'without an error': function(err, value) {
                    assert.ifError(err);
                }
            },
            'and we can create an item with punctuation in the id': {
                topic: function(bank) {
                    bank.create('locality', "Hale'iwa", {country: 'us'}, this.callback);
                },
                'without an error': function(err, value) {
                    assert.ifError(err);
                }
            },
            'and we can create an item with a very long id': {
                topic: function(bank) {
                    bank.create('locality', "Llanfairpwllgwyngyllgogerychwyrndrobwllllantysiliogogogoch", 
                                {country: 'uk'},
                                this.callback);
                },
                'without an error': function(err, value) {
                    assert.ifError(err);
                }
            }
        }
    };

    return context;
};

module.exports = basicCrudContext;
