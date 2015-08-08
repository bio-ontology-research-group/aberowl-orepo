// Databank that uses a cache
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

var databank = require('../databank'),
    Step = require('step'),
    Databank = databank.Databank,
    DatabankError = databank.DatabankError,
    AlreadyExistsError = databank.AlreadyExistsError,
    NoSuchThingError = databank.NoSuchThingError;

var CachingDatabank = function(params) {
    if (!params.cache) {
        params.cache = {driver: 'memory', params: {}};
    }
    if (!params.source) {
        throw new Error("Must define a source.");
    }
    this.schema = params.schema || {};

    params.source.params.schema = params.cache.params.schema = this.schema;

    this.cache = Databank.get(params.cache.driver, params.cache.params);
    this.source = Databank.get(params.source.driver, params.source.params);
};

CachingDatabank.prototype = new Databank();

// Connect yourself on up.
// params: object containing any params you need
// onCompletion(err): function to call on completion

CachingDatabank.prototype.connect = function(params, onCompletion) {
    var bank = this;

    Step(
        function() {
            bank.cache.connect(params.cache, this);
        },
        function(err) {
            if (err) throw err;
            bank.source.connect(params.source, this);
        },
        function(err) {
            onCompletion(err);
        }
    );
};

// Disconnect yourself.
// onCompletion(err): function to call on completion

CachingDatabank.prototype.disconnect = function(onCompletion) {
    var bank = this;
    Step(
        function() {
            bank.cache.disconnect(this.parallel());
            bank.source.disconnect(this.parallel());
        },
        function(err) {
            onCompletion(err);
        }
    );
};

// Create a new thing
// type = string, type of thing, usually 'user' or 'activity'
// id = a unique ID, like a nickname or a UUID
// value = JavaScript value; will be JSONified
// onCompletion(err, value) = function to call on completion

CachingDatabank.prototype.create = function(type, id, value, onCompletion) {
    var bank = this;
    Step(
        function() {
            bank.source.create(type, id, value, this);
        },
        function(err, results) {
            if (err) throw err;
            bank.cache.save(type, id, results, this);
        },
        function(err, results) {
            // XXX: skip if error is from cache?
            if (err) {
                onCompletion(err, null);
            } else {
                onCompletion(null, results);
            }
        }
    );
};

// Read an existing thing
// type = the type of thing; 'user', 'activity'
// id = a unique ID -- nickname or UUID or URI
// onCompletion(err, value) = function to call on completion

CachingDatabank.prototype.read = function(type, id, onCompletion) {
    var bank = this;
    Step(
        function() {
            bank.cache.read(type, id, this);
        },
        function(err, results) {
            if (err) {
                if (err instanceof NoSuchThingError) {
                    // Cache miss
                    bank.source.read(type, id, this);
                } else {
                    // Some other error
                    onCompletion(err, null);
                }
            } else {
                // Cache hit
                onCompletion(null, results);
            }
        },
        function(err, results) {
            // XXX: make sure to clear cache if not found?
            if (err) throw err;
            bank.cache.save(type, id, results, this);
        },
        function(err, results) {
            // XXX: skip if error is from cache?
            if (err) {
                onCompletion(err, null);
            } else {
                onCompletion(null, results);
            }
        }
    );
};

// Update an existing thing
// type = the type of thing; 'user', 'activity'
// id = a unique ID -- nickname or UUID or URI
// value = the new value of the thing
// onCompletion(err, value) = function to call on completion

CachingDatabank.prototype.update = function(type, id, value, onCompletion) {
    var bank = this;
    Step(
        function() {
            bank.source.update(type, id, value, this);
        },
        function(err, results) {
            // XXX: make sure to clear cache if not found?
            if (err) throw err;
            bank.cache.save(type, id, results, this);
        },
        function(err, results) {
            // XXX: skip if error is from cache?
            if (err) {
                onCompletion(err, null);
            } else {
                onCompletion(null, results);
            }
        }
    );
};

// Delete an existing thing
// type = the type of thing; 'user', 'activity'
// id = a unique ID -- nickname or UUID or URI
// value = the new value of the thing
// onCompletion(err) = function to call on completion

CachingDatabank.prototype.del = function(type, id, onCompletion) {
    var bank = this;
    Step(
        function() {
            var scall = this.parallel(),
                ccall = this.parallel();
            bank.source.del(type, id, scall);
            bank.cache.del(type, id, function(err) {
              if (err && err.name != "NoSuchThingError") {
                ccall(err);
              } else {
                ccall(null);
              }
            });
        },
        function(err) {
            onCompletion(err);
        }
    );
};

// Search for things
// type = type of thing
// criteria = map of criteria, with exact matches,
//           like {'subject.id' ='tag =example.org,2011 =evan' }
// onResult(value) = called once per result found
// onCompletion(err) = called once at the end of results

CachingDatabank.prototype.search = function(type, criteria, onResult, onCompletion) {
    // XXX: is there an efficient way to cache this stuff?
    this.source.search(type, criteria, onResult, onCompletion);
};

// Scan a type
// type = type of thing
// onResult(value) = called once per result found
// onCompletion(err) = called once at the end of results

CachingDatabank.prototype.scan = function(type, onResult, onCompletion) {
    // XXX: Any other choice? Scan cache first, then skip cached stuff from source...?
    this.source.scan(type, onResult, onCompletion);
};

