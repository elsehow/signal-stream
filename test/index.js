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
                    .pipe(alice.encrypt)
                    .pipe(bob.decrypt)
                    .pipe(bobReplication)
                    .pipe(aliceReplication)
            })
        })
    }
})
