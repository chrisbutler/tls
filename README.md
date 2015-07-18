Veeder-Root TLS API
=========

Connects to a TLS-350 tank monitoring system and returns json-formatted tank information. Also includes a `TLS.utils` object for data parsing.

### Documentation

<http://chrisbutler.github.io/tls>


### Example Usage

```
var myTLS = new TLS.connect('<ip address>', <port number>);

console.log(myTLS.getTanks());

```