// Update an existing thing
// type = the type of thing; 'user', 'activity'
// id = a unique ID -- nickname or UUID or URI
// value = the new value of the thing
// onCompletion(err, value) = function to call on completion

CachingDatabank.prototype.save = function(type, id, value, onCompletion) {
    var bank = this;
    Step(
        function() {
            bank.source.save(type, id, value, this);
        },
        function(err, results) {
            // XXX: make sure to clear cache if not found?
            if (err) throw err;
            bank.cache.save(type, id, results, this);
        },
        function(err, results) {
            // XXX: skip if error is from cache?
            if (err) {
                onCompletion(err, null);
            } else {
                onCompletion(null, results);
            }
        }
    );
};

// Read a bunch of things from the db
// type = the type of thing; 'user', 'activity'
// id = array of IDs
// onCompletion(err, results) = function to call on completion;
//    err = an error or null if none
//    results = map of id (maybe stringified) to value

CachingDatabank.prototype.readAll = function(type, ids, onCompletion) {
    var bank = this, allMap = {}, notFound = [];

    Step(
        function() {
            bank.cache.readAll(type, ids, this);
        },
        function(err, cacheMap) {
            var i, id, value;
            // XXX: make sure to clear cache if not found?
            if (err) throw err;
            for (i = 0; i < ids.length; i++) {
                id = ids[i];
                // copy the hits
                if (cacheMap.hasOwnProperty(id)) {
                    if (cacheMap[id] === null) {
                        notFound.push(id);
                    } else {
                        allMap[id] = cacheMap[id];
                    }
                }
            }
            if (notFound.length === 0) {
                onCompletion(null, allMap);
            } else {
                bank.source.readAll(type, notFound, this);
            }
        },
        function(err, sourceMap) {
            var i, id;
            if (err) {
                onCompletion(err, null);
            } else {
                for (i = 0; i < ids.length; i++) {
                    id = ids[i];
                    // copy everything
                    if (sourceMap.hasOwnProperty(id)) {
                        allMap[id] = sourceMap[id];
                    }
                }
                onCompletion(null, allMap);
            }
        }
    );
};

CachingDatabank.prototype.incr = function(type, id, onCompletion) {
    var bank = this;
    Step(
        function() {
            bank.source.incr(type, id, this);
        },
        function(err, value) {
            if (err) throw err;
            bank.cache.save(type, id, value, this);
        },
        function(err, value) {
            if (err) {
                onCompletion(err, null);
            } else {
                onCompletion(null, value);
            }
        }
    );
};

CachingDatabank.prototype.decr = function(type, id, onCompletion) {
    var bank = this;
    Step(
        function() {
            bank.source.decr(type, id, this);
        },
        function(err, value) {
            if (err) throw err;
            bank.cache.save(type, id, value, this);
        },
        function(err, value) {
            if (err) {
                onCompletion(err, null);
            } else {
                onCompletion(null, value);
            }
        }
    );
};

CachingDatabank.prototype.append = function(type, id, toAppend, onCompletion) {
    var bank = this;
    Step(
        function() {
            bank.source.append(type, id, toAppend, this);
        },
        function(err) {
            var cb = this;
            if (err) throw err;
            bank.cache.del(type, id, function(err) {
                if (err) {
                    if (err.name == 'NoSuchThingError') {
                        cb(null);
                    } else {
                        cb(err);
                    }
                } else {
                    cb(null);
                }
            });
        },
        onCompletion
    );
};

CachingDatabank.prototype.prepend = function(type, id, toPrepend, onCompletion) {
    var bank = this;
    Step(
        function() {
            bank.source.prepend(type, id, toPrepend, this);
        },
        function(err) {
            var cb = this;
            if (err) throw err;
            bank.cache.del(type, id, function(err) {
                if (err) {
                    if (err.name == 'NoSuchThingError') {
                        cb(null);
                    } else {
                        cb(err);
                    }
                } else {
                    cb(null);
                }
            });
        },
        onCompletion
    );
};

CachingDatabank.prototype.item = function(type, id, index, onCompletion) {
    var bank = this, item = null;
    Step(
        function() {
            bank.cache.item(type, id, index, this);
        },
        function(err, value) {
            if (err) {
                if (err instanceof NoSuchThingError) {
                    // Cache miss; read it all and cache
                    bank.source.read(type, id, this);
                } else {
                    // Some other error
                    onCompletion(err, null);
                }
            } else {
                onCompletion(null, value);
            }
        },
        function(err, full) {
            if (err) throw err;
            item = full[index];
            bank.cache.save(type, id, full, this);
        },
        function(err, value) {
            if (err) {
                onCompletion(err, null);
            } else {
                onCompletion(null, item);
            }
        }
    );
};

CachingDatabank.prototype.slice = function(type, id, start, length, onCompletion) {
    var bank = this, slice = null;
    Step(
        function() {
            bank.cache.slice(type, id, start, length, this);
        },
        function(err, value) {
            if (err) {
                if (err instanceof NoSuchThingError) {
                    // Cache miss; read it all and cache
                    bank.source.read(type, id, this);
                } else {
                    // Some other error
                    onCompletion(err, null);
                }
            } else {
                onCompletion(null, value);
            }
        },
        function(err, full) {
            if (err) throw err;
            slice = full.slice(start, length);
            bank.cache.save(type, id, full, this);
        },
        function(err, value) {
            if (err) {
                onCompletion(err, null);
            } else {
                onCompletion(null, slice);
            }
        }
    );
};

module.exports = CachingDatabank;
