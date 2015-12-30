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

var screens = [];
var idx_screens = {};
// ====================================================================
// Private functions
// ====================================================================
function refresh_idx() {
    screens.forEach(function(item, num) {
        idx_screens[item.ident] = num;
    });
}
// ====================================================================
// Public functions
// ====================================================================
// Initialize screens
//
exports.initialize = function(params, cb) {
	debug("screens.initialize");

    flush_interval = params.flush_interval || 30;

	debug(" flush_interval = " + flush_interval);

    screens = storage.read_screens();
    refresh_idx();

    cb(null);
};
// --------------------------------------------------------------------
// Get list of screens
//
exports.get_list = function() {
	debug("graphs.get_list");

    debug("screens = ", screens);

    return screens;
};
// --------------------------------------------------------------------
// Get screen
//
exports.get_screen = function(ident) {
	debug("screens.get_screen");

    if (idx_screens.hasOwnProperty(ident)) { 
        return screens[idx_screens[ident]];
    }
    return null;
};
