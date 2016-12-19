let net = require('net')
let spigot = require('stream-spigot')
let h = require('../test/helpers')
let port = 10000
h.bobAliceSessionCiphers()
 .then(([aliceCipher, bobCipher]) => {
   let opts = {
     jsonIn: true,
     jsonOut: true,
   }
   let alice = require('..')(aliceCipher, opts)
   let bob = require('..')(bobCipher, opts)
   server = net.createServer(function (socket) {
     console.log('client connected')
     spigot(['hello', 'sweet', 'world'])
       .pipe(alice.encrypt)
       .pipe(socket)
   })

   server.listen(port, () => {
    console.log('server started, connecting a client...')
    client = net.connect(port)
    client.pipe(bob.decrypt)
      .on('data', d => console.log(d.toString()))
      .on('end', d => server.close())
   })
 })
