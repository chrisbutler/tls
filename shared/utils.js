tls.utils = {

};

tls.utils.labels = {
  headings: {
    default: ['#', 'PRODUCT', 'GAL', 'TC GAL', 'ULL', 'IN', 'W', '&deg;F'],
    full: ['Number', 'Product', 'Gallons', 'TC Gallons', 'Ullage', 'Inches', 'Water', 'Temperature (&deg;F)'],
    meta: ['id', 'product', 'gallons', 'tcgallons', 'ullage', 'inches', 'water', 'temp']
  }
};

tls.utils.parse = {
  IEEE: function(num) {
    if (num == 0) return 0;

    num = '0x' + num;

    var sign = (num & 0x80000000) ? -1 : 1;
    var exponent = ((num >> 23) & 0xff) - 127;
    var mantissa = 1 + ((num & 0x7fffff) / 0x7fffff);

    return sign * mantissa * Math.pow(2, exponent);
  },
  int: function(num) {
    return (tls.utils.parse.IEEE(num)).toFixed(0);
  }
};

tls.utils.tanks = {
  extract: function(responseString) {
    responseString = responseString.substring(16);

    var pattern = /(\d{2})(.{1})(\d{4})07(.{56})&?&?/g;
    var values = [];
    var tank = 0;

    responseString.replace(pattern, function(m, g1, g2, g3, g4) {
      //console.log('replace', m, '\n', g1, '\n', g2, '\n', g3, '\n', g4);
      var matches = {};
      matches.id = g1;
      matches.product = g2;
      for(var i = 0; i < 48; i += 8) {
        var idx = (i / 8) + 2;
        matches[tls.utils.labels.headings.meta[idx]] = tls.utils.parse.int(g4.substring(i, i + 8));
      }
      values.push(matches);
      tank++;
    });

    return values;
  }
};
