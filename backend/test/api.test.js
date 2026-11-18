const path = require('path');
const fs = require('fs');

// Configure isolated test SQLite database path BEFORE importing db or app
const testDbPath = path.join(__dirname, 'test-ephemeral.sqlite');
process.env.DB_PATH = testDbPath;

if (fs.existsSync(testDbPath)) {
  fs.unlinkSync(testDbPath);
}

const request = require('supertest');
const db = require('../db');
const app = require('../server');

describe('Backend REST API Integration Tests (Isolated Ephemeral Database)', () => {
  const mockOwner = '0x70997970C51812dc3A010C7d01b50e0d17dc79C8';
  const mockBuyer = '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC';
  const mockDocHash = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
  const mockNewDocHash = '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890';

  beforeAll(() => {
    // Seed test data into isolated database
    // 1. Property 1: Verified and For Sale on Marketplace
    db.prepare(`
      INSERT INTO PROPERTIES (property_id, location_hash, area, current_owner, document_hash, is_verified, is_frozen, registered_at, price, is_for_sale)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(1, 'geo:28.6139,77.2090', 1200, mockOwner, mockDocHash, 1, 0, 1729000000, '2000000000000000000', 1);

    // 2. Property 2: Verified, Not for Sale
    db.prepare(`
      INSERT INTO PROPERTIES (property_id, location_hash, area, current_owner, document_hash, is_verified, is_frozen, registered_at, price, is_for_sale)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(2, 'geo:19.0760,72.8777', 850, mockOwner, mockNewDocHash, 1, 0, 1729001000, '0', 0);

    // 3. Property 3: Pending verification
    db.prepare(`
      INSERT INTO PROPERTIES (property_id, location_hash, area, current_owner, document_hash, is_verified, is_frozen, registered_at, price, is_for_sale)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(3, 'geo:12.9716,77.5946', 2000, mockBuyer, '0x3333333333333333333333333333333333333333333333333333333333333333', 0, 0, 1729002000, '0', 0);

    // 4. Property 4: Disputed / Frozen
    db.prepare(`
      INSERT INTO PROPERTIES (property_id, location_hash, area, current_owner, document_hash, is_verified, is_frozen, registered_at, price, is_for_sale)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(4, 'geo:13.0827,80.2707', 500, mockOwner, '0x4444444444444444444444444444444444444444444444444444444444444444', 1, 1, 1729003000, '0', 0);

    // Seed Transfers
    db.prepare(`
      INSERT INTO TRANSFERS (transfer_id, property_id, from_address, to_address, new_document_hash, from_signed, to_signed, authority_approved, executed, created_at, escrow_amount)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(1, 1, mockOwner, mockBuyer, mockNewDocHash, 1, 1, 0, 0, 1729004000, '2000000000000000000');

    // Seed Audit Events
    db.prepare(`
      INSERT INTO AUDIT_EVENTS (property_id, event_type, tx_hash, block_number, timestamp, log_index, from_address, to_address)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(1, 'PropertyRegistered', '0xtx1', 10, 1729000000, 0, null, mockOwner);

    db.prepare(`
      INSERT INTO AUDIT_EVENTS (property_id, event_type, tx_hash, block_number, timestamp, log_index, from_address, to_address)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(1, 'PropertyListed', '0xtx2', 12, 1729000500, 0, mockOwner, null);

    // Seed Documents
    db.prepare(`
      INSERT INTO DOCUMENTS (document_hash, file_reference, uploaded_by, uploaded_at)
      VALUES (?, ?, ?, ?)
    `).run(mockDocHash, '/uploads/mock-deed.pdf', mockOwner, 1729000000);
  });

  afterAll(() => {
    try {
      db.close();
    } catch (e) {}
    if (fs.existsSync(testDbPath)) {
      try {
        fs.unlinkSync(testDbPath);
      } catch (e) {}
    }
  });

  describe('Health Route', () => {
    it('GET /api/health returns status ok or structured json', async () => {
      const res = await request(app).get('/api/health');
      expect([200, 500]).toContain(res.status);
      expect(res.body).toHaveProperty('status');
    });
  });

  describe('Properties & Marketplace Routes', () => {
    it('GET /api/properties returns all properties', async () => {
      const res = await request(app).get('/api/properties');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(4);
      expect(res.body[0]).toHaveProperty('propertyId');
      expect(res.body[0]).toHaveProperty('isForSale');
      expect(res.body[0]).toHaveProperty('price');
    });

    it('GET /api/properties/marketplace returns only active for-sale properties', async () => {
      const res = await request(app).get('/api/properties/marketplace');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(1);
      expect(res.body[0].propertyId).toBe(1);
      expect(res.body[0].isForSale).toBe(true);
      expect(res.body[0].price).toBe('2000000000000000000');
    });

    it('GET /api/marketplace direct alias route returns marketplace properties', async () => {
      const res = await request(app).get('/api/marketplace');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(1);
      expect(res.body[0].propertyId).toBe(1);
    });

    it('GET /api/properties?status=for-sale filters correctly', async () => {
      const res = await request(app).get('/api/properties?status=for-sale');
      expect(res.status).toBe(200);
      expect(res.body.length).toBe(1);
      expect(res.body[0].propertyId).toBe(1);
    });

    it('GET /api/properties?status=verified filters verified non-frozen', async () => {
      const res = await request(app).get('/api/properties?status=verified');
      expect(res.status).toBe(200);
      expect(res.body.length).toBe(2);
    });

    it('GET /api/properties?status=pending filters pending properties', async () => {
      const res = await request(app).get('/api/properties?status=pending');
      expect(res.status).toBe(200);
      expect(res.body.length).toBe(1);
      expect(res.body[0].propertyId).toBe(3);
    });

    it('GET /api/properties?status=frozen filters frozen properties', async () => {
      const res = await request(app).get('/api/properties?status=frozen');
      expect(res.status).toBe(200);
      expect(res.body.length).toBe(1);
      expect(res.body[0].propertyId).toBe(4);
    });

    it('GET /api/properties?owner=... filters by owner address', async () => {
      const res = await request(app).get(`/api/properties?owner=${mockOwner}`);
      expect(res.status).toBe(200);
      expect(res.body.length).toBe(3);
    });

    it('GET /api/properties/:id returns single property with inline history', async () => {
      const res = await request(app).get('/api/properties/1');
      expect(res.status).toBe(200);
      expect(res.body.propertyId).toBe(1);
      expect(res.body.isForSale).toBe(true);
      expect(Array.isArray(res.body.history)).toBe(true);
      expect(res.body.history.length).toBe(1);
      expect(res.body.history[0].eventType).toBe('PropertyRegistered');
    });

    it('GET /api/properties/:id/history returns ownership timeline array', async () => {
      const res = await request(app).get('/api/properties/1/history');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(1);
      expect(res.body[0].eventType).toBe('PropertyRegistered');
    });

    it('GET /api/properties/invalid returns 400', async () => {
      const res = await request(app).get('/api/properties/abc');
      expect(res.status).toBe(400);
      expect(res.body.code).toBe('INVALID_ID');
    });

    it('GET /api/properties/999 returns 404 for non-existent property', async () => {
      const res = await request(app).get('/api/properties/999');
      expect(res.status).toBe(404);
      expect(res.body.code).toBe('NOT_FOUND');
    });
  });

  describe('Transfers & Escrow Routes', () => {
    it('GET /api/transfers returns transfers list with escrowAmount', async () => {
      const res = await request(app).get('/api/transfers');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(1);
      expect(res.body[0].transferId).toBe(1);
      expect(res.body[0].escrowAmount).toBe('2000000000000000000');
    });

    it('GET /api/transfers?status=pending returns pending transfers', async () => {
      const res = await request(app).get('/api/transfers?status=pending');
      expect(res.status).toBe(200);
      expect(res.body.length).toBe(1);
    });

    it('GET /api/transfers?party=... filters by participant address', async () => {
      const res = await request(app).get(`/api/transfers?party=${mockBuyer}`);
      expect(res.status).toBe(200);
      expect(res.body.length).toBe(1);
    });

    it('GET /api/transfers?party=invalid returns 400 for malformed address', async () => {
      const res = await request(app).get('/api/transfers?party=0xinvalid');
      expect(res.status).toBe(400);
      expect(res.body.code).toBe('INVALID_ADDRESS');
    });

    it('GET /api/transfers/:id returns single transfer details', async () => {
      const res = await request(app).get('/api/transfers/1');
      expect(res.status).toBe(200);
      expect(res.body.transferId).toBe(1);
      expect(res.body.fromAddress).toBe(mockOwner);
      expect(res.body.toAddress).toBe(mockBuyer);
      expect(res.body.escrowAmount).toBe('2000000000000000000');
    });

    it('GET /api/transfers/999 returns 404', async () => {
      const res = await request(app).get('/api/transfers/999');
      expect(res.status).toBe(404);
      expect(res.body.code).toBe('NOT_FOUND');
    });
  });

  describe('Documents Routes', () => {
    it('GET /api/documents/:hash returns document reference metadata', async () => {
      const res = await request(app).get(`/api/documents/${mockDocHash}`);
      expect(res.status).toBe(200);
      expect(res.body.documentHash).toBe(mockDocHash);
      expect(res.body.fileReference).toBe('/uploads/mock-deed.pdf');
    });

    it('GET /api/documents/invalid returns 400 for invalid hash format', async () => {
      const res = await request(app).get('/api/documents/0x123');
      expect(res.status).toBe(400);
      expect(res.body.code).toBe('INVALID_HASH');
    });

    it('GET /api/documents/0x... returns 404 for unknown hash', async () => {
      const unknownHash = '0x9999999999999999999999999999999999999999999999999999999999999999';
      const res = await request(app).get(`/api/documents/${unknownHash}`);
      expect(res.status).toBe(404);
      expect(res.body.code).toBe('NOT_FOUND');
    });

    it('POST /api/documents uploads file and computes keccak256 hash', async () => {
      const testBuffer = Buffer.from('%PDF-1.4 test deed content');
      const res = await request(app)
        .post('/api/documents')
        .attach('file', testBuffer, 'test-deed.pdf')
        .field('uploader', mockOwner);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('documentHash');
      expect(res.body).toHaveProperty('fileReference');
      expect(res.body.documentHash).toMatch(/^0x[a-fA-F0-9]{64}$/);

      // Clean up uploaded test file if on disk
      const uploadedFile = path.join(__dirname, '..', res.body.fileReference.replace(/^\//, ''));
      if (fs.existsSync(uploadedFile)) {
        fs.unlinkSync(uploadedFile);
      }
    });

    it('POST /api/documents without file returns 400', async () => {
      const res = await request(app).post('/api/documents');
      expect(res.status).toBe(400);
      expect(res.body.code).toBe('NO_FILE');
    });
  });

  describe('Audit Log Routes', () => {
    it('GET /api/audit-log returns event history sorted newest first', async () => {
      const res = await request(app).get('/api/audit-log');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(2);
      expect(res.body[0].eventType).toBe('PropertyListed');
    });

    it('GET /api/audit-log?propertyId=1 filters by property ID', async () => {
      const res = await request(app).get('/api/audit-log?propertyId=1');
      expect(res.status).toBe(200);
      expect(res.body.length).toBe(2);
      expect(res.body.every(e => e.propertyId === 1)).toBe(true);
    });

    it('GET /api/audit-log?propertyId=invalid returns 400', async () => {
      const res = await request(app).get('/api/audit-log?propertyId=invalid');
      expect(res.status).toBe(400);
      expect(res.body.code).toBe('INVALID_ID');
    });
  });
});
