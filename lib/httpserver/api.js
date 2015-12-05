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

    if (!req.body.hasOwnProperty('ident')) {
        data.status = "KO";
        data.errors.push("Create variable needs a ident attribute")
        res.send(data);
    }
    else {
        variables.create({ident : req.body.ident}, function(err) {
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

    if (!req.body.hasOwnProperty('ident')) {
        data.status = "KO";
        data.errors.push("Set meta data variable needs a ident attribute")
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
    var create = false;

    // test attributes
    //
    if (!req.body.hasOwnProperty('ident')) {
        data.status = "KO";
        data.errors.push("Add value to variable needs a ident attribute")
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
    // create if not exists
    //
    if (req.body.hasOwnProperty('create')) {
        create = true;
    }
    // Do the job
    //
    if (data.status === "OK") {
        var err = variables.add_value(req.body.ident, d, req.body.value, create);
        if (err) {
            data.status = "KO";
            data.errors.push(err)
        }
    }
    res.send(data);
};
// --------------------------------------------------------------------
// Flush variable cache
//
exports.flush = function(req, res, next) {
	debug("api.set_meta");
    debug("   body ", req.body);
    var data = {status : "OK",
                errors  : []
               };

    variables.flush(function(err) {
        if (err) {
            data.status = "KO";
            data.errors.push(err)
        }
        res.send(data);
    });
};
// --------------------------------------------------------------------
// Get values of variable 
//
exports.get_values = function(req, res, next) {
	debug("api.get_values for " + req.query.ident);
    var data = { status : "OK",
                errors  : []
               };

    var start_date;
    var end_date;
    if (req.query.hasOwnProperty('start_date')) {
        start_date = req.query.start_date;
    }
    if (req.query.hasOwnProperty('end_date')) {
        start_date = req.query.end_date;
    }
    variables.get_values(req.query.ident, start_date, end_date, function(err, values) {
	    debug("===> return  form get_values");
	    debug("      err = " + err);
	    //debug("      values = ", values);
        if (err) {
            data.status = "KO";
            data.errors.push(err)
        }
        else {
            data.values = values;
        }
        res.send(data);
    });
};
// --------------------------------------------------------------------
// Get last_value of variable 
//
exports.get_last_value = function(req, res, next) {
	debug("api.get_last_value for " + req.query.ident);
    var data = { status : "OK",
                errors  : []
               };

    variables.get_last_value(req.query.ident, function(err, value) {
	    debug("===> return  form get_last_value");
        if (err) {
            data.status = "KO";
            data.errors.push(err)
        }
        else {
            data.value = value;
        }
        res.send(data);
    });
};
// --------------------------------------------------------------------
// Call a module interface to write values
//
exports.set_module = function(req, res, next) {
    debug("api.set_module");
    debug("name = ", req.body.name);
    var data = {status : "OK",
                errors  : []
               };
    mod = require("../modules/"+req.params.name+".js");
    if (!mod) {
        errors.push("pages/error", {message : "No module found with name = " + req.body.name + "."});
    }
    else {
        var err = mod.set_value({action : req.body.action, params : JSON.parse(req.body.params)});

        if (err) {
            data.status = "KO";
            data.errors.push(err);
        }
    }
    res.send(data);
}
