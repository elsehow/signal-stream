var signalstream = require('..')
var helpers = require('./helpers')
var signal = require('signal-protocol')

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

    console.log('starting')
    let ctxt = aliceEncrypt(new Buffer('hello sweet world', 'utf-8'))
        .then(bobDecrypt)
        .then(bobEncrypt)
        .then(aliceDecrypt)
        .then(aliceEncrypt)
        .then(bobDecrypt)
        .then(bobEncrypt)
        .then(aliceDecrypt)
        .then(aliceEncrypt)
        .then(bobDecrypt)
        .then(x => new Buffer.from(x).toString('utf-8'))
        .then(log('DATA:'), log('ERR!!'))
}
