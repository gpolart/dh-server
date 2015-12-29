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

var debug  = require('debug')('server');
var httpserver  = require('./lib/httpserver/httpserver.js');
var logger  = require('./lib/logger.js');
var storage  = require('./lib/storage.js');
var variables  = require('./lib/variables.js');
var screens  = require('./lib/screens.js');
var graphs  = require('./lib/graphs.js');
var async  = require('async');

//
// Complement prototypes for system libs
//
Date.prototype.formatISO = function(fl_hour, fl_utc) {
	function zeroPad(n) {
		return (n < 10 ? '0' : '') + n;
	}

	var c;
	if (fl_utc === true) {
		c = this.getUTCFullYear() + '-' + zeroPad(this.getUTCMonth() + 1) + '-' + zeroPad(this.getUTCDate());
		if (fl_hour) {
			c += ' ' + zeroPad(this.getUTCHours()) + ':' + zeroPad(this.getUTCMinutes()) + ':' + zeroPad(this.getUTCSeconds());
		}
	}
	else {
		c = this.getFullYear() + '-' + zeroPad(this.getMonth() + 1) + '-' + zeroPad(this.getDate());
		if (fl_hour) {
			c += ' ' + zeroPad(this.getHours()) + ':' + zeroPad(this.getMinutes()) + ':' + zeroPad(this.getSeconds());
		}
	}

	return c;
}

//=========================================================================================
// Utilities to stop process correctly
//-----------------------------------------------------------------------------------------
function exitHandler(options, err) {
	debug("exitHandler   options : ", options);
    // TODO flush variable cache
    variables.flush(function(err) {
        if (err) {
            console.log( "exitHandler flush variables error : " + err);
        }
	    if (options.exit) process.exit();
    });
}
//catches ctrl+c event
process.on('SIGINT', exitHandler.bind(null, {exit:true}));

//=========================================================================================
// Main server initialize
//-----------------------------------------------------------------------------------------
// TODO Print an error message if config.js not present
//
var config  = require('./config.js');
debug("config  : ", config);

var funcs = [
    function(cb) {
        logger.start(config.logger, function(err) {
            var res = "logger OK";
            if (err !== null) {
                debug("cb start logger err  : ", err);
                res = "logger KO";
            }
            cb(err, res);
        });
    },
    function(cb) {
        storage.initialize(config.storage, function(err) {
            var res = "storage OK";
            if (err !== null) {
                debug("cb initialize storage err  : ", err);
                res = "storage KO";
            }
            cb(err, res);
        });
    },
    function(cb) {
        variables.initialize(config.variables, function(err) {
            var res = "variables OK";
            if (err !== null) {
                debug("cb initialize variables err  : ", err);
                res = "variables KO";
            }
            cb(err, res);
        });
    },
    function(cb) {
        screens.initialize({}, function(err) {
            var res = "screens OK";
            if (err !== null) {
                debug("cb initialize screens err  : ", err);
                res = "screens KO";
            }
            cb(err, res);
        });
    },
    function(cb) {
        graphs.initialize({}, function(err) {
            var res = "graphs OK";
            if (err !== null) {
                debug("cb initialize graphs err  : ", err);
                res = "graphs KO";
            }
            cb(err, res);
        });
    }
];
// Add initialization function for modules
//
config.modules.forEach(function(item) {
    funcs.push(function(cb) {
        mod = require('./lib/modules/'+item.name+'.js');
        mod.initialize(item.params, cb);
    });
});
// Start all
//
async.series(funcs, function(err, results) {
    debug("results = ", results);
    if (err !== null) {
	    process.exit();
    }
    else {
        httpserver.start(config.http_port, config.http_public_path);
    }
});
