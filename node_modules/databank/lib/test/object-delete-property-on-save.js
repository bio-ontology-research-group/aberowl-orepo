// test/object-save-hook.js
//
// Testing DatabankObject save() hooks
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
    Databank = databank.Databank,
    DatabankObject = require('../databankobject').DatabankObject;

var objectDeletePropertyOnSaveContext = function(driver, params) {

    var context = {};

    context["When we create a " + driver + " databank"] = {

        topic: function() {
            if (!params.hasOwnProperty('schema')) {
                params.schema = {};
            }
            params.schema.tree = {
                pkey: 'name'
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
                        bank.del("tree", "oak", this);
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
            'and we can initialize the Tree class': {
                topic: function(bank) {
                    var Tree = DatabankObject.subClass('tree');
                    Tree.bank = function() {
                        return bank;
                    };
                    return Tree;
                },
                'which is valid': function(Tree) {
                    assert.isFunction(Tree);
                },
                'and we can create a tree': {
                    topic: function(Tree) {
		        Tree.create({name: "oak", type: "deciduous", bark: "rough"}, this.callback);
		    },
                    "it works": function(err, tree) {
                        assert.ifError(err);
                        assert.isObject(tree);
                    },
                    "and we delete a property and save()": {
                        topic: function(tree) {
                            delete tree.bark;
                            tree.save(this.callback);
                        },
                        "it works": function(err, saved) {
                            assert.ifError(err);
                            assert.isObject(saved);
                        },
                        "and we re-read the object": {
                            topic: function(saved, tree, Tree) {
                                Tree.get("oak", this.callback);
                            },
                            "it works": function(err, tree) {
                                assert.ifError(err);
                            },
                            "it does not have the deleted property": function(err, tree) {
                                assert.ifError(err);
                                assert.isUndefined(tree.bark);
                            }
                        }
                    }
                }
            }
        }
    };

    return context;
};

module.exports = objectDeletePropertyOnSaveContext;
