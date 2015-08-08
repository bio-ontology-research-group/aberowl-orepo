// drivertest.js
//
// Builds a test suite based on a given databank driver
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

var vows = require('vows');

var tests = [
    'array',
    'bank-instance',
    'basic-crud',
    'connection',
    'extreme-ids',
    'float',
    'integer',
    'key-error',
    'object-create-hook',
    'object-del-hook',
    'object-get-hook',
    'object-readall-hook',
    'object-readall',
    'object-readarray-hook',
    'object-readarray',
    'object-save-hook',
    'object-scan',
    'object',
    'object-update-hook',
    'object-delete-and-search',
    'object-delete-property-on-save',
    'readall',
    'save',
    'scan',
    'search'
];

var DriverTest = function(driver, params) {

    var suite = vows.describe(driver + 'databank driver test'),
        maker, i, ctx;

    for (i = 0; i < tests.length; i++) {
        maker = require('./test/'+tests[i]);
        ctx = {};
        ctx[tests[i]] = maker(driver, params);
        suite.addBatch(ctx);
    }

    return suite;
};

exports.DriverTest = DriverTest;
