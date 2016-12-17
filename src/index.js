let signal = require('signal-protocol')
let through = require('through2')
let l = require('./helpers')
// var textsecure = require('signal-protocol/test/temp_helpers')
const PREKEY_BUNDLE_CODE = 3 //textsecure.protobuf.IncomingPushMessageSignal.Type.PREKEY_BUNDLE

function encryptable (cipher, enc) {
    return function (plaintext) {
        return cipher.encrypt(plaintext, enc)
    }
}

function decryptable (cipher) {
    // returns a promise of plaintext
    function parse (ciphertext) {
        console.log('ciphertext to decrypt is', ciphertext)
        if (ciphertext.type == PREKEY_BUNDLE_CODE)
            return cipher.decryptPreKeyWhisperMessage(ciphertext.body, 'binary')
        return cipher.decryptWhisperMessage(ciphertext.body, 'binary')
    }
    return function (ctxt) {
        return parse(ctxt)
    }
}

module.exports = {
    encryptable: encryptable,
    decryptable: decryptable,
}
