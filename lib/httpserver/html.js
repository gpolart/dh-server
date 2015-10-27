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

var debug  = require('debug')('html');
var variables = require('../variables.js');


// --------------------------------------------------------------------
// Index page
//
exports.index = function(req, res, next) {
    res.render("pages/index");
}
// --------------------------------------------------------------------
// Display variables 
//
exports.variables = function(req, res, next) {
    debug("html.variables");
    var data = variables.get_list();
    debug("data = ", data);
    res.render("pages/variables", {data : data });
}
