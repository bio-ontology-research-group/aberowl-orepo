// test/object-save-hook.js
//
// Testing DatabankObject save() hooks
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

var objectSaveHookContext = function(driver, params) {

    var context = {};

    context["When we create a " + driver + " databank"] = {

        topic: function() {
            if (!params.hasOwnProperty('schema')) {
                params.schema = {};
            }
            params.schema.website = {
                pkey: 'domain'
            };
            return Databank.get(driver, params);
        },
        'We can connect to it': {
            topic: function(bank) {
                bank.connect(params, this.callback);
            },
            teardown: function(bank) {
                Step(
                    function() {
                        bank.del("website", "example.com", this);
                    },
                    function(err) {
                        if (err) throw err;
                        bank.disconnect(this);
                    },
                    this.callback
                );
            },
            'without an error': function(err) {
                assert.ifError(err);
            },
            'and we can initialize the Website class': {
                topic: function(bank) {
                    var Website = DatabankObject.subClass('website');
                    Website.bank = function() {
                        return bank;
                    };
                    return Website;
                },
                'which is valid': function(Website) {
                    assert.isFunction(Website);
                },
                'and we can create and save a Website': {
                    topic: function(Website) {

                        var cb = this.callback,
                            called = {
                                before: false,
                                after: false,
                                website: null
                            };

                        Website.prototype.beforeSave = function(callback) {
                            called.before = true;
                            this.addedByBefore = 42;
                            callback(null);
                        };

                        Website.prototype.afterSave = function(callback) {
                            called.after = true;
                            this.addedByAfter = 23;
                            callback(null);
                        };

                        var website = new Website({domain: "example.com"});

                        website.save(function(err, newWebsite) {
                            if (err) {
                                cb(err, null);
                            } else {
                                called.website = newWebsite;
                                // note: not the website
                                cb(null, called);
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
                    },
                    'and the before hook modification happened': function(err, called) {
                        assert.equal(called.website.addedByBefore, 42);
                    },
                    'and the after hook modification happened': function(err, called) {
                        assert.equal(called.website.addedByAfter, 23);
                    }
                }
            }
        }
    };

    return context;
};

module.exports = objectSaveHookContext;
