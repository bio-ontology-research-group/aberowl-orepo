// partitioning-driver-test.js
//
// Testing the partitioning driver
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

var assert = require('assert'),
    vows = require('vows'),
    databank = require('../lib/index'),
    params = {};

// Kind of extreme: we make a different memory databank
// for each type used in our tests.

var types = [
    "inbox",
    "shoes",
    "friends",
    "test",
    "cellphone",
    "locality",
    "probability",
    "computer-count",
    "painting",
    "album",
    "person",
    "flight",
    "stock",
    "auto",
    "planet",
    "appliance",
    "state",
    "website",
    "card",
    "species",
    "task",
    "grape",
    "film",
    "song",
    "user",
    "bird",
    "tree"
];
    
for (var i = 0; i < types.length; i++) {
    params[types[i]] = {driver: 'memory', params: {}};
};

var suite = databank.DriverTest('partitioning', params);

suite['export'](module);

