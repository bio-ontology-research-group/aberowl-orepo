databank-redis
==============

This is the Redis driver for Databank.

License
-------

Copyright 2011-2014, E14N https://e14n.com/

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

> http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.

Usage
-----

To create a Redis databank, use the `Databank.get()` method:

    var Databank = require('databank').Databank;

    var db = Databank.get('redis', {});

The driver takes the following parameters:

* `host`: the host to connect to; default is `127.0.0.1`.
* `port`: the port to connect to; default is `6379`.
* `schema`: the database schema, as described in the Databank README.
* `database`: integer representing the Redis database to use; default is 0.
* `checkIndices`: at connect time the driver will check that the non-primary
  indices (see below) in the database are up-to-date with the values in the
  schema parameter. If not, it tries to build them. This can take a loooong
  time in a big database, so if you want to make it stop, set this
  parameter to `false`. Default is `true`.

See the main databank package for info on its interface.

Under the covers
----------------

Keys in the database have the form "type:id". So a "person" with id
"evanp" is at "person:evanp".

Objects and arrays are stored as JSON-encoded strings in the Redis
database. Numbers are stored as numbers.

Indices are implemented as sets. Search uses set intersection to
quickly find keys to matching objects.
