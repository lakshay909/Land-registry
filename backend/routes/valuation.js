/**
 * backend/routes/valuation.js
 * REST API Endpoints for PKG-02 Safe Foundation Valuation Engine.
 */

const express = require('express');
const router = express.Router();
const db = require('../db');
const { executeValuation, ValuationEngineError } = require('../services/valuation/valuationEngine');
const { ScheduleResolutionError } = require('../services/valuation/scheduleResolver');
const { createAndPersistReceipt } = require('../services/valuation/auditReceiptService');

/**
 * Validates core input fields. Returns error string or null if valid.
 */
function validateInput(body) {
  if (!body || typeof body !== 'object') {
    return 'Request body must be a JSON object';
  }
  const { district, tehsil, villageCode, landUse } = body;
  if (!district || typeof district !== 'string' || district.trim().length === 0) {
    return 'Missing or invalid district name';
  }
  if (!tehsil || typeof tehsil !== 'string' || tehsil.trim().length === 0) {
    return 'Missing or invalid tehsil name';
  }
  if (!villageCode || typeof villageCode !== 'string' || villageCode.trim().length === 0) {
    return 'Missing or invalid villageCode';
  }
  if (!landUse || !['AGRICULTURAL', 'RESIDENTIAL', 'COMMERCIAL', 'INDUSTRIAL', 'INSTITUTIONAL'].includes(landUse.toUpperCase())) {
    return `Invalid landUse: must be one of AGRICULTURAL, RESIDENTIAL, COMMERCIAL, INDUSTRIAL, INSTITUTIONAL`;
  }
  return null;
}

/**
 * POST /api/valuation/calculate
 * Computes deterministic circle rate valuation and government levies.
 */
router.post('/calculate', (req, res) => {
  try {
    const validationError = validateInput(req.body);
    if (validationError) {
      return res.status(400).json({
        status: 'INVALID_INPUT',
        error: validationError
      });
    }

    const clientIp = req.ip || req.headers['x-forwarded-for'] || '127.0.0.1';
    const result = executeValuation(db, req.body);
    const receipt = createAndPersistReceipt(db, req.body, result, clientIp);

    return res.status(200).json({
      status: 'SUCCESS',
      valuationHash: receipt.valuationHash,
      calculatedAt: receipt.calculatedAt,
      isStatutoryDefinitive: result.isStatutoryDefinitive,
      calculationBasis: result.calculationBasis,
      schedule: result.schedule,
      valuation: result.valuation,
      duties: result.duties,
      auditFlags: result.auditFlags,
      statutoryNotice: result.statutoryNotice
    });
  } catch (err) {
    if (err instanceof ScheduleResolutionError || err instanceof ValuationEngineError) {
      return res.status(err.httpStatus).json({
        status: err.code,
        error: err.message,
        details: err.details
      });
    }
    return res.status(500).json({
      status: 'CALCULATION_INTERNAL_ERROR',
      error: err.message
    });
  }
});

/**
 * GET /api/valuation/receipt/:hash
 * Retrieves a persisted, non-repudiable valuation audit receipt by Keccak-256 hash.
 */
router.get('/receipt/:hash', (req, res) => {
  try {
    const { hash } = req.params;
    if (!hash || !hash.startsWith('0x') || hash.length !== 66) {
      return res.status(400).json({
        status: 'INVALID_HASH',
        error: 'Valuation hash must be a 0x-prefixed 32-byte hex string (66 characters)'
      });
    }

    const row = db.prepare(`
      SELECT * FROM VALUATION_AUDIT_LOG WHERE valuation_hash = ?
    `).get(hash);

    if (!row) {
      return res.status(404).json({
        status: 'RECEIPT_NOT_FOUND',
        error: `No valuation audit receipt found for hash ${hash}`
      });
    }

    return res.status(200).json({
      status: 'SUCCESS',
      valuationHash: row.valuation_hash,
      instrumentType: row.instrument_type,
      authorityCode: row.authority_code,
      enablingStatute: row.enabling_statute,
      isStatutoryDefinitive: Boolean(row.is_statutory_definitive),
      calculationBasis: row.calculation_basis,
      conditionalFlags: JSON.parse(row.conditional_flags || '[]'),
      calculatedAt: row.calculated_at,
      inputs: JSON.parse(row.inputs_json),
      result: JSON.parse(row.result_json)
    });
  } catch (err) {
    return res.status(500).json({
      status: 'RECEIPT_RETRIEVAL_ERROR',
      error: err.message
    });
  }
});

module.exports = router;
