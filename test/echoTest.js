var bobAliceSessionCiphers = require('./helpers')
var signal = require('signal-protocol')
var read = require('fs').createReadStream
var through = require('through2')
var test = require('tape')
var spigot = require("stream-spigot")

var l = require('../src/helpers')

let concat = require('concat-stream')

function log (note) {
    return function (x) {
        console.log(note, x)
        return x
    }
}

// .pipe(through(function (buf, enc, next) {
//     let amt = 239 // HACK signal-protocol 0.0.x seems to truncate messages in node, but not browser
//     for (let i=0; i<buf.length; i+=amt)
//         this.push(buf.slice(i, i+amt))
//     next()
// }))

function roundTripEcho (str, cb) {

    bobAliceSessionCiphers()
        .then(echo, log('ERR'))

    // // // the world's slowest impl of `echo`
    function echo ([aliceCipher, bobCipher]) {
        let alice = require('..')(aliceCipher)
        let bob = require('..')(bobCipher)
        // spigot([str])
        //         .pipe(alice.encrypt)
        //         .pipe(bob.decrypt)
        //         // .pipe(bob.encrypt)
        //         // .pipe(alice.decrypt)
        //         .pipe(concat(cb))
        //         .on('error', err => console.log('err', err))
        // // })
        // //     .pipe(concat(cb))
        // //     // .on('data', d => console.log(d))



        // TODO this simple example works in the browser
        //      but breaks in node
        alice.encrypt(str)
            .then(bob.decrypt)
            .then(cb)
    }
}

test('can echo a short textfile from alice to bob to alice again', t => {
    var str = require('./story2.js')
    roundTripEcho(str, recoveredBuff => {
        t.deepEqual(str, recoveredBuff.toString(),
                    'textfile buffer after round trip encrypt/decrypt/encrypt/decrypt identical to original buffer')
        t.end()
    })
})

// test('can echo long short textfile from alice to bob to alice again', t => {
//     let filepath = __dirname + '/story2.txt'
//     roundTripEcho(filepath, buff => {
//         let trueBuff = require('fs').readFileSync(filepath)
//         t.deepEqual(buff, trueBuff,
//                     'long textfile buffer perserved after roundtrip')
//         t.end()
//     })
// })

// test('can echo an image file', t => {
//     let filepath = __dirname + '/oakland-bridge.jpg'
//     roundTripEcho(filepath, buff => {
//         let trueBuff = require('fs').readFileSync(filepath)
//         t.deepEqual(buff, trueBuff,
//                     'long textfile buffer perserved after roundtrip')
//         t.end()
//     })
// })
