// test/scan.js
//
// Testing scan() method
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
    Step = require('step'),
    databank = require('../databank'),
    Databank = databank.Databank;

// Films featuring prospectors

var data = [
    {
        imdb: 'tt0469494',
        title: 'There Will Be Blood',
        year: 2007
    },
    {
        imdb: 'tt0040897',
        title: 'The Treasure of the Sierra Madre',
        year: 1948
    },
    {
        imdb: 'tt0064615',
        title: 'Mackenna\'s Gold',
        year: 1969
    },
    {
        imdb: 'tt0120363',
        title: 'Toy Story 2',
        year: 1999
    }
];

var scanContext = function(driver, params) {

    var context = {};

    context["When we create a " + driver + " databank"] = {

        topic: function() {
            if (!params.hasOwnProperty('schema')) {
                params.schema = {};
            }
            params.schema.film = {
                pkey: 'imdb',
                fields: ['title', 'year']
            };
            return Databank.get(driver, params);
        },
        'We can connect to it': {
            topic: function(bank) {
                bank.connect(params, this.callback);
            },
            teardown: function(bank) {
                Step(
                    function() {
                        var i, group = this.group();
                        for (i = 0; i < data.length; i++) {
                            bank.del('film', data[i].imdb, group());
                        }
                    },
                    function(err) {
                        if (err) throw err;
                        bank.disconnect(this);
                    },
                    this.callback
                );
            },
            'without an error': function(err) {
                assert.ifError(err);
            },
            'and we can add some films': {
                topic: function(bank) {
                    var cb = this.callback;
                    Step(
                        function() {
                            var i = 0, group = this.group();
                            for ( i = 0; i < data.length; i++) {
                                bank.save('film', data[i].imdb, data[i], group());
                            }
                        },
                        cb
                    );
                },
                'without an error': function(err, films) {
                    var i;
                    assert.ifError(err);
                    assert.isArray(films);
                    assert.lengthOf(films, data.length);
                    for (i = 0; i < films.length; i++) {
                        assert.isObject(films[i]);
                        assert.equal(films[i].imdb, data[i].imdb);
                    }
                },
                'and we can scan a type with some data': {
                    topic: function(films, bank) {
                        var cb = this.callback,
                            results = [], 
                            onResult = function(result) { results.push(result); };

                        bank.scan('film', onResult, function(err) {
                            cb(err, results);
                        });
                    },
                    'without an error': function(err, results) {
                        assert.ifError(err);
                    },
                    'with the correct data': function(err, results) {
                        assert.ifError(err);
                        assert.isArray(results);
                        assert.lengthOf(results, data.length);
                    }
                },
                'and we can scan a type previously unseen': {
                    topic: function(films, bank) {
                        var cb = this.callback,
                            results = [], 
                            onResult = function(result) { results.push(result); };

                        bank.scan('bird', onResult, function(err) {
                            cb(err, results);
                        });
                    },
                    'without an error': function(err, results) {
                        assert.ifError(err);
                    },
                    'with the correct data': function(err, results) {
                        assert.ifError(err);
                        assert.isArray(results);
                        assert.lengthOf(results, 0);
                    }
                }
            }
	}
    };
    
    return context;
};

module.exports = scanContext;
