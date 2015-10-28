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

var debug  = require('debug')('xpl-agent');
var dgram = require('dgram');
var request  = require('request');
var yaml = require('yamljs');
var fs = require('fs');
var config  = require('./config.js');
//
// Sockets to listen on and to send orders
var server = dgram.createSocket('udp4');
var sender = dgram.createSocket('udp4');
var listen_address;
var listen_port;
var hbeat_str;
var hbeat_ip_broadcast;
var message_count = 0;
var config_path = config.storage.conf_dir;

var xpl_config = {};
var sources_idx = {};

//=========================================================================================
// Utilities to stop process correctly
//-----------------------------------------------------------------------------------------
function exitHandler(options, err) {
	debug("exitHandler   options : ", options);
	server.close();
	sender.close();
	if (options.exit) process.exit();
}
//catches ctrl+c event
process.on('SIGINT', exitHandler.bind(null, {exit:true}));
// ---------------------------------------------------------------------------
// emit_hbeat
// ---------------------------------------------------------------------------
function emit_hbeat() {
	debug("xpl.emit_hbeat");
	var msg = new Buffer(hbeat_str);
	debug("buffer length = " + msg.length);
	sender.send(msg, 0, msg.length, 3865, hbeat_ip_broadcast, function () {
		debug("message sent arguments = ", arguments);
	});
	log_message("emit hbeat");

    record_variable("xpl.messages", message_count);
    message_count = 0;
}
// ---------------------------------------------------------------------------
// decode_message
// ---------------------------------------------------------------------------
function decode_message(str) {
	debug("xpl.decode_message --------------------------");
	var xpl_msg = { time : new Date(),
					type: "",
					header : {},
                    source : "",
					mess: "",
					body : {},
					str : str.trim() };
    var re = /([^{]*){([^}]*)}([^{]*){([^}]*)}/;
    var res = re.exec(xpl_msg.str);
	//debug("     res = ", res);
    if (!res || res.length !== 5) {
	    debug("     bad message = ", res);
        return null;
    }
    xpl_msg.type = res[1].trim();
    xpl_msg.mess = res[3].trim();
    // header
    var lines = res[2].trim().split("\n");
    //debug("     lines = ", lines);
	lines.forEach(function(li, num) {
       elems = li.split("=");
       // debug("elms[0] " + elems[0] + "  elems[1] " + elems[1]);
       xpl_msg.header[elems[0]] = elems[1];
       if (elems[0] === "source") {
           xpl_msg.source = elems[1];
        }
    });
    // body
    lines = res[4].trim().split("\n");
	//debug("     items = ", items);
	lines.forEach(function(li, num) {
		elems = li.split("=");
		// debug("elms[0] " + elems[0] + "  elems[1] " + elems[1]);
		xpl_msg.body[elems[0]] = elems[1];
    });
	return xpl_msg;
} // end of decode_message
// ---------------------------------------------------------------------------
// process_message
// Classify xpl messages from type and generate standard application messages
// ---------------------------------------------------------------------------
function process_message(xpl_msg) {
	debug("process_message ....");
    // Test source
    //
    if (!sources_idx.hasOwnProperty(xpl_msg.source)) {
    //if (!xpl_config.sources.hasOwnProperty(xpl_msg.source)) {
        log_message("Source <"+xpl_msg.source+"> unknown for " + xpl_msg.str);
        sources_idx[xpl_msg.source] = { ident : xpl_msg.source,
                                               ignore : true };
        //storage.store_driver_config('xpl', xpl_config);
    }

    var src = sources_idx[xpl_msg.source];
    if (src.ignore) {
        debug("Source <"+xpl_msg.source+"> ignored");
        return;
    }

    var var_name = [];
    var_name.push(xpl_msg.source);
    //var type; // TODO usable ?
    var value;
    var process = false;

    // sensor.basic
	if ( (xpl_msg.mess === 'sensor.basic') && ( (xpl_msg.type === 'xpl-trig') || (xpl_msg.type === 'xpl-stat') ) ) {
        var_name.push(xpl_msg.body['device']);
        var_name.push(xpl_msg.body['type']);
		value =  xpl_msg.body['current'];
        process = true;
	}
	else if ( (xpl_msg.mess === 'ac.basic') && ( (xpl_msg.type === 'xpl-trig') || (xpl_msg.type === 'xpl-cmnd') ) ) {
        var_name.push(xpl_msg.body['address']);
        var_name.push(xpl_msg.body['unit']);
		value =  xpl_msg.body['command'];
        process = true;
    }
    // x10.security
	else if ( (xpl_msg.mess === 'x10.security') ) {
		var_name.push(xpl_msg.body['device']);
		//type =  xpl_msg.body['type'];
		value =  xpl_msg.body['command'];
        process = true;
	}
    // x10.basic
	else if ( (xpl_msg.mess === 'x10.basic') && (xpl_msg.type === 'xpl-trig') ) {
        var_name.push(xpl_msg.body['device']);
		//type = 'x10.basic';
		value =  xpl_msg.body['command'];
        process = true;
    }
    // Heartbeat from source
	else if ( ( (xpl_msg.mess === 'hbeat.app') || (xpl_msg.mess === 'hbeat.basic') ) && (xpl_msg.type === 'xpl-stat') ) {
		debug("Seen source <"+xpl_msg.header['source']+" from remote-ip <"+xpl_msg.body['remote-ip']+">");
	}
    // Unknown messages
	else if ( (xpl_msg.mess === 'log.basic') && (xpl_msg.type === 'xpl-trig') ) {
        if (xpl_msg.body['text'] === 'unknown sensor') {
            if (src.log_unknown) {
                log_message("Source <"+xpl_msg.source+"> unknown sensor : " + xpl_msg.str);
            }
		}
		else {
            log_message("Source <"+xpl_msg.source+">  unknown message : " + xpl_msg.str);
		}
	}
    // message not interpreted, just log it
    else {
        log_message("Source <"+xpl_msg.source+">  unknown message : " + xpl_msg.str);
    }

    // Search if variable is configured 
    //
	debug("var_name ", var_name);
    if (process) {
        var key = var_name.join(".");
        var ident = key.replace(/ /g, "_");
        if (xpl_config.ignore.hasOwnProperty(ident)) {
	        debug("found ident  " + ident + " for key " + key);
        }
        else if (xpl_config.keys.hasOwnProperty(ident)) {
	        debug("found ident  " + ident + " for key " + key);
            record_variable("xpl." + ident, value);
        }
        else {
	        debug("not found ident  " + ident + " for key " + key);
            if (!xpl_config.unknown.hasOwnProperty(ident)) {
                xpl_config.unknown[ident] = { name : "", key : key };
                store_config();
                record_variable("xpl.discovery", ident);
            }
        }
    }
} // end of process_message
// ---------------------------------------------------------------------------
// record variable
// ---------------------------------------------------------------------------
function record_variable(ident, value) {
	debug("record_variable ....");
    var headers = {
        'User-Agent' :    'xpl-agent',
        'Content-Type' : 'application/x-www-form-urlencoded'
    };

    var options = {
        url : 'http://localhost:8888/api/add_value',
        method : 'POST',
        headers : headers,
        form : {'ident' : ident, 'value' : value, create : 'yes' }
    }

    request(options, function(err, resp, body) {
        debug("err = " + err);
        debug("body = " + body);
        // TODO test return of request
    });
}
// ----------------------------------------------------------------------------------------
// Read variables configuration
// ----------------------------------------------------------------------------------------
function read_config () {
    debug("read_config ... ");

    var path = config_path + "xpl-agent.yml";
    debug("path = " + path);

    if (fs.existsSync(path)) {
        xpl_config = yaml.load(path);
        debug("yaml load xpl_config = ", xpl_config);

        if (xpl_config['keys'] === null) {
            xpl_config['keys'] = {};
        }
        if (xpl_config['unknown'] === null) {
            xpl_config['unknown'] = {};
        }
        if (xpl_config['ignore'] === null) {
            xpl_config['ignore'] = {};
        }
    }
    else {
        xpl_config = {};
        xpl_config['keys'] = {};
        xpl_config['unknown'] = {};
        xpl_config['ignore'] = {};
    }
}
// ----------------------------------------------------------------------------------------
// Store variables configuration
// ----------------------------------------------------------------------------------------
function store_config () {
    debug("store_config ... ");
    var str = yaml.stringify(xpl_config);
    debug("yaml str = " + str);

    fs.writeFileSync(config_path + "xpl-agent.yml", str);

}
// ----------------------------------------------------------------------------------------
// Log messages as a variable
// ----------------------------------------------------------------------------------------
function log_message(msg) {
    debug("log_message ... ");

    record_variable("xpl.logs", msg);
}

