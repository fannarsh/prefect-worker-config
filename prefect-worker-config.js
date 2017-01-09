'use strict';

var url = require('url');
var cluster = require('cluster');
var bunyan = require('bunyan');
var deck = require('deck');

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

function getURL (service, path) {
  var record = deck.pick(config[service] || []);
  if (!record || !record.host) {
    log.warn(new Error('Didn\'t find a record for ' + service));
    return;
  }

  var uo = url.parse('http://' + record.host + ':' + record.port);
  if (path) uo.pathname = path;
  return url.format(uo);
}

config.log = log;
config.getURL = getURL;
module.exports = config;
