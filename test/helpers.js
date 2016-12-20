module.exports = function (signal) {
  
  function generateIdentity(store) {
    return Promise.all([
      signal.KeyHelper.generateIdentityKeyPair(),
      signal.KeyHelper.generateRegistrationId(),
    ]).then(function(result) {
      store.put('identityKey', result[0]);
      store.put('registrationId', result[1]);
    });
  }
  
  function generatePreKeyBundle(store, preKeyId, signedPreKeyId) {
    return Promise.all([
      store.getIdentityKeyPair(),
      store.getLocalRegistrationId()
    ]).then(function(result) {
      var identity = result[0];
      var registrationId = result[1];
  
      return Promise.all([
        signal.KeyHelper.generatePreKey(preKeyId),
        signal.KeyHelper.generateSignedPreKey(identity, signedPreKeyId),
      ]).then(function(keys) {
        var preKey = keys[0];
        var signedPreKey = keys[1];
  
        store.storePreKey(preKeyId, preKey.keyPair);
        store.storeSignedPreKey(signedPreKeyId, signedPreKey.keyPair);
  
        return {
          identityKey: identity.pubKey,
          registrationId : registrationId,
          preKey:  {
            keyId     : preKeyId,
            publicKey : preKey.keyPair.pubKey
          },
          signedPreKey: {
            keyId     : signedPreKeyId,
            publicKey : signedPreKey.keyPair.pubKey,
            signature : signedPreKey.signature
          }
        };
      });
    });
  }
  
  var SignalStore =
      require('signal-protocol/test/InMemorySignalProtocolStore.js')
  
  
  
  // returns a promise of
  // [ aliceSessionCipher, bobSessionCipher ]
  function bobAliceSessionCiphers () {
      var ALICE_ADDRESS = new signal.SignalProtocolAddress("+14151111111", 1);
      var BOB_ADDRESS   = new signal.SignalProtocolAddress("+14152222222", 1);
  
      var aliceStore = new SignalStore();
      var bobStore = new SignalStore();
  
      var bobPreKeyId = 1337;
      var bobSignedKeyId = 1;
  
      return Promise.all([
          generateIdentity(aliceStore),
          generateIdentity(bobStore),
      ]).then(function() {
          return generatePreKeyBundle(bobStore, bobPreKeyId, bobSignedKeyId);
      }).then(function(preKeyBundle) {
          var builder = new signal.SessionBuilder(aliceStore, BOB_ADDRESS);
          return builder.processPreKey(preKeyBundle)
      }).then(function () {
          var aliceSessionCipher = new signal.SessionCipher(aliceStore, BOB_ADDRESS);
          var bobSessionCipher = new signal.SessionCipher(bobStore, ALICE_ADDRESS);
          return [ aliceSessionCipher, bobSessionCipher ]
      })
  }
  
  function imageBuffer () {
    var filepath = __dirname + '/oakland-bridge.jpg'
    var trueBuf = require('fs').readFileSync(filepath)
    return trueBuf
  }
  return {
    imageBuffer: imageBuffer,
    bobAliceSessionCiphers: bobAliceSessionCiphers,
  }

} 
