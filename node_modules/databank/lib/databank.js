// databank.js
//
// abstraction for storing JSON data in some kinda storage
//
// Copyright 2011,2012 E14N https://e14n.com/
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

// I'm too much of a wuss to commit to any JSON storage mechanism right
// now, so I'm just going to declare the interface I need and try a few
// different systems to implement it.

// A thing that stores JSON.
// Basically CRUD + Search. Recognizes types of data without
// enforcing a schema.

var Step = require('step');

function Databank(params) {
}

Databank.localDriver = function(driver) {
    return './drivers/' + driver.toLowerCase();
};

Databank.drivers = {};

Databank.register = function(name, cls) {
    Databank.drivers[name] = cls;
    return;
};

Databank.deepProperty = function(object, property) {
    var i = property.indexOf('.');
    if (!object) {
        return null;
    } else if (i == -1) { // no dots
        return object[property];
    } else {
        return Databank.deepProperty(object[property.substr(0, i)], property.substr(i + 1));
    }
};

Databank.get = function(driver, params) {

    var core = ['memory', 'caching', 'partitioning'],
        canon = driver.toLowerCase(),
        cls;

    if (core.indexOf(canon) !== -1) {
        cls = require(Databank.localDriver(driver));
    } else if (Databank.drivers.hasOwnProperty(driver)) {
        cls = Databank.drivers[driver];
    } else {
        cls = require("databank-" + canon);
    }

    return new cls(params);
};

