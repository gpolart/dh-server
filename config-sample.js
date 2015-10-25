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




//
module.exports = config;

