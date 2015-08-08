caching driver
--------------

The caching driver doesn't directly provide storage. Instead, it
provides a storage pattern -- using fast and easy storage for quick
retrieval, and slower storage for long-term persistence.

Hopefully using this driver will keep you from having to write caching
code in your own app.

Usage
=====

To create a caching databank, use the `Databank.get()` method:

    var Databank = require('databank').Databank;
    
    var db = Databank.get('caching', {cache: {driver: 'memory', params: {}},
                                      source: {driver: 'disk', params: {dir: '/var/lib/mine/'}}});
    
The driver takes the following parameters:

* `schema`: the database schema, as described in the Databank README.
* `source`: the source databank info. Must be an object with `driver` and `params` properties.
* `cache`: the cache databank info. Must be an object with `driver` and `params` properties.
  If not set, a new `memory` databank will be used.
