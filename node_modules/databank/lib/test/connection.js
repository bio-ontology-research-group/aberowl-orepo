// test/connection.js
//
// Tests connect()/disconnect()/NotConnectedError
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
    NotConnectedError = databank.NotConnectedError,
    AlreadyConnectedError = databank.AlreadyConnectedError;

var connectContext = function(driver, params) {

    var context = {};

    context["With the " + driver + " driver"] = {
        "when we connect a bank": {
            topic: function() {
                var bank = Databank.get(driver, params),
                    cb = this.callback;
                bank.connect({}, function(err) {
                    cb(err, bank);
                });
            },
            "it works": function(err, bank) {
                assert.ifError(err);
                assert.isObject(bank);
            },
            "and we disconnect the bank": {
                "topic": function(bank) {
                    bank.disconnect(this.callback);
                },
                "it works": function(err) {
                    assert.ifError(err);
                }
            }
        },
        "when we create a value without connecting": {
            topic: function() {
                var bank = Databank.get(driver, params),
                    cb = this.callback;
                bank.create("cellphone", "galaxy-nexus-III", {}, function(err, value) {
                    if (err instanceof NotConnectedError) {
                        cb(null);
                    } else if (err) {
                        cb(err);
                    } else {
                        cb(new Error("Unexpected success"));
                    }
                });
            },
            "it fails with a NotConnected error": function(err) {
                assert.ifError(err);
            }
        },
        "when we read a value without connecting": {
            topic: function() {
                var bank = Databank.get(driver, params),
                    cb = this.callback;
                bank.read("cellphone", "iphone", function(err, value) {
                    if (err instanceof NotConnectedError) {
                        cb(null);
                    } else if (err) {
                        cb(err);
                    } else {
                        cb(new Error("Unexpected success"));
                    }
                });
            },
            "it fails with a NotConnected error": function(err) {
                assert.ifError(err);
            }
        },
        "when we update a value without connecting": {
            topic: function() {
                var bank = Databank.get(driver, params),
                    cb = this.callback;
                bank.update("cellphone", "palmpre", {}, function(err, value) {
                    if (err instanceof NotConnectedError) {
                        cb(null);
                    } else if (err) {
                        cb(err);
                    } else {
                        cb(new Error("Unexpected success"));
                    }
                });
            },
            "it fails with a NotConnected error": function(err) {
                assert.ifError(err);
            }
        },
        "when we delete a value without connecting": {
            topic: function() {
                var bank = Databank.get(driver, params),
                    cb = this.callback;
                bank.del("cellphone", "blackberry", function(err, value) {
                    if (err instanceof NotConnectedError) {
                        cb(null);
                    } else if (err) {
                        cb(err);
                    } else {
                        cb(new Error("Unexpected success"));
                    }
                });
            },
            "it fails with a NotConnected error": function(err) {
                assert.ifError(err);
            }
        },
        "when we disconnect from a bank that's not connected": {
            topic: function() {
                var bank = Databank.get(driver, params),
                    cb = this.callback;
                bank.disconnect(function(err) {
                    if (err instanceof NotConnectedError) {
                        cb(null);
                    } else if (err) {
                        cb(err);
                    } else {
                        cb(new Error("Unexpected success"));
                    }
                });
            },
            "it fails with a NotConnected error": function(err) {
                assert.ifError(err);
            }
        },
        "when we try to use a bank after disconnecting": {
            topic: function() {
                var bank = Databank.get(driver, params),
                    cb = this.callback;

                Step(
                    function() {
                        bank.connect({}, this);
                    },
                    function(err) {
                        if (err) throw err;
                        bank.disconnect(this);
                    },
                    function(err) {
                        var tcb = this;
                        if (err) throw err;
                        bank.create("cellphone", "freerunner", {}, function(err, value) {
                            if (err instanceof NotConnectedError) {
                                tcb(null);
                            } else if (err) {
                                tcb(err);
                            } else {
                                tcb(new Error("Unexpected success"));
                            }
                        });
                    },
                    cb
                );
            },
            "it fails with a NotConnected error": function(err) {
                assert.ifError(err);
            }
        },
        "when we try to connect twice": {
            topic: function() {
                var bank = Databank.get(driver, params),
                    cb = this.callback;

                Step(
                    function() {
                        bank.connect({}, this);
                    },
                    function(err) {
                        var tcb = this;
                        if (err) throw err;
                        bank.connect({}, function(err) {
                            if (err instanceof AlreadyConnectedError) {
                                tcb(null);
                            } else if (err) {
                                tcb(err);
                            } else {
                                tcb(new Error("Unexpected success"));
                            }
                        });
                    },
                    cb
                );
            },
            "it fails with an AlreadyConnected error": function(err) {
                assert.ifError(err);
            }
        }
    };

    return context;
};

module.exports = connectContext;
