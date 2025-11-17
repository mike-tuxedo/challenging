console.log('util.js LOADED')

const $id = id => document.getElementById(id);
const $ = selector => document.querySelector(selector);
const $$ = selector => document.querySelectorAll(selector);

function getUserKeys(username, uuid) {
    const message = username + uuid;
    const messageBytes = nacl.util.decodeUTF8(message);
    const hash = nacl.hash(messageBytes);
    const seed = hash.slice(0, 32);
    const keyPair = nacl.sign.keyPair.fromSeed(seed);
    const { publicKey, secretKey } = keyPair;
    const id = nacl.util.encodeBase64(publicKey).slice(0, 16);   
    return { id, publicKey, secretKey };
}

function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text || "";
    return div.innerHTML;
}

function encryptData(data) {
    const message = nacl.util.decodeUTF8(JSON.stringify(data));
    const nonce = nacl.randomBytes(24);
    const encrypted = nacl.secretbox(
        message,
        nonce,
        this.keyPair.secretKey.slice(0, 32)
    );

    return {
        encrypted: nacl.util.encodeBase64(encrypted),
        nonce: nacl.util.encodeBase64(nonce),
    };
}

function decryptData(encryptedObj) {
    const encrypted = nacl.util.decodeBase64(
        encryptedObj.encrypted
    );
    const nonce = nacl.util.decodeBase64(encryptedObj.nonce);
    const decrypted = nacl.secretbox.open(
        encrypted,
        nonce,
        this.keyPair.secretKey.slice(0, 32)
    );

    if (!decrypted) {
        throw new Error("Entschlüsselung fehlgeschlagen");
    }

    return JSON.parse(nacl.util.encodeUTF8(decrypted));
}

// export { $id, $, $$, getUserKeys, escapeHtml, encryptData, decryptData };