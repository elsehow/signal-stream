function ab2str(buf) {
    return String.fromCharCode.apply(null, new Uint8Array(buf));
}

function str2ab(str) {
    var buf = new ArrayBuffer(str.length*2); // 2 bytes for each char
    var bufView = new Uint8Array(buf);
    for (var i=0, strLen=str.length; i<strLen; i++) {
        bufView[i] = str.charCodeAt(i);
    }
    return buf;
}
function getPaddedMessageLength(messageLength) {
    var messageLengthWithTerminator = messageLength + 1
    var messagePartCount            = Math.floor(messageLengthWithTerminator / 160)
    if (messageLengthWithTerminator % 160 !== 0) {
        messagePartCount++
    }
    return messagePartCount * 160
}

function pad (plaintext) {
    var paddedPlaintext = new Uint8Array(
        getPaddedMessageLength(plaintext.byteLength + 1) - 1
    );
    paddedPlaintext.set(new Uint8Array(plaintext));
    paddedPlaintext[plaintext.byteLength] = 0x80;

    return paddedPlaintext.buffer;
}

function unpad (paddedPlaintext) {
    paddedPlaintext = new Uint8Array(paddedPlaintext);
    var plaintext;
    for (var i = paddedPlaintext.length - 1; i >= 0; i--) {
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
module.exports = {
    ab2str: ab2str,
    str2ab: str2ab,
    pad: pad,
    unpad: unpad,
}
