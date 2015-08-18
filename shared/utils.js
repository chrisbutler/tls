TLS.utils = {};

TLS.utils.labels = {
  headings: {
    default: ['#', 'PRODUCT', 'GAL', 'TC GAL', 'ULL', 'IN', 'W', '&deg;F'],
    full: ['Number', 'Product', 'Gallons', 'TC Gallons', 'Ullage', 'Inches', 'Water', 'Temp &deg;F'],
    meta: ['id', 'product', 'gallons', 'tcgallons', 'ullage', 'inches', 'water', 'temp']
  }
};

TLS.utils.parse = {
  IEEE: function(num) {
    if (num == 0) return 0;

    num = '0x' + num;

    var sign = (num & 0x80000000) ? -1 : 1;
    var exponent = ((num >> 23) & 0xff) - 127;
    var mantissa = 1 + ((num & 0x7fffff) / 0x7fffff);

    return sign * mantissa * Math.pow(2, exponent);
  },
  int: function(num) {
    return (TLS.utils.parse.IEEE(num)).toFixed(0);
  }
};

TLS.utils.time = {
  local: function(response) {
    var time = response.substr(6, 10);
    var d = 0;
    var h = time.match(/.{2}/g);

    if(h != null) {
      h[0] = '20' + h[0];
      h[1]--;
      var d = moment().utc(h);
    }

    return d;
  },
  offset: function(response) {
    var d = this.local(response);
    var o = ((d - moment().utc()) / 60000) / 60;
    return Math.round(o);
  }
}

TLS.utils.tanks = {
  extract: function(response, tankNames) {
    data = response.substring(16);

    var pattern = /(\d{2})(.{1})(\d{4})07(.{56})&?&?/g;
    var values = [];
    var tank = 0;

    data.replace(pattern, function(m, g1, g2, g3, g4) {
      var matches = {};
      matches.id = g1;
      matches.product = g2;
      for(var i = 0; i < 48; i += 8) {
        var idx = (i / 8) + 2;
        matches[TLS.utils.labels.headings.meta[idx]] = TLS.utils.parse.int(g4.substring(i, i + 8));
      }
      values.push(matches);
      tank++;
    });

    if (tankNames) {
      _.each(values, function(tank, idx) {
        values[idx].name = tankNames[idx];
      });
    }

    return values;
  },
  names: function(data) {
    data = data.replace(/(\s\d{1}\s+\b\w+\b)\s(\b\w+\b)/g, "$1-$2");

    var list = data.match(/[\d\.\w\-]+/g) || [];
    list.shift();
    list.splice(0, 23);

    var names = Array();
    do {
      var row = list.splice(0, 7);
      if (row && row[1]) {
        names.push(row[1].replace('-', ' '));
      }
    } while (list.length > 0);

    return names;
  }
};
