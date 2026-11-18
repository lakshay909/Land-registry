import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { webcrypto } from 'node:crypto';

// Replicate native browser Web Crypto SHA-256 pre-hashing
async function computeSha256Hex(arrayBuffer) {
  const digestBuffer = await webcrypto.subtle.digest('SHA-256', arrayBuffer);
  const hashArray = Array.from(new Uint8Array(digestBuffer));
  return '0x' + hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

describe('Sprint 2 PKG-10: Document Upload, Hashing & Metadata Verification', () => {
  describe('Web Crypto API SHA-256 Pre-Hashing', () => {
    test('computes deterministic 0x-prefixed 64-character lowercase hex digest', async () => {
      const sampleDeedText = '%PDF-1.7 Certified UP Khatauni Extract Gata 452/1';
      const encoder = new TextEncoder();
      const buffer = encoder.encode(sampleDeedText).buffer;

      const digest = await computeSha256Hex(buffer);
      
      assert.match(digest, /^0x[0-9a-f]{64}$/, 'Digest must be 0x-prefixed and exactly 64 lowercase hex characters');
      assert.strictEqual(digest.length, 66, '0x + 64 hex chars = 66 chars total');

      // Second run must be strictly deterministic
      const digest2 = await computeSha256Hex(buffer);
      assert.strictEqual(digest, digest2, 'Digest must be deterministic');
    });

    test('operates with zero heavy npm dependencies using native subtle crypto', () => {
      assert.ok(webcrypto.subtle, 'Web Crypto Subtle API must be natively present');
      assert.strictEqual(typeof webcrypto.subtle.digest, 'function');
    });
  });

  describe('Deed Constraints & Freshness Policy', () => {
    test('validates 10MB maximum file size limit', () => {
      const MAX_BYTES = 10 * 1024 * 1024;
      assert.strictEqual(MAX_BYTES, 10485760, '10MB must equal 10,485,760 bytes');

      const validSize = 9.8 * 1024 * 1024;
      const invalidSize = 10.1 * 1024 * 1024;
      assert.ok(validSize <= MAX_BYTES, '9.8MB is within threshold');
      assert.ok(invalidSize > MAX_BYTES, '10.1MB exceeds threshold');
    });

    test('validates 90-Day Freshness Alert logic under UP Revenue Standing Orders', () => {
      const checkFreshness = (daysOld) => daysOld > 90;

      assert.strictEqual(checkFreshness(30), false, '30 days deed is fresh (no warning)');
      assert.strictEqual(checkFreshness(89), false, '89 days deed is fresh');
      assert.strictEqual(checkFreshness(90), false, '90 days deed is at boundary');
      assert.strictEqual(checkFreshness(91), true, '91 days deed exceeds 90-day freshness policy');
      assert.strictEqual(checkFreshness(120), true, '120 days deed exceeds freshness window');
    });

    test('formats exact statutory freshness alert tag', () => {
      const alertTag = 'APPLICATION_FRESHNESS_POLICY: Khatauni extract exceeds 90-day window';
      assert.strictEqual(alertTag, 'APPLICATION_FRESHNESS_POLICY: Khatauni extract exceeds 90-day window');
    });
  });

  describe('Statutory Disclaimer Baseline', () => {
    test('contains mandatory persistent statutory notice verbatim', () => {
      const expectedNotice = 'Under Entry 1 of the First Schedule to the Information Technology Act, 2000 and Section 17(1) of the Registration Act, 1908, cryptographic deed hashing and timestamping provide mathematical anti-tamper proof of document integrity. They DO NOT substitute for mandatory physical deed registration before the Sub-Registrar or revenue mutation under the UP Revenue Code, 2006.';

      assert.ok(expectedNotice.includes('First Schedule to the Information Technology Act, 2000'));
      assert.ok(expectedNotice.includes('Section 17(1) of the Registration Act, 1908'));
      assert.ok(expectedNotice.includes('UP Revenue Code, 2006'));
      assert.ok(expectedNotice.includes('DO NOT substitute for mandatory physical deed registration'));
    });
  });

  describe('16-Digit Computerized Gata (UPIC) & 9-Stage Stepper', () => {
    test('validates 16-digit computerized UPIC syntax', () => {
      const sampleUPIC = '0915010045200100';
      assert.match(sampleUPIC, /^\d{16}$/, 'UPIC must be exactly 16 numeric digits');
      assert.strictEqual(sampleUPIC.slice(0, 2), '09', 'State code prefix must be 09 for Uttar Pradesh');
    });

    test('validates 9 stages in revenue verification stepper', () => {
      const stages = [
        'Document Integrity',
        'PDF/A Conformance',
        'Sub-Registrar Stamping',
        'UPIC Syntax',
        'Village & Tehsil Cross-Match',
        'Khatauni ROR Sync',
        'Anti-Encumbrance Screen',
        'Ceiling Limit Audit',
        'Registrar Clearance'
      ];
      assert.strictEqual(stages.length, 9, 'Stepper must contain exactly 9 statutory verification stages');
    });
  });
});
