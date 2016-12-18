var bobAliceSessionCiphers = require('./helpers')
var hyperlog = require('hyperlog')
var memdb = require('memdb')
var test = require('tape')
var through = require('through2')

function log (note) {
    return function (x) {
        console.log(note, x)
        return x
    }
}
test('can replicate a hyperlog over a signal transform stream', t => {
    t.plan(2)

    bobAliceSessionCiphers()
        .then(tryReplicate, log('ERR'))

    // // // the world's slowest impl of `echo`
    function tryReplicate ([aliceCipher, bobCipher]) {

        let alice = require('..')(aliceCipher)
        let bob = require('..')(bobCipher)

        var aliceLog = hyperlog(memdb(), { valueEncoding: 'json' })
        var bobLog = hyperlog(memdb(), { valueEncoding: 'json' })

        function check (repStream, log, datum, msg) {
            repStream.on('end', function() {
                log.createReadStream({since: 1}).on('data', ds => {
                    t.deepEqual(ds.value, datum, msg)
                })
            })
        }

        aliceLog.add(null, 'beep', () => {
            console.log('alice added beep')
            bobLog.add(null, 'boop', () => {
                console.log('bob added boop')
                var aliceReplication = aliceLog.replicate()
                var bobReplication = bobLog.replicate()
                check(aliceReplication, aliceLog, 'boop',
                      'alice gets a `boop` after replicating')
                check(bobReplication, bobLog, 'beep',
                      'bob gets a `beep` after replicating')

                // var map = reqire('map-stream')
                // var es = require('event-stream')
                // var streamFromPromise = require('stream-from-promise')
                // var flatmap = require('flat-map')
                // var map = require('through2-map-promise')

                aliceReplication
                    .pipe(through(function (buf,enc,next) {
                        new Promise(function (resolve) {
                            resolve(buf)
                        }).then(function (b) {
                            console.log('seeing', b)
                            console.log('equal?', b.equals(buf))
                            next(null, b)
                        })
                    }))
                            // callback(null, buf)
                            // .catch(err => console.log('ERR', err))
                        // console.log('before cb', buf)
                        // callback(null, buf)
                    .pipe(bobReplication)
                    .pipe(aliceReplication)
                        // console.log(buf)
                        // callback(null, buf)
                        // es.map(function (buf, callback) {
                        // alice.encrypt(buf)
                        //     .then(bob.decrypt)
                        //     .then(b => {
                        //         callback(null, b)
                        //     })
                    // }))
                    // .pipe(through.obj(function (buf, enc, next) {
                    //     console.log('now i see', buf)
                    //     this.push(buf)
                    //     next()
                    // }))
                    // .pipe(alice.encrypt)
                // ciphertext only here
                // we could send this stream over a snoopable channel
                // but let's just pretend we've done that,
                // and decrypt the stream on bob's side
                    // .pipe(bob.decrypt)
                    // .pipe(bobReplication)
                    // .pipe(bob.encrypt)
                    // .pipe(alice.decrypt)
                    // .pipe(aliceReplication)
                // console.log('started them replicating through encrypted channel')
            })
        })
    }
})
