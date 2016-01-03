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
var async = require('async');
var fs = require('fs');
var child = require('child_process');
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
        //debug("ident = " + item);
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


    //debug("data = ", data);
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
            d = item.t.toISOString().substring(0, 10);
            if (!days.hasOwnProperty(d)) {
                days[d] = "";
            }
            days[d] = days[d] + item.t.getTime() + ":" + item.v + "\n";
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
// --------------------------------------------------------------------
// read variables values 
// --------------------------------------------------------------------
exports.get_variable_values = function(params, cb) {
    debug(" storage.get_variable_values " + params.ident + " from " + params.start + " to " + params.end);

    var dir_path = config.files_dir + "variables/" + params.ident;
	debug(" dir_path = " + dir_path);

    var date = new Date(params.start.getTime());
    var str = "";
    var funcs = [];

    function init_funcs(path) {
        funcs.push(function(callback) {
            fs.exists(path, function(exists) {
                if (exists) {
                    fs.readFile(path, function(err, data) {
                        debug("init err = " + err);
                        //debug("init data = " + data);
                        if (err) {
                            callback(err, null);
                        }
                        else {
                            callback(null, data.toString());
                        }
                    });
                }
                else {
                    debug("no file with path " + path);
                    callback(null, ""); 
                }
            });
        });
    }

    function add2funcs(path) {
        funcs.push(function(arg, callback) {
            debug("path = " + path);
            debug("arg = " + arg);
            fs.exists(path, function(exists) {
                if (exists) {
                    debug("exists ! ");
                    fs.readFile(path, function(err, data) {
                        debug("err = " + err);
                        //debug("data = " + data);
                        if (err) {
                            callback(err, null);
                        }
                        else {
                            callback(null, arg + data);
                        }
                    });
                }
                else {
                    debug("doesn't exist ! ");
                    callback(null, arg); 
                }
            });
        });
    }

    var first = true;
    debug(" date = " + date);
    while  (date <= params.end) {
        var filename = date.formatISO(false, false);
        debug(" filename = " + filename);
        if (first)  {
            init_funcs(dir_path+"/"+filename);
            first = false;
        }
        else {
            add2funcs(dir_path+"/"+filename);
        }
        date.setDate(date.getDate() + 1);
    }
        debug(" funcs = ",  funcs);

    async.waterfall(funcs, function(err, result) {
        debug(" err = " + err);
        debug(" result = " + result);

        // Transform string from file to array of value with key
        //
        if (result.length > 0) {
            var data = { key : params.ident, values: [] };
            var lines = result.split("\n");
            lines.forEach(function(l, num) {
                if (l.length >0) {
                    var items = l.split(":");
                    if (params.type === 'Numeric') {
                        data.values.push({x:1*items[0], y:1.0*items[1]});
                    }
                    else {
                        data.values.push({x:1*items[0], y:items[1]});
                    }
                }
            });
            cb(err, data);
        }
        else {
            cb("No values for date range", null);
        }

    });
}

// ====================================================================
// screens functions
// ====================================================================
// --------------------------------------------------------------------
// Read screen list. Synchronous function
// --------------------------------------------------------------------
exports.read_screens = function() {
    debug(" storage.read_screens");

    var base_path = config.files_dir + "screens";
	debug(" base_path = " + base_path);
    var data = [];

    var dirs = fs.readdirSync(base_path);
    dirs.forEach(function(item) {
        var path = base_path + "/" + item;
        var json = fs.readFileSync(path);
        try {
            var screen = JSON.parse(json);
            data.push(screen);
        }
        catch(e) {
            // TODO log error
	        debug(" syntax error ", e);
            process.exit();
        }
    });

    return data;
};
// ====================================================================
// Graphs functions 
// ====================================================================
// --------------------------------------------------------------------
// read all graphs
// --------------------------------------------------------------------
exports.read_graphs = function() {
    debug(" storage.read_graphs ");

    var base_path = config.files_dir + "graphs";
	debug(" base_path = " + base_path);
    var data = [];

    var dirs = fs.readdirSync(base_path);
    dirs.forEach(function(item) {
	    debug(" item = " + item);
        var path = base_path + "/" + item;
        var gr = yaml.load(path);
        if (gr) {
            data.push(gr);
        }
        else {
            // TODO log error
	        debug(" graph " + item + " null");
        }
    });
    
    return data;
}
// ====================================================================
// modules functions TODO : move that to special storage function for modules
// ====================================================================
// --------------------------------------------------------------------
// read heating config (Synchronous)
// --------------------------------------------------------------------
exports.read_heating_conf = function() {
    debug(" storage.read_heating_conf ");

    var heating;

    var path = config.conf_dir + "heating.yml";
    debug("path = " + path);

    if (fs.existsSync(path)) {
        heating = yaml.load(path);
        debug("yaml load heating = ", heating);
    }
    if (!heating) {
        heating = {};
        heating['zones'] = [];
        heating['mode'] = "Manual";
    }

    return heating;
}
// --------------------------------------------------------------------
// write heating config (Synchronous)
// --------------------------------------------------------------------
exports.write_heating_conf = function(heating) {
    debug(" storage.write_heating_conf ");

    var path = config.conf_dir + "heating.yml";
    debug("path = " + path);
    var str = yaml.stringify(heating);
    debug("yaml str = " + str);

    fs.writeFileSync(path, str);
}

