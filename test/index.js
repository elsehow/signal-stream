var signalstream = require('..')
var bobAliceSessionCiphers = require('./helpers')
var signal = require('signal-protocol')
var read = require('fs').createReadStream
var through = require('through2')
var test = require('tape')

var l = require('../src/helpers')

function log (note) {
    return function (x) {
        console.log(note, x)
        return x
    }
}

function roundTripEcho (path, cb) {

    bobAliceSessionCiphers()
        .then(echo, log('ERR'))

    // // // the world's slowest impl of `echo`
    function echo ([aliceCipher, bobCipher]) {
        let alice = require('..')(aliceCipher)
        let bob = require('..')(bobCipher)
        let concat = require('concat-stream')
        read(path)
            .pipe(through(function (buf, enc, next) {
                let amt = 239
                for (let i=0; i<buf.length; i+=amt)
                    this.push(buf.slice(i, i+amt))
                next()
            }))
            .pipe(alice.encrypt)
            .pipe(bob.decrypt)
            .pipe(bob.encrypt)
            .pipe(alice.decrypt)
            .pipe(through.obj((buff, enc, next) => {
                let b = new Buffer(buff, enc)
                next(null, b)
            }))
            .pipe(concat(cb))
        // .on('data', d => console.log(d))
            .on('error', err => console.log('err', err))
    }
}

// test('can echo a short textfile from alice to bob to alice again', t => {
//     let filepath = __dirname + '/story.txt'
//     roundTripEcho(filepath, buff => {
//         let trueBuff = require('fs').readFileSync(filepath)
//         t.deepEqual(buff, trueBuff,
//                     'textfile buffer after round trip encrypt/decrypt/encrypt/decrypt identical to original buffer')
//         t.end()
//     })
// })

// test('can echo long short textfile from alice to bob to alice again', t => {
//     let filepath = __dirname + '/story2.txt'
//     roundTripEcho(filepath, buff => {
//         let trueBuff = require('fs').readFileSync(filepath)
//         t.deepEqual(buff, trueBuff,
//                     'long textfile buffer perserved after roundtrip')
//         t.end()
//     })
// })

test('can echo an image file', t => {
    let filepath = __dirname + '/oakland-bridge.jpg'
    roundTripEcho(filepath, buff => {
        let trueBuff = require('fs').readFileSync(filepath)
        t.deepEqual(buff, trueBuff,
                    'long textfile buffer perserved after roundtrip')
        t.end()
    })
})
