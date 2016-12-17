var signalstream = require('..')
var helpers = require('./helpers')
var signal = require('signal-protocol')
var read = require('fs').createReadStream
var through = require('through2')
var util = require('signal-protocol/src/helpers.js')

var l = require('../src/helpers')

var ALICE_ADDRESS = new signal.SignalProtocolAddress("+14151111111", 1);
var BOB_ADDRESS   = new signal.SignalProtocolAddress("+14152222222", 1);

var aliceStore = new helpers.SignalStore();
var bobStore = new helpers.SignalStore();

var bobPreKeyId = 1337;
var bobSignedKeyId = 1;

Promise.all([
    helpers.generateIdentity(aliceStore),
    helpers.generateIdentity(bobStore),
]).then(function() {
    return helpers.generatePreKeyBundle(bobStore, bobPreKeyId, bobSignedKeyId);
}).then(function(preKeyBundle) {
    var builder = new signal.SessionBuilder(aliceStore, BOB_ADDRESS);
    return builder.processPreKey(preKeyBundle)
}).then(function () {
    //var originalMessage = util.toArrayBuffer("L'homme est condamné à être libre");
    var aliceSessionCipher = new signal.SessionCipher(aliceStore, BOB_ADDRESS);
    var bobSessionCipher = new signal.SessionCipher(bobStore, ALICE_ADDRESS);
    return [ aliceSessionCipher, bobSessionCipher ]
}).then(echo, log)

function log (note) {
    return function (x) {
        console.log(note, x)
        return x
    }
}

// // // the world's slowest impl of `echo`
function echo ([aliceCipher, bobCipher]) {

    let aliceEncrypt = require('..')
        .encryptable(aliceCipher)
    let aliceDecrypt = require('..')
        .decryptable(aliceCipher)

    let bobEncrypt = require('..')
        .encryptable(bobCipher)
    let bobDecrypt = require('..')
        .decryptable(bobCipher)

    var kefir = require('kefir')
    console.log('starting')
    let pushPromise = (p, next) => p.then(x => next(null, x), next)
    let streamF = f => through.obj(function (buf, enc, next) { pushPromise(f(buf), next) })

    let aliceEnc = streamF(aliceEncrypt)
    let bobDec = streamF(bobDecrypt)

    let readS = kefir.fromEvents(
        read(__dirname + '/story.txt', 'utf-8'),
        'data')
    readS
        .log('reading')
        .flatMap(aliceEncrypt)
        .flatMap(bobDecrypt)
        .flatMap(bobEncrypt)
        .flatMap(aliceDecrypt)
        .flatMap(aliceEncrypt)
        .flatMap(bobDecrypt)
        .flatMap(bobEncrypt)
        .flatMap(aliceDecrypt)
        .flatMap(aliceEncrypt)
        .flatMap(bobDecrypt)
        .flatMap(bobEncrypt)
        .flatMap(aliceDecrypt)
        .map(x => new Buffer.from(x).toString('utf-8'))
        .log('decrypting')
}
