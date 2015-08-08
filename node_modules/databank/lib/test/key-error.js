// test/key-error.js
//
// Testing for key errors
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
    NoSuchThingError = databank.NoSuchThingError,
    AlreadyExistsError = databank.AlreadyExistsError;

var keyErrorContext = function(driver, params) {

    var context = {};

    context["When we create a " + driver + " databank"] = {

        topic: function() {
            if (!params.hasOwnProperty('schema')) {
                params.schema = {};
            }
            params.schema.painting = {
                pkey: 'title',
                fields: ['artist', 'style'],
                indices: ['artist']
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
                        var i, group = this.group();
                        bank.del('painting', 'Starry Night', group());
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
            'and when we double-insert a value': {
                topic: function(bank) {
                    var cb = this.callback,
                        p = {title: 'Starry Night',
                             artist: 'Vincent Van Gogh',
                             style: 'Impressionist'};
                    Step(
                        function() {
                            bank.create('painting', p.title, p, this);
                        },
                        function(err, results) {
                            if (err) {
                                cb(err);
                            } else {
                                bank.create('painting', p.title, p, this);
                            }
                        },
                        function(err, results) {
                            if (err && err.name == "AlreadyExistsError") {
                                cb(null);
                            } else if (err) {
                                cb(err);
                            } else {
                                cb(new Error("Unexpected success"));
                            }
                        }
                    );
                },
                'we get an AlreadyExistsError': function(err) {
                    assert.ifError(err);
                }
            },
            'and when we try to read a non-existent value': {
                topic: function(bank) {
                    var cb = this.callback;
                    bank.read('painting', 'Mona Lisa', function(err, value) {
                        if (err && err.name == "NoSuchThingError") {
                            cb(null);
                        } else if (err) {
                            cb(err);
                        } else {
                            cb(new Error("Unexpected success"));
                        }
                    });
                },
                'we get a NoSuchThingError': function(err) {
                    assert.ifError(err);
                }

            },
            'and when we try to update a non-existent value': {
                topic: function(bank) {
                    var cb = this.callback,
                        p = {title: 'Number 1',
                             artist: 'Jackson Pollock',
                             style: 'Abstract Expressionist'};

                    bank.update('painting', p.title, p, function(err, value) {
                        if (err && err.name == "NoSuchThingError") {
                            cb(null);
                        } else if (err) {
                            cb(err);
                        } else {
                            cb(new Error("Unexpected success"));
                        }
                    });
                },
                'we get a NoSuchThingError': function(err) {
                    assert.ifError(err);
                }
            },
            'and when we try to delete a non-existent value': {
                topic: function(bank) {
                    var cb = this.callback;

                    bank.del('painting', 'Landscape with the Fall of Icarus', function(err, value) {
                        if (err && err.name == "NoSuchThingError") {
                            cb(null);
                        } else if (err) {
                            cb(err);
                        } else {
                            cb(new Error("Unexpected success"));
                        }
                    });
                },
                'we get a NoSuchThingError': function(err) {
                    assert.ifError(err);
                }
            }
        }
    };

    return context;
};

module.exports = keyErrorContext;
