Veeder-Root TLS API
=========

Connects to a TLS-350 tank monitoring system and returns json-formatted tank information. Also includes a `TLS.utils` object for data parsing.

### Documentation

<http://chrisbutler.github.io/tls>


### Example Usage

```javascript
var myTLS = new TLS.connect('<ip address>', <port number>);

console.log(myTLS.getTanks());

```

### License
This project is open source software under the GNU AGPL. Please see the license file for details.
