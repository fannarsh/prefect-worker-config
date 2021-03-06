'use strict';

var os = require('os');
var url = require('url');
var cluster = require('cluster');
var pino = require('pino');
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

var logger = pino({
  name: config.name,
  level: config.log_level || 'info'
});
var log = logger.child({
  version: config.version,
  worker: cluster.isWorker ? cluster.worker.id : 'unknown'
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
  return [config.name, 'v' + config.version, config.environment, shortId(), process.pid].join('_');
}

function shortId () {
  return os.hostname().substring(0, 8);
}

config.log = log;
config.getURL = getURL;
config.clientId = clientId;
module.exports = config;
