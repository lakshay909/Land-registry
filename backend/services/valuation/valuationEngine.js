/**
 * backend/services/valuation/valuationEngine.js
 * Legally Neutral Safe Foundation Valuation Engine & Substantive Dispatcher.
 */

const {
  toPaisa,
  toRupees,
  multiplyAreaByRate,
  calculatePercentage,
  maxPaisa,
  minPaisa,
  PAISA_SCALE
} = require('./decimalMath');
const { resolveSchedule } = require('./scheduleResolver');

const MIN_REGISTRATION_FEE_PAISA = 100n * PAISA_SCALE; // ₹100 statutory floor (Registration Act Sec 78)
const MAX_FEMALE_CONCESSION_CAP_PAISA = 100000n * PAISA_SCALE; // Flat ₹1,00,000 max rebate cap
const MAX_FEMALE_ELIGIBLE_CONSIDERATION_PAISA = 10000000n * PAISA_SCALE; // ₹1 Crore property value ceiling

class ValuationEngineError extends Error {
  constructor(code, message, details = {}) {
    super(message);
    this.name = 'ValuationEngineError';
    this.code = code;
    this.details = details;
    this.httpStatus = 422;
  }
}

/**
 * Executes a deterministic, legally neutral circle rate valuation and government dues estimate.
 * @param {import('better-sqlite3').Database} db
 * @param {Object} input
 * @returns {Object} Structured valuation result
 */
