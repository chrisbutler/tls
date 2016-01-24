var net = Npm.require('net');
var future = Npm.require('fibers/future');

var log = new Logger('tls:api');

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
	log.debug('tls connect', ip, port);

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
	if (res) {
		this.offset = TLS.utils.time.offset(res);
  	res = TLS.utils.tanks.names(res);
	}
  return res;
}

/**
 * Returns an array of tanks objects
 * @param  {Array} tanks TLS tanks
 * @param  {Function} [callback] callback function
 */
TLS.connect.prototype.getTanks = function getTanks(cb) {
	var res = this.api('i20100', cb);
	if (res) {
		this.offset = TLS.utils.time.offset(res);
		res = TLS.utils.tanks.extract(res, this.tankNames);
	}
	return res;
}

/**
 * Send TLS API request
 * @param  {String} command TLS function code
* @param  {Function} [completed] Connection close callback
 */
TLS.connect.prototype.request = function setup(command, completed) {
	log.debug('tls request', command);

	var fut	= new future(),
		timer = new Date(),
		_tls 	= this,
		errorHandled = false;

	command = SOH + command;
	var responseString = '';

	var c = net.connect(_tls.port, _tls.ip);
	c.setEncoding('ascii');
	c.setTimeout(2000);

	c.on('connect', function() {
		log.info(_tls.ip + ' connected (' + command + ')');
		clearInterval(_tls.retryInterval);
		this.write(command);
	});

	c.on('error', function(err) {
		if (err.code == 'ECONNREFUSED') {
			log.info(_tls.ip + ' retrying (' + err.code + ')');
			errorHandled = true;
			setTimeout(function() {
				fut.return(false);
			}, 2000);
		} else if (err.code == 'ENETUNREACH') {
			log.info(_tls.ip + ' unreachable (' + err.code + ')');
		} else {
			log.info(_tls.ip + ' error (' + err + ')');
			errorHandled = true;
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
		log.info(_tls.ip + ' closed ([' + c.bytesRead + '] err: ' + hadError + ') (' + (new Date() - timer) + 'ms)');
		if (!hadError && c.bytesRead > 0 && responseString.length > 0) {
			fut.return(responseString);
			typeof completed === 'function' && completed();
		} else if (!errorHandled) {
			fut.return(false);
		}
	});

	c.on('end', function() {
		log.info(_tls.ip + ' disconnected (' + (new Date() - timer) + 'ms)');
	});

	c.on('timeout', function() {
		log.info(_tls.ip + ' timeout (' + (new Date() - timer) + 'ms)');
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
	log.debug('tls api', command);

	var response = new future(),
					_tls = this,
			 retries = 1,
			 success = false;

	if (typeof options === 'function' && !callback) {
		callback = options;
		options = undefined;
	}

	do {
		var request = _tls.request(command);
		if (request) {
			typeof callback === 'function' && callback();
			response.return(request);
			success = true;
			break;
		} else {
			retries++;
		}
	} while (retries <= MAX_RETRIES);

	if (!success) {
		response.return(false);
	}

  return response.wait();
};
