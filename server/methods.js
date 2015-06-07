net = Npm.require('net');
Future = Npm.require('fibers/future');

Meteor.methods({
  '/tls/getTanks': function(ip, port) {
    var fut = new Future();
    var cmd = String.fromCharCode(1) + "i20100";
    var responseString = '';

    var client = net.connect(port, ip, function() {
      console.log(ip + ' connected');
      client.write(cmd);
    });

    client.on('readable', function() {
      var chunk;
      while (null !== (chunk = client.read())) {
        var s = chunk.toString();
        responseString += s;
        if (s == '&') {
          client.end();
          //FIXME refactor with options’
          fut.return(tls.tanks.extract(responseString));
        }
      }
    });

    client.on('end', function() {
      console.log(ip + ' connected');
    });

    client.on('error', function(err) {
      fut.return(err);
    });

    return fut.wait();
  },
  '/tls/getTankNames': function(ip, port) {
    return;
  }
});
