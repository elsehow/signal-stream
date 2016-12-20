var signal = require('signal-protocol')
var h = require('./helpers')(signal)
var read = require('fs').createReadStream
var through = require('through2')
var test = require('tape')
var spigot = require("stream-spigot")
var read = require('fs').createReadStream
var readSync = require('fs').readFileSync
var concat = require('concat-stream')

var l = require('../src/helpers')


function log (note) {
    return function (x) {
        console.log(note, x)
        return x
    }
}

function roundTripEcho (readable, cb) {

    h.bobAliceSessionCiphers()
        .then(echo, log('ERR'))

    // // // the world's slowest impl of `echo`
    function echo (ciphers) {
        var aliceCipher = ciphers[0]
        var bobCipher = ciphers[1]
        var alice = require('..')(aliceCipher)
        var bob = require('..')(bobCipher)


        readable
        .pipe(alice.encrypt)
        .pipe(bob.decrypt)
        .pipe(bob.encrypt)
        .pipe(alice.decrypt)
        .pipe(concat(cb))
        .on('error', err => console.log('err', err))
    }
}

test('can echo a long textfile from alice to bob to alice again', t => {
    var dir = __dirname + '/story2.js'
    var buff = readSync(dir)
    var readable = read(dir)
    roundTripEcho(readable, recoveredBuff => {
        t.deepEqual(recoveredBuff, buff,
                    'textfile identical after round trip')
        t.end()
    })
})

test('can echo an image file', t => {
   var trueBuf = h.imageBuffer()
   var dir = __dirname + '/oakland-bridge.jpg'
   var readable = read(dir)
   roundTripEcho(readable, buff => {
       t.deepEqual(buff, trueBuf,
                   'image perserved after roundtrip')
       t.end()
   })
})
