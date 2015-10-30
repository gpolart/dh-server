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

// ====================================================================
// Private functions
// ====================================================================
// ====================================================================
// Public functions
// ====================================================================
// Initialize module
//
exports.initialize = function(params, cb) {
    cb(null, "heating OK");
    var config = storage.read_heating_conf();
}
// --------------------------------------------------------------------
// 
// --------------------------------------------------------------------
