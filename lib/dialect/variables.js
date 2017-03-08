var pkg = require("../../package");
var assert = require('assert');
var request = require('request');
var meta4qa = require('meta4qa'),
	helps = meta4qa.helpers,
	files = helps.files,
	http = helps.http,
	_ = meta4qa._;
var fs = require('fs');
var path = require('path');
var debug = require('debug')('meta4qa:dialect:variables');

var meta4qa = require('meta4qa'),
	helps = meta4qa.helpers,
	vars = helps.vars,
	files = helps.files,
	converts = meta4qa.converts,
	http = helps.http;
/**
 * Variables
 * Configures the Gherkin parser with phrases that support operations on variables
 *
 * @module Default Dialect
 * @class Variables
 *
 */

var self = module.exports = function (learn, config, dialect) {
	assert(learn, "missing learn");
	assert(config, "missing config");
	assert(dialect, "missing dialect");
	assert(helps, "missing helpers");

	// ***** GIVEN *****

	/**
	 * Remove all the scoped variables
	 *
	 *      I clear variables
	 *
	 *      I reset variables
	 *
	 * @example
	 *
	 *      GIVEN I reset variables
	 *      
	 * @method Clear Variables
	 */

	learn.given(["I clear variables", "I reset variables"], function (done) {
		for (var name in this.vars) delete this.vars[name];
		done && done();
	});

	/**
	 * Set the value of a scoped variable
	 *
	 *      I set $varname to $value
	 *
	 *      I set $varname = $value
	 *
	 *      I define $varname = $value
	 *
	 *      I define $varname is $value
	 *
	 * @example
	 *
	 *      GIVEN I set hello to world
	 *      AND I set yes to true
	 *      AND I set nope to false
	 *      AND I set answer to 42
     *      Then answer should be 42
     *      Then nope should be false
     *      Then yes should be true
	 *
	 * @method Set Variable
	 * @param {String} variable - variable name
	 * @param {Object} value - simple value (string | number | boolean)
	 */

	learn.given(["I set $varname to $value", "I set $varname = $value", "I define $varname = $value", "I set $varname is $value"], function (name, value, done) {
        if (value=="true") value = true;
        else if (value=="false") value = false;

		vars.set(this.vars, name, value);
		done && done();
	});

	learn.given(["I set $varname from $varname2"], function (name, var2, done) {
		var value = vars.find(this, var2);
		assert(value != undefined, "Value " + name + " is undefined");
		vars.set(this.vars, name, value);
		done && done();
	});

    learn.given(["I unset $varname"], function (name, done) {
        assert(name, "missing" + name);
        delete this.vars[name];
        done && done();
    });

	// learn.given(["I randomize $varname with $size characters"], function(name, size, done) {
	//     var value = vars.find(this, name);
	//     assert(value!=undefined, "Value "+name+" is undefined");
	//     vars.set(this.vars, name, value);
	//     done && done();
	// });

	learn.given(["I want it $varname", "I want a $varname", "I want an $varname"], function (name, done) {
		vars.set(this.vars, name, true);
		done && done();
	});

	learn.given(["I convert $varname to text"], function (name, done) {
		var original = vars.find(this, name);
		vars.set(this.vars, name, JSON.stringify(original));

		done && done();
	});

	/**
	 * Sets the value of a scoped variable to inline CSV data structure
	 *
	 *      I set $varname to CSV:
	 *      -------------
	 *      $CSV
	 *      -------------
	 *
	 *      some $varname as CSV:
	 *      -------------
	 *      $CSV
	 *      -------------
	 *
	 * @example
	 *
	 *      GIVEN I set my-csv to CSV:
	 *      -------------
	 *      hello, goodbye
	 *      world, earth
	 *      -------------
	 *
	 *  or:
	 *
	 *      AND some CSV as my-csv:
	 *      -------------
	 *      hello, goodbye
	 *      world, earth
	 *      -------------
	 *
	 *
	 * @method Set Variable from CSV
	 * @param {String} name - variable name
	 * @param {string} CSV - inline CSV text
	 */

	learn.given(["I set $varname to CSV:\n$CSV", "some CSV as $varname:\n$CSV"], function (varname, csv, done) {
		vars.set(this.vars, varname, csv);
		done && done();
	});

	/**
	 * Sets the value of a scoped variable to inline JSON data structure
	 * ---------- ---------- ---------- ----------
	 *
	 * @example
	 *
	 *      GIVEN I set $varname to JSON:
	 *      -------------
	 *      { "hello": "world" }
	 *      -------------
	 *
	 *  or:
	 *
	 *      AND some JSON as $varname:
	 *      -------------
	 *      { "hello": "world" }
	 *      -------------
	 *
	 *
	 * @method Set Variable from JSON
	 * @param {String} name - variable name
	 * @param {Object} JSON - inline JSON
	 */

	learn.given(["I set $varname to JSON:\n$JSON", "some JSON as $varname:\n$JSON"], function (name, json, done) {
		vars.set(this.vars, name, json);
		done && done();
	});

	learn.given(["I set $varname to text:\n$TEXT", "some text as $varname:\n$TEXT"], function (name, text, done) {
		vars.set(this.vars, name, text);
		done && done();
	});

	/**
	 * Run Javscript and save result into a variable
	 *
	 * @example
	 *
	 *      GIVEN I return 2+3 as my-answer
	 *
	 *      AND I return new Date().getTime() as now

	 * @method Save Javascript to Variable
	 * @param {String} javascript - inline javascript
	 * @param {string} varname - variable name
	 */

	learn.given("I return $javascript as $varname", function (js, name, done) {
		var fn = new Function("return (" + js + ");");
		var result = fn.apply(this, arguments);
		vars.set(this.vars, name, result);
		done && done();
	});

	/**
	 * Execute Javascript - trigger a fail if return is falsey
	 *
	 * @example
	 *
	 *      WHEN I execute (3+4)
	 *
	 * @method Execute Javascript
	 * @param {String} javascript - inline javascript
	 */

	learn.when(["I execute $javascript", "I execute\n$javascript"], function (js, done) {
		var fn = new Function(js);
		var result = fn.apply(this);
		if (typeof (result) != "undefined") {
			assert(result, "Javascript return 'falsey'");
		}
		done && done();
	});

    /**
     * Sets the value of a scoped variable to inline CSV data structure
     *
     *      I set $varname to CSV:
     *      -------------
     *      $CSV
     *      -------------
     *
     *      some $varname as CSV:
     *      -------------
     *      $CSV
     *      -------------
     *
     * @example
     *
     *      GIVEN I set my-csv to CSV:
     *      -------------
     *      hello, goodbye
     *      world, earth
     *      -------------
     *
     *  or:
     *
     *      AND some CSV as my-csv:
     *      -------------
     *      hello, goodbye
     *      world, earth
     *      -------------
     *
     *
     * @method Set Variable from CSV
     * @param {String} name - variable name
     * @param {string} CSV - inline CSV text
     */

    learn.given(["I sanitize $varname"], function (varname, done) {
        var value = vars.get(this.vars, varname);
        assert(value, "Can't sanitize missing value: "+varname);
        value = vars.sanitize(value,"_").toLowerCase();
        vars.set(this.vars,varname, value);
        done && done();
    });

    /**
	 * Assert some Javascript returns true or trigger a fail if return is 'falsey'
	 *
	 * @example
	 *
	 *      GIVEN I am testing
	 *      THEN I assert this.name == "testing"
	 *
	 * @method Assert Javascript
	 * @param {String} javascript - inline javascript
	 */

	learn.then(["I assert $javascript", "I expect $javascript"], function (js, done) {
		//console.log("VARS: %s -> %j", js, _.keys(this));
		var fn = new Function("return (" + js + ");");
		var result = fn.apply(this);
		assert(result, "Javascript assert: " + js + " --> " + result);
		done && done();
	});

	/**
	 * Assert some variable is assigned a value that is truthy
	 *
	 *      variable $varname should exist
	 *
	 * @example
	 *
	 *      GIVEN I set variable hello to world
	 *      THEN variable hello should exist
	 *
	 * @method Assert variable is truthy
	 * @param {String} varname - scoped variable
	 */

	learn.then(["variable $varname should exist", "variable $varname exists", "$varname should exist", "$varname exists"], function (name, done) {
		var value = vars.find(this, name);
//		console.log("VAR: %j", this);
		assert(value, "Variable " + name + " does not exist");
		assert(value != undefined, "Variable " + name + " does not exist");
		done && done();
	});

	/**
	 * Assert some variable should match an exact value
	 *
	 *
	 *      variable $varname should be $value
	 *      $varname should be $value
	 *      $varname equals $value
	 *      $varname is $value
	 *      $varname = $value
	 *
	 * @example
	 *
	 *      GIVEN I set variable hello to world
	 *      THEN variable hello should exist
	 *
	 * @method Assert variable matches a value exactly
	 * @param {String} varname - scoped variable
	 * @param {String} value - expected value
	 */

	learn.then(["variable $varname should be $value", "$varname should be $value", "$varname equals $value", "$varname must equal $value", "$varname = $value"], function (name, value, done) {

		if (value == "true") value = true;
		else if (value == "false") value = false;
		var v = vars.findNamed(this, name);
		assert(v != undefined, "Variable [" + name + "] does not exist -> " + this.vars[name]);
		assert(v == value, "Variable " + name + " does not equal " + value);
		done && done();
	});

	/**
	 * Assert some variable should contain a value
	 *
	 *
	 *      variable $varname should contain $value
	 *
	 * @example
	 *
	 *      GIVEN I set variable hello to world
	 *      THEN variable hello should contain orl
	 *
	 * @method Assert variable value contains some string
	 * @param {String} varname - scoped variable
	 * @param {String} value - expected value
	 */

	learn.then("variable $varname should contain $value", function (name, value, done) {
		var v = vars.get(this.vars, name);
		assert(v, "Variable " + name + " does not exist");
		assert(v.indexOf(value) > 0, "Variable " + name + " does not contain " + value);
		done && done();
	});

	/**
	 * Assert some variable should match a regular expression (RegExp)
	 *
	 *
	 *      variable $varname should match $regex
	 *
	 * @example
	 *
	 *      GIVEN I set variable hello to world
	 *      THEN variable hello should match a-z
	 *
	 * @method Assert variable matches RegExp
	 * @param {String} varname - scoped variable
	 * @param {String} regex - regular expression
	 */

	learn.then(["variable $varname should match $regex", "variable $varname must match $regex"], function (name, regex, done) {
		var v = vars.findNamed(this, name);
		assert(v, "Variable " + name + " does not exist");
		var re = new RegExp(regex);
		assert(re.test(v), "Variable " + name + " does not match " + regex);
		done && done();
	});

	/**
	 * Assert some JSON path should match a regular expression (RegExp)
	 *
	 *
	 *      variable $varname should match $regex
	 *
	 * @example
	 *
	 *      GIVEN I set variable hello to world
	 *      THEN variable hello should match a-z
	 *
	 * @method Assert variable matches RegExp
	 * @param {String} varname - scoped variable
	 * @param {String} regex - regular expression
	 */

	learn.then(["$path should match $regex", "$path matches $regex", "$path must match $regex"], function (name, regex, done) {
		var v = vars.findNamed(this, name);
		assert(v, "Variable " + name + " does not exist");
		var re = new RegExp(regex);
		assert(re.test(v), "Variable " + name + " does not match " + regex);
		done && done();
	});


	/**
	 * Assert some JSON path within a complex variable should match a regular expression (RegExp)
	 *
	 *
	 *      $.hello in $varname should match $regex
	 *
	 * @example
	 *
	 *      GIVEN I set variable my.hello to world
	 *      THEN $.hello in my should match a-z
	 *
	 * @method Assert JSON path matches RegExp
	 * @param {String} path- JSON path
	 * @param {String} varname - scoped variable
	 * @param {String} regex - regular expression
	 */

	learn.then(["$path in $varname should match $regex", "$path in $varname must match $regex", "$path in $varname matches $regex"], function (path, name, regex, done) {
		var value = vars.findNamed(this, name);
		//        debug("VALUE: %j in %s -> %j", value, name, this);
		assert(value, "Variable " + name + " does not exist");
		//        debug("found: %s -> %j", name, value);
		var found = vars.findInPath(value, path);
		debug("found: %s in %s -> %j", path, name, found);
		assert(found, "Path " + path + " not found in " + name);
		var re = new RegExp(regex);
		assert(re.test(found), "No path " + path + " in " + name + " matches " + regex);
		done && done();
	});

	/**
	 * Assert that any array element in JSON path within a variable should match a regular expression (RegExp)
	 *
	 *
	 *      $.hello in $varname should match $regex
	 *
	 * @example
	 *
	 *      GIVEN I set variable my.hello to world
	 *      THEN any $.hello in my should match a-z
	 *
	 * @method Assert JSON path matches RegExp
	 * @param {String} path - a valid JSON path
	 * @param {String} varname - scoped variable
	 * @param {String} regex - regular expression
	 */

	learn.then(["any $path in $varname should match $regex", "any $path in $varname must match $regex", "any $path in $varname matches $regex"], function (path, name, regex, done) {
		var value = vars.findNamed(this, name);
		//        debug("VALUE: %j in %s -> %j", value, name, this);
		assert(value, "Variable " + name + " does not exist");
		//        debug("found: %s -> %j", name, value);
		var found = vars.findAllInPath(value, path);
		assert(found, "Path " + path + " not found in " + name);

		if (!_.isArray(found)) found = [found];
		debug("found all: %s in %s -> %j", path, name, found);

		var re = new RegExp(regex);
		var passed = false;
		_.each(found, function (value) {
			passed = passed ? passed : re.test(value);
		})
		assert(passed, "No path " + path + " in " + name + " matches " + regex);
		done && done();
	});

	// **********************************************************************
	// * Dialect Controller
	// **********************************************************************

	self.feature = function (dialect, scope) {
		assert(dialect, "missing dialect");
		assert(scope, "missing scope");

	};

	self.scenario = function (dialect, scope) {
		assert(dialect, "missing dialect");
		assert(scope, "missing scope");

	};
	self.annotations = function (dialect, annotations, scope) {
		assert(dialect, "missing dialect");
		assert(annotations, "missing annotations");
		assert(scope, "missing scope");
	}

	debug("understands variables - v%s", pkg.version);
	return self;
}
