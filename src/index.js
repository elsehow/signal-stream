let signal = require('signal-protocol')
let through = require('through2')
// let l = require('./helpers')
// var textsecure = require('signal-protocol/test/temp_helpers')
const PREKEY_BUNDLE_CODE = 3 //textsecure.protobuf.IncomingPushMessageSignal.Type.PREKEY_BUNDLE
// let pushPromise = (p, next) => p.then(x => next(null, x), next)
let streamF = f => {
    return through.obj(function (buf, enc, next) {
        f(buf, enc).then(x => {
            this.push(x)
            next()
        }).catch(err => {
            next(err)
        })
    })
}

function encryptor (cipher) {
    return function (plaintext) {
        return cipher.encrypt(plaintext)
    }
}

function decryptor (cipher) {
    function bufferify (ab) {
        let b = new Buffer(ab)
        return b
    }
    // returns a promise of plaintext
    return function (ciphertext, enc) {
        if (ciphertext.type == PREKEY_BUNDLE_CODE)
            return cipher.decryptPreKeyWhisperMessage(ciphertext.body, 'binary')
            .then(bufferify)
        return cipher.decryptWhisperMessage(ciphertext.body, 'binary')
            .then(bufferify)
    }
}

module.exports = function (cipher) {
    return {
        encrypt: streamF(encryptor(cipher)),
        decrypt: streamF(decryptor(cipher)),
        //encrypt: encryptor(cipher),
        //decrypt: decryptor(cipher),
    }
}
