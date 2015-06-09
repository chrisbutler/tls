var net = Npm.require('net');
var future = Npm.require('fibers/future');

var ETX = String.fromCharCode(3);

/**
 * TLS API Interface
 * @constructor
 * @param {string} ip TLS IP Address
 * @param {number} port TLS Port
 */
tls.connect = function tls(ip, port) {
	this.ip = ip;
	this.port = port;
};

/**
 * Returns an array of tanks objects
 * @param  {Array} tanks TLS tanks
 */
tls.connect.prototype.getTankNames = function getTankNames() {
	var res = this.api('200');
  res = tls.utils.tanks.names(res);
  return res;
};

/**
 * Returns an array of tanks objects
 * @param  {Array} tanks TLS tanks
 */
tls.connect.prototype.getTanks = function getTanks() {
	return tls.utils.tanks.extract(this.api('i20100'));
};

/**
 * Returns data for the specified tankId
 * @param  {String} tankId TLS tank number
 * @param  {Function} callback function(error, tank)
 */
tls.connect.prototype.getTank = function getTank(tankId) {
	this.api('i20100', {id: tankId});
};

/**
 * Make a function call
 * @param  {String} code TLS function code
 * @param  {Object} [options] Set call options
 */
tls.connect.prototype.api = function api(command, options) {
  var fut = new future();
  var responseString = '';
  var _tls = this;

  command = String.fromCharCode(1) + command;

  var client = net.connect(_tls.port, _tls.ip, function() {
    console.log(_tls.ip + ' connected');
    client.write(command);
  });

  client.setEncoding('ascii');
  client.setTimeout(2000);

  client.on('readable', function() {
    var chunk;
    while (null !== (chunk = client.read())) {
      var s = chunk.toString();
      if (s.indexOf(ETX) != -1) {
        client.end();
        fut.return(responseString);
        break;
      } else {
        responseString += s;
      }
    }
  });

  client.on('end', function() {
    console.log(_tls.ip + ' disconnected');
  });

  client.on('timeout', function() {
    console.log(_tls.ip + ' timeout');
    client.end();
  });

  client.on('error', function(err) {
    fut.return(err);
  });

  return fut.wait();
};
