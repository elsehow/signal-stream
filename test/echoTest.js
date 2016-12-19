var h = require('./helpers')
var signal = require('signal-protocol')
var read = require('fs').createReadStream
var through = require('through2')
var test = require('tape')
var spigot = require("stream-spigot")

var l = require('../src/helpers')


function log (note) {
    return function (x) {
        console.log(note, x)
        return x
    }
}

function roundTripEcho (buf, cb) {

    h.bobAliceSessionCiphers()
        .then(echo, log('ERR'))

    // // // the world's slowest impl of `echo`
    function echo ([aliceCipher, bobCipher]) {
        let alice = require('..')(aliceCipher)
        let bob = require('..')(bobCipher)

        spigot([buf])
        .pipe(alice.encrypt)
        .pipe(bob.decrypt)
        .pipe(bob.encrypt)
        .pipe(alice.decrypt)
        .on('data', cb)
        .on('error', err => console.log('err', err))
    }
}

test('can echo a long textfile from alice to bob to alice again', t => {
    var str = require('./story2.js')
    roundTripEcho(str, recoveredBuff => {
        t.deepEqual(recoveredBuff.toString(), str,
                    'textfile identical after round trip')
        t.end()
    })
})

test('can echo an image file', t => {
  let trueBuf = h.imageBuffer()
   roundTripEcho(trueBuf, buff => {
       t.deepEqual(buff, trueBuf,
                   'image perserved after roundtrip')
       t.end()
   })
})
