// test/search.js
//
// Testing search() method
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
    Step = require('step'),
    databank = require('../databank'),
    Databank = databank.Databank;

var data = [
    {
        brainz: 'c5b6f035-2965-4b14-8ab8-739c8ccef8a1',
        title: 'Free Ride',
        album: 'They Only Come Out at Night',
        artist: 'The Edgar Winter Group'
    },
    {
        brainz: 'c9960e00-5ff6-47f4-ba97-32ebcad935cb',
        title: 'Goodbye Stranger',
        album: 'Breakfast in America',
        artist: 'Supertramp'
    },
    {
        brainz: '0881386b-0275-4273-849d-4cf02b306a24',
        title: 'Dreamer',
        album: 'Crime of the Century',
        artist: 'Supertramp'
    },
    {
        brainz: 'a1369840-e111-4ea7-9f2c-08e217c4645b',
        title: 'Take the Long Way Home',
        album: 'Breakfast in America',
        artist: 'Supertramp'
    },
    {
        brainz: 'c45a3943-bdca-4753-b59a-5e10749c407e',
        title: 'Werewolves of London',
        album: 'Excitable Boy',
        artist: 'Warren Zevon'
    }
];

var searchContext = function(driver, params) {

    var context = {};

    context["When we create a " + driver + " databank"] = {

        topic: function() {
            if (!params.hasOwnProperty('schema')) {
                params.schema = {};
            }
            params.schema.song = {
                pkey: 'brainz',
                fields: ['artist', 'album', 'title'],
                indices: ['artist', 'album']
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
                            bank.del('song', data[i].brainz, group());
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
            'and we can add some songs': {
                topic: function(bank) {
                    var cb = this.callback;
                    Step(
                        function() {
                            var i = 0, group = this.group();
                            for ( i = 0; i < data.length; i++) {
                                bank.save('song', data[i].brainz, data[i], group());
                            }
                        },
                        cb
                    );
                },
                'without an error': function(err, songs) {
                    var i;
                    assert.ifError(err);
                    assert.isArray(songs);
                    assert.lengthOf(songs, data.length);
                    for (i = 0; i < songs.length; i++) {
                        assert.isObject(songs[i]);
                        assert.equal(songs[i].brainz, data[i].brainz);
                    }
                },
                'and we can search by an indexed value': {
                    topic: function(songs, bank) {
                        var cb = this.callback,
                            results = [], 
                            onResult = function(result) { results.push(result); };

                        bank.search('song', {'artist': 'Supertramp'}, onResult, function(err) {
                            cb(err, results);
                        });
                    },
                    'without an error': function(err, results) {
                        assert.ifError(err);
                    },
                    'with the correct data': function(err, results) {
                        assert.ifError(err);
                        assert.isArray(results);
                        assert.lengthOf(results, 3);
                    }
                },
                'and we can search by two indexed values': {
                    topic: function(songs, bank) {
                        var cb = this.callback,
                            results = [], 
                            onResult = function(result) { results.push(result); };

                        bank.search('song', {'artist': 'Supertramp', 'album': 'Breakfast in America'}, onResult, function(err) {
                            cb(err, results);
                        });
                    },
                    'without an error': function(err, results) {
                        assert.ifError(err);
                    },
                    'with the correct data': function(err, results) {
                        assert.ifError(err);
                        assert.isArray(results);
                        assert.lengthOf(results, 2);
                    }
                },
                'and we can search by an non-indexed value': {
                    topic: function(songs, bank) {
                        var cb = this.callback,
                            results = [],
                            onResult = function(result) { results.push(result); };

                        bank.search('song', {'title': 'Werewolves of London'}, onResult, function(err) {
                            cb(err, results);
                        });
                    },
                    'without an error': function(err, results) {
                        assert.ifError(err);
                    },
                    'with the right data': function(err, results) {
                        assert.ifError(err);
                        assert.isArray(results);
                        assert.lengthOf(results, 1);
                        assert.equal(results[0].title, 'Werewolves of London');
                    }
                },
                'and we can search by mixed indexed and unindexed': {
                    topic: function(songs, bank) {
                        var cb = this.callback,
                            results = [],
                            onResult = function(result) { results.push(result); };

                        bank.search('song', {'title': 'Free Ride', 'artist': 'The Edgar Winter Group'}, onResult, function(err) {
                            cb(err, results);
                        });
                    },
                    'without an error': function(err, results) {
                        assert.ifError(err);
                    },
                    'with the right data': function(err, results) {
                        assert.ifError(err);
                        assert.isArray(results);
                        assert.lengthOf(results, 1);
                        assert.equal(results[0].title, 'Free Ride');
                    }
                },
                'and we can search with no expected results': {
                    topic: function(songs, bank) {
                        var cb = this.callback,
                            results = [],
                            onResult = function(result) { results.push(result); };

			bank.search('song', {'artist': 'Batman'}, onResult, function(err) {
                            cb(err, results);
                        });
                    },
                    'without an error': function(err, results) {
			assert.ifError(err);
                    },
                    'with an empty result set': function(err, results) {
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

module.exports = searchContext;
