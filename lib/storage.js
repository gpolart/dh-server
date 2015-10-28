// =====================================================================
// Copyright Gilles Polart-Donat 2015
//
// Domohub is free software: you can redistribute it and/or modify
//    it under the terms of the GNU General Public License as published by
//    the Free Software Foundation, either version 3 of the License, or
//    (at your option) any later version.
//
//    Domohub is distributed in the hope that it will be useful,
//    but WITHOUT ANY WARRANTY; without even the implied warranty of
//    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
//    GNU General Public License for more details.
//    You should have received a copy of the GNU General Public License
//    along with Domohub.  If not, see <http://www.gnu.org/licenses/>.
// ======================================================================
//
// This module implement storage level for application. It proposes functions
// to access configuration and to store values.
// ======================================================================
//
var debug = require('debug')('storage');
var yaml = require('yamljs');
var fs = require('fs');
var config = require('../config.js');

var config;

function mkdirpSync(path){
    var items = path.split("/");
    var p = "";
    items.forEach(function(item) {
        if (item.length > 0) {
            p = p + "/" + item;
            if (!fs.existsSync(p)) {
                fs.mkdirSync(p);
            }
        }
    });
}
// --------------------------------------------------------------------
// Initialize
// --------------------------------------------------------------------
exports.initialize = function(params, cb) {
    debug(" storage.initialize");
    debug("   params  = ", params);
    // TODO nothing to do for the moment
    //
    config = params;
    cb(null);
};
// ====================================================================
// variables functions
// ====================================================================
// --------------------------------------------------------------------
// Read variables list. Synchronous function
// --------------------------------------------------------------------
exports.read_variables = function() {
    debug(" storage.read_variables");

    var base_path = config.files_dir + "variables";
	debug(" base_path = " + base_path);
    var data =  {};

    var dirs = fs.readdirSync(base_path);
    dirs.forEach(function(item) {
        debug("ident = " + item);
        var path = base_path + "/" + item + "/metadata.yml";
        var meta;
        if (fs.existsSync(path)) {
            meta = yaml.load(path);
        }
        if (!meta) {
            meta = {};
        }
        if (!meta.hasOwnProperty('last_seen')) {
            meta.last_seen = "";
        }
        if (!meta.hasOwnProperty('last_value')) {
            meta.last_value = "";
        }

        // TODO change to false
        data[item] = { ident : item, to_write : false, data : [], meta : meta };
    });


    return data;
};
// --------------------------------------------------------------------
// Create variable. Synchronous function
// --------------------------------------------------------------------
exports.write_variable = function(variable, cb) {
    debug(" storage.write_variable " + variable.ident);

    var dir_path = config.files_dir + "variables/" + variable.ident;
	debug(" dir_path = " + dir_path);

    // function to write values
    function write_values(fcb) {
	    debug(" write_values ", variable.data);
        var days = {};
        // prepare job with a sort by day
        var item;
        var d;
        while (item = variable.data.shift()) {
	        debug(" item ", item);
            d = item.t.substring(0, 10);
            if (!days.hasOwnProperty(d)) {
                days[d] = "";
            }
            days[d] = days[d] + item.t + ":" + item.v + "\n";
        }
	    debug(" days ", days);
        for (var k in days) {
            fs.appendFileSync(dir_path + "/" + k, days[k]);
        }
        fcb(null);
    }
    // function to write meta data
    function write_meta(fcb) {
	    debug(" write_meta ", variable.meta);
        var str = yaml.stringify(variable.meta);
        fs.writeFile(dir_path+"/metadata.yml", str, function(err) {
            if (err) {
                logger.log("Error writing meta data in variable : " + dir_path + "  error = " + err);
                fcb(err);
            }
            else {
                write_values(fcb);
            }
        });
    }

    // Test if exist or create it
    fs.exists(dir_path, function(exist) {
        if (!exist) {
	        debug(dir_path + " doesn't exists, must be created");
            fs.mkdir(dir_path, function(err) {
                if (err) {
                    logger.log("Error creatind directory for variable : " + dir_path + "  error = " + err);
                    cb(err);
                 }
                 else {
                    write_meta(cb);
                }
            });
        }
        else {
	        debug(dir_path + " exists so do the job");
            write_meta(cb);
        }
    });
};
