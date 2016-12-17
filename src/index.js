let signal = require('signal-protocol')
let through = require('through2')
// let textsecure = require('signal-protocol/test/temp_helpers.js')
// const CIPHERTEXT_CODE = textsecure.protobuf.IncomingPushMessageSignal.Type.CIPHERTEXT
const PREKEY_BUNDLE_CODE = 3 //textsecure.protobuf.IncomingPushMessageSignal.Type.PREKEY_BUNDLE

function ab2str(buf) {
    return String.fromCharCode.apply(null, new Uint16Array(buf));
}

function str2ab(str) {
    var buf = new ArrayBuffer(str.length*2); // 2 bytes for each char
    var bufView = new Uint16Array(buf);
    for (var i=0, strLen=str.length; i<strLen; i++) {
        bufView[i] = str.charCodeAt(i);
    }
    return buf;
}
function getPaddedMessageLength(messageLength) {
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

function unpad(paddedPlaintext) {
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
    // return through.obj(function (buff, enc, next) {
    return function (plaintext) {
        let buff = pad(str2ab(plaintext))
        // console.log('buff', buff)
        return cipher.encrypt(buff)
    }
}

function decryptable (cipher) {
    // returns a promise of plaintext
    function parse (ciphertext) {
        // console.log('SEEING\n', ciphertext, '\n\n')
        if (ciphertext.type == PREKEY_BUNDLE_CODE)
            return cipher.decryptPreKeyWhisperMessage(ciphertext.body, 'binary')
        return cipher.decryptWhisperMessage(ciphertext.body, 'binary')
    }
    // return through.obj(function (ctxt, enc, next) {
    return function (ctxt) {
        return parse(ctxt)
            .then(unpad)
            .then(ab2str)
            //.catch(err => console.log(err)) 
            // .then(plaintext => {
            //     console.log('DECRYPTED', plaintext)
            //     // this.push(plaintext)
            //     next()
            // })
            // .catch(err => console.log('ERR!', err))
    // })
    }
}

// console.log(decode.toString())
module.exports = {
    encryptable: encryptable,
    decryptable: decryptable,
}
