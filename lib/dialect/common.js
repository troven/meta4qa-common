var pkg = require("../../package");
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
    http = helps.http;

/**
 * Useful
 * Configures the Gherkin parser with phrases that support common, useful operations
 *
 * @module Default Dialect
 * @class Common
 *
 */

var self = module.exports = function(learn, config, dialect) {
    assert(learn, "missing learn");
    assert(config, "missing config");
    assert(dialect, "missing dialect");
    assert(helps, "missing helpers");

    Array.prototype.contains = function(element){
        return this.indexOf(element) > -1;
    };

    learn.given(["I am $actor", "I am a $actor", "I am an $actor"], function(actor, done) {
        assert(actor, "Missing $actor");
        debug("We are "+actor);
        this.vars.name = actor;
        done && done();
    });

    learn.given(["I want $outcome", "I want a $outcome", "I want an $outcome", "I want some $outcome", "I want to $outcome"], function(outcome, done) {
        assert(outcome, "Missing $outcome");
        debug("We want "+outcome);
        this.vars.name = outcome;
        done && done();
    });

    learn.when(["debug $msg"], function(msg, done) {
        debug(msg);
        done && done();
    });

    learn.when(["log $msg"], function(msg, done) {
        log(msg);
        done && done();
    });

    learn.when(["error $msg"], function(msg, done) {
        error(msg);
        done && done();
    });

    learn.then(["dump $varname", "I dump $varname"], function(name, done) {
        assert(name, "Missing $varname")
        debug("dump %s in current scope", name);
        var found = helps.vars.findNamed(this, name);
        console.log("\t%s ==>\n%j", name, (found || "Not Found") );
        done && done();
    });

    learn.then(["dump", "I dump"], function(done) {
        debug("dump current scope");
        console.log("%j", this);
        done && done();
    });

    learn.then(["I fail"], function(done) {
        debug("doh !!");
        throw new Error("Deliberate Fail");
    });

    learn.then(["I fail with $msg"], function(msg, done) {
        debug("doh !! %s", msg);
        throw new Error("Deliberate Fail: "+msg);
    });

    learn.then(["I pass", "I do nothing", "I succeed"], function(done) {
        debug("meta4qas are Awesome !!");
        done && done();
    });

    learn.when(["I wait $time $units", "I wait for $time $units"], function(time, units, done) {
        var scale = 1000;
        switch(units) {
            case "m":
            case "min":
            case "mins":
            case "minute":
            case "minutes":
                scale = 60*1000; break;
            case "s":
            case "second":
            case "seconds":
                scale = 1000; break;
            case "ms":
            case "millsecond":
            case "millseconds":
                scale = 1; break;
            default:
                scale = 1000; break;
        }
        var wait = time * scale;
        debug("waiting "+wait+" ms");
        done && setTimeout(done, wait);
    });

    learn.when(["I run $filename"], function(command, done) {
        var self = this;
        debug ("CLI Run %s from %s", command, process.cwd());
        child_process.execFile(command, {}, {
            cwd: process.cwd()
        }, function(err, stdout, stderr) {
            debug ("Finished Run: %s -> %s", command, err);
            assert(!err, "RUN: "+command+" -> "+err);
            self.stdout = stdout;
            self.stderr = stderr;
            done && done();
        })
    });

    learn.when(["I exec $command"], function(command, done) {
        var self = this;
        debug ("CLI Exec: %s from %s", command, process.cwd());
        child_process.exec(command, {}, {
            cwd: process.cwd()
        }, function(err, stdout, stderr) {
            debug ("Finished Exec: %s -> %s", command, err);
            assert(!err, "EXEC: "+command+" -> "+err);
            self.stdout = stdout;
            self.stderr = stderr;
            done && done();
        })
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

    self.annotations = function(dialect, annotations, scope, scope2) {
        assert(dialect, "missing dialect");
        assert(annotations, "missing annotations");
        assert(scope, "missing scope");

        _.defaults(scope, { stopwatch: {} });

        // dynamic dialects
        var dialects = [];
        if (_.isString(annotations.dialects)) dialects.push(annotations.dialects);
        if (_.isArray(annotations.dialects)) dialects.concat(annotations.dialects);
        if (_.isString(annotations.dialect)) dialects.push(annotations.dialect);
        if (_.isArray(annotations.dialect)) dialects.concat(annotations.dialect);

        if (annotations.timeout && scope2 && _.isFunction(scope2.timeout)) {
            debug("timeout: %s", annotations.timeout);
            scope2.timeout(annotations.timeout);
        }
        dialect.requires(dialects);
        scope.dialects = dialects;
    }

    debug("utility phrases - v%s",pkg.version);
    return self;
}

