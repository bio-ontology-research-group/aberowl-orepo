// test/object-readall.js
//
// Testing DatabankObject readAll()
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
    {name: "Mercury", moons: 0},
    {name: "Venus", moons: 0},
    {name: "Earth", moons: 1},
    {name: "Mars", moons: 2},
    {name: "Jupiter", moons: 66},
    {name: "Saturn", moons: 62},
    {name: "Uranus", moons: 27},
    {name: "Neptune", moons: 13}
];

var ids = ['Venus', 'Mars', 'Saturn', 'invalid'];

var objectReadallContext = function(driver, params) {

    var context = {};

    context["When we create a " + driver + " databank"] = {
        topic: function() {
            if (!params.hasOwnProperty('schema')) {
                params.schema = {};
            }
            params.schema.planet = {
                pkey: 'name'
            };
            return Databank.get(driver, params);
        },
        'We can connect to it': {
            topic: function(bank) {
                bank.connect(params, this.callback);
            },
            'without an error': function(err) {
                assert.ifError(err);
            },
            teardown: function(bank) {
                var callback = this.callback;
                Step(
                    function() {
                        var i, group = this.group();
                        for (i = 0; i < data.length; i++) {
                            bank.del('planet', data[i].name, group());
                        }
                    },
                    function(err) {
                        if (err) throw err;
                        bank.disconnect(this);
                    },
                    callback
                );
            },
            'and we can initialize the Planet class': {
                topic: function(bank) {
                    var Planet = DatabankObject.subClass('planet');

                    // Override so there's not a global causing grief.

                    Planet.bank = function() {
                        return bank;
                    };

                    return Planet;
                },
                'and we can create some people': {
                    topic: function(Planet, bank) {
                        var that = this;
                        Step(
                            function() {
                                var i, group = this.group();
                                for (i = 0; i < data.length; i++) {
                                    Planet.create(data[i], group());
                                }
                            },
                            function(err, planets) {
                                that.callback(err, planets);
                            }
                        );
                    },
                    'without an error': function(err, planets) {
                        assert.ifError(err);
                    },
                    'and we can read a few of them': {
                        topic: function(planets, Planet, bank) {
                            Planet.readAll(ids, this.callback);
                        },
                        'without an error': function(err, planetMap) {
                            assert.ifError(err);
                            assert.isObject(planetMap);
                            assert.isObject(planetMap.Venus);
                            assert.isObject(planetMap.Mars);
                            assert.isObject(planetMap.Saturn);
                            assert.isNull(planetMap.invalid);
                        }
                    }
                }
            }
        }
    };

    return context;
};

module.exports = objectReadallContext;
