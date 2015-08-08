// test/object-readarray.js
//
// Testing DatabankObject readArray()
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

var vows = require('vows'),
    assert = require('assert'),
    databank = require('../databank'),
    Databank = databank.Databank,
    Step = require('step'),
    DatabankObject = require('../databankobject').DatabankObject;

var data = [
    {abbr: 'MA', name: 'Massachussetts'},
    {abbr: 'CA', name: 'California'},
    {abbr: 'NY', name: 'New York'},
    {abbr: 'MO', name: 'Missouri'},
    {abbr: 'WY', name: 'Wyoming'} 
];

var ids = ['CA', 'NY', 'MO', 'invalid'];

var objectReadarrayContext = function(driver, params) {

    var context = {};

    context["When we create a " + driver + " databank"] = {
        topic: function() {
            if (!params.hasOwnProperty('schema')) {
                params.schema = {};
            }
            params.schema.state = {
                pkey: 'abbr'
            };
            return Databank.get(driver, params);
        },
        'We can connect to it': {
            topic: function(bank) {
                bank.connect(params, this.callback);
            },
            teardown: function(bank) {
                var callback = this.callback;
                Step(
                    function() {
                        var i, group = this.group();
                        for (i = 0; i < data.length; i++) {
                            bank.del("state", data[i].abbr, group());
                        }
                    },
                    function(err) {
                        if (err) throw err;
                        bank.disconnect(this);
                    },
                    callback
                );
            },
            'without an error': function(err) {
                assert.ifError(err);
            },
            'and we can initialize the State class': {
                topic: function(bank) {
                    var State = DatabankObject.subClass('state');

                    // Override so there's not a global causing grief.

                    State.bank = function() {
                        return bank;
                    };
                    
                    return State;
                },
                'and we can create some states': {
                    topic: function(State, bank) {
                        var cb = this.callback;
                        Step(
                            function() {
                                var i, group = this.group();
                                for (i = 0; i < data.length; i++) {
                                    State.create(data[i], group());
                                }
                            },
                            cb
                        );
                    },
                    'without an error': function(err, states) {
                        assert.ifError(err);
                    },
                    'and we can read a few of them': {
                        topic: function(states, State, bank) {
                            State.readArray(ids, this.callback);
                        },
                        'without an error': function(err, statesArray) {
                            var i;
                            assert.ifError(err);
                            assert.isArray(statesArray);
                            assert.lengthOf(statesArray, ids.length);
                            for (i = 0; i < 3; i++) {
                                assert.isObject(statesArray[i]);
                                assert.equal(statesArray[i].abbr, ids[i]);
                            }
                            assert.isNull(statesArray[3]);
                        }
                    }
                }
            }
        }
    };
    
    return context;
};

module.exports = objectReadarrayContext;
