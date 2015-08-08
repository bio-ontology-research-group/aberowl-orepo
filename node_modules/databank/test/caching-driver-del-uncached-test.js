// caching-driver-del-uncached-test.js
//
// Testing the caching driver
//
// Copyright 2014, E14N https://e14n.com/
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
    databank = require('../lib/index'),
    Databank = databank.Databank;

var suite = vows.describe("Caching driver with missing items").addBatch({
    'When we connect to the databank': {
        'topic': function() {
            var params = {
                    'cache': {driver: 'memory', params: {}},
                    'source': {driver: 'memory', params: {}},
                    'schema': {
                        'bike': {
                            'pkey': 'id'
                        }
                    }
                },
                db = Databank.get("caching", params),
                callback = this.callback;

            db.connect({}, function(err) {
                callback(err, db);
            });
        },
        'it works': function(err, db) {
            assert.ifError(err);
            assert.isObject(db);
        },
        'and we create an object': {
            'topic': function(db) {
                db.create('bike', 307, {'id': 307, 'name': 'Simone'}, this.callback);
            },
            'it works': function(err, bike) {
                assert.ifError(err);
                assert.isObject(bike);
                assert.equal(bike.id, 307);
                assert.equal(bike.name, 'Simone');
            },
            'and we simulate cache expiration by deleting the object from the cache databank': {
                'topic': function(bike, db) {
                    // Note: this is probably a bug in the caching databank interface!
                    db.cache.del('bike', bike.id, this.callback);
                },
                'it works': function(err) {
                    assert.ifError(err);
                },
                'and we delete the object from the databank': {
                    'topic': function(bike, db) {
                        db.del('bike', bike.id, this.callback);
                    },
                    'it works': function(err) {
                        assert.ifError(err);
                    }
                }
            }
        }
  }
});

suite['export'](module);


