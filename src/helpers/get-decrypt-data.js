var aesjs = require('aes-js');

var getDecryptData = async (text) => {
    var key = process.env.key;
    var iv = process.env.iv;

    // When ready to decrypt the hex string, convert it back to bytes
    var encryptedBytes = aesjs.utils.hex.toBytes(text);
    // The output feedback mode of operation maintains internal state,
    // so to decrypt a new instance must be instantiated.
    var aesOfb = new aesjs.ModeOfOperation.ofb(key, iv);
    var decryptedBytes = aesOfb.decrypt(encryptedBytes);

    // Convert our bytes back into text
    var decryptedText = aesjs.utils.utf8.fromBytes(decryptedBytes);

    // Send back the result through the success exit.
    return (decryptedText);
}

module.exports = {
    getDecryptData
}