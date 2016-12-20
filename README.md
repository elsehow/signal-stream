# signal-stream

```
npm install signal-stream
```

encrypt and decrypt streams 
using the [signal-protocol](https://github.com/elsehow/signal-protocol)

[![Build Status](https://travis-ci.org/elsehow/signal-protocol.svg?branch=master)](https://travis-ci.org/elsehow/signal-protocol)


## example

```javascript
var signalstream = require('signal-stream')
var signal = require('signal-protocol')
var h = require('signal-stream/test/helpers')(signal)

h.bobAliceSessionCiphers()
  .then(([aliceCipher, bobCipher]) => {
    let alice = signalstream(aliceCipher)
    let bob = signalstream(bobCipher)
    require('http')
      .get({
        hostname:'info.cern.ch',
        path: '/hypertext/WWW/TheProject.html',
      }, res => {
        res
          .pipe(alice.encrypt)
          .pipe(bob.decrypt)
          .pipe(bob.encrypt)
          .pipe(alice.decrypt)
          .on('data', d =>
              console.log(d.toString()))
      })
  })
  
// <HEADER>
// <TITLE>The World Wide Web project</TITLE>
// ...
```

see `examples/` for more.

## api

### signalstream(sessionCipher, opts)

returns an object `{ encrypt, decrypt }`.

`encrypt` is a transform stream that consumes (plaintext) buffers and produces (encrypted) ciphertext objects (refer to [signal-protocol](https://github.com/elsehow/signal-protocol) for details).

`decrypt` is a transform stream that consumes signal-protocol's ciphertext objects and produces plaintext buffers.

the default `opts` are

```js
{
  jsonIn: false,
  jsonOut: false,
}
```

setting these to `true` can be helpful if you need to (de-)serialize the objects produced by signal-protocol's `encrypt`, e.g. to send over a websocket or a network. (see `examples/net.js`).

## license

BSD
