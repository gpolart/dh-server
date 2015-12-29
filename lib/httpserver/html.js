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
var screens = require('../screens.js');
var graphs = require('../graphs.js');


// ====================================================================
// Private functions
// ====================================================================
// --------------------------------------------------------------------
// Construct data for header display
//
function get_header_data() {
    // TODO get values from modules
    var data = { modules : [ {ident : "heating", label : "Heating"} ],
                 screens : [ {ident : "example", label : "Example"} ],
                 graphs : []
            };

    graphs.get_list().forEach(function(item, num) {
        data.graphs.push({ident : item.ident, label: item.name });
    });
    debug("header data = ", data);
    return data;
}
// ====================================================================
// Public functions
// ====================================================================
// --------------------------------------------------------------------
// Variables
// --------------------------------------------------------------------
// Index page
//
exports.index = function(req, res, next) {
    var header = get_header_data();
    res.render("pages/index", {header : header});
}
// --------------------------------------------------------------------
// Display variables 
//
exports.variables = function(req, res, next) {
    debug("html.variables");
    var data = variables.get_list();
    var header = get_header_data();
    debug("data = ", data);
    res.render("pages/variables", {header : header, data : data });
}
// --------------------------------------------------------------------
// Edit variable 
//
exports.edit_var = function(req, res, next) {
    debug("html.edit_var");
    debug("name = ", req.params.ident);
    var header = get_header_data();
    var types = ['Text', 'Numeric'];
    var groups = ['System', 'Temperature', 'Room 1'];
    var data = variables.get_variable(req.params.ident);
    if (!data) {
        res.render("pages/error", {message : "No variable found with ident = " + req.params.ident + "."});
    }
    else {
        res.render("pages/variable", {header : header, variable : data, types :types, groups:groups} );
    }
}
// --------------------------------------------------------------------
// Write variable 
//
exports.write_var = function(req, res, next) {
    debug("html.write_var");
    debug("body", req.body);
    var ident = req.body.ident;
    var meta = { name : req.body.name,
                 unit : req.body.unit,
                 type : req.body.type
               };
    var data = {status : "OK",
                errors  : []
               };

    var err = variables.set_meta(ident, meta);

    if (err) {
        data.status = "KO";
        data.errors.push(err);
    }
    res.send(data);
}
// --------------------------------------------------------------------
// Call a module interface to get values
//
exports.display_module = function(req, res, next) {
    debug("html.display_module");
    debug("ident = ", req.params.ident);
    var header = get_header_data();
    mod = require("../modules/"+req.params.ident+".js");
    if (!mod) {
        res.render("pages/error", {message : "No module found with ident = " + req.params.ident + "."});
    }
    else {
        var config = mod.get_config();
        debug("config = ", config);
        var var_list = variables.get_list();
        // TODO get it from config or data
        var persons = [{ id: 1, name : "Florence"}, { id: 2, name : "Gilles"}, { id: 3, name : "Mélanie"} ];
        res.render("pages/"+req.params.name, {header:header, heating : config, variables:var_list, persons:persons });
    }
}
// --------------------------------------------------------------------
// Screens
// --------------------------------------------------------------------
// --------------------------------------------------------------------
// Get informations to display a screen
//
exports.display_screen = function(req, res, next) {
    debug("html.display_screen");
    debug("ident = ", req.params.ident);
    var header = get_header_data();
    debug("header = ", header);
    var data = screens.get_screen(req.params.ident);
    debug("data = ", data);
    if (!data) {
        res.render("pages/error", {header:header, message : "No screen found with ident = " + req.params.ident + "."});
    }
    else {
        res.render("pages/screen", {header : header, screen : data } );
    }
}
// --------------------------------------------------------------------
// Graphs
// --------------------------------------------------------------------
// --------------------------------------------------------------------
// Create a new empty graph
//
exports.create_graph = function(req, res, next) {
    debug("html.create_graph");
    debug("body", req.body);
    var name = req.body.name;
    var data = graphs.create(name);
    // Display page for graph
    var header = get_header_data();
    debug("header = ", header);
    if (!data) {
        res.render("pages/error", {header:header, message : "Cannot create graph with name = " + name + "."});
    }
    else {
        res.render("pages/graph", {header : header, graph : data } );
    }
}
// --------------------------------------------------------------------
// Display a graph
//
exports.display_graph = function(req, res, next) {
    debug("html.display_graph");
    debug("ident = ", req.params.ident);
    var data = graphs.get(req.params.ident);
    var header = get_header_data();
    debug("header = ", header);
    if (!data) {
        res.render("pages/error", {header:header, message : "Cannot get graph with ident = " + req.params.ident + "."});
    }
    else {
        res.render("pages/graph", {header : header, graph : data } );
    }
}
