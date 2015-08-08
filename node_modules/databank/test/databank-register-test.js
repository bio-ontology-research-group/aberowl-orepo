// test/databank-register-test.js
//
// Test the registration interface for Databank
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
    databank = require('../lib/databank'),
    Databank = databank.Databank,
    MemoryDatabank = require('../lib/drivers/memory');

vows.describe('databank register').addBatch({
    'When we register a databank module': {
        topic: function() { 
            Databank.register('memoryalias', MemoryDatabank);
            return Databank.get('memoryalias', {});
        },
        "we get back a good value": function(db) {
            assert.isObject(db);
            assert.instanceOf(db, MemoryDatabank);
        }
    }
}).export(module);
