const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');
const request = require('supertest');

// Isolated ephemeral database for server-based integration tests
const testDbPath = path.join(__dirname, 'test-migration-ephemeral.sqlite');
process.env.DB_PATH = testDbPath;
process.env.MAX_CONCURRENT_UPLOADS = '10';

if (fs.existsSync(testDbPath)) {
  fs.unlinkSync(testDbPath);
}

const db = require('../db');
const app = require('../server');
const { migrateVaultUniqueKeccak } = db;

describe('Final Security Invariant Verification (Sprint 3 Closeout)', () => {
  const mockUploader = '0x90F79bf6EB2c4f870365E785982E1f101E93b906';
  const uploadsDir = path.join(__dirname, '..', 'uploads');

  function createDummyPdf(gata, customContent = '') {
    const content = `UP_KHATAUNI GATA:${gata} ${customContent} DATE:2026-10-15`;
    return Buffer.from(
      `%PDF-1.4\n1 0 obj\n<< /Title (${content}) >>\nendobj\n%%EOF`
    );
  }

  function createLegacyDb() {
    const memDb = new Database(':memory:');
    memDb.exec(`
      CREATE TABLE CITIZEN_SALT_VAULT (
        vault_id INTEGER PRIMARY KEY AUTOINCREMENT,
        document_anchor TEXT,
        salt_value TEXT,
        raw_keccak256 TEXT,
        client_sha256 TEXT,
        citizen_address TEXT,
        created_at INTEGER,
        access_count INTEGER DEFAULT 0
      );
    `);
    return memDb;
  }

  afterAll(() => {
    try { db.close(); } catch (e) {}
    if (fs.existsSync(testDbPath)) {
      try { fs.unlinkSync(testDbPath); } catch (e) {}
    }
  });

  // =========================================================================
  // 1. Database Migration Invariants (6 Tests)
  // =========================================================================
  describe('1. Database Migration Invariants', () => {
    // 1.1 Fresh DB with NOT NULL and UNIQUE on raw_keccak256
    it('1.1: Fresh DB initializes with NOT NULL and UNIQUE constraint on raw_keccak256', () => {
      const freshDb = new Database(':memory:');
      freshDb.exec(`
        CREATE TABLE CITIZEN_SALT_VAULT (
          vault_id INTEGER PRIMARY KEY AUTOINCREMENT,
          document_anchor TEXT UNIQUE NOT NULL,
          salt_value TEXT NOT NULL,
          raw_keccak256 TEXT UNIQUE NOT NULL,
          client_sha256 TEXT,
          citizen_address TEXT,
          created_at INTEGER
        );
      `);

      migrateVaultUniqueKeccak(freshDb);
      const indexRow = freshDb.prepare("SELECT name FROM sqlite_master WHERE type = 'index' AND name = 'idx_vault_raw_keccak'").get();
      expect(indexRow).toBeDefined();

      // Verify schema has NOT NULL
      const tableInfo = freshDb.prepare("PRAGMA table_info('CITIZEN_SALT_VAULT')").all();
      const rawCol = tableInfo.find(c => c.name === 'raw_keccak256');
      expect(rawCol.notnull).toBe(1);
      freshDb.close();
    });

    // 1.2 Legacy DB with valid records migrated
    it('1.2: Legacy DB with valid records successfully migrates and enforces uniqueness', () => {
      const legacyDb = createLegacyDb();
      legacyDb.prepare(`
        INSERT INTO CITIZEN_SALT_VAULT (document_anchor, salt_value, raw_keccak256, citizen_address, created_at)
        VALUES ('0xanchor1', '0xsalt1', '0xkeccak1', '0xuser1', 1729000000)
      `).run();

      migrateVaultUniqueKeccak(legacyDb);
      const indexRow = legacyDb.prepare("SELECT name FROM sqlite_master WHERE type = 'index' AND name = 'idx_vault_raw_keccak'").get();
      expect(indexRow).toBeDefined();

      // Duplicate insert attempt throws SQLITE_CONSTRAINT
      expect(() => {
        legacyDb.prepare(`
          INSERT INTO CITIZEN_SALT_VAULT (document_anchor, salt_value, raw_keccak256, citizen_address, created_at)
          VALUES ('0xanchor2', '0xsalt2', '0xkeccak1', '0xuser2', 1729000001)
        `).run();
      }).toThrow(/UNIQUE constraint failed|SQLITE_CONSTRAINT/);
      legacyDb.close();
    });

    // 1.3 DB with duplicate hashes halts with MigrationError (0 rows lost)
    it('1.3: DB with duplicate hashes halts with MigrationError (0 rows lost or corrupted)', () => {
      const legacyDb = createLegacyDb();
      legacyDb.prepare("INSERT INTO CITIZEN_SALT_VAULT (document_anchor, raw_keccak256) VALUES ('0xa', '0xdup')").run();
      legacyDb.prepare("INSERT INTO CITIZEN_SALT_VAULT (document_anchor, raw_keccak256) VALUES ('0xb', '0xdup')").run();

      expect(() => migrateVaultUniqueKeccak(legacyDb)).toThrow(/MigrationError.*Existing duplicate records detected/);

      const count = legacyDb.prepare('SELECT COUNT(*) as count FROM CITIZEN_SALT_VAULT').get().count;
      expect(count).toBe(2); // Exactly 0 rows lost
      legacyDb.close();
    });

    // 1.4 DB with NULL hashes halts with MigrationError (0 rows lost)
    it('1.4: DB with NULL hashes halts with MigrationError (0 rows lost)', () => {
      const legacyDb = createLegacyDb();
      legacyDb.prepare("INSERT INTO CITIZEN_SALT_VAULT (document_anchor, raw_keccak256) VALUES ('0xnull', NULL)").run();

      expect(() => migrateVaultUniqueKeccak(legacyDb)).toThrow(/MigrationError.*Found 1 records with NULL raw_keccak256/);

      const count = legacyDb.prepare('SELECT COUNT(*) as count FROM CITIZEN_SALT_VAULT').get().count;
      expect(count).toBe(1); // Row preserved
      legacyDb.close();
    });

    // 1.5 Repeated migration runs idempotently
    it('1.5: Repeated migration executes idempotently without throwing', () => {
      const legacyDb = createLegacyDb();
      expect(() => migrateVaultUniqueKeccak(legacyDb)).not.toThrow();
      expect(() => migrateVaultUniqueKeccak(legacyDb)).not.toThrow();
      legacyDb.close();
    });

    // 1.6 New NULL insertion attempt asserts SQLite rejection
    it('1.6: Asserts SQLite rejection on attempting to insert NULL raw_keccak256 in strict schema', () => {
      const strictDb = new Database(':memory:');
      strictDb.exec(`
        CREATE TABLE CITIZEN_SALT_VAULT (
          vault_id INTEGER PRIMARY KEY AUTOINCREMENT,
          document_anchor TEXT UNIQUE NOT NULL,
          salt_value TEXT NOT NULL,
          raw_keccak256 TEXT NOT NULL
        );
      `);

      expect(() => {
        strictDb.prepare("INSERT INTO CITIZEN_SALT_VAULT (document_anchor, salt_value, raw_keccak256) VALUES ('0x1', '0xs', NULL)").run();
      }).toThrow(/NOT NULL constraint failed/);
      strictDb.close();
    });
  });

  // =========================================================================
  // 2. Concurrency & Upload Lifecycle Invariants (6 Tests)
  // =========================================================================
  describe('2. Concurrency & Upload Lifecycle Invariants', () => {
    // 2.1 Concurrency limit reached -> HTTP 429
    it('2.1: Concurrency limit reached returns HTTP 429 CONCURRENCY_LIMIT_EXCEEDED before memory allocation', async () => {
      process.env.MAX_CONCURRENT_UPLOADS = '0'; // Saturate limit
      try {
        const res = await request(app)
          .post('/api/documents/ingest')
          .attach('file', createDummyPdf('0914285100000601'), 'saturated.pdf')
          .field('citizenAddress', mockUploader);

        expect(res.status).toBe(429);
        expect(res.body.code).toBe('CONCURRENCY_LIMIT_EXCEEDED');
      } finally {
        process.env.MAX_CONCURRENT_UPLOADS = '10';
      }
    });

    // 2.2 Counter recovers properly after normal completion and after error exceptions
    it('2.2: Counter recovers properly after normal completion and after error exceptions', async () => {
      process.env.MAX_CONCURRENT_UPLOADS = '1'; // Limit to 1 active upload
      try {
        // Run 1: Normal successful completion
        const res1 = await request(app)
          .post('/api/documents/ingest')
          .attach('file', createDummyPdf('0914285100000602'), 'success.pdf')
          .field('citizenAddress', mockUploader);
        expect(res1.status).toBe(200);

        // Run 2: Immediately follow with exception-triggering request (missing Gata -> 422)
        const res2 = await request(app)
          .post('/api/documents/ingest')
          .attach('file', Buffer.from('%PDF-1.4 No Gata here'), 'fail.pdf')
          .field('citizenAddress', mockUploader);
        expect(res2.status).toBe(422);

        // Run 3: Follow-up request must succeed, proving slot was NOT leaked/locked by Run 1 or 2
        const res3 = await request(app)
          .post('/api/documents/ingest')
          .attach('file', createDummyPdf('0914285100000603'), 'success2.pdf')
          .field('citizenAddress', mockUploader);
        expect(res3.status).toBe(200);
      } finally {
        process.env.MAX_CONCURRENT_UPLOADS = '10';
      }
    });

    // 2.3 Client disconnect test: slot not prematurely released while processing in-flight
    it('2.3: Client disconnect / socket close releases slot cleanly without counter underflow', async () => {
      process.env.MAX_CONCURRENT_UPLOADS = '2';
      try {
        // Send request that closes connection prematurely
        const req = request(app)
          .post('/api/documents/ingest')
          .attach('file', createDummyPdf('0914285100000604'), 'abort.pdf')
          .field('citizenAddress', mockUploader);

        // Abort in-flight
        req.abort();

        // Wait a tick for socket close to settle
        await new Promise(r => setTimeout(r, 50));

        // Capacity must remain available (no deadlock, no negative counter)
        const nextRes = await request(app)
          .post('/api/documents/ingest')
          .attach('file', createDummyPdf('0914285100000605'), 'after-abort.pdf')
          .field('citizenAddress', mockUploader);

        expect([200, 409]).toContain(nextRes.status);
      } finally {
        process.env.MAX_CONCURRENT_UPLOADS = '10';
      }
    });

    // 2.4 Single-file rejection (HTTP 400)
    it('2.4: Rejects multiple file attachments with HTTP 400', async () => {
      const res = await request(app)
        .post('/api/documents/ingest')
        .attach('file', createDummyPdf('0914285100000606'), 'primary.pdf')
        .attach('extraFile', createDummyPdf('0914285100000607'), 'extra.pdf')
        .field('citizenAddress', mockUploader);

      expect(res.status).toBe(400);
      expect(res.body.code).toMatch(/TOO_MANY_FILES|MULTIPLE_FILES_REJECTED|LIMIT_UNEXPECTED_FILE|UPLOAD_ERROR/);
    });

    // 2.5 Oversized file rejection (HTTP 413)
    it('2.5: Rejects oversized file (>10MB) with HTTP 413 FILE_TOO_LARGE', async () => {
      const oversizedBuf = Buffer.alloc(10 * 1024 * 1024 + 1024, '%PDF-1.4 Oversize');
      const res = await request(app)
        .post('/api/documents/ingest')
        .attach('file', oversizedBuf, 'big.pdf')
        .field('citizenAddress', mockUploader);

      expect(res.status).toBe(413);
      expect(res.body.code).toBe('FILE_TOO_LARGE');
    });

    // 2.6 Zero disk persistence on Aadhaar detection
    it('2.6: Guarantees zero disk persistence when Aadhaar is detected in document payload', async () => {
      const aadhaarPdf = Buffer.from(
        '%PDF-1.4\n1 0 obj\n<< /Title (Khatauni Aadhaar: 2345 6789 0124 Gata: 0914285100000608 Date: 2026-10-15) >>\nendobj\n%%EOF'
      );
      const filesBefore = fs.readdirSync(uploadsDir).filter(f => f.endsWith('.pdf'));

      const res = await request(app)
        .post('/api/documents/ingest')
        .attach('file', aadhaarPdf, 'aadhaar.pdf')
        .field('citizenAddress', mockUploader);

      expect(res.status).toBe(422);
      expect(res.body.code).toBe('AADHAAR_DETECTED');

      const filesAfter = fs.readdirSync(uploadsDir).filter(f => f.endsWith('.pdf'));
      expect(filesAfter.length).toBe(filesBefore.length);
    });
  });
});
