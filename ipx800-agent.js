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

var debug  = require('debug')('ipx800-agent');
var request  = require('request');
var fs = require('fs');
var config  = require('./config.js');
var async  = require('async.js');
//
var read_active = false;
//=========================================================================================
// Utilities to stop process correctly
//-----------------------------------------------------------------------------------------
function exitHandler(options, err) {
	debug("exitHandler   options : ", options);
	if (options.exit) process.exit();
}
//catches ctrl+c event
process.on('SIGINT', exitHandler.bind(null, {exit:true}));
// ---------------------------------------------------------------------------
// record variable
// ---------------------------------------------------------------------------
function record_variable(ident, value) {
	debug("record_variable .... ident = ", ident);
	debug("record_variable .... value = ", value);

    var headers = {
        'User-Agent' :    'ipx800-agent',
        'Content-Type' : 'application/x-www-form-urlencoded'
    };

    var options = {
        url : 'http://localhost:8888/api/add_value',
        method : 'POST',
        headers : headers,
        form : {'ident' : ident, 'value' : value, create : 'yes' }
    }

    request(options, function(err, resp, body) {
        debug("err = " + err);
        debug("body = " + body);
        // TODO test return of request
    });
}
// ---------------------------------------------------------------------------
// Get values from IPX 800 API
// ---------------------------------------------------------------------------
function get_values(cmd, channels, cb) {
	debug("get_values");

    if (read_active) {
        log_message("get_values still running");
    }

    read_active = true;

    var headers = {
        'User-Agent' :    'ipx800-agent',
        'Content-Type' : 'application/json'
    };

    var options = {
        url : 'http://'+config.ipx800.ip_address+'/api/xdevices.json?cmd='+cmd,
        method : 'GET',
        headers : headers
    }
    debug("options ", options);



    request(options, function(err, resp, body) {
        if (err) {
            cb(err, null);
        }
        else {
            var data = JSON.parse(body);
            var list = [];
            channels.forEach(function(item, num) {
                list.push({ label : item.key+"."+item.label, value : data[item.key] });
            });
            cb(null, list);
        }
    });
}
// ----------------------------------------------------------------------------------------
// Log messages as a variable
// ----------------------------------------------------------------------------------------
function log_message(msg) {
    debug("log_message ... ");

    record_variable("ipx800.logs", msg);
}
// ----------------------------------------------------------------------------------------
// Process polling for values
// ----------------------------------------------------------------------------------------

function process_polling() {
	debug("process_polling");

    if (read_active) {
        log_message("get_values still running");
    }

    read_active = true;
    var funcs = [];
    if (config.ipx800.inputs.length > 0) {
        funcs.push(function(cb) {
            get_values('10', config.ipx800.inputs, cb);
        });
    }
    if (config.ipx800.outputs.length > 0) {
        funcs.push(function(cb) {
            get_values('20', config.ipx800.outputs, cb);
        });
    }
    if (config.ipx800.analogs.length > 0) {
        funcs.push(function(cb) {
            get_values('30', config.ipx800.analogs, cb);
        });
    }
    if (config.ipx800.counters.length > 0) {
        funcs.push(function(cb) {
            get_values('40', config.ipx800.counters, cb);
        });
    }

    async.series(funcs, function(err, results) {
        debug("results = ", results);
        if (err !== null) {
            results.forEach(function(block, num) {
                block.forEach(function(item, num) {
                    var ident = config.ipx800.var_prefix + item['label'];
                    record_variable(ident, item['value']);
                });
            });
        }
        else {
            read_active = false;
        }
    });
}
//=========================================================================================
// Main server initialize
//-----------------------------------------------------------------------------------------
function start(options) {
	debug("========  ipx800-agent starting ==========");
	log_message(" ipx800-agent starting ...");

    setInterval(process_polling, config.ipx800.poll_interval * 1000);
}

start(config.ipx800);
