var spigot = require('stream-spigot')
var h = require('../test/helpers')
h.bobAliceSessionCiphers()
 .then(([aliceCipher, bobCipher]) => {

   let alice = require('..')(aliceCipher)
   let bob = require('..')(bobCipher)

   spigot(['hello', 'sweet', 'world'])
    .pipe(alice.encrypt)
    .pipe(bob.decrypt)
    .pipe(bob.encrypt)
    .pipe(alice.decrypt)
    .on('data', d => console.log(d.toString()))
})

// hello
// sweet
// world
