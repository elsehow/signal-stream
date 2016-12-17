var signalstream = require('..')
var helpers = require('./helpers')
var signal = require('signal-protocol')
var read = require('fs').createReadStream
var through = require('through2')

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

    let alice = require('..')(aliceCipher)
    let bob = require('..')(bobCipher)

    console.log('starting')
    let pushPromise = (p, next) => p.then(x => next(null, x), next)
    let streamF = f => through.obj((buf, enc, next) => pushPromise(f(buf), next))

    read(__dirname + '/story.txt', 'utf-8')
        .pipe(alice.encrypt)
        .pipe(bob.decrypt)
        // .pipe(bob.encrypt)
        // .pipe(alice.decrypt)
        .on('data', ds => ds.map(d => {
            let pt = new Buffer.from(d).toString('utf-8')
            console.log('SEE', d, pt)
        }))
        .on('error', err => console.log('err', err))
}
