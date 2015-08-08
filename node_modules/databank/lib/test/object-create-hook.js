// test/object-create-hook.js
//
// Test create hooks for Databank objects
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

var objectCreateHookContext = function(driver, params) {

    var context = {};

    context["When we create a " + driver + " databank"] = {

        topic: function() {
            if (!params.hasOwnProperty('schema')) {
                params.schema = {};
            }
            params.schema.album = {
                pkey: 'title'
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
                        bank.del('album', "Who's Next", this);
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
            'and we can initialize the Album class': {
                topic: function(bank) {
                    var Album = DatabankObject.subClass('album');
                    Album.bank = function() {
                        return bank;
                    };
                    return Album;
                },
                'which is valid': function(Album) {
                    assert.isFunction(Album);
                },
                'which has default beforeCreate()': function(Album) {
                    assert.isFunction(Album.beforeCreate);
                },
                'which has default afterCreate()': function(Album) {
                    assert.isFunction(Album.prototype.afterCreate);
                },
                'and we can create a Album': {
                    topic: function(Album, bank) {

                        var cb = this.callback,
                            called = {
                                before: false,
                                after: false,
                                album: null
                            };

                        Album.beforeCreate = function(props, callback) {
                            called.before = true;
                            props.addedByBefore = 42;
                            callback(null, props);
                        };

                        Album.prototype.afterCreate = function(callback) {
                            called.after = true;
                            this.addedByAfter = 23;
                            callback(null, this);
                        };

                        Album.create({title: "Who's Next"}, function(err, album) {
                            if (err) {
                                cb(err, null);
                            } else {
                                called.album = album;
                                // note: not the album
                                cb(null, called);
                            }
                        });
                    },
                    'without an error': function(err, called) {
                        assert.ifError(err);
                    },
                    'and the before hook is called': function(err, called) {
                        assert.isTrue(called.before);
                    },
                    'and the after hook is called': function(err, called) {
                        assert.isTrue(called.after);
                    },
                    'and the before hook modification happened': function(err, called) {
                        assert.equal(called.album.addedByBefore, 42);
                    },
                    'and the after hook modification happened': function(err, called) {
                        assert.equal(called.album.addedByAfter, 23);
                    }
                }
            }
        }
    };

    return context;
};

module.exports = objectCreateHookContext;
