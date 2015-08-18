var net = Npm.require('net');
var future = Npm.require('fibers/future');

var SOH = String.fromCharCode(1);
var ETX = String.fromCharCode(3);

var MAX_RETRIES = 3;

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
	this.offset = 0;

	this.retryInterval = {};

	if (typeof tankNames === 'undefined' || tankNames.length === 0) {
		this.tankNames = this.getTankNames(function() { fut.return() });
	} else {
		this.tankNames = tankNames;
		fut.return();
	}

	return fut.wait();
}

/**
 * Returns an array of tank names
 * @param  {Array} tanks TLS tanks
 * @param  {Function} [callback] callback function
 */
TLS.connect.prototype.getTankNames = function getTankNames(cb) {
	var res = this.api('200', cb);
	this.offset = TLS.utils.time.offset(res);
  res = TLS.utils.tanks.names(res);
  return res;
}

/**
 * Returns an array of tanks objects
 * @param  {Array} tanks TLS tanks
 * @param  {Function} [callback] callback function
 */
TLS.connect.prototype.getTanks = function getTanks(cb) {
	var res = this.api('i20100', cb);
	this.offset = TLS.utils.time.offset(res);
	res = TLS.utils.tanks.extract(res, this.tankNames);
	return res;
}

/**
 * Send TLS API request
 * @param  {String} command TLS function code
* @param  {Function} [completed] Connection close callback
 */
TLS.connect.prototype.request = function setup(command, completed) {
	var fut	= new future(),
		timer = new Date(),
		_tls 	= this;

	command = SOH + command;
	var responseString = '';

	var c = net.connect(_tls.port, _tls.ip);
	c.setEncoding('ascii');
	c.setTimeout(2000);

	c.on('connect', function() {
		console.log(_tls.ip + ' connected (' + command + ')');
		clearInterval(_tls.retryInterval);
		this.write(command);
	});

	c.on('error', function(err) {
		if (err.code == 'ECONNREFUSED') {
			console.log(_tls.ip + ' retrying (' + err.code + ')');
		} else {
			console.log(_tls.ip + ' error (' + err + ')');
			fut.throw(err);
		}
	});

	c.on('readable', function() {
		var chunk;
		while (null !== (chunk = c.read())) {
			var s = chunk.toString();
			if (s.indexOf(SOH) != -1) {
				s = s.substr(1);
			}
			if (s.indexOf(ETX) != -1) {
				c.end();
				break;
			} else {
				if (s != 'undefined') {
					responseString += s;
				}
			}
		}
	});

	c.on('close', function(hadError) {
		console.log(_tls.ip + ' closed ([' + c.bytesRead + '] err: ' + hadError + ')');
		if (c.bytesRead > 0 && responseString.length > 0) {
			fut.return(responseString);
			typeof completed === 'function' && completed();
		} else {
			fut.return(false);
		}
	});

	c.on('end', function() {
		console.log(_tls.ip + ' disconnected (' + (new Date() - timer) + 'ms)');
	});

	return fut.wait();
}

/**
 * Process TLS command
 * @param  {String} command TLS function code
 * @param  {Object} [options] Set call options
* @param  {Function} [callback] Function to execute on completion
 */
TLS.connect.prototype.api = function api(command, options, callback) {
	var response = new future(),
					_tls = this,
			 retries = 0;

	if (typeof options === 'function' && !callback) {
		callback = options;
		options = undefined;
	}

	var request = _tls.request(command);

	if (!request) {
		_tls.retryInterval = Meteor.setInterval(function() {
			request = _tls.request(command, function() {
				Meteor.clearInterval(_tls.retryInterval);

				typeof callback === 'function' && callback();
				response.return(request);
			});

			if (retries >= MAX_RETRIES) {
				Meteor.clearInterval(_tls.retryInterval);
				retries = 0;
			}

			retries++;
		}, 1000);
	} else {
		typeof callback === 'function' && callback();
		response.return(request);
	}

  return response.wait();
};
