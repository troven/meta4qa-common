var assert = require('assert');
var request = require('request');
var _ = require('underscore');
var path = require('path');
var debug = require('debug')('meta4qa:dialect:common');
var log = require('debug')('meta4qa:log');
var error = require('debug')('meta4qa:error');
var child_process = require('child_process');

var meta4qa = require('meta4qa'),
    helps = meta4qa.helpers,
    files = helps.files,
    converts = meta4qa.converts,
    http = helps.http;

/**
 * Useful
 * Configures the Gherkin parser with phrases that support simple (map/reduce) style data transformations
 *
 * @module Default Dialect
 * @class Transform
 *
 */

var self = module.exports = function(learn, config, dialect) {
    assert(learn, "missing learn");
    assert(config, "missing config");
    assert(dialect, "missing dialect");
    assert(helps, "missing helpers");


    learn.when(["I merge $varnames as $varname", "I merge $varnames into $varname"], function(varnames, varname, done) {
        var names = varnames.split(",");
        var result = {};
        var self = this;
        _.each(names, function(name) {
            var found  = helps.vars.findNamed(self,name) || {};
            _.extend(result, found);
        })
        helps.vars.set(this.vars, varname, result);
        done && done();
    });


    /**
     * Transform some variable using a Javascript function
     *
     * @example
     *
     *      When I transform something with:
     *          this.transformed = this.transformed?this.transformed+1:1;
     *      THEN something.transformed should be true
     *
     * @method Transform a variable using Javascript
     * @param {String} varname - variable to transform
     * @param {String} javascript - inline javascript
     */

    learn.when(["I transform $varname with\n:$javascript"], function(varname, js, done) {
        var fn = new Function(js);
        var original = helps.vars.find(this,varname) || [];
        var results = _.map(original, fn);
        helps.vars.set(this, varname, results);
        done && done();
    });

    learn.when(["I reduce $varname with\n:$javascript"], function(varname, js, done) {
        var fn = new Function(js);
        var original = helps.vars.find(this,varname) || [];
        var results = {};
        _.reduce(original, fn, results);
        helps.vars.set(this, varname, results);
        done && done();
    });

    // **********************************************************************
    // * Dialect Controller
    // **********************************************************************

    self.feature = function(dialect, scope) {
        assert(dialect, "missing dialect");
        assert(scope, "missing scope");
    };

    self.scenario = function(dialect, scope) {
        assert(dialect, "missing dialect");
        assert(scope, "missing scope");
    };

    self.annotations = function(dialect, annotations, scope) {
        assert(dialect, "missing dialect");
        assert(annotations, "missing annotations");
        assert(scope, "missing scope");
    }

    debug("data transformations [experimental]");
    return self;
}

