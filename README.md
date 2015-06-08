Veeder-Root TLS API
=========

Connects to a TLS-350 tank monitoring system and returns json-formatted tank information. Also includes a `tls.utils` object for data parsing.

### Documentation

<http://chrisbutler.github.io/tls>


### Example Usage

```
var myTLS = new tls.connect('<ip address>', <port number>);

console.log(myTLS.getTanks());

```
