const crypto = require('crypto');
const { ethers } = require('ethers');

/**
 * Generates a 32-byte cryptographically secure pseudorandom salt.
 * @returns {string} 0x-prefixed 64-character hex string (total 66 chars).
 */
function generateSalt() {
  return '0x' + crypto.randomBytes(32).toString('hex');
}

/**
 * Computes standard SHA-256 digest hex string from a buffer.
 * @param {Buffer|Uint8Array} buffer
 * @returns {string} 64-character hex string.
 */
function computeSha256(buffer) {
  if (!buffer || buffer.length === 0) {
    throw new Error('BUFFER_REQUIRED');
  }
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

/**
 * Validates client pre-hash against backend computed SHA-256.
 * Case-insensitive and tolerates optional 0x prefix.
 * @param {Buffer|Uint8Array} buffer
 * @param {string} clientSha256
 * @returns {boolean}
 */
function verifyClientChecksum(buffer, clientSha256) {
  if (!buffer || !clientSha256 || typeof clientSha256 !== 'string') {
    return false;
  }
  const computed = computeSha256(buffer).toLowerCase().replace(/^0x/, '');
  const client = clientSha256.trim().toLowerCase().replace(/^0x/, '');
  return computed === client;
}

/**
 * Computes EVM Cancun compatible Keccak-256 hash using ethers.
 * Strictly uses new Uint8Array(buffer) to match smart contract hashing.
 * @param {Buffer|Uint8Array} buffer
 * @returns {string} 0x-prefixed 64-character hex string.
 */
function computeRawKeccak256(buffer) {
  if (!buffer || buffer.length === 0) {
    throw new Error('BUFFER_REQUIRED');
  }
  return ethers.keccak256(new Uint8Array(buffer));
}

/**
 * Derives a two-stage salted anchor commitment:
 * Keccak-256(rawKeccakHex || saltHex)
 * @param {string} rawKeccakHex 0x-prefixed 32-byte hex string
 * @param {string} saltHex 0x-prefixed 32-byte hex string
 * @returns {string} 0x-prefixed 64-character hex string
 */
function computeSaltedAnchor(rawKeccakHex, saltHex) {
  if (!rawKeccakHex || typeof rawKeccakHex !== 'string') {
    throw new Error('INVALID_RAW_KECCAK');
  }
  if (!saltHex || typeof saltHex !== 'string') {
    throw new Error('INVALID_SALT');
  }
  const formattedRaw = rawKeccakHex.startsWith('0x') ? rawKeccakHex : '0x' + rawKeccakHex;
  const formattedSalt = saltHex.startsWith('0x') ? saltHex : '0x' + saltHex;

  if (!/^0x[a-fA-F0-9]{64}$/.test(formattedRaw)) {
    throw new Error('MALFORMED_RAW_KECCAK');
  }
  if (!/^0x[a-fA-F0-9]{64}$/.test(formattedSalt)) {
    throw new Error('MALFORMED_SALT');
  }

  return ethers.keccak256(ethers.concat([formattedRaw, formattedSalt]));
}

/**
 * Verifies document anchor against input buffer and salt.
 * @param {Buffer|Uint8Array} fileBuffer
 * @param {string} saltHex
 * @param {string} expectedAnchor
 * @returns {boolean}
 */
function verifyAnchor(fileBuffer, saltHex, expectedAnchor) {
  if (!fileBuffer || !saltHex || !expectedAnchor) return false;
  try {
    const rawKeccak = computeRawKeccak256(fileBuffer);
    const computedAnchor = computeSaltedAnchor(rawKeccak, saltHex);
    return computedAnchor.toLowerCase() === expectedAnchor.trim().toLowerCase();
  } catch (err) {
    return false;
  }
}

module.exports = {
  generateSalt,
  computeSha256,
  verifyClientChecksum,
  computeRawKeccak256,
  computeSaltedAnchor,
  verifyAnchor,
  // Helper alias for backward compatibility
  computeDocumentHash: computeRawKeccak256
};
