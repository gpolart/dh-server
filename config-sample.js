//
// This file must be copied in config.js and variables should be set to correct values for your env.
//

var config = {};

config.http_port = 8888;
config.interval  = 60000;

config.logger = { type       : 'file',
                  filename   : __dirname + '/public/log/server.log',
                  no_console : false
                 };

config.storage = {
                    files_dir : __dirname + '/files/',
                    conf_dir  : __dirname + '/confs/'
                 };

config.variables = {
                    flush_interval : 30         // given in seconds
                 };


config.xpl = {
                port           : 3865,
                ip_address     : "192.168.1.10",
                ip_broadcast   : "192.168.1.255",
                source_name    : "domohub-xpl-driver",
                hbeat_interval : 5,    // in minutes
                sources : [
                        {
                            name : "rfxcom-lan.xxxxxxxxxxxx"
                        },
                        {
                            name : "eedomus-xpl.xxxxxxxxxxxx"
                        }
                ]
             };

//
module.exports = config;

