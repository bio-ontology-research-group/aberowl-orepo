// update-schema-test.js
//
// Testing that connecting with an updated schema works
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
    async = require('async'),
    databank = require('databank'),
    Databank = databank.Databank,
    RedisDatabank = require('../lib/redis');

Databank.register('redis', RedisDatabank);

var provinces = [
    {code: "AB",
     name: "Alberta",
     capital: "Edmonton"},
    {code: "BC",
     name: "British Columbia",
     capital: "Victoria"},
    {code: "MB",
     name: "Manitoba",
     capital: "Winnipeg"},
    {code: "NB",
     name: "New Brunswick",
     capital: "Fredericton"},
    {code: "NL",
     name: "Newfoundland and Labrador",
     capital: "St. John's"},
    {code: "NT",
     name: "Northwest Territories",
     capital: "Yellowknife"},
    {code: "NS",
     name: "Nova Scotia",
     capital: "Halifax"},
    {code: "NU",
     name: "Nunavut",
     capital: "Iqaluit"},
    {code: "ON",
     name: "Ontario",
     capital: "Toronto"},
    {code: "PE",
     name: "Prince Edward Island",
     capital: "Charlottetown"},
    {code: "QC",
     name: "Quebec",
     capital: "Quebec City"},
    {code: "SK",
     name: "Saskatchewan",
     capital: "Regina"},
    {code: "YT",
     name: "Yukon",
     capital: "Whitehorse"}
];

var suite = vows.describe("update schema test");

suite.addBatch({
    "When we create a databank": {
        topic: function() {
            var callback = this.callback,
                schema = {
                    province: {
                        pkey: "code",
                        fields: ["name", "capital"]
                    }
                },
                bank = Databank.get("redis", {schema: schema});

            bank.connect({}, function(err) {
                if (err) {
                    callback(err, null);
                } else {
                    callback(null, bank);
                }
            });
        },
        "it works": function(err, bank) {
            assert.ifError(err);
            assert.isObject(bank);
        },
        teardown: function(bank) {
            var ignore = function(err) {};
            if (bank && bank.disconnect) {
                bank.disconnect(ignore);
            }
        },
        "and we store our data": {
            topic: function(bank) {
                var callback = this.callback,
                    saveProvince = function(province, callback) {
                        bank.create("province", province.code, province, function(err, type) {
                            callback(err);
                        });
                    };

                async.forEach(provinces, saveProvince, callback);
            },
            "it works": function(err) {
                assert.ifError(err);
            },
            "and we search on an unindexed property": {
                topic: function(bank) {
                    var callback = this.callback,
                        results = [],
                        onResult = function(result) {
                            results.push(result);
                        };

                    bank.search("province", {name: "Ontario"}, onResult, function(err) {
                        callback(err, results);
                    });
                },
                "it works": function(err, results) {
                    assert.ifError(err);
                    assert.isArray(results);
                    assert.lengthOf(results, 1);
                    assert.equal(results[0].code, "ON");
                },
                "and we create a new bank with a different schema": {
                    topic: function() {
                        var callback = this.callback,
                            schema = {
                                province: {
                                    pkey: "code",
                                    fields: ["name", "capital"],
                                    indices: ["name"]
                                }
                            },
                            bank = Databank.get("redis", {schema: schema});
                        
                        bank.connect({}, function(err) {
                            if (err) {
                                callback(err, null);
                            } else {
                                callback(null, bank);
                            }
                        });
                    },
                    "it works": function(err, bank) {
                        assert.ifError(err);
                        assert.isObject(bank);
                    },
                    teardown: function(bank) {
                        var ignore = function(err) {};
                        if (bank && bank.disconnect) {
                            bank.disconnect(ignore);
                        }
                    },
                    "and we search on a newly-indexed property": {
                        topic: function(bank) {
                            var callback = this.callback,
                                results = [],
                                onResult = function(result) {
                                    results.push(result);
                                };

                            bank.search("province", {name: "Quebec"}, onResult, function(err) {
                                callback(err, results);
                            });
                        },
                        "it works": function(err, results) {
                            assert.ifError(err);
                            assert.isArray(results);
                            assert.lengthOf(results, 1);
                            assert.equal(results[0].code, "QC");
                        }
                    }
                }
            }
        }
    }
});

suite['export'](module);