function executeValuation(db, input) {
  const {
    district,
    tehsil,
    villageCode,
    authorityCode,
    landUse,
    structureType = 'INDIVIDUAL_PLOT_BUILDING',
    roadTier = 'STANDARD',
    plotAreaSqm = 0,
    builtUpAreaSqm = 0,
    carpetAreaSqm = 0,
    declaredConsideration = 0,
    buyerCategory = 'SOLE_MALE',
    femaleShare = null,
    instrumentType = 'CONVEYANCE_SALE',
    transactionDate = Math.floor(Date.now() / 1000)
  } = input;

  // 1. Resolve Active Verified Schedule (Fail-Closed)
  const resolved = resolveSchedule(db, {
    district,
    tehsil,
    villageCode,
    authorityCode,
    landUse,
    structureType,
    roadTier,
    transactionDate
  });

  const { schedule, landRateSqm, constructionRateSqm } = resolved;

  // Strict check on enabling statute
  if (schedule.enabling_statute === 'STATUTE_UNVERIFIED') {
    throw new ValuationEngineError(
      'STATUS_LEGAL_RULE_UNVERIFIED',
      `Schedule ${schedule.schedule_code} has enabling_statute marked STATUTE_UNVERIFIED; statutory calculations barred`,
      { scheduleCode: schedule.schedule_code }
    );
  }

  // 2. Minimum Market Value Floor Computation (Rules 4 & 5, 1997 Rules)
  let landValuePaisa = 0n;
  let constValuePaisa = 0n;
  const normStructure = structureType.toUpperCase();

  if (normStructure === 'COMPLEX_MULTI_UNIT') {
    // Rule 5(1)(d): Commercial multi-unit complex assessed on carpet area; land share subsumed
    if (!carpetAreaSqm || Number(carpetAreaSqm) <= 0) {
      throw new ValuationEngineError(
        'INVALID_INPUT_DIMENSION',
        'Complex multi-unit valuation requires positive carpetAreaSqm under Rule 5(1)(d)'
      );
    }
    constValuePaisa = multiplyAreaByRate(carpetAreaSqm, landRateSqm); // In complex multi-unit, card rate is carpet rate
  } else {
    // Rule 5(1)(b) & 5(1)(c): Land valuation + covered plinth area
    if (plotAreaSqm > 0) {
      landValuePaisa = multiplyAreaByRate(plotAreaSqm, landRateSqm);
    }
    if (builtUpAreaSqm > 0 && constructionRateSqm > 0) {
      constValuePaisa = multiplyAreaByRate(builtUpAreaSqm, constructionRateSqm);
    }
  }

  const totalCircleValuePaisa = landValuePaisa + constValuePaisa;
  const declaredConsiderationPaisa = toPaisa(declaredConsideration || 0);

  // 3. Substantive Dutiable Base Assessment (Schedule I-B, Article 23)
  const taxableBasePaisa = maxPaisa(totalCircleValuePaisa, declaredConsiderationPaisa);
  const valuationBasis = declaredConsiderationPaisa >= totalCircleValuePaisa
    ? 'DECLARED_CONSIDERATION'
    : 'MINIMUM_CIRCLE_RATE_FLOOR';

  // 4. Government Levies Computation
  const auditFlags = [];

  // Check instrument type
  if (instrumentType !== 'CONVEYANCE_SALE') {
    // For safe foundation, unverified non-sale instrument types fail-closed unless official verified rules are active
    throw new ValuationEngineError(
      'STATUS_LEGAL_RULE_UNVERIFIED',
      `Instrument type '${instrumentType}' is currently unverified at statutory gazette level in this foundation release`,
      { instrumentType }
    );
  }

  // Base Stamp Duty: 5.0% (Schedule I-B, Article 23)
  const baseStampDutyPaisa = calculatePercentage(taxableBasePaisa, 5.0);

  // Authority Surcharge: Strictly from verified schedule
  const surchargeRatePercent = (schedule.applicable_additional_duty_rate || 0.0) * 100;
  const urbanSurchargePaisa = calculatePercentage(taxableBasePaisa, surchargeRatePercent);

  // Female Concession (Notifications 462/2006 & 1504/2006)
  let femaleConcessionPaisa = 0n;
  const normBuyer = buyerCategory.toUpperCase();

  if (normBuyer === 'SOLE_FEMALE' || normBuyer === 'ALL_FEMALE_JOINT') {
    // 1% rebate up to ₹1 Crore value, max ₹1,00,000 benefit
    const eligibleBasePaisa = minPaisa(taxableBasePaisa, MAX_FEMALE_ELIGIBLE_CONSIDERATION_PAISA);
    const rawRebatePaisa = calculatePercentage(eligibleBasePaisa, 1.0);
    femaleConcessionPaisa = minPaisa(rawRebatePaisa, MAX_FEMALE_CONCESSION_CAP_PAISA);
  } else if (normBuyer === 'JOINT_MALE_FEMALE') {
    // Under Notification 1504, pro-rata requires manual SRO inspection of deed recitals.
    // Automated engine applies ₹0.00 concession and emits mandatory audit flag.
    femaleConcessionPaisa = 0n;
    auditFlags.push('CONCESSION_CONDITIONAL_MANUAL_VERIFICATION');
  } else {
    // SOLE_MALE, CORPORATE_ENTITY, etc.
    femaleConcessionPaisa = 0n;
  }

  // Net Stamp Duty Payable
  let netStampDutyPaisa = baseStampDutyPaisa + urbanSurchargePaisa - femaleConcessionPaisa;
  if (netStampDutyPaisa < 0n) netStampDutyPaisa = 0n;

  // Registration Fee: 1% flat uncapped with ₹100 floor under Section 78
  const rawRegFeePaisa = calculatePercentage(taxableBasePaisa, 1.0);
  const registrationFeePaisa = maxPaisa(MIN_REGISTRATION_FEE_PAISA, rawRegFeePaisa);

  const totalStatutoryDuesPaisa = netStampDutyPaisa + registrationFeePaisa;

  // Synthetic & Definitive Origin Gating
  const isSynthetic = schedule.is_synthetic_illustrative === 1;
  const isStatutoryDefinitive = !isSynthetic && schedule.verified_at !== null;
  const calculationBasis = isSynthetic ? 'ILLUSTRATIVE_SYNTHETIC' : 'STATUTORY_VERIFIED';

  if (isSynthetic) {
    auditFlags.push('DATA_ORIGIN_SYNTHETIC_FIXTURE');
  }

  return {
    isStatutoryDefinitive,
    calculationBasis,
    schedule: {
      scheduleId: schedule.schedule_id,
      scheduleCode: schedule.schedule_code,
      authorityCode: schedule.authority_code,
      enablingStatute: schedule.enabling_statute,
      surchargeRate: schedule.applicable_additional_duty_rate,
      effectiveFrom: schedule.effective_from,
      effectiveTo: schedule.effective_to,
      isSyntheticIllustrative: Boolean(schedule.is_synthetic_illustrative),
      gazetteReference: schedule.gazette_reference
    },
    valuation: {
      structureType: normStructure,
      landValue: toRupees(landValuePaisa),
      constructionValue: toRupees(constValuePaisa),
      totalCircleValue: toRupees(totalCircleValuePaisa),
      declaredConsideration: toRupees(declaredConsiderationPaisa),
      taxableBase: toRupees(taxableBasePaisa),
      valuationBasis
    },
    duties: {
      baseStampDuty: toRupees(baseStampDutyPaisa),
      urbanSurcharge: toRupees(urbanSurchargePaisa),
      femaleConcession: toRupees(femaleConcessionPaisa),
      netStampDuty: toRupees(netStampDutyPaisa),
      registrationFee: toRupees(registrationFeePaisa),
      totalStatutoryDues: toRupees(totalStatutoryDuesPaisa)
    },
    auditFlags,
    statutoryNotice: isSynthetic
      ? 'SYNTHETIC ILLUSTRATIVE ESTIMATE: Figures are computed from synthetic illustrative test fixtures for modeling purposes only. Final statutory determination requires official Collector card rates and Sub-Registrar adjudication under Section 47-A.'
      : 'ADVISORY NOTICE: Calculation is an indicative estimate under UP Stamp (Valuation of Property) Rules, 1997. Final statutory liability is determined exclusively by the Sub-Registrar / Collector of Stamps under Section 47-A of the Indian Stamp Act, 1899.'
  };
}

module.exports = { executeValuation, ValuationEngineError };
