var net = Npm.require('net');
var future = Npm.require('fibers/future');

var ETX = String.fromCharCode(3);

/**
 * TLS API Interface
 * @constructor
 * @param {String} ip TLS IP Address
 * @param {Number} port TLS Port
 * @param {Array} tankNames Product List
 */
TLS.connect = function TLS(ip, port, tankNames) {
	var fut = new future();

	this.ip = ip;
	this.port = port;

	if (typeof tankNames !== 'undefined') {
		this.tankNames = tankNames;
		fut.return();
	} else {
		this.tankNames = this.getTankNames(fut.return);
	}

	return fut.wait();
};

/**
 * Returns an array of tank names
 * @param  {Array} tanks TLS tanks
 * @param  {Function} [callback] callback function
 */
TLS.connect.prototype.getTankNames = function getTankNames(cb) {
	var res = this.api('200', cb);
  res = TLS.utils.tanks.names(res);
  return res;
};

/**
 * Returns an array of tanks objects
 * @param  {Array} tanks TLS tanks
 * @param  {Function} [callback] callback function
 */
TLS.connect.prototype.getTanks = function getTanks(cb) {
	var t = this.api('i20100', cb);
	return TLS.utils.tanks.extract(t);
};

/**
 * Returns data for the specified tankId
 * @param  {String} tankId TLS tank number
 * @param  {Function} [callback] callback function
 */
TLS.connect.prototype.getTank = function getTank(tankId, cb) {
	this.api('i20100', {id: tankId}, cb);
};

/**
 * Make a function call
 * @param  {String} code TLS function code
 * @param  {Object} [options] Set call options
* @param  {Function} [callback] Function to execute on completion
 */
TLS.connect.prototype.api = function api(command, options, callback) {
  var fut = new future();
  var responseString = '';
  var _tls = this;

	if (typeof options === 'function' && !callback) {
		callback = options;
		options = undefined;
	}

  command = String.fromCharCode(1) + command;

  var client = net.connect(_tls.port, _tls.ip, function() {
    console.log(_tls.ip + ' connected (' + command + ')');
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
		setTimeout(function() {
			typeof callback === 'function' && callback();
		}, 100);
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
