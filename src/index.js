let signal = require('signal-protocol')
let through = require('through2')
// let l = require('./helpers')
// var textsecure = require('signal-protocol/test/temp_helpers')
const PREKEY_BUNDLE_CODE = 3 //textsecure.protobuf.IncomingPushMessageSignal.Type.PREKEY_BUNDLE
let pushPromise = (p, next) => p.then(x => next(null, x), next)
let streamF = f => through.obj((buf, enc, next) => pushPromise(f(buf), next))

function encryptor (cipher) {
    return function (plaintext) {
        return cipher.encrypt(plaintext)
    }
}

function decryptor (cipher) {
    // returns a promise of plaintext
    return function (ciphertext) {
        // console.log('ciphertext to decrypt is', ciphertext)
        if (ciphertext.type == PREKEY_BUNDLE_CODE)
            return cipher.decryptPreKeyWhisperMessage(ciphertext.body, 'binary')
        return cipher.decryptWhisperMessage(ciphertext.body, 'binary')
    }
}

module.exports = function (cipher) {
    return {
        encrypt: streamF(encryptor(cipher)),
        decrypt: streamF(decryptor(cipher)),
    }
}
