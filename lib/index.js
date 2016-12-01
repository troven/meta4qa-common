var assert = require('assert');
var request = require('request');
var meta4qa = require('meta4qa'), helps = meta4qa.helpers, files = helps.files, http = helps.http, _ = meta4qa._;
var fs = require('fs');
var path = require('path');
var debug = require('debug')("meta4qa:webapi");

var self = module.exports = function(learn, config, dialect) {
    assert(learn, "missing learn");
    assert(config, "missing config");
    assert(dialect, "missing dialect");

    var Dialect = {};

    Dialect.Common = require("./dialect/common");
    Dialect.Events = require("./dialect/events");
    Dialect.Files = require("./dialect/filesystem");
    Dialect.Transform = require("./dialect/transform");
    Dialect.Variables = require("./dialect/variables");

    _.each(Dialect, function(vocab, name) {
        vocab(learn,config, dialect);
    })

    self.feature = function(dialect, scope) {
        assert(dialect, "missing dialect");
        assert(scope, "missing scope");

        // initialize features
        _.each(Dialect, function(vocab, name) {
            if (_.isFunction(vocab.feature)) {
                vocab.feature(learn,config);
            }
        });
    };

    self.scenario = function(dialect, scope) {
        assert(dialect, "missing dialect");
        assert(scope, "missing scope");

        // initialize scenarios
        _.each(Dialect, function(vocab, name) {
            if (_.isFunction(vocab.scenario)) {
                vocab.scenario(dialect,scope);
            }
        });
    };

    self.annotations = function(dialect, annotations, scope) {
        assert(dialect, "missing dialect");
        assert(annotations, "missing annotations");
        assert(scope, "missing scope");

        // initialize request/response + targets + agents

        _.defaults(scope, {} );
        _.extend(scope, { stopwatch: {} } );

        // initialize scenarios
        _.each(Dialect, function(vocab, name) {
            if (_.isFunction(vocab.annotations)) {
                vocab.annotations(dialect,annotations, scope);
            }
        });
    };

    debug("understands common terms");
    return self;
};
