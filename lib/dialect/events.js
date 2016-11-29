var pkg = require("../../package");
var assert = require('assert');
var request = require('request');
var _ = require('underscore');
var path = require('path');
var debug = require('debug')('meta4qa:dialect:events');
var log = require('debug')('meta4qa:log');
var error = require('debug')('meta4qa:error');

var meta4qa = require('meta4qa'),
    helps = meta4qa.helpers,
    files = helps.files,
    http = helps.http;

/**
 * Events Dialect
 * transmits events to apigee
 *
 * @module Default Dialect
 * @class Events
 *
 */
var self = module.exports = function(learn, config, dialect) {
    assert(learn, "missing learn");
    assert(config, "missing config");
    assert(dialect, "missing dialect");
    assert(helps, "missing helpers");

    /**
     * Broadcast Event to interested parties
     *
     *      I emit $event
     *
     * @method Emit Event
     */

    learn.when(["I emit $event"], function(event, done) {
        this.emit(event, this.vars);
        done && done();
    });

    learn.when(["I emit $event with $vars"], function(event, varlist, done) {
        var vars = varlist.split(",");
        var body = _.pick(this, vars);
        debug("Emit: %s -> %j -> %j", event, vars, body)
        this.emit(event, body);
        done && done();
    });

    // **********************************************************************
    // * Dialect Controller
    // **********************************************************************

    self.feature = function(dialect, scope) {
        assert(dialect, "missing dialect");
        assert(scope, "missing scope");

        // No feature specific initialization
    };

    self.scenario = function(dialect, scope) {
        assert(dialect, "missing dialect");
        assert(scope, "missing scope");

        // No scenario specific initialization
    };

    self.annotations = function(dialect, annotations, scope) {
        assert(dialect, "missing dialect");
        assert(annotations, "missing annotations");
        assert(scope, "missing scope");

        _.defaults(scope, {stopwatch: {} });

        // dynamic events
        if (_.isString(annotations.on)) {
            throw "'On' events not implemented";
        }
    }

    debug("events [experimental] - v%s", pkg.version);
    return self;
}

