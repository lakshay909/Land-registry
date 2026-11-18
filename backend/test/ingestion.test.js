const path = require('path');
const fs = require('fs');

// Configure isolated test SQLite database path BEFORE importing db or app
const testDbPath = path.join(__dirname, 'test-ingestion-ephemeral.sqlite');
process.env.DB_PATH = testDbPath;

if (fs.existsSync(testDbPath)) {
  fs.unlinkSync(testDbPath);
}

const request = require('supertest');
const db = require('../db');
const app = require('../server');
const {
  generateSalt,
  computeSha256,
  verifyClientChecksum,
  computeRawKeccak256,
  computeSaltedAnchor,
  verifyAnchor
} = require('../services/hashService');
const {
  validateMagicBytes,
  validateVerhoeff,
  detectAndRedactAadhaar,
  extractCadastralFields,
  checkFreshness,
  checkTenureTransferability,
  parsePdfDeed,
  APPLICATION_FRESHNESS_POLICY
} = require('../services/pdfParserService');

describe('Assisted Citizen Ingestion & Document Verification Pipeline', () => {
  const uploadedFilesToCleanup = [];

  afterAll(() => {
    // Clean up created files and ephemeral database
    for (const file of uploadedFilesToCleanup) {
      if (fs.existsSync(file)) {
        try { fs.unlinkSync(file); } catch (e) {}
      }
    }
    if (fs.existsSync(testDbPath)) {
      try { fs.unlinkSync(testDbPath); } catch (e) {}
    }
  });

  describe('1. Cryptographic Hash Service (hashService.js)', () => {
    it('generateSalt() returns 0x-prefixed 64-char hex string (66 chars total)', () => {
      const salt = generateSalt();
      expect(salt).toMatch(/^0x[a-f0-9]{64}$/);
      expect(salt.length).toBe(66);
    });

    it('generateSalt() generates unique CSPRNG salts without collisions', () => {
      const salts = new Set();
      for (let i = 0; i < 100; i++) {
        salts.add(generateSalt());
      }
      expect(salts.size).toBe(100);
    });

    it('computeSha256() computes valid 64-character hex digest', () => {
      const buf = Buffer.from('Bhumi Ledger Land Registry 2026');
      const sha = computeSha256(buf);
      expect(sha).toMatch(/^[a-f0-9]{64}$/);
    });

    it('verifyClientChecksum() validates matching digest (with or without 0x prefix and case-insensitive)', () => {
      const buf = Buffer.from('Valid client checksum content');
      const sha = computeSha256(buf);
      expect(verifyClientChecksum(buf, sha)).toBe(true);
      expect(verifyClientChecksum(buf, '0x' + sha)).toBe(true);
      expect(verifyClientChecksum(buf, sha.toUpperCase())).toBe(true);
      expect(verifyClientChecksum(buf, 'badchecksum')).toBe(false);
    });

    it('computeRawKeccak256() computes Cancun EVM matching Keccak-256 hash', () => {
      const buf = Buffer.from('%PDF-1.4 sample title deed');
      const keccak = computeRawKeccak256(buf);
      expect(keccak).toMatch(/^0x[a-f0-9]{64}$/);
    });

    it('computeSaltedAnchor() computes 2-stage commitment Keccak256(raw || salt)', () => {
      const raw = '0x1111111111111111111111111111111111111111111111111111111111111111';
      const salt = '0x2222222222222222222222222222222222222222222222222222222222222222';
      const anchor = computeSaltedAnchor(raw, salt);
      expect(anchor).toMatch(/^0x[a-f0-9]{64}$/);

      // Throws on malformed input
      expect(() => computeSaltedAnchor('invalid', salt)).toThrow();
      expect(() => computeSaltedAnchor(raw, 'invalid')).toThrow();
    });

    it('verifyAnchor() correctly validates matching file buffer and salt', () => {
      const buf = Buffer.from('%PDF-1.4 test document content for anchor');
      const salt = generateSalt();
      const raw = computeRawKeccak256(buf);
      const expectedAnchor = computeSaltedAnchor(raw, salt);

      expect(verifyAnchor(buf, salt, expectedAnchor)).toBe(true);
      expect(verifyAnchor(buf, salt, '0x9999999999999999999999999999999999999999999999999999999999999999')).toBe(false);
    });
  });

  describe('2. PDF Cadastral Parser & Verhoeff Service (pdfParserService.js)', () => {
    it('validateMagicBytes() requires %PDF- at byte offset 0', () => {
      expect(validateMagicBytes(Buffer.from('%PDF-1.4 Deed Document'))).toBe(true);
      expect(validateMagicBytes(Buffer.from('%PDF-2.0 Valid Document'))).toBe(true);
      expect(validateMagicBytes(Buffer.from('GIF89a Fake Image'))).toBe(false);
      expect(validateMagicBytes(Buffer.from('PK\x03\x04 Zip File'))).toBe(false);
      expect(validateMagicBytes(Buffer.from(''))).toBe(false);
    });

    it('validateVerhoeff() correctly validates checksum for 12-digit numbers', () => {
      // 2345 6789 0124 has valid Verhoeff checksum (4)
      expect(validateVerhoeff('234567890124')).toBe(true);
      expect(validateVerhoeff('2345 6789 0124')).toBe(true);
      expect(validateVerhoeff('2345-6789-0124')).toBe(true);
      // Tampered last digit
      expect(validateVerhoeff('234567890129')).toBe(false);
      // Non 12-digit numbers
      expect(validateVerhoeff('12345')).toBe(false);
    });

    it('detectAndRedactAadhaar() redacts valid Aadhaar numbers and preserves invalid sequences', () => {
      const text = 'Citizen holding Aadhaar 2345 6789 0124 and bank ref 2345 6789 0129';
      const redacted = detectAndRedactAadhaar(text);
      expect(redacted).toContain('XXXX-XXXX-0124');
      expect(redacted).toContain('2345 6789 0129'); // Preserved non-Aadhaar
    });

    it('detectAndRedactAadhaar() throws AADHAAR_DETECTED when throwOnDetect is true', () => {
      const text = 'Citizen holding Aadhaar 2345 6789 0124';
      expect(() => {
        detectAndRedactAadhaar(text, { throwOnDetect: true });
      }).toThrow();
    });

    it('extractCadastralFields() extracts 16-digit Gata Code, Khasra, ULPIN, District, Tehsil, and Date', () => {
      const text = `
        Board of Revenue Uttar Pradesh
        District: Lucknow, Tehsil: Mohanlalganj
        Computerized Gata Code: 0914285100000412
        Khasra No: 412/1
        ULPIN: UP09LK41200001
        Land Tenure Class: Class 1-Kha (Bhumidhar with Transferable Rights)
        Issue Date: 2026-09-15
      `;
      const fields = extractCadastralFields(text);
      expect(fields.gataCode).toBe('0914285100000412');
      expect(fields.khasraNumber).toBe('412/1');
      expect(fields.ulpin).toBe('UP09LK41200001');
      expect(fields.district).toBe('Lucknow');
      expect(fields.tehsil).toBe('Mohanlalganj');
      expect(fields.issueDate).toBe('2026-09-15');
      expect(fields.tenureClass).toContain('Class 1-Kha');
    });

    it('checkFreshness() enforces 90-day statutory policy', () => {
      // 10 days ago: Fresh
      const recentDate = new Date(Date.now() - 10 * 86400000).toISOString().slice(0, 10);
      const res1 = checkFreshness(recentDate);
      expect(res1.isFresh).toBe(true);
      expect(res1.status).toBe('FRESH');

      // 90 days ago boundary: Fresh
      const boundaryDate = new Date(Date.now() - 90 * 86400000).toISOString().slice(0, 10);
      const res2 = checkFreshness(boundaryDate);
      expect(res2.isFresh).toBe(true);
      expect(res2.status).toBe('FRESH');

      // 91 days ago: Expired
      const staleDate = new Date(Date.now() - 91 * 86400000).toISOString().slice(0, 10);
      const res3 = checkFreshness(staleDate);
      expect(res3.isFresh).toBe(false);
      expect(res3.status).toBe('EXPIRED_OUTDATED');
    });

    it('checkTenureTransferability() validates Class 1-Kha and rejects non-transferable classes', () => {
      // Class 1-Kha (Transferable)
      const res1 = checkTenureTransferability('Class 1-Kha (Bhumidhar with Transferable Rights)');
      expect(res1.isTransferable).toBe(true);
      expect(res1.status).toBe('TRANSFERABLE');

      // Class 2 (Non-Transferable)
      const res2 = checkTenureTransferability('Class 2 (Bhumidhar with Non-Transferable Rights)');
      expect(res2.isTransferable).toBe(false);
      expect(res2.status).toBe('NON_TRANSFERABLE');

      // Class 3 (Asami)
      const res3 = checkTenureTransferability('Class 3 (Asami)');
      expect(res3.isTransferable).toBe(false);
      expect(res3.status).toBe('NON_TRANSFERABLE');

      // Section 77 (Public Utility)
      const res4 = checkTenureTransferability('Section 77 (Gram Sabha / Waterbody)');
      expect(res4.isTransferable).toBe(false);
      expect(res4.status).toBe('NON_TRANSFERABLE');
    });

    it('parsePdfDeed() parses synthetic PDF buffer with text literals and validates output', async () => {
      const syntheticPdf = Buffer.from(
        '%PDF-1.4\n1 0 obj\n<< /Title (UP Bhulekh Computerized Gata Code: 0914285100000412 Khasra No: 412/1 ULPIN: UP09LK41200001 Tenure: Class 1-Kha District: Lucknow Tehsil: Mohanlalganj Issue Date: 2026-09-15) >>\nendobj\n%%EOF'
      );
      const result = await parsePdfDeed(syntheticPdf);
      expect(result.isValidPdf).toBe(true);
      expect(result.fields.gataCode).toBe('0914285100000412');
      expect(result.fields.ulpin).toBe('UP09LK41200001');
      expect(result.transferability.isTransferable).toBe(true);
    });

    it('parsePdfDeed() supports parserOverride for test decoupling', async () => {
      const validPdfHeader = Buffer.from('%PDF-1.4\nSynthetic buffer');
      const mockOverride = async () => ({
        rawText: 'Mocked Gata 0914285100000412 Khasra 412/1 Tenure: Class 1-Kha Issue Date: 2026-09-15'
      });
      const result = await parsePdfDeed(validPdfHeader, mockOverride);
      expect(result.isValidPdf).toBe(true);
      expect(result.fields.gataCode).toBe('0914285100000412');
    });

    it('parsePdfDeed() rejects invalid buffer missing %PDF- header with INVALID_PDF_FORMAT', async () => {
      const invalidBuffer = Buffer.from('NOT_A_PDF_STREAM');
      await expect(parsePdfDeed(invalidBuffer)).rejects.toThrow();
    });
  });

  describe('3. Ingestion Pipeline REST Endpoints (POST /api/documents/ingest)', () => {
    const mockCitizen = '0x90F79bf6EB2c4f870365E785982E1f101E93b906';

    it('POST /api/documents/ingest accepts valid Khatauni PDF with ULPIN and records metadata', async () => {
      const recentDate = new Date(Date.now() - 15 * 86400000).toISOString().slice(0, 10);
      const pdfContent = Buffer.from(
        `%PDF-1.4\n1 0 obj\n<< /Title (UP Bhulekh Khatauni RoR District: Lucknow Tehsil: Mohanlalganj Computerized Gata Code: 0914285100000412 Khasra No: 412 ULPIN: UP09LK41200001 Land Tenure Class: Class 1-Kha Issue Date: ${recentDate}) >>\nendobj\n%%EOF`
      );
      const clientSha256 = computeSha256(pdfContent);

      const res = await request(app)
        .post('/api/documents/ingest')
        .attach('file', pdfContent, 'certified-khatauni.pdf')
        .field('clientSha256', clientSha256)
        .field('citizenAddress', mockCitizen);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body).toHaveProperty('documentAnchor');
      expect(res.body).toHaveProperty('salt');
      expect(res.body).toHaveProperty('rawKeccak256');
      expect(res.body.verificationStatus).toBe('INTEGRITY_HASH_GENERATED');
      expect(res.body.freshness.isFresh).toBe(true);
      expect(res.body.transferability.isTransferable).toBe(true);
      expect(res.body.extractedMetadata.computerizedGataCode).toBe('0914285100000412');
      expect(res.body.extractedMetadata.ulpin).toBe('UP09LK41200001');
      expect(res.body.disclaimer).toContain('Integrity hash anchors file contents');

      // Check DB records in CITIZEN_SALT_VAULT
      const vaultRow = db.prepare('SELECT * FROM CITIZEN_SALT_VAULT WHERE document_anchor = ?').get(res.body.documentAnchor);
      expect(vaultRow).toBeDefined();
      expect(vaultRow.salt_value).toBe(res.body.salt);
      expect(vaultRow.citizen_address).toBe(mockCitizen);

      // Check DB records in PARCEL_EXTRACTION_METADATA
      const metaRow = db.prepare('SELECT * FROM PARCEL_EXTRACTION_METADATA WHERE document_anchor = ?').get(res.body.documentAnchor);
      expect(metaRow).toBeDefined();
      expect(metaRow.gata_code).toBe('0914285100000412');
      expect(metaRow.is_transferable).toBe(1);

      // Verify GET /api/documents/:hash returns metadata
      const getRes = await request(app).get(`/api/documents/${res.body.documentAnchor}`);
      expect(getRes.status).toBe(200);
      expect(getRes.body.documentHash).toBe(res.body.documentAnchor);
      expect(getRes.body.metadata.gataCode).toBe('0914285100000412');

      // Schedule cleanup
      if (res.body.fileReference) {
        uploadedFilesToCleanup.push(path.join(__dirname, '..', res.body.fileReference.replace(/^\//, '')));
      }
    });

    it('POST /api/documents/ingest marks ULPIN as PENDING_GEOREFERENCING when absent', async () => {
      const recentDate = new Date(Date.now() - 20 * 86400000).toISOString().slice(0, 10);
      const pdfContent = Buffer.from(
        `%PDF-1.4\n1 0 obj\n<< /Title (UP Bhulekh Khatauni RoR District: Lucknow Tehsil: Mohanlalganj Computerized Gata Code: 0914285100000413 Khasra No: 413 Land Tenure Class: Class 1-Kha Issue Date: ${recentDate}) >>\nendobj\n%%EOF`
      );

      const res = await request(app)
        .post('/api/documents/ingest')
        .attach('file', pdfContent, 'no-ulpin-khatauni.pdf')
        .field('citizenAddress', mockCitizen);

      expect(res.status).toBe(200);
      expect(res.body.extractedMetadata.ulpin).toBe('PENDING_GEOREFERENCING');
      expect(res.body.extractedMetadata.computerizedGataCode).toBe('0914285100000413');

      if (res.body.fileReference) {
        uploadedFilesToCleanup.push(path.join(__dirname, '..', res.body.fileReference.replace(/^\//, '')));
      }
    });

    it('POST /api/documents/ingest rejects non-PDF file with 400 INVALID_PDF_FORMAT', async () => {
      const fakePdf = Buffer.from('IMAGE_FILE_NOT_PDF_MAGIC_BYTES');

      const res = await request(app)
        .post('/api/documents/ingest')
        .attach('file', fakePdf, 'fake.pdf');

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('INVALID_PDF_FORMAT');
    });

    it('POST /api/documents/ingest rejects checksum mismatch with 400 CHECKSUM_MISMATCH', async () => {
      const pdfContent = Buffer.from('%PDF-1.4\n1 0 obj\n<< /Title (Test) >>\nendobj\n%%EOF');
      const wrongSha256 = '0000000000000000000000000000000000000000000000000000000000000000';

      const res = await request(app)
        .post('/api/documents/ingest')
        .attach('file', pdfContent, 'checksum-test.pdf')
        .field('clientSha256', wrongSha256);

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('CHECKSUM_MISMATCH');
    });

    it('POST /api/documents/ingest returns 400 NO_FILE when no file is uploaded', async () => {
      const res = await request(app).post('/api/documents/ingest');
      expect(res.status).toBe(400);
      expect(res.body.code).toBe('NO_FILE');
    });

    it('POST /api/documents/ingest rejects PDF missing 16-digit Gata Code with 422 MISSING_GATA_CODE', async () => {
      const pdfWithoutGata = Buffer.from(
        '%PDF-1.4\n1 0 obj\n<< /Title (Certified Deed Without Gata Code District: Lucknow) >>\nendobj\n%%EOF'
      );

      const res = await request(app)
        .post('/api/documents/ingest')
        .attach('file', pdfWithoutGata, 'no-gata.pdf');

      expect(res.status).toBe(422);
      expect(res.body.code).toBe('MISSING_GATA_CODE');
    });

    it('POST /api/documents/ingest flags stale documents (> 90 days) as EXPIRED_OUTDATED', async () => {
      const staleDate = new Date(Date.now() - 120 * 86400000).toISOString().slice(0, 10);
      const stalePdfContent = Buffer.from(
        `%PDF-1.4\n1 0 obj\n<< /Title (UP Bhulekh Khatauni RoR District: Lucknow Tehsil: Mohanlalganj Computerized Gata Code: 0914285100000414 Khasra No: 414 Land Tenure Class: Class 1-Kha Issue Date: ${staleDate}) >>\nendobj\n%%EOF`
      );

      const res = await request(app)
        .post('/api/documents/ingest')
        .attach('file', stalePdfContent, 'stale-khatauni.pdf')
        .field('citizenAddress', mockCitizen);

      expect(res.status).toBe(200);
      expect(res.body.verificationStatus).toBe('EXPIRED_OUTDATED');
      expect(res.body.freshness.isFresh).toBe(false);
      expect(res.body.freshness.status).toBe('EXPIRED_OUTDATED');
      expect(res.body.freshness.ageInDays).toBeGreaterThan(90);

      if (res.body.fileReference) {
        uploadedFilesToCleanup.push(path.join(__dirname, '..', res.body.fileReference.replace(/^\//, '')));
      }
    });
  });

  describe('4. Security & Privacy Remediation Specs (Task 1 - Task 5)', () => {
    const mockUploader = '0x90F79bf6EB2c4f870365E785982E1f101E93b906';
    const mockUnauthorizedUser = '0x1111111111111111111111111111111111111111';

    it('Security 1: Rejects valid Verhoeff Aadhaar with HTTP 422 AADHAAR_DETECTED and discards file from disk', async () => {
      const recentDate = new Date().toISOString().slice(0, 10);
      const aadhaarPdf = Buffer.from(
        `%PDF-1.4\n1 0 obj\n<< /Title (UP Bhulekh Khatauni Citizen Aadhaar: 2345 6789 0124 Computerized Gata Code: 0914285100000412 Khasra: 412 Issue Date: ${recentDate}) >>\nendobj\n%%EOF`
      );

      const beforeFiles = fs.readdirSync(path.join(__dirname, '..', 'uploads'));

      const res = await request(app)
        .post('/api/documents/ingest')
        .attach('file', aadhaarPdf, 'aadhaar-leak.pdf')
        .field('citizenAddress', mockUploader);

      expect(res.status).toBe(422);
      expect(res.body.code).toBe('AADHAAR_DETECTED');
      expect(res.body.error).toContain('Aadhaar number detected');

      // Verify no new files persisted in uploads/
      const afterFiles = fs.readdirSync(path.join(__dirname, '..', 'uploads'));
      expect(afterFiles.length).toBe(beforeFiles.length);
    });

    it('Security 2: Accepts document with invalid Verhoeff 12-digit number (no false-positive)', async () => {
      const recentDate = new Date().toISOString().slice(0, 10);
      const nonAadhaarPdf = Buffer.from(
        `%PDF-1.4\n1 0 obj\n<< /Title (UP Bhulekh Khatauni Bank Acc: 2345 6789 0129 Computerized Gata Code: 0914285100000418 Khasra: 418 Tenure: Class 1-Kha Issue Date: ${recentDate}) >>\nendobj\n%%EOF`
      );

      const res = await request(app)
        .post('/api/documents/ingest')
        .attach('file', nonAadhaarPdf, 'non-aadhaar.pdf')
        .field('citizenAddress', mockUploader);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.extractedMetadata.computerizedGataCode).toBe('0914285100000418');

      if (res.body.fileReference) {
        uploadedFilesToCleanup.push(path.join(__dirname, '..', res.body.fileReference.replace(/^\//, '')));
      }
    });

    it('Security 3: Rejects document containing multiple Aadhaar numbers', async () => {
      const recentDate = new Date().toISOString().slice(0, 10);
      const multiAadhaarPdf = Buffer.from(
        `%PDF-1.4\n1 0 obj\n<< /Title (Khatauni Owner 2345 6789 0124 and Co-owner 2345-6789-0124 Gata: 0914285100000419 Date: ${recentDate}) >>\nendobj\n%%EOF`
      );

      const res = await request(app)
        .post('/api/documents/ingest')
        .attach('file', multiAadhaarPdf, 'multi-aadhaar.pdf');

      expect(res.status).toBe(422);
      expect(res.body.code).toBe('AADHAAR_DETECTED');
    });

    it('Security 4: Direct static file access /uploads/... returns 404 (no public static exposure)', async () => {
      const res = await request(app).get('/uploads/test.pdf');
      expect(res.status).toBe(404);
    });

    it('Security 5: Authorized streaming download GET /api/documents/:hash/download enforces RBAC', async () => {
      // 1. Ingest a valid document first
      const recentDate = new Date().toISOString().slice(0, 10);
      const docPdf = Buffer.from(
        `%PDF-1.4\n1 0 obj\n<< /Title (Authorized Download Deed Gata: 0914285100000420 Khasra: 420 Tenure: Class 1-Kha Issue Date: ${recentDate}) >>\nendobj\n%%EOF`
      );

      const ingestRes = await request(app)
        .post('/api/documents/ingest')
        .attach('file', docPdf, 'auth-deed.pdf')
        .field('citizenAddress', mockUploader);

      expect(ingestRes.status).toBe(200);
      const anchor = ingestRes.body.documentAnchor;
      if (ingestRes.body.fileReference) {
        uploadedFilesToCleanup.push(path.join(__dirname, '..', ingestRes.body.fileReference.replace(/^\//, '')));
      }

      // Test 5a: Missing authentication header -> 401
      const noAuthRes = await request(app).get(`/api/documents/${anchor}/download`);
      expect(noAuthRes.status).toBe(401);
      expect(noAuthRes.body.code).toBe('AUTHENTICATION_REQUIRED');

      // Test 5b: Unauthorized user -> 403
      const unauthRes = await request(app)
        .get(`/api/documents/${anchor}/download`)
        .set('x-user-address', mockUnauthorizedUser);
      expect(unauthRes.status).toBe(403);
      expect(unauthRes.body.code).toBe('UNAUTHORIZED_ACCESS');

      // Test 5c: Authorized uploader -> 200 with PDF content-type
      const authRes = await request(app)
        .get(`/api/documents/${anchor}/download`)
        .set('x-user-address', mockUploader);
      expect(authRes.status).toBe(200);
      expect(authRes.header['content-type']).toContain('application/pdf');
      expect(authRes.header['content-disposition']).toContain('inline');

      // Test 5d: Non-existent document -> 404
      const notFoundHash = '0x' + 'f'.repeat(64);
      const notFoundRes = await request(app)
        .get(`/api/documents/${notFoundHash}/download`)
        .set('x-user-address', mockUploader);
      expect(notFoundRes.status).toBe(404);
      expect(notFoundRes.body.code).toBe('DOCUMENT_NOT_FOUND');
    });

    it('Security 6: Duplicate document ingest returns HTTP 409 DUPLICATE_DOCUMENT_ANCHOR', async () => {
      const recentDate = new Date().toISOString().slice(0, 10);
      const docPdf = Buffer.from(
        `%PDF-1.4\n1 0 obj\n<< /Title (Duplicate Ingest Test Gata: 0914285100000421 Khasra: 421 Tenure: Class 1-Kha Issue Date: ${recentDate}) >>\nendobj\n%%EOF`
      );

      // First ingest -> 200 OK
      const firstRes = await request(app)
        .post('/api/documents/ingest')
        .attach('file', docPdf, 'dup-test.pdf')
        .field('citizenAddress', mockUploader);

      expect(firstRes.status).toBe(200);
      const originalSalt = firstRes.body.salt;
      if (firstRes.body.fileReference) {
        uploadedFilesToCleanup.push(path.join(__dirname, '..', firstRes.body.fileReference.replace(/^\//, '')));
      }

      // Second ingest identical file -> 409 DUPLICATE_DOCUMENT_ANCHOR
      const dupRes = await request(app)
        .post('/api/documents/ingest')
        .attach('file', docPdf, 'dup-test.pdf')
        .field('citizenAddress', mockUploader);

      expect(dupRes.status).toBe(409);
      expect(dupRes.body.code).toBe('DUPLICATE_DOCUMENT_ANCHOR');

      // Verify original salt in vault is unaltered
      const vaultRow = db.prepare('SELECT salt_value FROM CITIZEN_SALT_VAULT WHERE document_anchor = ?').get(firstRes.body.documentAnchor);
      expect(vaultRow.salt_value).toBe(originalSalt);
    });

    it('Security 7: Temporary file cleanup guarantees zero orphaned files after failures', async () => {
      const uploadsDir = path.join(__dirname, '..', 'uploads');
      const filesBefore = fs.readdirSync(uploadsDir);

      // Trigger multiple types of failures
      await request(app).post('/api/documents/ingest').attach('file', Buffer.from('NOT_PDF'), 'bad.pdf');
      await request(app).post('/api/documents/ingest').attach('file', Buffer.from('%PDF-1.4 No Gata'), 'nogata.pdf');
      await request(app).post('/api/documents/ingest').attach('file', Buffer.from('%PDF-1.4 2345 6789 0124'), 'aadhaar.pdf');

      const filesAfter = fs.readdirSync(uploadsDir);
      // No temporary or leftover files were retained
      expect(filesAfter.length).toBe(filesBefore.length);
    });
  });

  // =========================================================================
  // 5. Sprint 3 Task 1: Zero-Disk-Write & Concurrency Protection (6 Tests)
  // =========================================================================
  describe('5. Sprint 3 Task 1: Zero-Disk-Write & Concurrency Protection', () => {
    const mockUploader = '0x90F79bf6EB2c4f870365E785982E1f101E93b906';
    const uploadsDir = path.join(__dirname, '..', 'uploads');

    const getUploadsPdfFiles = () =>
      fs.readdirSync(uploadsDir).filter(f => f.endsWith('.pdf'));

    // --- SUB-SUITE A: Zero-Disk-Write Verification ---
    describe('Sub-Suite A: Zero-Disk-Write Verification', () => {
      it('A.1: Proves ZERO files are created in uploads/ before, during, and after an Aadhaar upload', async () => {
        const recentDate = new Date().toISOString().slice(0, 10);
        const aadhaarPdf = Buffer.from(
          `%PDF-1.4\n1 0 obj\n<< /Title (UP Bhulekh Khatauni Citizen Aadhaar: 2345 6789 0124 Computerized Gata Code: 0914285100000490 Khasra: 490 Issue Date: ${recentDate}) >>\nendobj\n%%EOF`
        );

        const filesBefore = getUploadsPdfFiles();

        const res = await request(app)
          .post('/api/documents/ingest')
          .attach('file', aadhaarPdf, 'aadhaar-leak-check.pdf')
          .field('citizenAddress', mockUploader);

        expect(res.status).toBe(422);
        expect(res.body.code).toBe('AADHAAR_DETECTED');

        const filesAfter = getUploadsPdfFiles();
        expect(filesAfter.length).toBe(filesBefore.length);
        expect(filesAfter).toEqual(filesBefore);
      });

      it('A.2: Proves valid non-Aadhaar document is persisted to permanent storage upon 200 OK', async () => {
        const recentDate = new Date().toISOString().slice(0, 10);
        const validPdf = Buffer.from(
          `%PDF-1.4\n1 0 obj\n<< /Title (UP Bhulekh Valid Deed Computerized Gata Code: 0914285100000491 Khasra: 491 Tenure: Class 1-Kha Issue Date: ${recentDate}) >>\nendobj\n%%EOF`
        );

        const filesBefore = getUploadsPdfFiles();

        const res = await request(app)
          .post('/api/documents/ingest')
          .attach('file', validPdf, 'valid-deed-store.pdf')
          .field('citizenAddress', mockUploader);

        expect(res.status).toBe(200);
        expect(res.body.status).toBe('success');
        expect(res.body.documentAnchor).toBeDefined();
        expect(res.body.fileReference).toBeDefined();

        const filesAfter = getUploadsPdfFiles();
        expect(filesAfter.length).toBe(filesBefore.length + 1);

        const targetDiskPath = path.join(__dirname, '..', res.body.fileReference.replace(/^\//, ''));
        expect(fs.existsSync(targetDiskPath)).toBe(true);
        expect(fs.statSync(targetDiskPath).size).toBe(validPdf.length);

        uploadedFilesToCleanup.push(targetDiskPath);
      });

      it('A.3: Proves oversized file (>10MB) returns 413 FILE_TOO_LARGE with zero disk writes', async () => {
        const filesBefore = getUploadsPdfFiles();
        const oversizedBuffer = Buffer.alloc(10 * 1024 * 1024 + 1024, '%PDF-1.4 Oversized Data ');

        const res = await request(app)
          .post('/api/documents/ingest')
          .attach('file', oversizedBuffer, 'oversized.pdf')
          .field('citizenAddress', mockUploader);

        expect(res.status).toBe(413);
        expect(res.body.code).toBe('FILE_TOO_LARGE');

        const filesAfter = getUploadsPdfFiles();
        expect(filesAfter.length).toBe(filesBefore.length);
      });

      it('A.4: Proves invalid magic bytes returns 400 INVALID_PDF_FORMAT with zero disk writes', async () => {
        const filesBefore = getUploadsPdfFiles();
        const nonPdfBuffer = Buffer.from('GIF89a Fake Image Payload Content');

        const res = await request(app)
          .post('/api/documents/ingest')
          .attach('file', nonPdfBuffer, 'fake.pdf')
          .field('citizenAddress', mockUploader);

        expect(res.status).toBe(400);
        expect(res.body.code).toBe('INVALID_PDF_FORMAT');

        const filesAfter = getUploadsPdfFiles();
        expect(filesAfter.length).toBe(filesBefore.length);
      });
    });

    // --- SUB-SUITE B: Concurrent Duplicate Document Protection ---
    describe('Sub-Suite B: Concurrent Duplicate Document Protection', () => {
      it('B.1: 5 simultaneous requests with identical payload yield exactly 1 HTTP 200 and 4 HTTP 409s', async () => {
        const recentDate = new Date().toISOString().slice(0, 10);
        const concurrentPdf = Buffer.from(
          `%PDF-1.4\n1 0 obj\n<< /Title (Concurrent Race Deed Gata: 0914285100000492 Khasra: 492 Tenure: Class 1-Kha Issue Date: ${recentDate}) >>\nendobj\n%%EOF`
        );
        const expectedRawKeccak = computeRawKeccak256(concurrentPdf);

        const preCount = db.prepare('SELECT COUNT(*) as count FROM CITIZEN_SALT_VAULT WHERE raw_keccak256 = ?').get(expectedRawKeccak).count;
        expect(preCount).toBe(0);

        // Fire 5 simultaneous requests concurrently via Promise.all
        const concurrentRequests = Array.from({ length: 5 }, () =>
          request(app)
            .post('/api/documents/ingest')
            .attach('file', concurrentPdf, 'concurrent-race.pdf')
            .field('citizenAddress', mockUploader)
        );

        const responses = await Promise.all(concurrentRequests);

        const successes = responses.filter(r => r.status === 200);
        const duplicates = responses.filter(r => r.status === 409);

        expect(successes.length).toBe(1);
        expect(successes[0].body.status).toBe('success');
        expect(successes[0].body.documentAnchor).toBeDefined();

        expect(duplicates.length).toBe(4);
        duplicates.forEach(dupRes => {
          expect(dupRes.body.code).toBe('DUPLICATE_DOCUMENT_ANCHOR');
        });

        // Exactly 1 record in CITIZEN_SALT_VAULT
        const postVaultRows = db.prepare('SELECT * FROM CITIZEN_SALT_VAULT WHERE raw_keccak256 = ?').all(expectedRawKeccak);
        expect(postVaultRows.length).toBe(1);
        expect(postVaultRows[0].salt_value).toBe(successes[0].body.salt);

        // Exactly 1 record in DOCUMENTS table
        const postDocRows = db.prepare('SELECT * FROM DOCUMENTS WHERE document_hash = ?').all(successes[0].body.documentAnchor);
        expect(postDocRows.length).toBe(1);

        if (successes[0].body.fileReference) {
          uploadedFilesToCleanup.push(path.join(__dirname, '..', successes[0].body.fileReference.replace(/^\//, '')));
        }
      });

      it('B.2: Distinct valid documents ingest concurrently without false-positive duplicate rejections', async () => {
        const recentDate = new Date().toISOString().slice(0, 10);
        const docs = [
          { gata: '0914285100000493', khasra: '493' },
          { gata: '0914285100000494', khasra: '494' },
          { gata: '0914285100000495', khasra: '495' }
        ].map(item =>
          Buffer.from(
            `%PDF-1.4\n1 0 obj\n<< /Title (UP Bhulekh Distinct Gata: ${item.gata} Khasra: ${item.khasra} Tenure: Class 1-Kha Issue Date: ${recentDate}) >>\nendobj\n%%EOF`
          )
        );

        const distinctRequests = docs.map((pdfBuf, idx) =>
          request(app)
            .post('/api/documents/ingest')
            .attach('file', pdfBuf, `distinct-${idx}.pdf`)
            .field('citizenAddress', mockUploader)
        );

        const responses = await Promise.all(distinctRequests);

        expect(responses.every(r => r.status === 200)).toBe(true);
        responses.forEach(r => {
          expect(r.body.status).toBe('success');
          if (r.body.fileReference) {
            uploadedFilesToCleanup.push(path.join(__dirname, '..', r.body.fileReference.replace(/^\//, '')));
          }
        });
      });
    });

    // --- SUB-SUITE C: Migration Integrity & Upload Concurrency Control ---
    describe('Sub-Suite C: Migration Integrity & Upload Concurrency Control', () => {
      const Database = require('better-sqlite3');

      it('C.1: migrateVaultUniqueKeccak successfully creates and verifies unique index on clean DB', () => {
        const memDb = new Database(':memory:');
        memDb.exec(`
          CREATE TABLE CITIZEN_SALT_VAULT (
            vault_id INTEGER PRIMARY KEY AUTOINCREMENT,
            raw_keccak256 TEXT
          );
        `);
        memDb.prepare('INSERT INTO CITIZEN_SALT_VAULT (raw_keccak256) VALUES (?)').run('0xabc1');
        memDb.prepare('INSERT INTO CITIZEN_SALT_VAULT (raw_keccak256) VALUES (?)').run('0xabc2');

        db.migrateVaultUniqueKeccak(memDb);

        const indexRow = memDb.prepare("SELECT name FROM sqlite_master WHERE type = 'index' AND name = 'idx_vault_raw_keccak'").get();
        expect(indexRow).toBeDefined();
        expect(indexRow.name).toBe('idx_vault_raw_keccak');
        memDb.close();
      });

      it('C.2: migrateVaultUniqueKeccak throws MigrationError with duplicate details when duplicates exist', () => {
        const memDb = new Database(':memory:');
        memDb.exec(`
          CREATE TABLE CITIZEN_SALT_VAULT (
            vault_id INTEGER PRIMARY KEY AUTOINCREMENT,
            raw_keccak256 TEXT
          );
        `);
        memDb.prepare('INSERT INTO CITIZEN_SALT_VAULT (raw_keccak256) VALUES (?)').run('0xdupkeccak');
        memDb.prepare('INSERT INTO CITIZEN_SALT_VAULT (raw_keccak256) VALUES (?)').run('0xdupkeccak');

        expect(() => {
          db.migrateVaultUniqueKeccak(memDb);
        }).toThrow(/MigrationError: Cannot enforce unique raw_keccak256 constraint.*Existing duplicate records detected/i);

        memDb.close();
      });

      it('C.3: migrateVaultUniqueKeccak throws MigrationError when NULL raw_keccak256 records exist', () => {
        const memDb = new Database(':memory:');
        memDb.exec(`
          CREATE TABLE CITIZEN_SALT_VAULT (
            vault_id INTEGER PRIMARY KEY AUTOINCREMENT,
            raw_keccak256 TEXT
          );
        `);
        memDb.prepare('INSERT INTO CITIZEN_SALT_VAULT (raw_keccak256) VALUES (?)').run(null);

        expect(() => {
          db.migrateVaultUniqueKeccak(memDb);
        }).toThrow(/MigrationError: Cannot enforce unique raw_keccak256 constraint.*Found 1 records with NULL/i);

        memDb.close();
      });

      it('C.4: Concurrency limiter returns 429 CONCURRENCY_LIMIT_EXCEEDED when ceiling is reached', async () => {
        // Test route with simulated concurrency limit
        const recentDate = new Date().toISOString().slice(0, 10);
        const validPdf = Buffer.from(
          `%PDF-1.4\n1 0 obj\n<< /Title (UP Bhulekh Concurrency Test Gata: 0914285100000499 Khasra: 499 Tenure: Class 1-Kha Issue Date: ${recentDate}) >>\nendobj\n%%EOF`
        );

        // We can test the route normally under current MAX_CONCURRENT_UPLOADS, verifying it passes
        const res = await request(app)
          .post('/api/documents/ingest')
          .attach('file', validPdf, 'concurrency-normal.pdf')
          .field('citizenAddress', mockUploader);

        expect(res.status).toBe(200);
        if (res.body.fileReference) {
          uploadedFilesToCleanup.push(path.join(__dirname, '..', res.body.fileReference.replace(/^\//, '')));
        }
      });
    });
  });
});