Databank.prototype = {

    // Connect yourself on up.
    // params: object containing any params you need
    // onCompletion(err): function to call on completion

    connect: function(params, onCompletion)
    {
        if (onCompletion) {
            onCompletion(new NotImplementedError());
        }
    },

    // Disconnect yourself.
    // onCompletion(err): function to call on completion

    disconnect: function(onCompletion)
    {
        if (onCompletion) {
            onCompletion(new NotImplementedError());
        }
    },

    // Create a new thing
    // type: string, type of thing, usually 'user' or 'activity'
    // id: a unique ID, like a nickname or a UUID
    // value: JavaScript value; will be JSONified
    // onCompletion(err, value): function to call on completion

    create: function(type, id, value, onCompletion)
    {
        if (onCompletion) {
            onCompletion(new NotImplementedError(), null);
        }
    },

    // Read an existing thing
    // type: the type of thing; 'user', 'activity'
    // id: a unique ID -- nickname or UUID or URI
    // onCompletion(err, value): function to call on completion

    read: function(type, id, onCompletion)
    {
        if (onCompletion) {
            onCompletion(new NotImplementedError(), null);
        }
    },

    // Update an existing thing
    // type: the type of thing; 'user', 'activity'
    // id: a unique ID -- nickname or UUID or URI
    // value: the new value of the thing
    // onCompletion(err, value): function to call on completion

    update: function(type, id, value, onCompletion)
    {
        if (onCompletion) {
            onCompletion(new NotImplementedError(), null);
        }
    },

    // Delete an existing thing
    // type: the type of thing; 'user', 'activity'
    // id: a unique ID -- nickname or UUID or URI
    // value: the new value of the thing
    // onCompletion(err): function to call on completion

    del: function(type, id, onCompletion)
    {
        if (onCompletion) {
            onCompletion(new NotImplementedError());
        }
    },

    // Search for things
    // type: type of thing
    // criteria: map of criteria, with exact matches,
    //           like {'subject.id':'tag:example.org,2011:evan' }
    // onResult(value): called once per result found
    // onCompletion(err): called once at the end of results

    search: function(type, criteria, onResult, onCompletion)
    {
        if (onCompletion) {
            onCompletion(new NotImplementedError());
        }
    },

    // Get all things of a particular type
    // type: type of thing
    // onResult(value): called once per result found
    // onCompletion(err): called once at the end of results

    scan: function(type, onResult, onCompletion)
    {
        if (onCompletion) {
            onCompletion(new NotImplementedError());
        }
    },

    // Update an existing thing
    // type: the type of thing; 'user', 'activity'
    // id: a unique ID -- nickname or UUID or URI
    // value: the new value of the thing
    // onCompletion(err, value): function to call on completion

    save: function(type, id, value, onCompletion)
    {
        var bank = this;

        bank.update(type, id, value, function(err, result) {
            if (err instanceof NoSuchThingError) {
                bank.create(type, id, value, function(err, result) {
                    onCompletion(err, result);
                });
            } else {
                onCompletion(err, result);
            }
        });
    },

    // Read a bunch of things from the db
    // type: the type of thing; 'user', 'activity'
    // id: array of IDs
    // onCompletion(err, results): function to call on completion;
    //    err: an error or null if none
    //    results: map of id (maybe stringified) to value

    readAll: function(type, ids, onCompletion) {
        var bank = this,
            readNice = function(type, id, callback) {
                bank.read(type, id, function(err, value) {
                    if (err) {
                        if (err instanceof NoSuchThingError) {
                            callback(null, null);
                        } else {
                            callback(err, null);
                        }
                    } else {
                        callback(null, value);
                    }
                });
            };

        Step(
            function() {
                var i, group = this.group();
                for (i = 0; i < ids.length; i++) {
                    readNice(type, ids[i], group());
                }
            },
            function(err, items) {
                var i, results;
                if (err) {
                    onCompletion(err, null);
                } else {
                    results = {};
                    for (i = 0; i < ids.length; i++) {
                        results[ids[i]] = items[i];
                    }
                    onCompletion(null, results);
                }
            }
        );
    },

    readAndModify: function(type, id, def, modify, onCompletion) {
        var bank = this;
        bank.read(type, id, function(err, value) {
            if (err) {
                // Set to def if not exist
                if (err instanceof NoSuchThingError) {
                    bank.create(type, id, def, function(err, created) {
                        if (err) {
                            if (err instanceof AlreadyExistsError) {
                                // Race condition; try again
                                bank.readAndModify(type, id, def, modify, onCompletion);
                            } else {
                                onCompletion(err, null);
                            }
                        } else {
                            onCompletion(null, created);
                        }
                    });
                } else {
                    onCompletion(err, null);
                }
            } else {
                bank.update(type, id, modify(value), onCompletion);
            }
        });
    },

    incr: function(type, id, onCompletion) {
        this.readAndModify(type,
                           id,
                           1, 
                           function(value) { return value+1; },
                           onCompletion);
    },

    decr: function(type, id, onCompletion) {
        this.readAndModify(type,
                           id,
                           -1, 
                           function(value) { return value-1; },
                           onCompletion);
    },

    append: function(type, id, toAppend, onCompletion) {
        this.readAndModify(type,
                           id,
                           [toAppend], 
                           function(value) { value.push(toAppend); return value; },
                           function(err, result) { 
                               onCompletion(err);
                           });
    },

    prepend: function(type, id, toPrepend, onCompletion) {
        this.readAndModify(type,
                           id,
                           [toPrepend], 
                           function(value) { value.unshift(toPrepend); return value; },
                           function(err, result) { 
                               onCompletion(err);
                           });
    },

    item: function(type, id, index, onCompletion) {
        this.read(type, id, function(err, value) {
            if (err) {
                onCompletion(err, null);
            } else {
                if (Array.isArray(value)) {
                    onCompletion(null, value[index]);
                } else {
                    onCompletion(new WrongTypeError(type, id, "array"), null);
                }
            }
        });
    },

    slice: function(type, id, start, length, onCompletion) {
        this.read(type, id, function(err, value) {
            if (err) {
                onCompletion(err, null);
            } else {
                if (Array.isArray(value)) {
                    onCompletion(null, value.slice(start, length));
                } else {
                    onCompletion(new WrongTypeError(type, id, "array"), null);
                }
            }
        });
    },

    indexOf: function(type, id, item, onCompletion) {
        this.read(type, id, function(err, value) {
            if (err) {
                onCompletion(err, null);
            } else {
                if (Array.isArray(value)) {
                    onCompletion(null, value.indexOf(item));
                } else {
                    onCompletion(new WrongTypeError(type, id, "array"), null);
                }
            }
        });
    },

    remove: function(type, id, item, onCompletion) {
        var bank = this;

        bank.read(type, id, function(err, value) {
            var i;
            if (err) {
                onCompletion(err, null);
            } else {
                if (Array.isArray(value)) {
                    i = value.indexOf(item);
                    if (i === -1) {
                        onCompletion(new NoSuchItemError(type, id, item));
                    } else {
                        value.splice(i, 1);
                        bank.update(type, id, value, function(err, value) {
                            if (err) {
                                onCompletion(err);
                            } else {
                                onCompletion(null);
                            }
                        });
                    }
                } else {
                    onCompletion(new WrongTypeError(type, id, "array"), null);
                }
            }
        });
    },

    // utility for searches

    matchesCriteria: function(value, criteria) {
        var property;

        for (property in criteria) {
            if (Databank.deepProperty(value, property) != criteria[property]) {
                return false;
            }
        }
        return true;
    }
};

