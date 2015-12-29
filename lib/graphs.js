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

var debug   = require('debug')('graphs');
var logger = require('./logger.js');
var storage = require('./storage.js');
var async = require('async');

var graphs = [];
var idx_graphs = {};
// ====================================================================
// Private functions
// ====================================================================
function refresh_idx() {
    graphs.forEach(function(item, num) {
        idx_graphs[item.ident] = num;
    });
}
// ====================================================================
// Public functions
// ====================================================================
// Initialize graphs
//
exports.initialize = function(params, cb) {
	debug("graphs.initialize");

    graphs = storage.read_graphs();
    refresh_idx();
    cb(null);
};
// --------------------------------------------------------------------
// Get list of graphs
//
exports.get_list = function() {
	debug("graphs.get_list");

    debug("graphs = ", graphs);

    return graphs;
};
// --------------------------------------------------------------------
// Create a new empty graph graph
//
exports.create = function(name) {
	debug("graphs.create");

    var now = new Date();
    var gr = { ident: 'GR' + now.getTime(),
                  name : name
                 };
    graphs.push(gr);
    refresh_idx();
    return gr;
};
// --------------------------------------------------------------------
// Get graph
//
exports.get = function(ident) {
	debug("graphs.get_graph");

    if (idx_graphs.hasOwnProperty(ident)) {
        return graphs[idx_graphs[ident]];
    }
    return null;
};
