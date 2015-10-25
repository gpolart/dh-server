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
// This module implement log system for messages.
// ======================================================================
//
var debug = require('debug')('logger');
var winston = require('winston');

// --------------------------------------------------------------------
// Initialize log system
//
exports.start = function(params, cb) {
	debug("logger.start");
    if (params.type === 'file') {
        winston.add(winston.transports.File, { filename: params.filename });
    }
    else {
        cb("Log type unknown");
        return;
    }
    if (params.no_console) {
        winston.remove(winston.transports.Console);
    }
    cb(null);
};
// --------------------------------------------------------------------
// log message
//
exports.log = function(message) {
	debug("log message" + message);
    var date = new Date();
    winston.log('info', '['+date.toISOString()+'] '+message);
};
