import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  INDIAN_STATES,
  DEFAULT_STATE_CODE,
  getAllStates,
  getActiveStates,
  getComingSoonStates,
  getStateByCode
} from '../src/config/states.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const centralConfig = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../src/config/central.config.json'), 'utf8')
);
const upConfig = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../src/config/up.config.json'), 'utf8')
);

describe('Sprint 1 PKG-09: Central & Multi-State Configuration Suite', () => {

  describe('Central Configuration Validation (central.config.json)', () => {
    test('contains correct sovereign jurisdiction and constitutional baseline', () => {
      assert.equal(centralConfig.jurisdiction, 'Republic of India');
      assert.equal(centralConfig.countryCode, 'IN');
      assert.equal(centralConfig.constitutionalBasis.entry, 'Entry 18');
      assert.equal(centralConfig.constitutionalBasis.list, 'List II (State List)');
      assert.equal(centralConfig.constitutionalBasis.schedule, 'Seventh Schedule');
    });

    test('codifies Income-tax Act, 2025 Section 393 direct tax rules', () => {
      const tax = centralConfig.statutoryBaselines.directTax;
      assert.equal(tax.act, 'Income-tax Act, 2025');
      assert.equal(tax.provision, 'Section 393(1)');
      assert.equal(tax.thresholdINR, 5000000);
      assert.equal(tax.tdsRatePct, 1.0);
      assert.equal(tax.filingForm, 'Form 141 (Schedule B)');
      assert.equal(tax.exemptions[0].type, 'RURAL_AGRICULTURAL_LAND');
      assert.equal(tax.exemptions[0].tdsExempt, true);
    });

    test('codifies Registration Act 1908 and IT Act First Schedule deed exclusion', () => {
      const reg = centralConfig.statutoryBaselines.registration;
      assert.equal(reg.act, 'Registration Act, 1908');
      assert.equal(reg.compulsoryRegistrationSection, 'Section 17(1)');
      assert.equal(reg.timeLimitMonths, 4);

      const itAct = centralConfig.statutoryBaselines.electronicTransactions;
      assert.ok(itAct.statutoryDeedExclusion.includes('First Schedule, Entry 1'));
    });

    test('codifies Indian Stamp Act Section 18 consular PoA 90-day deadline', () => {
      const stamp = centralConfig.statutoryBaselines.stampDutyFederal.consularNriPoa;
      assert.equal(stamp.section, 'Section 18');
      assert.equal(stamp.statutoryDeadlineDays, 90);
    });

    test('codifies DPDP Act 2023 with G.S.R. 846(E) and total Aadhaar exclusion', () => {
      const dpdp = centralConfig.statutoryBaselines.dataProtection;
      assert.equal(dpdp.rules, 'Digital Personal Data Protection Rules, 2025 (G.S.R. 846(E))');
      assert.equal(dpdp.statutoryHoldExemption, 'Section 17(1)(b) (Exempts processing necessary for compliance with statutory laws, revenue audits, and tax assessments)');
      assert.ok(dpdp.aadhaarPolicy.includes('EXCLUDED'));
    });

    test('codifies Model 4 Non-Custodial zero-custody settlement policy', () => {
      const settlement = centralConfig.settlementRail;
      assert.equal(settlement.custodyOfFunds, 'ZERO_PLATFORM_CUSTODY');
      assert.equal(settlement.rbiAuthorisationRequired, false);
    });
  });

  describe('Uttar Pradesh Configuration Validation (up.config.json)', () => {
    test('contains UP administrative structure and pilot districts', () => {
      assert.equal(upConfig.stateCode, 'UP');
      assert.equal(upConfig.status, 'ACTIVE_PILOT');
      assert.equal(upConfig.totalDistricts, 75);
      assert.equal(upConfig.administrativeDivisions, 18);
      assert.equal(upConfig.pilotDistricts.length, 2);

      const lko = upConfig.pilotDistricts.find(d => d.code === 'LKO');
      assert.ok(lko);
      assert.equal(lko.nameEn, 'Lucknow');
      assert.ok(lko.tehsils.includes('Lucknow Sadar'));

      const gbn = upConfig.pilotDistricts.find(d => d.code === 'GBN');
      assert.ok(gbn);
      assert.equal(gbn.nameEn, 'Gautam Buddha Nagar');
      assert.ok(gbn.tehsils.includes('Noida'));
    });

    test('contains feature-level readiness flags separating active from gated features', () => {
      const feat = upConfig.featureReadiness;
      assert.equal(feat.parcelIngestion.status, 'ACTIVE');
      assert.equal(feat.circleRateValuation.status, 'ACTIVE');
      assert.equal(feat.mutationTracking.status, 'ACTIVE');
      assert.equal(feat.taxSchedule.status, 'ACTIVE');
      assert.equal(feat.consularNriPoa.status, 'ACTIVE');

      // Controlled safety gating
      assert.equal(feat.marketplaceResale.status, 'INFORMATIONAL_ONLY');
      assert.equal(feat.automatedMatching.status, 'LOCKED_PENDING_COUNSEL');
      assert.equal(feat.regulatedEscrowSettlement.status, 'SIMULATION_ONLY');
    });

    test('validates statutory UP fee schedule and Rule 34 mutation rules', () => {
      const fee = upConfig.feeSchedule;
      assert.equal(fee.baseStampDutyPct, 5.0);
      assert.equal(fee.localBodySurchargeUrbanPct, 2.0);
      assert.equal(fee.localBodySurchargeRuralPct, 0.0);
      assert.equal(fee.femaleBuyerConcessionPct, 1.0);
      assert.equal(fee.femaleConcessionGovtOrder, 'U.P. Govt Order 1383/97');

      const mutation = upConfig.statutory.mutationRules;
      assert.equal(mutation.proclamationNoticeDays, 30);
      assert.equal(mutation.noticeRule, 'Rule 34(1), UP Revenue Code Rules 2016');
      assert.equal(mutation.undisputedMutationSlaDays, 45);
      assert.equal(mutation.disputedMutationSlaDays, 90);
      assert.equal(mutation.slaRule, 'Rule 34(7), UP Revenue Code Rules 2016');
    });

    test('contains accurate UP revenue terminology', () => {
      const term = upConfig.terminology;
      assert.ok(term.parcelIdentifierLabel.includes('Gata'));
      assert.ok(term.recordOfRightsLabel.includes('Khatauni'));
      assert.ok(term.subDistrictLabel.includes('Tehsil'));
      assert.ok(term.cadastralMapLabel.includes('Bhu-Naksha'));
    });
  });

  describe('Indian States Registry Validation (states.js)', () => {
    test('contains 1 active pilot state and multiple upcoming states', () => {
      const all = getAllStates();
      assert.ok(all.length >= 20);

      const active = getActiveStates();
      assert.equal(active.length, 1);
      assert.equal(active[0].code, 'UP');

      const comingSoon = getComingSoonStates();
      assert.ok(comingSoon.length >= 19);
      assert.ok(comingSoon.some(s => s.code === 'MH'));
      assert.ok(comingSoon.some(s => s.code === 'KA'));
      assert.ok(comingSoon.some(s => s.code === 'UK'));
    });

    test('getStateByCode resolves valid codes case-insensitively', () => {
      const upLower = getStateByCode('up');
      assert.equal(upLower.code, 'UP');
      assert.equal(upLower.nameEn, 'Uttar Pradesh');

      const mh = getStateByCode('MH');
      assert.equal(mh.code, 'MH');
      assert.equal(mh.nameEn, 'Maharashtra');
      assert.equal(mh.status, 'COMING_SOON');
    });

    test('getStateByCode defaults safely to DEFAULT_STATE_CODE for invalid inputs', () => {
      const invalid = getStateByCode('INVALID_CODE');
      assert.equal(invalid.code, DEFAULT_STATE_CODE);

      const nullCode = getStateByCode(null);
      assert.equal(nullCode.code, DEFAULT_STATE_CODE);

      const emptyCode = getStateByCode('');
      assert.equal(emptyCode.code, DEFAULT_STATE_CODE);
    });
  });

  describe('Feature Readiness Helper Validation', () => {
    test('verifies active features return true and locked features return false', () => {
      const isFeatureActive = (featureKey) => {
        const feat = upConfig.featureReadiness[featureKey];
        return feat ? feat.status === 'ACTIVE' : false;
      };

      assert.equal(isFeatureActive('parcelIngestion'), true);
      assert.equal(isFeatureActive('circleRateValuation'), true);
      assert.equal(isFeatureActive('mutationTracking'), true);

      // Gated features must NEVER return true
      assert.equal(isFeatureActive('marketplaceResale'), false);
      assert.equal(isFeatureActive('automatedMatching'), false);
      assert.equal(isFeatureActive('regulatedEscrowSettlement'), false);

      // Unknown features must fail closed
      assert.equal(isFeatureActive('nonExistentFeature'), false);
    });
  });

});
