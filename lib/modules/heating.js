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

var debug   = require('debug')('heating');
var storage = require('../storage.js');
var logger = require('../logger.js');
var variables = require('../variables.js');

var config;

var zones = {};
// ====================================================================
// Private functions
// ====================================================================
function emit_hbeat() {
	debug("heating.emit_hbeat");

    // TODO ???
}
// --------------------------------------------------------------------
// Chang setpoint event callback
// --------------------------------------------------------------------
function change_setpoint(ident, t, v) {
	debug("heating.change_setpoint_value");
	debug("   at " + t);
	debug("value " + v);

    // TODO stop or start heating
}
// --------------------------------------------------------------------
// Temp measure received for a zone
// --------------------------------------------------------------------
function verify_action(ident, t, v, data) {
	debug("heating.verify_action for " + ident);
	debug("   at " + t);
	debug("value " + v);
	debug("data ", data);

    if (zones.hasOwnProperty(ident)) {
	    debug(" ==> setpoint = " + zones[ident].setpoint);
        var setpoint = variables.get_variable(zones[ident].setpoint);
        var value = setpoint.meta.last_value;
	    debug(" ==> setpoint value = ", value);

        if (zones[ident].actual === "off") {
            if (v < value - 0.5) {
                variables.add_value(zones[ident].action, new Date(), "on", true);
                zones[ident].actual = "on"; // TODO better to get change from variable change ?
            }
            else {
	            debug("    === no change for off");
            }
        }
        else if (zones[ident].actual === "on") {
            if (v > value + 0.5) {
                variables.add_value(zones[ident].action, new Date(), "off", true);
                zones[ident].actual = "off";
            }
            else {
	            debug("    === no change for on");
            }
        }
        else {
	        debug("    === no change");
        }
    }
    else {
        log_message("heating.verify_action : receive action for " + ident + " but no zone known with this variable");
    }
}

// ----------------------------------------------------------------------------------------
// Log messages as a variable
// ----------------------------------------------------------------------------------------
function log_message(msg) {
    debug("log_message ... ");

    variables.add_values("heating.logs", new Date(), msg, true);
}

// ====================================================================
// Public functions
// ====================================================================
// Initialize module
//
exports.initialize = function(params, cb) {
    cb(null, "heating OK");
    config = storage.read_heating_conf();
    debug("config = ", config);

    if (!config.hasOwnProperty('heartbeat')) {
        config.heartbeat = 5; // minutes
    }


  	setInterval(emit_hbeat, config.heartbeat * 60000);
	emit_hbeat();

    if (config.hasOwnProperty('setpoint')) {
        var err = variables.add_callback(config.setpoint, change_setpoint);
        if (err) {
            debug(" variable setpoint error", err);
            logger.log("heating.initialize error : ", err);
        }
    }


    config.zones.forEach(function(item) {
        debug(" zone name " + item.name);
        if (item.hasOwnProperty('measure')) {
            // TODO verify variable is numeric
            var err = variables.add_callback(item.measure, verify_action, {zone : item.name });
            if (err) {
                debug(" variable measure zone " + item.name + " error", err);
                logger.log("heating.initialize variable measure zone " + item.name + " error : ", err);
            }

            zones[item.measure] = { setpoint : config.setpoint,
                                    actual : "off",
                                    action : item.action };
        }

    });
}
// --------------------------------------------------------------------
//  Read config values for IHM
// --------------------------------------------------------------------
exports.get_config = function() {
    debug("heating.get_config");

    return config;
}
// --------------------------------------------------------------------
//  Set a value for configuration
// --------------------------------------------------------------------
exports.set_value = function(params) {
    debug("heating.set_value params = ", params);

    if (!params.hasOwnProperty('action')) {
        return "heating.set_value must have an action parameter";
    }

    if (params.action === 'add_zone') {
        config.zones.push( { name : params.params.name,
                             tied : true
                           });
    }
    else {
        return "heating.set_value unknown action " + params.action;
    }

    var err = storage.write_heating_conf(config);
    return err;
}
