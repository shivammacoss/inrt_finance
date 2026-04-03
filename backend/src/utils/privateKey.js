/**
 * Normalize and validate an Ethereum secp256k1 private key for ethers.js Wallet.
 * Accepts 64 hex chars with or without 0x; rejects invalid BytesLike inputs.
 */
function normalizePrivateKey(raw) {
  if (raw == null || String(raw).trim() === '') {
    const err = new Error('PRIVATE_KEY is empty');
    err.code = 'INVALID_PRIVATE_KEY';
    throw err;
  }
  let s = String(raw).trim();
  if (
    (s.startsWith('"') && s.endsWith('"')) ||
    (s.startsWith("'") && s.endsWith("'"))
  ) {
    s = s.slice(1, -1).trim();
  }
  if (s.startsWith('0x') || s.startsWith('0X')) {
    s = `0x${s.slice(2).toLowerCase()}`;
  } else if (/^[0-9a-fA-F]{64}$/.test(s)) {
    s = `0x${s.toLowerCase()}`;
  } else {
    const err = new Error(
      'PRIVATE_KEY must be 64 hex characters, optionally prefixed with 0x (got invalid format)'
    );
    err.code = 'INVALID_PRIVATE_KEY';
    throw err;
  }
  const hex = s.slice(2);
  if (!/^[0-9a-f]{64}$/.test(hex)) {
    const err = new Error(
      'PRIVATE_KEY must be exactly 32 bytes (64 hex digits after 0x)'
    );
    err.code = 'INVALID_PRIVATE_KEY';
    throw err;
  }
  return s;
}

module.exports = { normalizePrivateKey };