//=========================================================================================
// Main server initialize
//-----------------------------------------------------------------------------------------
function start(options) {
	debug("========  xpl-agent starting ==========");
	log_message(" xpl-agent starting ...");

	server.on('listening', function () {
		var address = server.address();
		debug('XPL driver listening on ' + address.address + ":" + address.port);
        listen_address = address.address;
        listen_port = address.port;
		debug('listen_address = ' + listen_address + ' listen_port = ' + listen_port)
	});

	server.on('message', function (message, remote) {
		debug("==>  from : " + remote.address + ':' + remote.port);
		debug("     message = " + message);
        //TODO verify source
        message_count += 1;
		var str =  message.toString();
		debug("     str = " + str);
		var xpl_msg = decode_message(str);
		debug("xpl_msg = ", xpl_msg);
		process_message(xpl_msg);
	});

	// XPL heartbeat
	//
    function prepare_heartbeat() {
	    var addr = sender.address();
	    debug('sender is binded on ' + addr.address + ":" + addr.port);
        //params.sender_address = addr.address;
        //params.sender_port = addr.port;
	    hbeat_ip_broadcast = options.ip_broadcast;
	    hbeat_str = "xpl-stat\n{\nhop=1\nsource="+options.source_name+"\ntarget=*\n}\n";
	    hbeat_str += "hbeat.app\n{\ninterval="+options.hbeat_interval+"\nport="+addr.port+"\nremote-ip="+options.ip_address+"\n}\n";
	    debug("hbeat_str = " + hbeat_str);
        //params.hbeat = str;
		debug('hbeat_str = ', hbeat_str)
		debug('hbeat_ip_broadcast = ', hbeat_ip_broadcast)
		setInterval(emit_hbeat, options.hbeat_interval * 60000);
		emit_hbeat();
    }
    //
    // Get configuration from file system
    //
    read_config();
	debug('xpl_config = ', xpl_config);

    //
    // Prepare sources informations and index
    //
    message_count = 0;
    options.sources.forEach(function(item, num) {
        // TODO read config file for source
        sources_idx[item.name] = { name   : item.name,
                                   ignore : item.ignore,
                                   log_unknown : true,
                                   process_all : true
                                 };
    });
	debug('sources_idx = ', sources_idx)
    //
    // Start servers
    //
    server.bind(options.port);
    sender.bind(0, options.ip_address, function() {
        debug("after sender.bind arguments = ", arguments);
        sender.setBroadcast(true);
        prepare_heartbeat();
    });
}

start(config.xpl);
