// Testing basic crud functionality

var assert = require('assert'),
    vows = require('vows');

vows.describe('databank module interface').addBatch({
    'When we require the databank module': {
        topic: function() { 
            return require('../lib/databank');
        },
        'we get a module back': function(databank) {
            assert.ok(databank);
        },
        'we can get the DatabankError class': {
            topic: function(databank) {
                return databank.DatabankError;
            },
            'which is a function': function (DatabankError) {
                assert.isFunction(DatabankError);
            }
        },
        'we can get the NotImplementedError class': {
            topic: function(databank) {
                return databank.NotImplementedError;
            },
            'which is a function': function (NotImplementedError) {
                assert.isFunction(NotImplementedError);
            }
        },
        'we can get the AlreadyExistsError class': {
            topic: function(databank) {
                return databank.AlreadyExistsError;
            },
            'which is a function': function (AlreadyExistsError) {
                assert.isFunction(AlreadyExistsError);
            }
        },
        'we can get the NoSuchThingError class': {
            topic: function(databank) {
                return databank.NoSuchThingError;
            },
            'which is a function': function (NoSuchThingError) {
                assert.isFunction(NoSuchThingError);
            }
        },
        'we can get the AlreadyConnectedError class': {
            topic: function(databank) {
                return databank.AlreadyConnectedError;
            },
            'which is a function': function (AlreadyConnectedError) {
                assert.isFunction(AlreadyConnectedError);
            }
        },
        'we can get the NotConnectedError class': {
            topic: function(databank) {
                return databank.NotConnectedError;
            },
            'which is a function': function (NotConnectedError) {
                assert.isFunction(NotConnectedError);
            }
        },
        'we can get the Databank class': {
            topic: function(databank) {
                return databank.Databank;
            },
            'which is a function': function(Databank) {
                assert.isFunction(Databank);
            },
            'which has a get() method': function(Databank) {
                assert.isFunction(Databank.get);
            }
        }
    }
}).export(module);
