/**
 * backend/services/valuation/auditReceiptService.js
 * RFC 8785 Canonical JSON Serializer & Cancun EVM Keccak-256 Receipt Vault.
 * Enforces Zero-PII Invariant (DPDP Act, 2023).
 */

const { ethers } = require('ethers');

/**
 * Deep sorts object keys alphabetically adhering to RFC 8785 JSON Canonicalization Scheme (JCS).
 * @param {*} obj
 * @returns {*}
 */
function canonicalize(obj) {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map(canonicalize);
  }
  const sortedKeys = Object.keys(obj).sort();
  const result = {};
  for (const key of sortedKeys) {
    result[key] = canonicalize(obj[key]);
  }
  return result;
}

/**
 * Serializes an object to deterministic RFC 8785 canonical JSON string.
 * @param {Object} payload
 * @returns {string}
 */
function toCanonicalJson(payload) {
  return JSON.stringify(canonicalize(payload));
}

/**
 * Computes deterministic Keccak-256 valuation hash.
 * @param {string} canonicalInputJson
 * @param {string} canonicalResultJson
 * @returns {string} 0x-prefixed 32-byte hex string
 */
function computeValuationHash(canonicalInputJson, canonicalResultJson) {
  const combinedBytes = ethers.toUtf8Bytes(canonicalInputJson + '::' + canonicalResultJson);
  return ethers.keccak256(combinedBytes);
}

/**
 * Generates and persists a non-repudiable audit receipt in VALUATION_AUDIT_LOG.
 * @param {import('better-sqlite3').Database} db
 * @param {Object} input Original calculation input
 * @param {Object} result Computed calculation result
 * @param {string} [clientIp='127.0.0.1']
 * @returns {Object} { valuationHash, calculatedAt, canonicalInputs, canonicalResult }
 */
function createAndPersistReceipt(db, input, result, clientIp = '127.0.0.1') {
  // Sanitize input to guarantee zero-PII
  const sanitizedInput = {
    district: input.district,
    tehsil: input.tehsil,
    villageCode: input.villageCode,
    authorityCode: input.authorityCode,
    landUse: input.landUse,
    structureType: input.structureType,
    roadTier: input.roadTier,
    plotAreaSqm: input.plotAreaSqm,
    builtUpAreaSqm: input.builtUpAreaSqm,
    carpetAreaSqm: input.carpetAreaSqm,
    declaredConsideration: input.declaredConsideration,
    buyerCategory: input.buyerCategory,
    instrumentType: input.instrumentType || 'CONVEYANCE_SALE',
    transactionDate: input.transactionDate
  };

  const canonicalInputJson = toCanonicalJson(sanitizedInput);
  const canonicalResultJson = toCanonicalJson({
    schedule: result.schedule,
    valuation: result.valuation,
    duties: result.duties,
    auditFlags: result.auditFlags,
    calculationBasis: result.calculationBasis,
    isStatutoryDefinitive: result.isStatutoryDefinitive
  });

  const valuationHash = computeValuationHash(canonicalInputJson, canonicalResultJson);
  const calculatedAt = Math.floor(Date.now() / 1000);

  // Salted SHA-256 IP hash for zero-PII network audit
  const ipHash = ethers.sha256(ethers.toUtf8Bytes(clientIp + '::bhumi_valuation_salt_2026'));

  db.prepare(`
    INSERT INTO VALUATION_AUDIT_LOG (
        valuation_hash,
        instrument_type,
        authority_code,
        enabling_statute,
        inputs_json,
        result_json,
        rate_schedule_id,
        is_statutory_definitive,
        calculation_basis,
        conditional_flags,
        calculated_at,
        ip_hash
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    valuationHash,
    sanitizedInput.instrumentType,
    result.schedule.authorityCode,
    result.schedule.enablingStatute,
    canonicalInputJson,
    canonicalResultJson,
    result.schedule.scheduleId,
    result.isStatutoryDefinitive ? 1 : 0,
    result.calculationBasis,
    JSON.stringify(result.auditFlags),
    calculatedAt,
    ipHash
  );

  return {
    valuationHash,
    calculatedAt,
    canonicalInputJson,
    canonicalResultJson
  };
}

module.exports = {
  canonicalize,
  toCanonicalJson,
  computeValuationHash,
  createAndPersistReceipt
};
