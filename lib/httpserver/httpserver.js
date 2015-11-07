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
//
var debug = require('debug')('httpserver');
var events = require('events');
var express = require('express');
var bodyParser = require('body-parser');
var path = require('path');
var logger = require('../logger.js');


var api = require('./api.js');
var html = require('./html.js');

var app = express();

function logErrors(err, req, res, next) {
  console.error(err.stack);
  next(err);
}

// Start server
//
exports.start = function(port, public_path) {
	debug("httpserver.start dir name", __dirname);
    // TODO comment and understand this piece of code :-)
    app.use(bodyParser.urlencoded({ extended: true }));
    app.use(bodyParser.json());
    app.use(logErrors);

    var router = express.Router();
    app.use(function(req, res, next) {
      res.header("Access-Control-Allow-Origin", "*");
      res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
      next();
    });
    app.set('view engine', 'ejs');
    //app.use(express.static(path.join(__dirname + '../../public')));
    app.use(express.static(public_path));

    // Defines routes for application
    //
    router.get('/', html.index);
    router.get('/variables', html.variables);
    router.get('/variable/:ident', html.edit_var);
    router.post('/variable', html.write_var);
    
    router.get('/module/:name', html.display_module);
    router.post('/module/:name', api.set_module);

    //router.get('/', function(req, res) {
     //  res.render("pages/index");
    //});
    // Variables stuff
    //
    router.post('/api/create', api.create);
    router.post('/api/set_meta', api.set_meta);
    router.post('/api/add_value', api.add_value);
    router.get('/api/get_values', api.get_values);
    router.post('/api/flush', api.flush);

    app.use(router);

    app.listen(port);
    logger.log("HTTP server started");
}

