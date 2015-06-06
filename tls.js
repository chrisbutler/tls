tls = {
  labels: {
    headings: {
      default: ['#', 'PRODUCT', 'GAL', 'ULL', 'IN', 'W', '&deg;F'],
      full: ['Number', 'Product', 'Gallons', 'Ullage', 'Inches', 'Water', 'Temperature (&deg;F)'],
      meta: ['id', 'product', 'gallons', 'tcgallons', 'ullage', 'inches', 'water', 'temp']
    }
  },
  parse: {
    IEEE: function(num) {
      if (num == 0) return 0;

      num = '0x' + num;

      var sign = (num & 0x80000000) ? -1 : 1;
      var exponent = ((num >> 23) & 0xff) - 127;
      var mantissa = 1 + ((num & 0x7fffff) / 0x7fffff);

      return sign * mantissa * Math.pow(2, exponent);
    },
    int: function(num) {
      return (tls.parse.IEEE(num)).toFixed(0);
    }
  },
  tanks: {
    extract: function(responseString) {
      responseString = responseString.substring(16);

      var pattern = /(\d{2})(.{1})(\d{4})07(.{56})&?&?/g;
      var values = [];
      var tank = 0;

      responseString.replace(pattern, function(m, g1, g2, g3, g4) {

        console.log('replace', m, '\n', g1, '\n', g2, '\n', g3, '\n', g4);

        var matches = {};
        matches.id = g1;
        matches.product = g2;
        for(var i = 0; i < 48; i += 8) {
          var idx = (i / 8) + 2;
          matches[tls.labels.headings.meta[idx]] = tls.parse.int(g4.substring(i, i + 8));
        }
        values.push(matches);
        tank++;
      });

      console.log('values', values);

      return values;
    }
  }
};

if (Meteor.isServer) {
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
            client.end()
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
}
