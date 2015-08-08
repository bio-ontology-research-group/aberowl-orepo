// test/object.js
//
// Testing DatabankObject scan functionality
//
// Copyright 2013, E14N https://e14n.com/
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
    Step = require('step'),
    Databank = databank.Databank,
    NoSuchThingError = databank.NoSuchThingError,
    DatabankObject = require('../databankobject').DatabankObject;

var data = [
    {
        uuid: "baad21be-8fee-11e2-b812-2c8158efb9e9",
        name: "Fred Q. Jones",
        company: "Acme Corporation",
        phone: "+1-212-555-1001"
    },
    {
        uuid: "c9fa559c-8fee-11e2-96b3-2c8158efb9e9",
        name: "Fred W. Jones",
        company: "General Eclectic",
        phone: "+1-213-555-1001"
    },
    {
        uuid: "c9fa9d9a-8fee-11e2-beb1-2c8158efb9e9",
        name: "Fred N. Jones",
        company: "Consolidated Amalgamations",
        phone: "+1-214-555-1001"
    },
    {
        uuid: "c9faea20-8fee-11e2-97e4-2c8158efb9e9",
        name: "Fred R. Jones",
        company: "American Company Corporation",
        phone: "+1-215-555-1001"
    },
    {
        uuid: "c9fb37be-8fee-11e2-8472-2c8158efb9e9",
        name: "Fred B. Jones",
        company: "The Industry Group",
        phone: "+1-216-555-1001"
    }
];

var objectScanContext = function(driver, params) {

    var context = {};

    context["When we create a " + driver + " databank"] = {

        topic: function() {
            if (!params.hasOwnProperty('schema')) {
                params.schema = {};
            }
            params.schema.card = {
                pkey: 'uuid',
                fields: ['name', 'company']
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
                        for (i = 0; i < data.length; i++) {
                            bank.del('card', data[i].imdb, group());
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
            'and we can initialize the Card class': {
                topic: function(bank) {
                    var Card = DatabankObject.subClass('card');
                    Card.bank = function() {
                        return bank;
                    };
                    return Card;
                },
                'which is valid': function(Card) {
                    assert.ok(Card);
                    assert.ok(Card.scan);
                },
                'and we can add some cards': {
                    topic: function(Card, bank) {
                        var cb = this.callback;
                        Step(
                            function() {
                                var i = 0, group = this.group();
                                for ( i = 0; i < data.length; i++) {
                                    Card.create(data[i], group());
                                }
                            },
                            cb
                        );
                    },
                    'which works': function(err, cards) {
                        assert.ifError(err);
                        assert.isArray(cards);
                        assert.equal(cards.length, data.length);
                    },
                    'and we scan the Card class': {
                        topic: function(created, Card, bank) {
                            var cb = this.callback,
                                results = [], 
                                onResult = function(result) { results.push(result); };

                            Card.scan(onResult, function(err) {
                                cb(err, results);
                            });
                        },
                        'which is valid': function(err, cards) {
                            assert.ifError(err);
                            assert.isArray(cards);
                            assert.equal(cards.length, data.length);
                        }
                    }
                }
            }
        }
    };

    return context;
};

module.exports = objectScanContext;
