var signal = require('signal-protocol')
var h = require('./helpers')(signal)
var memdb = require('memdb')
var hypercore = require('hypercore')
var test = require('tape')
var bobAliceSessionCiphers = require('./helpers')
function myCoreFeed (key) {
  return hypercore(memdb()).createFeed(key)
}
var net = require('net')

var feedA = myCoreFeed()

var server, client, sockRef
test('can replicate hyercore', t => {
  t.plan(6)

  function tryReplicate (ciphers) {
    var aliceCipher = ciphers[0]
    var bobCipher = ciphers[1]
    var buff = h.imageBuffer()
    var buffLen = buff.length
    feedA.append(['hello', 'world', buff], function () {
      var feedKey = feedA.key.toString('hex')
      var feedB = myCoreFeed(feedKey)
      function checkOk (feed, event) {
        feed.on(event, function (block, data) {
          t.ok(data)
        })
      }
      checkOk(feedA, 'upload')
      checkOk(feedA, 'download')
      checkOk(feedB, 'upload')
      feedB.on('download', function (block, data) {
        t.ok(data.length=4||data.length==buffLen)
      })
      // make stream s for both of them
      var opts = {
        jsonIn: true,
        jsonOut: true,
      }
      var alice = require('..')(aliceCipher, opts)
      var bob = require('..')(bobCipher, opts)
      // first we need alice and bob to introduce themselves
      // (any message will do here)
      alice._encryptF("introduce!")
        .then(bob._decryptF)
      // after bob has seen alice's introduction,
      // we can start replicating
        .then(() => {

          var port = 10000
          server = net.createServer(function (socket) {
            socket
              .pipe(alice.decrypt)
              .pipe(feedA.replicate())
              .pipe(alice.encrypt)
              .pipe(socket)

          })
          server.listen(port, () => {
            client = net.connect(port)
            client
              .pipe(bob.decrypt)
              .pipe(feedB.replicate())
              .pipe(bob.encrypt)
              .pipe(client)

          })
        })
    })
  }

  h.bobAliceSessionCiphers()
    .then(tryReplicate)
})

test.onFinish(() => {
  console.log('closin')
  process.exit(0)
})
