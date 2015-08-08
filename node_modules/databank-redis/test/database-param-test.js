// database-param-test.js
//
// Testing the database parameter
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
    databank = require('databank'),
    Databank = databank.Databank,
    RedisDatabank = require('../lib/redis');

Databank.register('redis', RedisDatabank);

var suite = vows.describe("database parameter test");

suite.addBatch({
    "When we create two databanks with different databases": {
        topic: function() {
            var bank1 = Databank.get("redis", {database: 1}),
                bank2 = Databank.get("redis", {database: 2}),
                callback = this.callback;
            
            bank1.connect({}, function(err) {
                if (err) {
                    callback(err, null, null);
                    return;
                }
                bank2.connect({}, function(err) {
                    if (err) {
                        callback(err, null, null);
                        return;
                    }
                    callback(null, bank1, bank2);
                });
            });
        },
        "it works": function(err, bank1, bank2) {
            assert.ifError(err);
            assert.isObject(bank1);
            assert.isObject(bank2);
        },
        teardown: function(bank1, bank2) {
            var ignore = function(err) {};
            if (bank1 && bank1.disconnect) {
                bank1.disconnect(ignore);
            }
            if (bank2 && bank2.disconnect) {
                bank2.disconnect(ignore);
            }
        },
        "and we set a value in the first bank": {
            topic: function(bank1, bank2) {
                var callback = this.callback;
                bank1.save("eyecolor", "stav", "brown", function(err, type) {
                    callback(err);
                });
            },
            "it works": function(err) {
                assert.ifError(err);
            },
            "and we set the same value in the second bank": {
                topic: function(bank1, bank2) {
                    var callback = this.callback;
                    bank2.save("eyecolor", "stav", "green", function(err, type) {
                        callback(err);
                    });
                },
                "it works": function(err) {
                    assert.ifError(err);
                },
                "and we read the value in the first bank": {
                    topic: function(bank1, bank2) {
                        var callback = this.callback;
                        bank1.read("eyecolor", "stav", callback);
                    },
                    "it works": function(err, color) {
                        assert.ifError(err);
                    },
                    "it is the original value": function(err, color) {
                        assert.ifError(err);
                        assert.equal(color, "brown");
                    }
                }
            }
        }
    }
});

suite['export'](module);
