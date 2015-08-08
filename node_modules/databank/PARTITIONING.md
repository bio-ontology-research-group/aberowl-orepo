partitioning driver
-------------------

The partitioning driver lets you put different types into different
databanks. It lets you defer decisions about database partitioning
until configuration time, so you don't have to worry about that kind
of thing within your application code.

Usage
=====

To create a partitioning databank, use the `Databank.get()` method:

    var Databank = require('databank').Databank,
        params = {
            'session': {'driver': 'memory', 'params': {}},
            'token': {'driver': 'memcached', 'params': {'serverLocations': ['192.168.3.1:11211', '192.168.3.1:11211']}},
            '*': {'driver': 'mongodb', 'params': {'host': 'myhost.example', 'dbname': 'mydb'}},
        };
    
    var db = Databank.get('partitioning', params);

    // Just use databank calls as usual
    
    db.create('session', 123, {nickname: 'evanp', size: 'xl'}, function(err, newSession) {
         console.dir(newSession);
    });

    // Comes from the default databank
    
    db.read('address', '1444 Elm Street', function(err, readAddress) {
         console.dir(readAddress);
    });

Unlike most databank drivers, the partitioning driver doesn't take a fixed set of params.

Instead, the parameters are a map of type names to databank connection
definitions with `driver` and `params` values. In the above example:

* All `session` data will be stored in a memory databank
* All `token` data will be stored in memcached (actually, it could also be Couchbase, but you get the picture)
* All other types will be stored in a mongodb databank.

Note that the special param '*' defines a default driver. You should
usually have one, unless you're sure you mapped all your types.

Bugs
====

* You can only partition vertically by type for now. Horizontal partitioning (by key) will probably happen in the future.
* You can't have a type named '*'. You probably don't need this unless you're a proctologist or an astronomer.
* You can't make two types share the same databank instance.
