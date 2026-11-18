/**
 * backend/test/valuationSafeFoundation.test.js
 * Ephemeral Integration Test Suite for PKG-02 Safe Foundation (Part B).
 * Tests all 7 pillars of the legally neutral valuation engine.
 * Isolated database: test-valuation-safe-ephemeral.sqlite
 */

const path = require('path');
const fs = require('fs');
const request = require('supertest');
const { ethers } = require('ethers');

const testDbPath = path.join(__dirname, 'test-valuation-safe-ephemeral.sqlite');
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

describe('PKG-02 Legally Neutral Safe Foundation Test Suite (Part B)', () => {
  const TEST_VILLAGE = '09142851';
  const MOCK_DATE = 1761955200; // 2025-11-01T00:00:00Z

  beforeAll(() => {
    // Seed verified rate schedule fixture (synthetic illustrative)
    const scheduleStmt = db.prepare(`
      INSERT INTO CIRCLE_RATE_SCHEDULES (
        schedule_code, state_code, district, tehsil, village_code,
        authority_code, enabling_statute, applicable_additional_duty_rate,
        statutory_rate_ceiling, territorial_notification_ref, gazette_reference,
        gazette_date, notification_authority, effective_from, effective_to,
        verified_at, is_synthetic_illustrative, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    // 1. Active Verified Schedule (LDA, 2.0% surcharge)
    const resLda = scheduleStmt.run(
      'UP-LKO-SDR-VL09142851-2025-V1', 'UP', 'Lucknow', 'Sadar', TEST_VILLAGE,
      'LDA', 'UP_URBAN_PLANNING_ACT_1973_SEC_39', 0.02,
      0.05, 'Notification No. 1234/1974', 'Gazette Ref DM/LKO/2025/1',
      '2025-04-01', 'District Magistrate, Lucknow', 1743465600, null,
      1743465600, 1, 'ACTIVE', 1743465600
    );
    const ldaScheduleId = resLda.lastInsertRowid;

    // Rate records for LDA schedule
    const recordStmt = db.prepare(`
      INSERT INTO CIRCLE_RATE_RECORDS (
        schedule_id, land_use, structure_type, road_tier, base_rate_sqm, construction_rate_sqm
      ) VALUES (?, ?, ?, ?, ?, ?)
    `);
    recordStmt.run(ldaScheduleId, 'RESIDENTIAL', 'INDIVIDUAL_PLOT_BUILDING', 'STANDARD', 25000, 15000);
    recordStmt.run(ldaScheduleId, 'COMMERCIAL', 'STANDALONE_COMMERCIAL', 'STANDARD', 50000, 20000);
    recordStmt.run(ldaScheduleId, 'COMMERCIAL', 'COMPLEX_MULTI_UNIT', 'STANDARD', 60000, 0);

    // 2. Active Verified Schedule (NOIDA, 2.0% fixed, Sec 11-B)
    const resNoida = scheduleStmt.run(
      'UP-GBN-DDR-SEC062-2025-V1', 'UP', 'Gautam Buddha Nagar', 'Dadri', 'SEC062',
      'NOIDA', 'UP_INDUSTRIAL_AREA_DEV_ACT_1976_SEC_11B', 0.02,
      0.02, 'Notification No. 4157-HI/XVIII-11', 'U.P. Gazette Extraordinary 1976',
      '1976-04-17', 'Governor of Uttar Pradesh', 1743465600, null,
      1743465600, 1, 'ACTIVE', 1743465600
    );
    const noidaScheduleId = resNoida.lastInsertRowid;
    recordStmt.run(noidaScheduleId, 'COMMERCIAL', 'STANDALONE_COMMERCIAL', 'STANDARD', 85000, 24000);

    // 3. Expired Schedule
    scheduleStmt.run(
      'UP-LKO-SDR-EXPIRED-2020', 'UP', 'Lucknow', 'Sadar', 'EXPIRED_VL',
      'LDA', 'UP_URBAN_PLANNING_ACT_1973_SEC_39', 0.02,
      0.05, 'Notification Old', 'Old Gazette',
      '2020-01-01', 'DM', 1577836800, 1609459200, // 2020 to 2021
      1577836800, 1, 'ACTIVE', 1577836800
    );

    // 4. Unverified Schedule
    scheduleStmt.run(
      'UP-LKO-SDR-UNVERIFIED', 'UP', 'Lucknow', 'Sadar', 'UNVERIFIED_VL',
      'LDA', 'STATUTE_UNVERIFIED', 0.02,
      0.05, 'Notification Pending', 'Unpublished',
      '2025-01-01', 'DM', 1735689600, null,
      null, 0, 'DRAFT', 1735689600
    );
  });

  afterAll(() => {
    if (fs.existsSync(testDbPath)) {
      try { fs.unlinkSync(testDbPath); } catch (e) {}
    }
  });

  // ==========================================================================
  // Pillar 1: Versioned Rate-Schedule Schema Integrity (3 Tests)
  // ==========================================================================
  describe('Pillar 1: Versioned Rate-Schedule Schema Integrity', () => {
    test('B.1.1: Table existence and required schema column constraints', () => {
      const scheduleCols = db.prepare("PRAGMA table_info(CIRCLE_RATE_SCHEDULES)").all();
      const colNames = scheduleCols.map(c => c.name);
      expect(colNames).toContain('schedule_code');
      expect(colNames).toContain('authority_code');
      expect(colNames).toContain('enabling_statute');
      expect(colNames).toContain('applicable_additional_duty_rate');
      expect(colNames).toContain('effective_from');
      expect(colNames).toContain('status');
      expect(colNames).toContain('is_synthetic_illustrative');

      const auditCols = db.prepare("PRAGMA table_info(VALUATION_AUDIT_LOG)").all();
      const auditColNames = auditCols.map(c => c.name);
      expect(auditColNames).toContain('valuation_hash');
      expect(auditColNames).toContain('inputs_json');
      expect(auditColNames).toContain('result_json');
      expect(auditColNames).toContain('ip_hash');
    });

    test('B.1.2: Unique constraint on schedule_code prevents duplicate collision', () => {
      expect(() => {
        db.prepare(`
          INSERT INTO CIRCLE_RATE_SCHEDULES (
            schedule_code, district, tehsil, village_code, authority_code,
            enabling_statute, territorial_notification_ref, gazette_reference,
            gazette_date, notification_authority, effective_from, status, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          'UP-LKO-SDR-VL09142851-2025-V1', // Duplicate schedule_code
          'Lucknow', 'Sadar', TEST_VILLAGE, 'LDA',
          'UP_URBAN_PLANNING_ACT_1973_SEC_39', 'Ref', 'Gazette',
          '2025-01-01', 'DM', 1743465600, 'ACTIVE', 1743465600
        );
      }).toThrow(/UNIQUE constraint failed/);
    });

    test('B.1.3: Foreign key referential integrity between schedules and records', () => {
      expect(() => {
        db.prepare(`
          INSERT INTO CIRCLE_RATE_RECORDS (
            schedule_id, land_use, structure_type, road_tier, base_rate_sqm
          ) VALUES (999999, 'RESIDENTIAL', 'INDIVIDUAL_PLOT_BUILDING', 'STANDARD', 20000)
        `).run();
      }).toThrow(/FOREIGN KEY constraint failed/);
    });
  });

  // ==========================================================================
  // Pillar 2: Authority / Statute / Territorial Mapping (3 Tests)
  // ==========================================================================
  describe('Pillar 2: Authority / Statute / Territorial Mapping', () => {
    test('B.2.1: Resolves LDA under UP Urban Planning Act 1973 Sec 39 with enhancement ceiling up to 5%', () => {
      const row = db.prepare(`
        SELECT * FROM CIRCLE_RATE_SCHEDULES WHERE authority_code = 'LDA' AND status = 'ACTIVE'
      `).get();
      expect(row.enabling_statute).toBe('UP_URBAN_PLANNING_ACT_1973_SEC_39');
      expect(row.applicable_additional_duty_rate).toBe(0.02);
      expect(row.statutory_rate_ceiling).toBe(0.05);
    });

    test('B.2.2: Resolves NOIDA under UP Industrial Area Development Act 1976 Sec 11-B with fixed 2% ceiling', () => {
      const row = db.prepare(`
        SELECT * FROM CIRCLE_RATE_SCHEDULES WHERE authority_code = 'NOIDA' AND status = 'ACTIVE'
      `).get();
      expect(row.enabling_statute).toBe('UP_INDUSTRIAL_AREA_DEV_ACT_1976_SEC_11B');
      expect(row.applicable_additional_duty_rate).toBe(0.02);
      expect(row.statutory_rate_ceiling).toBe(0.02); // Strictly fixed; no 5% enhancement power
    });

    test('B.2.3: Rejects schedule with invalid enabling_statute constraint', () => {
      expect(() => {
        db.prepare(`
          INSERT INTO CIRCLE_RATE_SCHEDULES (
            schedule_code, district, tehsil, village_code, authority_code,
            enabling_statute, territorial_notification_ref, gazette_reference,
            gazette_date, notification_authority, effective_from, status, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          'INVALID-STATUTE-TEST', 'Lucknow', 'Sadar', 'VL_INV', 'CUSTOM',
          'NON_EXISTENT_CUSTOM_ACT_2026', 'Ref', 'Gazette',
          '2025-01-01', 'DM', 1743465600, 'ACTIVE', 1743465600
        );
      }).toThrow(/CHECK constraint failed/);
    });
  });

  // ==========================================================================
  // Pillar 3: Effective-Date Temporal Window Validation (3 Tests)
  // ==========================================================================
  describe('Pillar 3: Effective-Date Temporal Window Validation', () => {
    test('B.3.1: Active schedule resolves successfully for transaction date inside valid window', async () => {
      const res = await request(app)
        .post('/api/valuation/calculate')
        .send({
          district: 'Lucknow',
          tehsil: 'Sadar',
          villageCode: TEST_VILLAGE,
          authorityCode: 'LDA',
          landUse: 'RESIDENTIAL',
          plotAreaSqm: 200,
          declaredConsideration: 5500000,
          transactionDate: MOCK_DATE
        });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('SUCCESS');
      expect(res.body.schedule.scheduleCode).toBe('UP-LKO-SDR-VL09142851-2025-V1');
    });

    test('B.3.2: Rejects transaction on expired schedule with HTTP 422 STATUS_RATE_UNAVAILABLE', async () => {
      const res = await request(app)
        .post('/api/valuation/calculate')
        .send({
          district: 'Lucknow',
          tehsil: 'Sadar',
          villageCode: 'EXPIRED_VL',
          authorityCode: 'LDA',
          landUse: 'RESIDENTIAL',
          plotAreaSqm: 200,
          declaredConsideration: 5000000,
          transactionDate: MOCK_DATE // 2025, while schedule expired in 2021
        });

      expect(res.status).toBe(422);
      expect(res.body.status).toBe('STATUS_RATE_UNAVAILABLE');
    });

    test('B.3.3: Rejects transaction prior to schedule effective_from date with HTTP 422', async () => {
      const res = await request(app)
        .post('/api/valuation/calculate')
        .send({
          district: 'Lucknow',
          tehsil: 'Sadar',
          villageCode: TEST_VILLAGE,
          authorityCode: 'LDA',
          landUse: 'RESIDENTIAL',
          plotAreaSqm: 200,
          declaredConsideration: 5000000,
          transactionDate: 1600000000 // 2020 (before 2025-04-01 effective date)
        });

      expect(res.status).toBe(422);
      expect(res.body.status).toBe('STATUS_RATE_UNAVAILABLE');
    });
  });

  // ==========================================================================
  // Pillar 4: Pure Decimal Arithmetic Primitives (Zero Float Drift) (2 Tests)
  // ==========================================================================
  describe('Pillar 4: Pure Decimal Arithmetic Primitives (Zero Float Drift)', () => {
    test('B.4.1: Eliminates IEEE-754 precision drift on fractional area and rate calculations', () => {
      // 333.33 * 33333.33 = 11110998.8889 INR
      // In paisa: 1111099888.89 -> integer paisa BigInt 1111099888n
      // Rounded to nearest Rupee: ₹1,11,10,999
      const area = 333.33;
      const rate = 33333.33;
      const resultPaisa = multiplyAreaByRate(area, rate);
      const roundedRupees = toRupees(resultPaisa);

      expect(typeof resultPaisa).toBe('bigint');
      expect(resultPaisa).toBe(1111099888n);
      expect(roundedRupees).toBe(11110999);
    });

    test('B.4.2: High-value transaction preserves exact paisa precision without truncation', () => {
      // ₹2,20,00,000 (2.2 Crore) * 5.0% = ₹11,00,000
      const considerationPaisa = toPaisa('22000000');
      const stampDutyPaisa = calculatePercentage(considerationPaisa, 5.0);
      const stampDutyRupees = toRupees(stampDutyPaisa);

      expect(stampDutyRupees).toBe(1100000);
      expect(stampDutyPaisa).toBe(110000000n);
    });
  });

  // ==========================================================================
  // Pillar 5: Instrument-Type Dispatch Interface (2 Tests)
  // ==========================================================================
  describe('Pillar 5: Instrument-Type Dispatch Interface', () => {
    test('B.5.1: Correctly dispatches CONVEYANCE_SALE with Schedule I-B Art 23 floor', async () => {
      // 200 sqm @ 25k = ₹50,00,000 circle rate; Declared = ₹55,00,000
      // Taxable Base = max(55L, 50L) = 55L
      // Base Stamp (5%): 2,75,000; LDA Surcharge (2%): 1,10,000
      // Reg Fee (1% uncapped): 55,000
      // Total: ₹4,40,000 (male buyer)
      const res = await request(app)
        .post('/api/valuation/calculate')
        .send({
          district: 'Lucknow',
          tehsil: 'Sadar',
          villageCode: TEST_VILLAGE,
          authorityCode: 'LDA',
          landUse: 'RESIDENTIAL',
          plotAreaSqm: 200,
          declaredConsideration: 5500000,
          buyerCategory: 'SOLE_MALE',
          instrumentType: 'CONVEYANCE_SALE',
          transactionDate: MOCK_DATE
        });

      expect(res.status).toBe(200);
      expect(res.body.valuation.taxableBase).toBe(5500000);
      expect(res.body.valuation.valuationBasis).toBe('DECLARED_CONSIDERATION');
      expect(res.body.duties.baseStampDuty).toBe(275000);
      expect(res.body.duties.urbanSurcharge).toBe(110000);
      expect(res.body.duties.registrationFee).toBe(55000);
      expect(res.body.duties.totalStatutoryDues).toBe(440000);
    });

    test('B.5.2: Rejects unverified non-sale instrument types with HTTP 422 in foundation phase', async () => {
      const res = await request(app)
        .post('/api/valuation/calculate')
        .send({
          district: 'Lucknow',
          tehsil: 'Sadar',
          villageCode: TEST_VILLAGE,
          authorityCode: 'LDA',
          landUse: 'RESIDENTIAL',
          plotAreaSqm: 200,
          declaredConsideration: 5500000,
          instrumentType: 'UNVERIFIED_FUTURE_INSTRUMENT',
          transactionDate: MOCK_DATE
        });

      expect(res.status).toBe(422);
      expect(res.body.status).toBe('STATUS_LEGAL_RULE_UNVERIFIED');
    });
  });

  // ==========================================================================
  // Pillar 6: Fail-Closed Behavior on Unverified Rules & Data (2 Tests)
  // ==========================================================================
  describe('Pillar 6: Fail-Closed Behavior on Unverified Rules & Data', () => {
    test('B.6.1: Rejects schedule with STATUTE_UNVERIFIED status with HTTP 422', async () => {
      const res = await request(app)
        .post('/api/valuation/calculate')
        .send({
          district: 'Lucknow',
          tehsil: 'Sadar',
          villageCode: 'UNVERIFIED_VL',
          landUse: 'RESIDENTIAL',
          plotAreaSqm: 200,
          declaredConsideration: 5000000,
          transactionDate: MOCK_DATE
        });

      expect(res.status).toBe(422);
      expect(res.body.status).toBe('STATUS_RATE_UNAVAILABLE');
    });

    test('B.6.2: Rejects non-existent unindexed village with HTTP 422 STATUS_RATE_UNAVAILABLE', async () => {
      const res = await request(app)
        .post('/api/valuation/calculate')
        .send({
          district: 'Lucknow',
          tehsil: 'Sadar',
          villageCode: 'NON_EXISTENT_99999',
          landUse: 'RESIDENTIAL',
          plotAreaSqm: 200,
          declaredConsideration: 5000000,
          transactionDate: MOCK_DATE
        });

      expect(res.status).toBe(422);
      expect(res.body.status).toBe('STATUS_RATE_UNAVAILABLE');
    });
  });

  // ==========================================================================
  // Pillar 7: Deterministic EVM Keccak-256 Receipt Verification (1 Test)
  // ==========================================================================
  describe('Pillar 7: Deterministic EVM Keccak-256 Receipt Verification', () => {
    test('B.7.1: Computes deterministic EVM Keccak-256 receipt and enables verification via GET', async () => {
      const res = await request(app)
        .post('/api/valuation/calculate')
        .send({
          district: 'Lucknow',
          tehsil: 'Sadar',
          villageCode: TEST_VILLAGE,
          authorityCode: 'LDA',
          landUse: 'RESIDENTIAL',
          plotAreaSqm: 200,
          declaredConsideration: 5500000,
          buyerCategory: 'SOLE_FEMALE',
          instrumentType: 'CONVEYANCE_SALE',
          transactionDate: MOCK_DATE
        });

      expect(res.status).toBe(200);
      const { valuationHash } = res.body;
      expect(valuationHash).toMatch(/^0x[a-f0-9]{64}$/);

      // Verify that audit log persisted receipt
      const receiptRes = await request(app)
        .get(`/api/valuation/receipt/${valuationHash}`);

      expect(receiptRes.status).toBe(200);
      expect(receiptRes.body.status).toBe('SUCCESS');
      expect(receiptRes.body.valuationHash).toBe(valuationHash);
      expect(receiptRes.body.result.valuation.taxableBase).toBe(5500000);
      expect(receiptRes.body.result.duties.femaleConcession).toBe(55000); // 1% rebate up to 1 Cr
      expect(receiptRes.body.result.duties.netStampDuty).toBe(330000);
      expect(receiptRes.body.result.duties.registrationFee).toBe(55000);
      expect(receiptRes.body.result.duties.totalStatutoryDues).toBe(385000);
    });
  });
});
