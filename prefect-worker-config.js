'use strict';

var os = require('os');
var url = require('url');
var cluster = require('cluster');
var bunyan = require('bunyan');
var deck = require('deck');
var exitHook = require('exit-hook');

var args = process.argv.slice(2);
var config = args[0];
if (!config || config === 'undefined') throw new Error('Missing config!');

config = JSON.parse(config);

process.on('message', function(msg) {
  if (msg.type === 'config' && msg.config) config = msg.config;
});

// Responds to the cluster disconnect signal/event from the master process
exitHook(function (next) { next(); });

// todo : we could move the log creation out to the service init file.
//        and/or use a modified consule.log object or pico as default.
var log = bunyan.createLogger({
  name: config.name,
  version: config.version,
  worker: cluster.isWorker ? cluster.worker.id : 'unknown',
  level: config.log_level,
  serializers: bunyan.stdSerializers
});

function getURL (service, path, query) {
  var record = deck.pick(config[service] || []);
  if (!record || !record.host) {
    log.warn(new Error('Didn\'t find a record for ' + service));
    return;
  }

  var scheme = 'http';
  if (record.port === 443) scheme = 'https';
  var uo = url.parse(scheme + '://' + record.host + ':' + record.port);
  if (path) {
    if (Array.isArray(path)) path = path.join('/');
    uo.pathname = path;
  }
  if (query) {
    uo.query = query;
  }
  return url.format(uo);
}

function clientId () {
  return [config.name, 'v' + config.version, config.environment, process.pid, os.hostname()].join('_');
}

config.log = log;
config.getURL = getURL;
config.clientId = clientId;
module.exports = config;
