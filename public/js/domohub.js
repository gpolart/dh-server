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

var app = app || {};

$(document).ready(function() {
  console.log("document main");

  // TODO get parameters
  var base_url = "";

  var Router = Backbone.Router.extend({
    routes : {
        'screen/:name': 'load_screen',
        'variable/:driver/:name': 'load_variable',
        '*other': 'defaultRoute'
    },
    initialize : function() {
        console.log("initialize");
    },
    load_screen : function(name) {
        console.log("load_screen");
        load_screen(name);
    },
    load_variable : function(name) {
        console.log("load_variable");
        load_variable(name);
    },

    defaultRoute : function() {
        console.log("defaultRoute");
        load_screen("index");
    }
  });

  // Load variable
  //
  function load_variable(n) {
    var $cont = $('#main-body');

    $.ajax({
      url:"/var_data",
      data: {name : n},
      dataType:"json"
    }).done(function(data) {
      console.log("get var_data response");
      console.dir(data);
    }).fail(function() {
      // TODO display error
      console.log("get var_data fail");
      console.dir(arguments);
    });
  }

  // Load screen
  //
  function load_screen(n) {
    var $cont = $('#main-body');
    var name = n || 'index';

    $.ajax({
      url:"/screen_data",
      data: {name : name},
      dataType:"json"
    }).done(function(data) {
      console.log("get screen response");
      draw_screen($cont, data);
    }).fail(function() {
      // TODO display error
      console.log("get screen fail");
      console.dir(arguments);
    });
  }

  // draw_screen
  //
  function draw_screen($cont, screen) {
      console.log("draw_screen");
      $cont.empty();
      $('<h1>'+screen.name+'</h1>').appendTo($cont);
      $.each(screen.widgets, function(num, item) {
        draw_widget($cont, item);
      });
  }

  // draw_widget
  //
  function draw_widget($cont, widget) {
      console.log("draw_widget");
      var $widget = $('<div class="widget"></div>').appendTo($cont);
      if (widget.ident === "menu") {
        draw_menu($widget, base_url, widget.content);
      }
      else if (widget.ident === "link") {
        draw_link($widget, widget.screen, widget.text);
      }
      else if (widget.ident === "variables") {
        draw_variables($widget, base_url);
      }
      else if (widget.ident === "error") {
        draw_error($widget, widget.messages);
      }
      else {
        console.log("unknwon widget ident");
      }
  }

  app.router = new Router();

  Backbone.history.start();
});
