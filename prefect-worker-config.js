'use strict';

var cluster = require('cluster');
var bunyan = require('bunyan');

var args = process.argv.slice(2);
var config = args[0];
if (!config || config === 'undefined') throw new Error('Missing config!');

config = JSON.parse(config);

// todo : we could move the log creation out to the service init file.
//        and/or use a modified consule.log object or pico as default.
var log = bunyan.createLogger({
  name: config.name,
  version: config.version,
  worker: cluster.isWorker ? cluster.worker.id : 'unknown',
  level: config.log_level
});
config.log = log;
module.exports = config;
