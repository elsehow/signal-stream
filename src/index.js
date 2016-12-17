let signal = require('signal-protocol')
let through = require('through2')
// let textsecure = require('signal-protocol/test/temp_helpers.js')
// const CIPHERTEXT_CODE = textsecure.protobuf.IncomingPushMessageSignal.Type.CIPHERTEXT
const PREKEY_BUNDLE_CODE = 3 //textsecure.protobuf.IncomingPushMessageSignal.Type.PREKEY_BUNDLE

function str2ab (str) {
    var buf = new ArrayBuffer(str.length*2); // 2 bytes for each char
    var bufView = new Uint16Array(buf);
    for (var i=0, strLen=str.length; i<strLen; i++) {
        bufView[i] = str.charCodeAt(i);
    }
    return buf;
}
function getPaddedMessageLength (messageLength) {
    let messageLengthWithTerminator = messageLength + 1
    let messagePartCount            = Math.floor(messageLengthWithTerminator / 160)
    if (messageLengthWithTerminator % 160 !== 0) {
        messagePartCount++
    }
    return messagePartCount * 160
}

function pad (plaintext) {
    let paddedPlaintext = new Uint8Array(
        getPaddedMessageLength(plaintext.byteLength + 1) - 1
    );
    paddedPlaintext.set(new Uint8Array(plaintext));
    paddedPlaintext[plaintext.byteLength] = 0x80;

    return paddedPlaintext.buffer;
}

function unpad (paddedPlaintext) {
    paddedPlaintext = new Uint8Array(paddedPlaintext);
    let plaintext;
    for (let i = paddedPlaintext.length - 1; i >= 0; i--) {
        if (paddedPlaintext[i] == 0x80) {
            plaintext = new Uint8Array(i);
            plaintext.set(paddedPlaintext.subarray(0, i));
            plaintext = plaintext.buffer;
            break;
        } else if (paddedPlaintext[i] !== 0x00) {
            throw new Error('Invalid padding');
        }
    }
    return plaintext;
}

function encryptable (cipher) {
    return through.obj(function (buff, enc, next) {
        // if (enc !== 'buffer')
        //     throw 'Must feed buffer to encryptable!'
        console.log('"encryptable" input enc:', enc)
        // let ab = pad(buff.buffer)
        // console.log('padded', ab)
        // console.log('unpadded', buff.buffer)
        // TODO this is a weird thing to do
        //      coincidentally, it works whether `buff` is buffers or string
        let inefficientAb = pad(str2ab(buff.toString()))
        // console.log('stringed to arraybuff', inefficientAb)
        // let inefficientUnpaddedAb = str2ab(buff.toString())
        // console.log('my ab', inefficientUnpaddedAb)
        cipher
            // .encrypt(ab)
            // .encrypt(buff.buffer)
            .encrypt(inefficientAb)
            // .encrypt(inefficientUnpaddedAb)
            .then(ctxt => next(null, ctxt),
                  err => next(err))
    })
}

function decryptable (cipher) {
    // returns a promise of plaintext
    function parse (ciphertext) {
        // console.log('SEEING\n', ciphertext)
        if (ciphertext.type == PREKEY_BUNDLE_CODE)
            return cipher.decryptPreKeyWhisperMessage(ciphertext.body, 'binary')
        // console.log('REACHED!', ciphertext)
        return cipher.decryptWhisperMessage(ciphertext.body, 'binary')
    }
    return through.obj(function (ctxt, enc, next) {
        return parse(ctxt)
            .then(unpad)
            // .then(ab2str)
            .then(plaintext => next(null, plaintext),
                  err => next(err))
    })
}

// console.log(decode.toString())
module.exports = {
    encryptable: encryptable,
    decryptable: decryptable,
}
