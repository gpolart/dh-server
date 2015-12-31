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
var async = require('async');

var variables = {};
var flush_interval;
var flush_running = false;
// ====================================================================
// Private functions
// ====================================================================
// flush_cache
//
function flush_cache(cb) {
	debug("flush_cache");
    //debug("   variables = ", variables);
    if (flush_running) {
        logger.log("A flush of variables id already running. Try to augment flush_interval.");
        return;
    }
    flush_running = true;
    // TODO is it good for flush date or use async and set at end ?
    var funcs = [];

    function add_to_funcs(key) {
        funcs.push(function(cb) {
                debug(" key = " + key);
                storage.write_variable(variables[key], function(err) {
                debug(" err = " + err);
                if (err) {
                    logger.log("Error while writing variable " + key + " : " + err);
                }
                else {
                    debug("  succesfully writed");
                    variables[key].to_write = false;
                }
                cb(err, key);
            });
        });
    }

    for (var key in variables) {
        if (variables.hasOwnProperty(key)) {  // to eliminate all other herited properties
            debug("verify " + key  );
            if (variables[key].to_write) {
                debug("  need to write ");
                add_to_funcs(key);
            }
        }
    }

    async.series(funcs, function(err, results) {
        debug(" async cb results = ", results);
        //debug(" after variables = ", variables);
        flush_running = false;
        if (cb) {
            cb(err);
        }
    });
}
// ====================================================================
// Public functions
// ====================================================================
// Initialize variables
// Set an interval to write variables on storage based on flush_running
//
exports.initialize = function(params, cb) {
	debug("variables.initialize");

    flush_interval = params.flush_interval || 30;

	debug(" flush_interval = " + flush_interval);

    variables = storage.read_variables();

    for (var key in variables) {
	    debug(" key = " + key);
        if (variables.hasOwnProperty(key)) {  // to eliminate all other herited properties
            variables[key].callbacks = [];
        }
    }

    setInterval(flush_cache, flush_interval * 1000);

    cb(null);
};
// --------------------------------------------------------------------
// Flush variables cache
//
exports.flush = function(cb) {
	debug("variables.flush");

    flush_cache(function(err) {
        cb(err);
    });

};
// --------------------------------------------------------------------
// Create variable
//
exports.create = function(params, cb) {
	debug("variables.create");
    debug("   params ", params);

    // TODO verify ident (letters, numbers, - and _ separate by dots (.)
    if (variables.hasOwnProperty(params.ident)) {
        cb("Error : the variable " + params.ident + "already exists");
    }
    else {
        variables[params.ident] = {  to_write : true,
                                    ident : params.ident,
                                    meta : params.meta || {},
                                    data : [],
                                    callbacks : []
                                  };
        cb(null);
    }

};
// --------------------------------------------------------------------
// Add a value
//
exports.add_value = function(ident, t, v, create) {
	debug("variables.add_value");

    if (!variables.hasOwnProperty(ident)) {
        if (create) {
            variables[ident] = {  to_write : true,
                                    ident : ident,
                                    meta : {},
                                    data : [],
                                    callbacks : []
                                  };
        }
        else {
            return "Error : the variable " + ident + "doesn't exist";
        }
    }
    variables[ident].meta.last_seen = t.toISOString();
    variables[ident].meta.last_value = v;
    variables[ident].to_write = true;
    variables[ident].data.push({ t : t, v : v});

    // Process event on variable change
    //
    variables[ident].callbacks.forEach(function(item) {
	    debug("call for callback for ident " + ident);
        item.cb(ident, t, v, item.data);
    });
    return null;
};
// --------------------------------------------------------------------
// Add a callback to variable
//
exports.add_callback = function(ident, cb, data) {
	debug("variables.add_callback for " + ident);
    if (!variables.hasOwnProperty(ident)) {
        return "Error : the variable " + ident + "doesn't exist";
    }

    variables[ident].callbacks.push( {cb : cb, data : data });
	debug(" .... done");

    return null;
}
// --------------------------------------------------------------------
// Set metadata values
//
exports.set_meta = function(ident, meta) {
	debug("variables.set_meta");

    if (!variables.hasOwnProperty(ident)) {
        return "Error : the variable " + ident + "doesn't exist";
    }
    variables[ident].meta.name = meta.name || '';
    variables[ident].meta.unit = meta.unit || '';
    variables[ident].meta.type = meta.type;
    variables[ident].to_write = true;

    return null;
};
// --------------------------------------------------------------------
// Get list of variables
//
exports.get_list = function() {
	debug("variables.get_list");

    var data = [];

    for (var key in variables) {
        if (variables.hasOwnProperty(key)) {  // to eliminate all other herited properties
            data.push(variables[key]);
        }
    }

    return data;
};
// --------------------------------------------------------------------
// Get variable
//
exports.get_variable = function(ident) {
	debug("variables.get_variable ident " + ident);

	//debug("variables ", variables);
    if (variables.hasOwnProperty(ident)) { 
        return variables[ident];
    }

    return null;
};
// --------------------------------------------------------------------
// Get variable values
//
exports.get_values = function(ident, start_date, end_date, cb) {
	debug("variables.get_values");

    if (!variables.hasOwnProperty(ident)) { 
        cb("Error : the variable " + ident + "doesn't exist", null);
    }
    else {
        if (!start_date) {
            start_date = new Date();
        }
        if (!end_date) {
            end_date = new Date();
        }
        if (start_date > end_date) {
            cb("Error : the start_date is older than end_date", null);
        }
        else {
            storage.get_variable_values(ident, start_date, end_date, cb);
        }
    }
};
// --------------------------------------------------------------------
// Get last_value
//
exports.get_last_value = function(ident, cb) {
	debug("variables.get_last_value");

    if (!variables.hasOwnProperty(ident)) { 
        cb("Error : the variable " + ident + "doesn't exist", null);
    }
    else {
        cb(null, variables[ident].meta.last_value);
    }
};
