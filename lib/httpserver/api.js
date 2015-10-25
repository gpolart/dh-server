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

var debug  = require('debug')('api');
var variables = require('../variables.js');

// --------------------------------------------------------------------
// Create variable
//
exports.create = function(req, res, next) {
	debug("api.create");
    debug("   body ", req.body);
    var data = {status : "OK",
                errors  : []
               };

    if (!req.body.hasOwnProperty('name')) {
        data.status = "KO";
        data.errors.push("Create variable needs a name attribute")
        res.send(data);
    }
    else {
        variables.create({name : req.body.name}, function(err) {
            if (err) {
                data.status = "KO";
                data.errors.push(err)
            }
            res.send(data);
        });
    }
};
// --------------------------------------------------------------------
// Set meta data value 
//
exports.set_meta = function(req, res, next) {
	debug("api.set_meta");
    debug("   body ", req.body);
    var data = {status : "OK",
                errors  : []
               };

    if (!req.body.hasOwnProperty('name')) {
        data.status = "KO";
        data.errors.push("Set meta data variable needs a name attribute")
        res.send(data);
    }
    else {
        // TODO just do it
            res.send(data);
    }
};
// --------------------------------------------------------------------
// Add value to variable 
//
exports.add_value = function(req, res, next) {
	debug("api.add_value");
    debug("   body ", req.body);
    var data = { status : "OK", errors  : [] };
    var d;

    // test attributes
    //
    if (!req.body.hasOwnProperty('name')) {
        data.status = "KO";
        data.errors.push("Add value to variable needs a name attribute")
    }
    if (!req.body.hasOwnProperty('value')) {
        data.status = "KO";
        data.errors.push("Add value to variable needs a value attribute")
    }
    // decode date
    //
    if (req.body.hasOwnProperty('timestamp')) {
        d = new Date(req.body.timestamp);
        if (!d) {
            data.status = "KO";
            data.errors.push("Timestamp bad formatting")
        }
    }
    else {
        d = new Date(); // default to now();
    }
    //
    //
    if (data.status === "OK") {
        var err = variables.add_value(req.body.name, d, req.body.value);
        if (err) {
            data.status = "KO";
            data.errors.push(err)
        }
    }
    res.send(data);
};

