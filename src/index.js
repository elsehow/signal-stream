var signal = require('signal-protocol')
var through = require('through2')
var JSONStream = require('JSONStream')
const PREKEY_BUNDLE_CODE = 3 //textsecure.protobuf.IncomingPushMessageSignal.Type.PREKEY_BUNDLE
var pumpify = require('pumpify')


function streamF (f) {
  return through.obj(function (buf, enc, next) {
    f(buf, enc).then(x => {
      next(null, x)
    }, err => {
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
    var b = new Buffer(ab)
    return b
  }
  // returns a promise of plaintext
  return function (ciphertext) {
    if (ciphertext.type == PREKEY_BUNDLE_CODE)
      return cipher.decryptPreKeyWhisperMessage(ciphertext.body, 'binary')
      .then(bufferify)
    return cipher.decryptWhisperMessage(ciphertext.body, 'binary')
      .then(bufferify)
  }
}

module.exports = function (cipher, opts) {

  if (!opts)
    opts={}

  var encryptF = encryptor(cipher)
  var decryptF = decryptor(cipher)

  var encS = streamF(encryptF)
  var decS = streamF(decryptF)

  if (opts.jsonIn) {
    // parse input before decyrpting
    var parser = JSONStream.parse('*')
    decS = pumpify(parser, decS)
  }

  if (opts.jsonOut) {
    // stringifiy output after encrypting
    var stringer = JSONStream.stringify()
    encS = pumpify(encS, stringer)
  }

  return {
    encrypt: encS,
    decrypt: decS,
    _encryptF: encryptF,
    _decryptF: decryptF,
  }
}
