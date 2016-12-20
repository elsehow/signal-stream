var signalstream = require('..')
var signal = require('signal-protocol')
var h = require('../test/helpers')(signal)
var test = require('tape')
var hyperlog = require('hyperlog')
var through = require('through2')
var memdb = require('memdb')

test('can replicate a hyperlog', function (t) {

  t.plan(4)

  function myLog () {
    return hyperlog(memdb(), { valueEncoding: 'json', })
  }
  function expect (log, name) {
    log.createReadStream({ live: true })
      .on('data', function (d) {
        t.ok(d.value)
        console.log(name, 'sees', d.value)
      })
  }

  var aliceLog = myLog()
  var bobLog = myLog()
  h.bobAliceSessionCiphers()
    .then(function (ciphers) {
      var alice = signalstream(ciphers[0])
      var bob = signalstream(ciphers[1])

      alice._encryptF('introducing!')
        .then(bob._decryptF)
        .then(function () {
          aliceLog.append('hello', function (err, res) {
            bobLog.append('world', function (err, res) {
              expect(aliceLog, 'alice')
              expect(bobLog, 'bob')
              var arep = aliceLog.replicate()
              var brep = bobLog.replicate()
              arep
                .pipe(alice.encrypt)
                .pipe(bob.decrypt)
                .pipe(brep)
                .pipe(bob.encrypt)
                .pipe(alice.decrypt)
                .pipe(arep)
            })
          })

        })

    })

})
