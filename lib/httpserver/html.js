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
// --------------------------------------------------------------------
// Edit variable 
//
exports.edit_var = function(req, res, next) {
    debug("html.edit_var");
    debug("name = ", req.params.ident);
    var types = ['Text', 'Numeric'];
    var groups = ['System', 'Temperature', 'Room 1'];
    var data = variables.get_variable(req.params.ident);
    if (!data) {
        res.render("pages/error", {message : "No variable found with ident = " + req.params.ident + "."});
    }
    else {
        res.render("pages/variable", {variable : data, types :types, groups:groups} );
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
    debug("name = ", req.params.name);
    mod = require("../modules/"+req.params.name+".js");
    if (!mod) {
        res.render("pages/error", {message : "No module found with name = " + req.params.name + "."});
    }
    else {
        var config = mod.get_config();
        debug("config = ", config);
        var var_list = variables.get_list();
        var persons = [{ id: 1, name : "Florence"}, { id: 2, name : "Gilles"}, { id: 3, name : "Mélanie"} ];
        res.render("pages/"+req.params.name, {heating : config, variables:var_list, persons:persons });
    }
}
