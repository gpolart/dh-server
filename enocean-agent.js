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

var debug  = require('debug')('enocean-agent');
var enocean  = require('node-enocean')();
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
        'User-Agent' :    'enocean-agent',
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
// ----------------------------------------------------------------------------------------
// Log messages as a variable
// ----------------------------------------------------------------------------------------
function log_message(msg) {
    debug("log_message ... ");

    record_variable("enocean.logs", msg);
}
//=========================================================================================
// Main server initialize
//-----------------------------------------------------------------------------------------
function start(options) {
	debug("========  enocean-agent starting ==========");
	log_message(" enocean-agent starting ...");

    debug("options = ", options);
    enocean.listen(options.device);

    enocean.on("data", function(data) {
        debug("data = ", data);
        record_variable("enocean."+data.senderId+"."+data.packetTypeString, data.raw)
    });

}

start(config.enocean);
