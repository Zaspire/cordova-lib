/*
 *
 * Copyright 2013 Canonical Ltd.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 *
*/

/* jshint node:true, bitwise:true, undef:true, trailing:true, quotmark:true,
          indent:4, unused:vars, latedef:nofunc,
          sub:true
*/

var fs            = require('fs'),
    path          = require('path'),
    util          = require('../util'),
    shell         = require('shelljs'),
    Q             = require('q'),
    Parser        = require('./parser'),
    os            = require('os'),
    ConfigParser  = require('../../configparser/ConfigParser');

function ubuntu_parser(project) {

    // Call the base class constructor
    Parser.call(this, 'ubuntu', project);

    this.path = project;
    this.config = new ConfigParser(this.config_xml());
}

function sanitize(str) {
    return str.replace(/\n/g, ' ').replace(/^\s+|\s+$/g, '');
}

require('util').inherits(ubuntu_parser, Parser);

module.exports = ubuntu_parser;

ubuntu_parser.prototype.update_from_config = function(config) {
    if (config instanceof ConfigParser) {
    } else {
        return Q.reject(new Error('update_from_config requires a ConfigParser object'));
    }

    this.config = new ConfigParser(this.config_xml());
    this.config.setName(config.name());
    this.config.setVersion(config.version());
    this.config.setPackageName(config.packageName());
    this.config.setDescription(config.description());

    this.config.write();

    return Q();
};

ubuntu_parser.prototype.cordovajs_path = function(libDir) {
    var jsPath = path.join(libDir, 'www', 'cordova.js');
    return path.resolve(jsPath);
};

ubuntu_parser.prototype.config_xml = function(){
    return path.join(this.path, 'config.xml');
};

ubuntu_parser.prototype.www_dir = function() {
    return path.join(this.path, 'www');
};

ubuntu_parser.prototype.update_www = function() {
    var projectRoot = util.isCordova(this.path);
    var www = util.projectWww(projectRoot);

    shell.rm('-rf', this.www_dir());
    shell.cp('-rf', www, this.path);
};

ubuntu_parser.prototype.update_overrides = function() {
    var projectRoot = util.isCordova(this.path);
    var mergesPath = path.join(util.appDir(projectRoot), 'merges', 'ubuntu');
    if(fs.existsSync(mergesPath)) {
        var overrides = path.join(mergesPath, '*');
        shell.cp('-rf', overrides, this.www_dir());
    }
};

// Returns a promise.
ubuntu_parser.prototype.update_project = function(cfg) {
    var self = this;

    return this.update_from_config(cfg).then(function() {
        self.update_overrides();
        util.deleteSvnFolders(self.www_dir());
    });
};
