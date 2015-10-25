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

var debug   = require('debug')('variables');
var logger = require('./logger.js');
var storage = require('./storage.js');

var variables = {};
var last_flush_date;
var flush_interval;
var flush_running = false;
// --------------------------------------------------------------------
// flush_cache
// --------------------------------------------------------------------
function flush_cache() {
	debug("flush_cache");
    debug("   variables = ", variables);
    if (flush_running) {
        logger.log("A flush of variables id already running. Try to augment flush_interval.");
        return;
    }
    flush_running = true;
    // TODO is it good for flush date or use async and set at end ?
    var flush_date = new Date();
    for (var key in variables) {
        if (variables.hasOwnProperty(key)) {
            debug("verify ", variables[key]);
            if (variables[key].to_write) {
                debug("  need to write ");
                storage.write_variable(variables[key], function(err) {
                    if (!err) {
                        variables[key].to_write = false;
                    }
                });
            }
        }
    }
    last_flush_date = new Date();
    flush_running = false;
}
// --------------------------------------------------------------------
// Initialize variables
// Set an interval to write variables on storage based on last_flush_date
//
exports.initialize = function(params, cb) {
	debug("variables.initialize");

    flush_interval = params.flush_interval || 30;

	debug(" flush_interval = " + flush_interval);

    variables = storage.read_variables();

    setInterval(flush_cache, flush_interval * 1000);

    cb(null);
};
// --------------------------------------------------------------------
// Create variable
//
exports.create = function(params, cb) {
	debug("variables.create");
    debug("   params ", params);

    // TODO verify name (letters, numbers, - and _ separate by dots (.)
    if (variables.hasOwnProperty(params.name)) {
        cb("Error : the variable " + params.name + "already exists");
    }
    else {
        variables[params.name] = {  to_write : true,
                                    name : params.name,
                                    meta : params.meta || {},
                                    data : []
                                  };
        cb(null);
    }

};
// --------------------------------------------------------------------
// Add a value
//
exports.add_value = function(name, t, v) {
	debug("variables.add_value");

    if (!variables.hasOwnProperty(name)) {
        return "Error : the variable " + name + "doesn't exist";
    }
    variables[name].meta.last_seen = t.toISOString();
    variables[name].meta.last_value = v;
    variables[name].to_write = true;
    variables[name].data.push({ t : t.toISOString(), v : v});

    // TODO
    // Test if there is a dependance and throw calculus
    //
    return null;
};
