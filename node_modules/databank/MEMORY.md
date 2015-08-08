memory driver
-------------

The memory driver provides in-memory storage of data. It is *not*
persistent; data will be lost after the process stops.

It works well in conjunction with the caching driver (q.v.), and for
unit tests.

Usage
=====

To create a memory databank, use the `Databank.get()` method:

    var Databank = require('databank').Databank;
    
    var db = Databank.get('memory', {});
    
The driver takes the following parameters:

* `schema`: the database schema, as described in the Databank README.
* `data`: initial data for the databank. It must be an object, with properties
  mapped to types, each of which maps to a map of key-value pairs. For example:
  
  var db = Databank.get('memory', {data: {state: {'KY': {name: 'Kentucky'},
                                                  'KS': {name: 'Kansas'}}},
                                         {city: {'LAX': {name: 'Los Angeles'},
                                                 'NYC': {name: 'New York City'}}}});
                                                  

