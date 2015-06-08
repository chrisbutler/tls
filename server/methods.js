var net = Npm.require('net');
var future = Npm.require('fibers/future');

Meteor.methods({
  '/tls/getTanks': function(ip, port) {
    var t = new tls(ip, port);
    return t.getTanks();
  },
  '/tls/getTankNames': function(ip, port) {
    return;
  }
});
