/**
 * backend/test/valuationAuditEdgeCases.test.js
 * Independent Edge-Case & Adversarial Verification Test Suite for PKG-02 Safe Foundation.
 * Tests edge cases, boundaries, overlapping schedules, duplicate idempotency, concurrency, and validation.
 */

const path = require('path');
const fs = require('fs');
const request = require('supertest');

const testDbPath = path.join(__dirname, 'test-valuation-edge-cases.sqlite');
process.env.DB_PATH = testDbPath;
if (fs.existsSync(testDbPath)) fs.unlinkSync(testDbPath);

const db = require('../db');
const app = require('../server');
const {
  toPaisa,
  toRupees,
  multiplyAreaByRate,
  calculatePercentage,
  maxPaisa,
  minPaisa
} = require('../services/valuation/decimalMath');
const {
  canonicalize,
  toCanonicalJson,
  computeValuationHash
} = require('../services/valuation/auditReceiptService');

describe('PKG-02 Independent Audit Edge-Case & Adversarial Test Suite', () => {
  const TEST_VILLAGE = '09142851';
  const MOCK_DATE = 1761955200; // 2025-11-01T00:00:00Z

  beforeAll(() => {
    // Seed verified rate schedule fixture
    const scheduleStmt = db.prepare(`
      INSERT INTO CIRCLE_RATE_SCHEDULES (
        schedule_code, state_code, district, tehsil, village_code,
        authority_code, enabling_statute, applicable_additional_duty_rate,
        statutory_rate_ceiling, territorial_notification_ref, gazette_reference,
        gazette_date, notification_authority, effective_from, effective_to,
        verified_at, is_synthetic_illustrative, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    // Schedule 1: LDA standard active
    const res1 = scheduleStmt.run(
      'UP-LKO-SDR-VL09142851-2025-V1', 'UP', 'Lucknow', 'Sadar', TEST_VILLAGE,
      'LDA', 'UP_URBAN_PLANNING_ACT_1973_SEC_39', 0.02,
      0.05, 'Notification No. 1234/1974', 'Gazette Ref DM/LKO/2025/1',
      '2025-04-01', 'District Magistrate, Lucknow', 1743465600, null,
      1743465600, 1, 'ACTIVE', 1743465600
    );
    const s1Id = res1.lastInsertRowid;

    // Rate records for s1
    const recordStmt = db.prepare(`
      INSERT INTO CIRCLE_RATE_RECORDS (
        schedule_id, land_use, structure_type, road_tier, base_rate_sqm, construction_rate_sqm
      ) VALUES (?, ?, ?, ?, ?, ?)
    `);
    recordStmt.run(s1Id, 'RESIDENTIAL', 'INDIVIDUAL_PLOT_BUILDING', 'STANDARD', 25000, 15000);
    recordStmt.run(s1Id, 'COMMERCIAL', 'STANDALONE_COMMERCIAL', 'STANDARD', 50000, 20000);
    recordStmt.run(s1Id, 'COMMERCIAL', 'COMPLEX_MULTI_UNIT', 'STANDARD', 60000, 0);

    // Overlapping schedule test fixtures: Village OVERLAP_VL
    // Schedule A: older
    const resA = scheduleStmt.run(
      'UP-LKO-SDR-OVERLAP-A', 'UP', 'Lucknow', 'Sadar', 'OVERLAP_VL',
      'LDA', 'UP_URBAN_PLANNING_ACT_1973_SEC_39', 0.02,
      0.05, 'Notif A', 'Gazette A',
      '2024-01-01', 'DM', 1704067200, 1798761600, // 2024 to 2027
      1704067200, 1, 'ACTIVE', 1704067200
    );
    recordStmt.run(resA.lastInsertRowid, 'RESIDENTIAL', 'INDIVIDUAL_PLOT_BUILDING', 'STANDARD', 20000, 10000);

    // Schedule B: newer overlapping
    const resB = scheduleStmt.run(
      'UP-LKO-SDR-OVERLAP-B', 'UP', 'Lucknow', 'Sadar', 'OVERLAP_VL',
      'LDA', 'UP_URBAN_PLANNING_ACT_1973_SEC_39', 0.02,
      0.05, 'Notif B', 'Gazette B',
      '2025-01-01', 'DM', 1735689600, 1798761600, // 2025 to 2027
      1735689600, 1, 'ACTIVE', 1735689600
    );
    recordStmt.run(resB.lastInsertRowid, 'RESIDENTIAL', 'INDIVIDUAL_PLOT_BUILDING', 'STANDARD', 28000, 14000);
  });

  afterAll(() => {
    if (fs.existsSync(testDbPath)) {
      try { fs.unlinkSync(testDbPath); } catch (e) {}
    }
  });

  // ==========================================================================
  // Edge Case 1: Ultra High Value Transaction (₹500 Crore / ₹5,00,00,00,000)
  // ==========================================================================
  test('EC-1: Ultra High Value Transaction (₹500 Crore) computes exact paisa without overflow', async () => {
    const declaredConsideration = 5000000000; // 500 Crore
    const res = await request(app)
      .post('/api/valuation/calculate')
      .send({
        district: 'Lucknow',
        tehsil: 'Sadar',
        villageCode: TEST_VILLAGE,
        authorityCode: 'LDA',
        landUse: 'RESIDENTIAL',
        plotAreaSqm: 10000,
        declaredConsideration: declaredConsideration,
        buyerCategory: 'SOLE_MALE',
        transactionDate: MOCK_DATE
      });

    expect(res.status).toBe(200);
    // Base Stamp (5% of 500 Cr) = ₹25,00,00,000 (25 Cr)
    expect(res.body.duties.baseStampDuty).toBe(250000000);
    // LDA Surcharge (2% of 500 Cr) = ₹10,00,00,000 (10 Cr)
    expect(res.body.duties.urbanSurcharge).toBe(100000000);
    // Reg Fee (1% uncapped) = ₹5,00,00,000 (5 Cr)
    expect(res.body.duties.registrationFee).toBe(50000000);
    // Total Dues = 40 Cr
    expect(res.body.duties.totalStatutoryDues).toBe(400000000);
  });

  // ==========================================================================
  // Edge Case 2: Rounding Boundary at Half-Paisa (0.50 Rupee)
  // ==========================================================================
  test('EC-2: toRupees rounding boundary at exact 50 paisa', () => {
    // 10050n paisa = ₹100.50 -> rounds to ₹101
    expect(toRupees(10050n)).toBe(101);
    // 10049n paisa = ₹100.49 -> rounds to ₹100
    expect(toRupees(10049n)).toBe(100);
    // -10050n paisa = -₹100.50 -> rounds to -₹101
    expect(toRupees(-10050n)).toBe(-101);
    // -10049n paisa = -₹100.49 -> rounds to -₹100
    expect(toRupees(-10049n)).toBe(-100);
  });

  // ==========================================================================
  // Edge Case 3: Overlapping Active Schedules Temporal Resolution
  // ==========================================================================
  test('EC-3: Overlapping active schedules resolve to most recent effective_from', async () => {
    // In OVERLAP_VL, Schedule A starts 2024-01-01, Schedule B starts 2025-01-01.
    // Querying at MOCK_DATE (2025-11-01) should pick Schedule B (rate 28,000 vs 20,000)
    const res = await request(app)
      .post('/api/valuation/calculate')
      .send({
        district: 'Lucknow',
        tehsil: 'Sadar',
        villageCode: 'OVERLAP_VL',
        authorityCode: 'LDA',
        landUse: 'RESIDENTIAL',
        plotAreaSqm: 100,
        declaredConsideration: 1000000,
        transactionDate: MOCK_DATE
      });

    expect(res.status).toBe(200);
    expect(res.body.schedule.scheduleCode).toBe('UP-LKO-SDR-OVERLAP-B');
    // 100 sqm @ 28,000 = ₹28,00,000
    expect(res.body.valuation.landValue).toBe(2800000);
  });

  // ==========================================================================
  // Edge Case 4: Duplicate Submission Idempotency Probe
  // ==========================================================================
  test('EC-4: Duplicate identical calculation request (idempotency vs unique key constraint)', async () => {
    const payload = {
      district: 'Lucknow',
      tehsil: 'Sadar',
      villageCode: TEST_VILLAGE,
      authorityCode: 'LDA',
      landUse: 'RESIDENTIAL',
      plotAreaSqm: 200,
      declaredConsideration: 5500000,
      buyerCategory: 'SOLE_MALE',
      transactionDate: MOCK_DATE
    };

    // First request
    const res1 = await request(app).post('/api/valuation/calculate').send(payload);
    expect(res1.status).toBe(200);
    const hash1 = res1.body.valuationHash;

    // Second request with exact identical payload
    const res2 = await request(app).post('/api/valuation/calculate').send(payload);
    
    // Finding documented: Currently throws 500 UNIQUE constraint failed due to lack of INSERT OR IGNORE
    expect(res2.status).toBe(500);
    expect(res2.body.error).toContain('UNIQUE constraint failed: VALUATION_AUDIT_LOG.valuation_hash');
  });

  // ==========================================================================
  // Edge Case 5: High-Concurrency Calculation Requests
  // ==========================================================================
  test('EC-5: High-concurrency calculation requests (20 parallel requests)', async () => {
    const promises = Array.from({ length: 20 }).map((_, i) => {
      return request(app)
        .post('/api/valuation/calculate')
        .send({
          district: 'Lucknow',
          tehsil: 'Sadar',
          villageCode: TEST_VILLAGE,
          authorityCode: 'LDA',
          landUse: 'RESIDENTIAL',
          plotAreaSqm: 100 + i * 10,
          declaredConsideration: 3000000 + i * 50000,
          transactionDate: MOCK_DATE
        });
    });

    const results = await Promise.all(promises);
    results.forEach((res, idx) => {
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('SUCCESS');
      expect(res.body.valuationHash).toMatch(/^0x[a-f0-9]{64}$/);
    });
  });

  // ==========================================================================
  // Edge Case 6: Receipt Hash Parameterized Boundary Checks
  // ==========================================================================
  test('EC-6: Receipt endpoint parameter boundary validation', async () => {
    // 1. Invalid prefix (no 0x)
    const res1 = await request(app).get('/api/valuation/receipt/123456');
    expect(res1.status).toBe(400);
    expect(res1.body.status).toBe('INVALID_HASH');

    // 2. Invalid length (0x + 63 chars instead of 64)
    const res2 = await request(app).get('/api/valuation/receipt/0x' + 'a'.repeat(63));
    expect(res2.status).toBe(400);
    expect(res2.body.status).toBe('INVALID_HASH');

    // 3. Non-existent 66-character hash -> 404
    const res3 = await request(app).get('/api/valuation/receipt/0x' + '0'.repeat(64));
    expect(res3.status).toBe(404);
    expect(res3.body.status).toBe('RECEIPT_NOT_FOUND');
  });

  // ==========================================================================
  // Edge Case 7: Complex Multi-Unit with Zero or Missing Carpet Area
  // ==========================================================================
  test('EC-7: Complex multi-unit requires positive carpet area', async () => {
    const res = await request(app)
      .post('/api/valuation/calculate')
      .send({
        district: 'Lucknow',
        tehsil: 'Sadar',
        villageCode: TEST_VILLAGE,
        authorityCode: 'LDA',
        landUse: 'COMMERCIAL',
        structureType: 'COMPLEX_MULTI_UNIT',
        plotAreaSqm: 500, // plot area provided, but carpet area missing
        declaredConsideration: 5000000,
        transactionDate: MOCK_DATE
      });

    expect(res.status).toBe(422);
    expect(res.body.status).toBe('INVALID_INPUT_DIMENSION');
  });

  // ==========================================================================
  // Edge Case 8: Negative & Malformed Input Values Handling Probe
  // ==========================================================================
  test('EC-8: Negative & Malformed input values behavior probe', async () => {
    // 1. Negative plotAreaSqm: -200 silently evaluated to 0
    const resNegArea = await request(app)
      .post('/api/valuation/calculate')
      .send({
        district: 'Lucknow',
        tehsil: 'Sadar',
        villageCode: TEST_VILLAGE,
        authorityCode: 'LDA',
        landUse: 'RESIDENTIAL',
        plotAreaSqm: -200,
        declaredConsideration: 5000000,
        transactionDate: MOCK_DATE
      });

    expect(resNegArea.status).toBe(200);
    expect(resNegArea.body.valuation.landValue).toBe(0);

    // 2. Negative declaredConsideration: -500000 accepted and floored by circle rate
    const resNegConsideration = await request(app)
      .post('/api/valuation/calculate')
      .send({
        district: 'Lucknow',
        tehsil: 'Sadar',
        villageCode: TEST_VILLAGE,
        authorityCode: 'LDA',
        landUse: 'RESIDENTIAL',
        plotAreaSqm: 100,
        declaredConsideration: -500000,
        transactionDate: MOCK_DATE
      });

    expect(resNegConsideration.status).toBe(200);
    expect(resNegConsideration.body.valuation.totalCircleValue).toBe(2500000);
    expect(resNegConsideration.body.valuation.taxableBase).toBe(2500000);

    // 3. String 'abc' for plotAreaSqm silently evaluates to 0
    const resStringArea = await request(app)
      .post('/api/valuation/calculate')
      .send({
        district: 'Lucknow',
        tehsil: 'Sadar',
        villageCode: TEST_VILLAGE,
        authorityCode: 'LDA',
        landUse: 'RESIDENTIAL',
        plotAreaSqm: 'abc',
        declaredConsideration: 5000000,
        transactionDate: MOCK_DATE
      });

    expect(resStringArea.status).toBe(200);
    expect(resStringArea.body.valuation.landValue).toBe(0);
  });
});
