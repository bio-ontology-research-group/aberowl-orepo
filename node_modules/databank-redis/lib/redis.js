// redis.js
//
// implementation of Databank interface using redis
//
// Copyright 2011-2013 E14N https://e14n.com/
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

var _ = require("underscore"),
    async = require("async"),
    databank = require('databank'),
    redis = require('redis'),
    Databank = databank.Databank,
    DatabankError = databank.DatabankError,
    AlreadyExistsError = databank.AlreadyExistsError,
    NoSuchThingError = databank.NoSuchThingError,
    NotConnectedError = databank.NotConnectedError,
    AlreadyConnectedError = databank.AlreadyConnectedError;

// Main databank class for redis

var RedisDatabank = function(params) {

    // Private members and methods

    var bank = this,
        client,
        host     = params.host || '127.0.0.1',
        port     = params.port || 6379,
        database = params.database || 0,
        checkIndices = (_.has(params, "checkIndices")) ? params.checkIndices : true,
        pkeyOf = function(type) {
            if (bank.schema && bank.schema[type] && bank.schema[type].pkey) {
                return bank.schema[type].pkey;
            } else {
                return "id";
            }
        },
        toKey = function(type, id) {
            return type + ':' + id;
        },
        indexKey = function(type, prop, val) {
            return 'databank:index:' + type + ':' + prop + ':' + val;
        },
        indicesKey = function(type) {
            return 'databank:indices:' + type;
        },
        addToIndex = function(type, obj, key, prop, callback) {
            var val = Databank.deepProperty(obj, prop),
                ikey = indexKey(type, prop, val);
            
            client.sadd(ikey, key, function(err, result) {
                if (err) {
                    callback(err);
                } else {
                    // Shouldn't have been there before, but we kind of don't care
                    callback(null);
                }
            });
        },
        index = function(type, id, obj, callback) {
            if (!bank.schema ||
                !bank.schema[type] ||
                !bank.schema[type].indices ||
                bank.schema[type].indices.length === 0) {
                callback(null);
                return;
            }

            var indices = bank.schema[type].indices,
                key = toKey(type, id),
                updated = 0,
                i = 0,
                hadErr = false;

            for (i = 0; i < indices.length; i++) {
                addToIndex(type, obj, key, indices[i], function(err) {
                    if (err) {
                        hadErr = true;
                        callback(err);
                    } else if (!hadErr) {
                        updated++;
                        if (updated === indices.length) {
                            callback(null);
                        }
                    }
                });
            }
        },
        deindex = function(type, id, callback) {

            if (!bank.schema ||
                !bank.schema[type] ||
                !bank.schema[type].indices ||
                bank.schema[type].indices.length === 0) {
                callback(null);
                return;
            }

            // We have to do an extra read here. :(
            // FIXME: have a path to pass down the "old object" if we've already read it
            bank.read(type, id, function(err, obj) {
                var indices = bank.schema[type].indices,
                    key = toKey(type, id),
                    updated = 0,
                    i = 0,
                    hadErr = false,
                    delFromIndex = function(prop, callback) {
                        var val = Databank.deepProperty(obj, prop),
                            ikey = indexKey(type, prop, val);
                        
                        client.srem(ikey, key, function(err, result) {
                            if (err) {
                                callback(err);
                            } else {
                                // Shouldn't have been there before, but we kind of don't care
                                callback(null);
                            }
                        });
                    };

                if (err) {
                    callback(err);
                } else {
                    for (i = 0; i < indices.length; i++) {
                        delFromIndex(indices[i], function(err) {
                            if (err) {
                                hadErr = true;
                                callback(err);
                            } else if (!hadErr) {
                                updated++;
                                if (updated === indices.length) {
                                    callback(null);
                                }
                            }
                        });
                    }
                }
            });
        },
        // We do our own hacked-up search indices; this method makes sure they are initialized
        // This can take a loooong time (like days-long); use the databank param if you don't want
        // it run at startup.
        checkAllIndices = function(callback) {
            var q,
                seenErr = null,
                keys = _.filter(_.keys(bank.schema), function(key) { return _.isArray(bank.schema[key].indices); });

            if (keys.length === 0) {
                callback(null);
            } else {
                q = async.queue(checkTypeIndices, 4);
                q.drain = function() {
                    callback(seenErr);
                };
                q.push(keys, function(err) {
                    if (err) {
                        seenErr = err;
                    }
                });
            }
        },
        checkTypeIndices = function(type, callback) {
            var def, inSchema;

            def = bank.schema[type];

            if (!_.isObject(def) ||
                !_.isArray(def.indices) ||
                def.indices.length == 0) {
                inSchema = [];
            } else {
                inSchema = def.indices;
            }

            async.waterfall([
                function(callback) {
                    getKnownIndices(type, callback);
                },
                function(inDB, callback) {
                    var toAdd,
                        q,
                        done,
                        cnt = 0,
                        pkey = pkeyOf(type),
                        addObjectIndices = function(value, callback) {
                            var key = toKey(type, value[pkey]);
                            async.forEach(toAdd,
                                          function(prop, callback) {
                                              addToIndex(type, value, key, prop, callback);
                                          },
                                          callback);
                        };
                    // We add ones in the schema but not in the db yet
                    toAdd = _.difference(inSchema, inDB);
                    // Note: we don't delete indices in the DB but not in the schema;
                    // could be used by another process. Databank schema def is too loose for this.
                    if (toAdd.length === 0) {
                        callback(null);
                        return;
                    }
                    q = async.queue(addObjectIndices, 100);
                    q.drain = function() {
                        if (done) {
                            setKnownIndices(type, _.union(inSchema, inDB), callback);
                        }
                    };
                    bank.scan(type,
                              function(value) {
                                  cnt++;
                                  if (_.isObject(value)) {
                                      q.push(value, function(err) {});
                                  }
                              },
                              function(err) {
                                  if (err) {
                                      callback(err);
                                  } else if (cnt === 0) {
                                      // No items; set the indices
                                      setKnownIndices(type, _.union(inSchema, inDB), callback);
                                  } else {
                                      // Wait till the queue drains before final callback
                                      done = true;
                                  }
                              });
                }
            ], callback);
        },
        getKnownIndices = function(type, callback) {
            // get existing indices, with fallback if none known
            client.get(indicesKey(type), function(err, val) {
                var res;
                if (err) {
                    callback(err, null);
                } else if (!val) {
                    callback(null, []);
                } else {
                    try {
                        res = JSON.parse(val);
                        callback(null, res);
                    } catch (err) {
                        callback(err, null);
                    }
                }
            });
        },
        setKnownIndices = function(type, indices, callback) {
            client.set(indicesKey(type), JSON.stringify(indices), callback);
        },
        scanKeys = function(keys, onResult, callback) {
            var onKey = function(key, callback) {
                client.get(key, function(err, record) {
                    var value;
                    if (err) {
                        callback(err);
                    } else if (_.isNull(record)) {
                        // database miss; for our purposes we skip silently
                        callback(null);
                    } else {
                        try {
                            value = JSON.parse(record);
                            onResult(value);
                        } catch (e) {
                            callback(e);
                            return;
                        }
                        callback(null);
                    }
                });
            };

            async.eachLimit(keys, 64, onKey, callback);
        };

    // Public members

    bank.schema = params.schema || {},
    
    // Privileged members

    bank.connect = function(params, callback) {

        var onConnectionError = function(err) {
            if (callback) {
                callback(new DatabankError(err));
            }
        };

        if (client) {
            callback(new AlreadyConnectedError());
            return;
        }

        client = redis.createClient(port, host);

        client.on('error', onConnectionError);

        // Whenever we re-connect, make sure to select the right DB

        client.on('connect', function() {
            client.select(database, function(err) {});
        });

        client.once('connect', function() {
            // Only want this once
            client.removeListener('error', onConnectionError);
            // check indices
            if (callback) {
                if (checkIndices) {
                    checkAllIndices(callback);
                } else {
                    callback(null);
                }
            }
        });
    };

    bank.disconnect = function(callback) {

        if (!client) {
            callback(new NotConnectedError());
            return;
        }

        client.quit(function(err) {
            if (err) {
                callback(err);
            } else {
                client = null;
                callback(null);
            }
        });
    };

    bank.create = function(type, id, value, callback) {

        if (!client) {
            callback(new NotConnectedError(), null);
            return;
        }

        client.setnx(toKey(type, id), JSON.stringify(value), function(err, result) {
            if (err) {
                callback(new DatabankError(err));
            } else if (result === 0) {
                callback(new AlreadyExistsError(type, id));
            } else {
                index(type, id, value, function(err) {
                    if (err) {
                        callback(err, null);
                    } else {
                        callback(null, value);
                    }
                });
            }
        });
    };

    bank.read = function(type, id, callback) {

        if (!client) {
            callback(new NotConnectedError(), null);
            return;
        }

        client.get(toKey(type, id), function(err, value) {
            if (err) {
                callback(new DatabankError(err), null);
            } else if (value === null) {
                callback(new NoSuchThingError(type, id), null);
            } else {
                callback(null, JSON.parse(value));
            }
        });
    };

    bank.update = function(type, id, value, callback) {

        if (!client) {
            callback(new NotConnectedError(), null);
            return;
        }

        deindex(type, id, function(err) {
            if (err) {
                callback(err, null);
            } else {
                client.set(toKey(type, id), JSON.stringify(value), function(err) {
                    if (err) {
                        callback(new DatabankError(err), null);
                    } else {
                        index(type, id, value, function(err) {
                            if (err) {
                                callback(err, null);
                            } else {
                                callback(null, value);
                            }
                        });
                    }
                });
            }
        });
    };

    bank.del = function(type, id, callback) {

        if (!client) {
            callback(new NotConnectedError());
            return;
        }

        deindex(type, id, function(err) {
            if (err) {
                callback(err, null);
            } else {
                client.del(toKey(type, id), function(err, count) {
                    if (err) {
                        callback(err);
                    } else if (count === 0) {
                        callback(new NoSuchThingError(type, id));
                    } else {
                        callback(null);
                    }
                });
            }
        });
    };

    bank.readAll = function(type, ids, callback) {

        var keys = [];

        if (!client) {
            callback(new NotConnectedError(), null);
            return;
        }

        keys = ids.map(function(id) { return toKey(type, id); } );

        if (keys.length === 0) {
            callback(null, {});
        } else {
            client.mget(keys, function(err, values) {
                var results = {}, i = 0, key, id, value;
                
                if (err) {
                    callback(new DatabankError(err), null);
                } else {
                    for (i = 0; i < values.length; i++) {
                        key = keys[i];
                        id = ids[i];
                        value = JSON.parse(values[i]);
                        results[id] = value;
                    }
                    callback(null, results);
                }
            });
        }
    };

    bank.search = function(type, criteria, onResult, callback) {
        var indices = [],
            property,
            indexed = {},
            unindexed = {},
            haveIndexed = false,
            indexKeys = [],
            checkMatch = function(value) { 
                if (bank.matchesCriteria(value, unindexed)) {
                    onResult(value);
                }
            };

        if (!client) {
            callback(new NotConnectedError(), null);
            return;
        }

        // Determine which criteria, if any, are on an indexed property

        if (bank.schema && bank.schema[type] && bank.schema[type].indices) {
            indices = bank.schema[type].indices;
            for (property in criteria) {
                if (indices.indexOf(property) == -1) {
                    unindexed[property] = criteria[property];
                } else {
                    haveIndexed = true;
                    indexed[property] = criteria[property];
                }
            }
        } else {
            unindexed = criteria;
        }

        // If there are any indexed properties, use set intersection to get candidate keys
        if (haveIndexed) {
            for (property in indexed) {
                indexKeys.push(indexKey(type, property, indexed[property]));
            }
            // intersection of all keys. note: with just one arg, sinter returns all
            // values under that key
            client.sinter(indexKeys, function(err, keys) {
                if (err) {
                    callback(err);
                } else {
                    scanKeys(keys, checkMatch, callback);
                }
            });
        } else {
            // Get every record of a given type
            client.keys(type + ':*', function(err, keys) {
                if (err) {
                    callback(err);
                } else {
                    scanKeys(keys, checkMatch, callback);
                }
            });
        }
    };

    bank.scan = function(type, onResult, callback) {

        if (!client) {
            callback(new NotConnectedError(), null);
            return;
        }

        // Get every record of a given type
        client.keys(type + ':*', function(err, keys) {
            if (err) {
                callback(err);
            } else {
                scanKeys(keys, onResult, callback);
            }
        });
    };

    bank.incr = function(type, id, callback) {
        if (!client) {
            callback(new NotConnectedError(), null);
            return;
        }
        client.incr(toKey(type, id), callback);
    };

    bank.decr = function(type, id, callback) {
        if (!client) {
            callback(new NotConnectedError(), null);
            return;
        }
        client.decr(toKey(type, id), callback);
    };
};

RedisDatabank.prototype = new Databank();

module.exports = RedisDatabank;