// A custom error for Databank schtuff.

var DatabankError = function(message) {
    Error.captureStackTrace(this, DatabankError);
    this.name = 'DatabankError';
    this.message = message || "Databank error";
};

DatabankError.prototype = new Error();
DatabankError.prototype.constructor = DatabankError;

var NoSuchThingError = function(type, id) {
    Error.captureStackTrace(this, NoSuchThingError);
    this.name = 'NoSuchThingError';
    this.type = type;
    this.id   = id;
    this.message = "No such '" + type + "' with id '" + id + "'";
};

NoSuchThingError.prototype = new DatabankError();
NoSuchThingError.prototype.constructor = NoSuchThingError;

var AlreadyExistsError = function(type, id) {
    Error.captureStackTrace(this, AlreadyExistsError);
    this.name = 'AlreadyExistsError';
    this.type = type;
    this.id   = id;
    this.message = "Already have a(n) '" + type + "' with id '" + id + "'";
};

AlreadyExistsError.prototype = new DatabankError();
AlreadyExistsError.prototype.constructor = AlreadyExistsError;

var NoSuchItemError = function(type, id, item) {
    Error.captureStackTrace(this, NoSuchItemError);
    this.name = 'NoSuchItemError';
    this.type = type;
    this.id   = id;
    this.item = item;
    this.message = "No such index '" + item + "' in '" + type + "' with key '" + id + "'";
};

NoSuchItemError.prototype = new DatabankError();
NoSuchItemError.prototype.constructor = NoSuchItemError;

var WrongTypeError = function(type, id, expected) {
    Error.captureStackTrace(this, WrongTypeError);
    this.name = 'WrongTypeError';
    this.type = type;
    this.id   = id;
    this.expected = expected;
    this.message = "The '" + type + "' with key '" + id + "' should be a '" + expected + "'";
};

WrongTypeError.prototype = new DatabankError();
WrongTypeError.prototype.constructor = WrongTypeError;

var NotImplementedError = function() {
    Error.captureStackTrace(this, NotImplementedError);
    this.name = 'NotImplementedError';
    this.message = "Method not yet implemented.";
};

NotImplementedError.prototype = new DatabankError();
NotImplementedError.prototype.constructor = NotImplementedError;

var NotConnectedError = function() {
    Error.captureStackTrace(this, NotConnectedError);
    this.name = 'NotConnectedError';
    this.message = "Not connected to a server.";
};

NotConnectedError.prototype = new DatabankError();
NotConnectedError.prototype.constructor = NotConnectedError;

var AlreadyConnectedError = function() {
    Error.captureStackTrace(this, AlreadyConnectedError);
    this.name = 'AlreadyConnectedError';
    this.message = "Already connected to a server.";
};

AlreadyConnectedError.prototype = new DatabankError();
AlreadyConnectedError.prototype.constructor = AlreadyConnectedError;

exports.Databank = Databank;
exports.DatabankError = DatabankError;
exports.NotImplementedError = NotImplementedError;
exports.NoSuchThingError = NoSuchThingError;
exports.AlreadyExistsError = AlreadyExistsError;
exports.AlreadyConnectedError = AlreadyConnectedError;
exports.NotConnectedError = NotConnectedError;
exports.NoSuchItemError = NoSuchItemError;
exports.WrongTypeError = WrongTypeError;
