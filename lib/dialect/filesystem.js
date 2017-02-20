var pkg = require("../../package");
var assert = require('assert');
var meta4qa = require('meta4qa'),
	helps = meta4qa.helpers,
	files = helps.files,
	http = helps.http,
	converts = meta4qa.converts,
	_ = meta4qa._;
var fs = require('fs');
var path = require('path');
var mkdirp = require('mkdirp');
var debug = require('debug')('meta4qa:dialect:files');

var meta4qa = require('meta4qa'),
	helps = meta4qa.helpers,
	files = helps.files,
	converts = meta4qa.converts,
	http = helps.http;

/**
 * File System
 * Configures the Gherkin parser with phrases that support operations on File System
 *
 * @module Default Dialect
 * @class File System
 *
 */


var self = module.exports = function (learn, config, dialect) {
	assert(learn, "missing learn");
	assert(config, "missing config");
	assert(dialect, "missing dialect");
	assert(helps, "missing helpers");
	assert(converts, "missing converters");

	assert(config.paths, "missing file paths");
	assert(config.paths.files, "missing default file path");

	var FILE_ENCODING = "UTF-8";

	learn.given(["I load $varname as $format from $file", "I read $varname as $format from $file"], function (name, format, filename, done) {
		var file = helps.files.root(this, filename);
		assert(helps.files.exists(file), format + " file not found: " + file);

		format = format.toLowerCase();
		var converter = converts[format];
		assert(converter, format + " files are not supported: " + file);
		var raw = helps.files.load(file);
		assert(raw, format + " file is empty: " + file);
		var self = this;
		converter(raw, function (err, json) {
			assert(!err, format + " not valid: " + file);
			helps.vars.set(self.vars, name, json);
			debug("%s loaded: %j", format, file);
            done && done();
		})

	});

	learn.given(["I load $varname as $format from $folder $file", "I read $varname as $format from $folder $file"], function (name, format, folder, filename, done) {
		var file = helps.files.root(this, folder, filename);
		assert(helps.files.exists(file), format + " file not found: " + file);

		format = format.toLowerCase();
		var converter = converts[format];
		assert(converter, format + " files are not supported: " + file);
		var raw = helps.files.load(file);
		assert(raw, format + " file is empty: " + file);
		var self = this;
		converter(raw, function (err, json) {
			assert(!err, format + " not valid: " + file);
			helps.vars.set(self.vars, name, json);
			debug("%s converted to %s: %j", file, format, json);
            done && done();
		})

	});

	learn.given(["I load $varname from $file", "I read $varname from $file"], function (name, filename, done) {
        assert(name, "Missing $varname");
        assert(filename, "Missing $filename");
        assert(done, "Missing callback");

		var file = helps.files.root(this, filename);
		var format = path.extname(file);
		assert(format, "missing file extension: " + file);
		assert(helps.files.exists(file), format + " file not found: " + file);

		format = format.substring(1).toLowerCase();
		var converter = converts[format];
		assert(converter, format + " files are not supported: " + file);
		var raw = helps.files.load(file);
		assert(raw, format + " file is empty: " + file);
		var self = this;
		try {
			converter(raw, function (err, json) {
				assert(!err, format + " not valid: " + file);
				helps.vars.set(self.vars, name, json);
				debug("%s loaded %s %s items from %s", format, _.keys(json).length, name, file);
                done && done();
			});
		} catch (e) {
			throw new Error(e + " in " + filename);
		}

	});

	learn.given(["I find $filter in folder $folder"], function (filter, folder, done) {
		if (filter == "files") filter = ".";
		var file = helps.files.root(this, folder);
		var files = helps.files.find(file, filter);
		helps.vars.set(this.vars, "files", files);
		done && done();
	});

	learn.given(["I find $filter in $type folder $folder"], function (filter, type, folder, done) {
		if (filter == "files") filter = ".";
		var root = this.paths[type] || config.paths[type];
		var file = helps.files.path(root, folder);

		var files = helps.files.find(file, filter);
		helps.vars.set(this.vars, "files", files);
		done && done();
	});

	learn.given(["I find $filter in folder $folder as $varname"], function (filter, folder, varname, done) {
		if (filter == "files") filter = ".";
		var file = helps.files.root(this, folder);
		// console.log("FIND (%s): %s -> %s", filter, folder);
		var files = helps.files.find(file, filter, function (filename, json) {
			var name = path.basename(filename, filter);
			json.name = json.name || name;
			json.id = json.id || helps.vars.uuid(filename);
			return json;
		});
		helps.vars.set(this.vars, varname, files);
		done && done();
	});

	learn.given(["I find $filter in $type folder $folder as $varname"], function (filter, type, folder, varname, done) {
		if (filter == "files") filter = ".";
		var root = this.paths[type] || config.paths[type];
		var file = helps.files.path(root, folder);
		// console.log("FIND (%s): %s -> %s", filter, folder);
		var files = helps.files.find(file, filter, function (filename, json) {
			var name = path.basename(filename, filter);
			json.name = json.name || name;
			json.id = json.id || helps.vars.uuid(filename);
			return json;
		});
		helps.vars.set(this.vars, varname, files);
		done && done();
	});

	learn.when(["I save $varname to $file", "I write $varname to $file"], function (name, filename, done) {
        assert(name, "Missing $varname");
        assert(filename, "Missing filename");
		var file = helps.files.root(this, filename);
        helps.files.save(file, JSON.stringify(this.vars[name] || {}));
		debug("file saved: " + file);
		done && done();
	});

    learn.when(["I save $varname to $path $file", "I write $varname to $path $file"], function (name, path, filename, done) {
        assert(name, "Missing $varname");
        assert(path, "Missing $path");
        assert(filename, "Missing filename");
        var root = this.paths[path] || config.paths[path] || helps.vars.get(this.vars, path) || helps.vars.get(this, path);
        var file = helps.files.path(root, filename);
        assert(!helps.files.exists(file), path + " file already exists: " + file);
        var payload = this.vars[name]  || {};
        helps.files.save(file, JSON.stringify(payload));
        debug("saved: %s" , file);
        done && done();
    });

	learn.when(["I delete file $file", "I delete folder $file"], function (filename, done) {
		assert(filename, "Missing filename");
		var file = helps.files.root(this, filename);
		helps.files.rmrf(file);
		done && done();
	});

	learn.when(["I delete $path $file_folder $file"], function (path, type, filename, done) {
		assert(path, "Missing path");
		assert(type, "Missing type (file or folder)");
		assert(filename, "Missing filename");
		var root = this.paths[path] || config.paths[path] || helps.vars.get(this.vars, path) || helps.vars.get(this, path);
		assert(root, "Missing root folder: " + path);
		var file = helps.files.path(root, filename);
		debug("deleting %s -> %s (%s)", type, file, filename);

		helps.files.rmrf(file);
		done && done();
	});

	learn.when(["I mkdir $folder"], function (folder, done) {
		var path = helps.files.root(this, folder);
		mkdirp.sync(path);
		done && done();
	});

	// ***** THEN *****

	learn.then(["file $file exists", "file $file should exist", "file $file must exist"], function (filename, done) {
		var file = helps.files.root(this, filename);
        var file_exists = helps.files.exists(file);
		assert(file_exists, "File " + file + " does not exist")
		done && done();
	});


	learn.then(["$path file $file exists", "$path file $file should exist", "$path file $file must exist"], function (path, filename, done) {
		var root = this.paths[path] || this.paths[path] || helps.vars.get(this.vars, path) || helps.vars.get(this, path);
		assert(root, "Missing root folder: " + path);
		var file = helps.files.path(root, filename);
        var file_exists = helps.files.exists(file);

		assert(file_exists, path + " file does not exist: " + file);
		assert(!helps.files.isDirectory(file), path + " filename is a folder: " + file);

		done && done();
	});


	learn.then(["file $file doesn't exist", "file $file does not exist",
        "folder $file doesn't exist", "folder $file does not exist"], function (filename, done) {

		var file = helps.files.root(this, filename);
		try {
			var stat = fs.statSync(file);
			assert(!stat, "File " + file + " exist")
		} catch (e) {
			debug("file not found: " + file);
			done && done();
		}
	});

	learn.then(["folder $file exists", "folder $file should exist"], function (filename, done) {
		var file = helps.files.root(this, filename);
        var file_exists = helps.files.exists(file);
        debug("folder exists?: %s == %s", file, file_exists);

		assert(file_exists, "Folder does not exist: " + file);
		assert(helps.files.isDirectory(file), "File is not folder: " + file);
		done && done();
	});


	learn.then(["folder $file should not exist", "$file folder should not exist"], function (filename, done) {
		var file = helps.files.root(this, filename);

		assert(!helps.files.exists(file), "Folder exists: " + file);
		debug("Folder does not exist: " + file);
		done && done();
	});

	learn.then(["$name $type $file exists", "$name $type $file should exist"], function (name, type, filename, done) {
		var root = this.paths[name] || config.paths[name] || helps.vars.get(this.vars, name) || helps.vars.get(this, name);
		assert(root, "Missing root folder: " + name);
		var file = helps.files.path(root, filename);

		assert(helps.files.exists(file), "File does not exist: " + file);
		if (type == "folder") {
			assert(helps.files.isDirectory(file), "File is not folder: " + file);
			debug("Folder '%s' exists: %s", name, file);
		}
		done && done();
	});

	learn.then(["file $file is not empty"], function (filename, done) {
		var file = helps.files.root(this, filename);
		assert(helps.files.exists(file), "File does not exist: " + file);
		assert(helps.files.size(file) > 0, "File is empty: " + file);
		done && done();
	});


	learn.then("file $file should contain $expression", function (filename, expression, done) {
		var file = helps.files.root(this, filename);
		assert(helps.files.exists(file), "File does not exist: " + file);

		var data = helps.files.load(file);
		var found = new RegExp(expression).test(data);
		assert(found, "File " + file + " does not contain /" + expression + "/");
		done && done();
	});

	learn.then("$name $type $file should contain $expression", function (name, type, filename, expression, done) {
		var root = this.paths[name] || config.paths[name] || helps.vars.get(this.vars, name) || helps.vars.get(this, name);
		assert(root, "Missing root folder: " + name);
		var file = helps.files.path(root, filename);

		assert(helps.files.exists(file), "File does not exist: " + file);

		var data = helps.files.load(file);
		var found = new RegExp(expression).test(data);
		assert(found, "File " + file + " does not contain /" + expression + "/");
		done && done();
	});


	learn.then("file $file should not contain $expression", function (filename, expression, done) {
		var file = helps.files.root(this, filename);
		assert(helps.files.exists(file), "File does not exist: " + file);

		var data = helps.files.load(file);
		var found = new RegExp(expression).test(data);
		assert(!found, "File contains /" + expression + "/");
		done && done();
	});

	learn.then("$name $type $file should not contain $expression", function (name, type, filename, expression, done) {
		var root = this.paths[name] || config.paths[name] || helps.vars.get(this.vars, name) || helps.vars.get(this, name);
		assert(root, "Missing root folder: " + name);
		var file = helps.files.path(root, filename);
		assert(helps.files.exists(file), "File does not exist: " + file);

		var data = helps.files.load(file);
		var found = new RegExp(expression).test(data);
		assert(!found, "File contains /" + expression + "/");
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

	self.annotations = function (dialect, annotations, scope) {}

	debug("understands files & folders - v%s", pkg.version);
	return self;
}
