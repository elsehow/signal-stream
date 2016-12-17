var signalstream = require('..')
var helpers = require('./helpers')
var signal = require('signal-protocol')
let read = require('fs').ReadStream
let through = require('through2')

let log = note => x => console.log(note, x)

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
}).then(echo)
    .catch(log)



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

    // let ctxt = aliceEncrypt('hello sweet world')
    //     .then(bobDecrypt)
    //     .then(bobEncrypt)
    //     .then(aliceDecrypt)
    //     .then(aliceEncrypt)
    //     .then(bobDecrypt)
    //     .then(log('DATA:'))
    //     .catch(log('ERR:'))

    let dir = __dirname + '/story.txt'
    console.log('starting')
    read(dir)
        .pipe(aliceEncrypt)
        .pipe(bobDecrypt)
        .pipe(bobEncrypt)
        .pipe(aliceDecrypt)
        .pipe(aliceEncrypt)
        .pipe(bobDecrypt)
        .pipe(bobEncrypt)
        .pipe(aliceDecrypt)
        .on('data', d => console.log('DATA', d))
        .on('error', e => console.log('ERR!', e))
        // .pipe(process.stdout)
        // .pipe(decrypt)
}
