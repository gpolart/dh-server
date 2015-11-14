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

var debug   = require('debug')('screens');
var logger = require('./logger.js');
var storage = require('./storage.js');
var async = require('async');

var screens = {};
// ====================================================================
// Private functions
// ====================================================================
// ====================================================================
// Public functions
// ====================================================================
// Initialize screens
// Set an interval to write screens on storage based on flush_running
//
exports.initialize = function(params, cb) {
	debug("screens.initialize");

    flush_interval = params.flush_interval || 30;

	debug(" flush_interval = " + flush_interval);

    screens = storage.read_screens();

    cb(null);
};
// --------------------------------------------------------------------
// Get variable
//
exports.get_screen = function(ident) {
	debug("screens.get_screen");

    //if (screens.hasOwnProperty(ident)) { 
        var screen = { label : "Example",
                       rows : [
                                 { cols : [
                                            { slots : 4, widget : 'simple', params : { variable : 'xpl.rfxcom-lan.0004a3154160.elec2_0x832.power' } },
                                            { slots : 4, widget : 'simple', params : { variable : 'xpl.rfxcom-lan.0004a3154160.th1_0x3701.temp' } },
                                            { slots : 4, widget : 'simple', params : { variable : 'xpl.rfxcom-lan.0004a3154160.th1_0xb102.humidity' } }
                                          ]
                                 }
                              ]
                     };
        return screen;
    //}

    return null;
};
