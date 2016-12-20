var sigstream = require('..')
var signal = require('signal-protocol')
var h = require('../test/helpers')(signal)

h.bobAliceSessionCiphers()
  .then(([aliceCipher, bobCipher]) => {
    let alice = sigstream(aliceCipher)
    let bob = sigstream(bobCipher)
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

