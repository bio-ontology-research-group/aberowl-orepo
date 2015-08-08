// partitioning.js
//
// A driver for partitioned databanks
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

require('set-immediate');

var databank = require('../databank'),
    Step = require('step'),
    EventEmitter = require('events').EventEmitter,
    Databank = databank.Databank,
    DatabankError = databank.DatabankError,
    AlreadyExistsError = databank.AlreadyExistsError,
    NoSuchThingError = databank.NoSuchThingError,
    NotConnectedError = databank.NotConnectedError,
    AlreadyConnectedError = databank.AlreadyConnectedError;

var PartitioningDatabank = function(params) {

    var bank = this,
        banks = {},
        connected = false,
        typeConnected = new EventEmitter(),
        getBank = function(type, callback) {
            var tb, key;
            if (params[type]) {
                key = type;
            } else if (params['*']) {
                key = '*';
            } else {
                callback(new Error("No bank for type: " + type));
            }
            if (banks[key]) {
                if (typeConnected.connected[key]) {
                    callback(null, banks[key]);
                } else {
                    typeConnected.on("connect:"+key, function() {
                        callback(null, banks[key]);
                    });
                    typeConnected.on("error:"+key, function(err) {
                        callback(err, null);
                    });
                }
            } else {
                if (params.schema) {
                    if (!params[key].params) {
                        params[key].params = {};
                    }
                    params[key].params.schema = params.schema;
                }
                banks[key] = Databank.get(params[key].driver, params[key].params);
                if (!typeConnected.connected) {
                    typeConnected.connected = {};
                }
                typeConnected.connected[key] = false;
                banks[key].connect(params[key].params, function(err) {
                    if (err) {
                        typeConnected.emit("error:"+key, err);
                        callback(err, null);
                    } else {
                        typeConnected.connected[key] = true;
                        setImmediate(function() {
                            callback(null, banks[key]);
                        });
                        typeConnected.emit("connect:"+key);
                    }
                });
            }
        },
        wrapped = function(name) {
            return function(type) {
                var callback = arguments[arguments.length - 1],
                    mainArgs = arguments;

                if (!connected) {
                    callback(new NotConnectedError());
                    return;
                }

                Step(
                    function() {
                        getBank(type, this);
                    },
                    function(err, typeBank) {
                        if (err) {
                            callback(err);
                        } else if (!typeBank[name]) {
                            callback(new Error("No method " + name + " for databank for type: " + type));
                        } else {
                            typeBank[name].apply(typeBank, mainArgs);
                        }
                    }
                );
            };
        },
        methods = ["create",
                   "read",
                   "update",
                   "del",
                   "search",
                   "scan",
                   "save",
                   "readAll",
                   "incr",
                   "decr",
                   "append",
                   "prepend",
                   "item",
                   "slice",
                   "indexOf",
                   "remove"];

    if (params.schema) {
        bank.schema = params.schema;
    }

    bank.connect = function(params, callback) {
        if (connected) {
            callback(new AlreadyConnectedError());
            return;
        }
        connected = true;
        // We do actual connections when they're needed, so just skip here
        setImmediate(function() {
            callback(null);
        });
    };

    bank.disconnect = function(callback) {

        if (!connected) {
            callback(new NotConnectedError());
            return;
        }

        connected = false;

        Step(
            function() {
                var group = this.group(), type;
                for (type in banks) {
                    if (banks.hasOwnProperty(type)) {
                        typeConnected.connected[type] = false;
                        banks[type].disconnect(group());
                    }
                }
            },
            function(err) {
                if (err) {
                    callback(err);
                } else {
                    callback(null);
                }
            }
        );
    };

    for (var i = 0; i < methods.length; i++) {
        bank[methods[i]] = wrapped(methods[i]);
    }
};

PartitioningDatabank.prototype = new Databank();

module.exports = PartitioningDatabank;

