/**
 * backend/services/valuation/decimalMath.js
 * Pure BigInt / integer-paisa arithmetic primitives for fiscal calculations.
 * Eliminates IEEE-754 floating point precision drift.
 * Scale: 1 INR = 100 Paisa (BigInt)
 */

const PAISA_SCALE = 100n;
const BASIS_POINTS_SCALE = 10000n; // 100% = 10,000 basis points

/**
 * Converts an INR amount to integer paisa (BigInt).
 * @param {number|string|bigint} inrValue
 * @returns {bigint}
 */
function toPaisa(inrValue) {
  if (typeof inrValue === 'bigint') return inrValue * PAISA_SCALE;
  if (inrValue === undefined || inrValue === null || inrValue === '' || isNaN(Number(inrValue))) {
    throw new TypeError(`INVALID_DECIMAL_INPUT: Value cannot be converted to paisa: ${inrValue}`);
  }
  const str = String(inrValue).trim();
  const parts = str.split('.');
  const whole = BigInt(parts[0] || '0');
  let fracStr = (parts[1] || '').slice(0, 2);
  while (fracStr.length < 2) fracStr += '0';
  const frac = BigInt(fracStr);
  return whole * PAISA_SCALE + (whole >= 0n ? frac : -frac);
}

/**
 * Converts integer paisa (BigInt) back to exact INR number (half-up rounding to nearest rupee).
 * @param {bigint} paisaValue
 * @returns {number}
 */
function toRupees(paisaValue) {
  if (typeof paisaValue !== 'bigint') {
    throw new TypeError('INVALID_PAISA_INPUT: Expected BigInt');
  }
  const isNegative = paisaValue < 0n;
  const absPaisa = isNegative ? -paisaValue : paisaValue;
  const remainder = absPaisa % PAISA_SCALE;
  let rupees = absPaisa / PAISA_SCALE;
  if (remainder >= 50n) {
    rupees += 1n;
  }
  return Number(isNegative ? -rupees : rupees);
}

/**
 * Multiplies an area (sq.m) by a unit rate (INR/sq.m) with zero float drift.
 * Area is scaled by 10,000 (0.0001 sq.m precision).
 * @param {number|string} areaSqM
 * @param {number|string|bigint} ratePerSqM
 * @returns {bigint} Total value in paisa (BigInt)
 */
function multiplyAreaByRate(areaSqM, ratePerSqM) {
  const numArea = Number(areaSqM);
  if (isNaN(numArea) || numArea < 0) {
    throw new TypeError(`INVALID_AREA_INPUT: Area must be a non-negative number: ${areaSqM}`);
  }
  const areaScaled = BigInt(Math.round(numArea * 10000));
  const ratePaisa = toPaisa(ratePerSqM);
  return (areaScaled * ratePaisa) / 10000n;
}

/**
 * Calculates percentage on a paisa base using integer basis points.
 * @param {bigint} basePaisa
 * @param {number} ratePercent e.g. 5.0 for 5%, 2.0 for 2%
 * @returns {bigint} Result in paisa (BigInt)
 */
function calculatePercentage(basePaisa, ratePercent) {
  if (typeof basePaisa !== 'bigint') {
    throw new TypeError('INVALID_BASE_INPUT: Expected BigInt base in paisa');
  }
  const bps = BigInt(Math.round(Number(ratePercent) * 100)); // 5.0% -> 500 bps
  return (basePaisa * bps) / BASIS_POINTS_SCALE;
}

/**
 * Returns the maximum of two BigInt values.
 * @param {bigint} a
 * @param {bigint} b
 * @returns {bigint}
 */
function maxPaisa(a, b) {
  return a >= b ? a : b;
}

/**
 * Returns the minimum of two BigInt values.
 * @param {bigint} a
 * @param {bigint} b
 * @returns {bigint}
 */
function minPaisa(a, b) {
  return a <= b ? a : b;
}

module.exports = {
  toPaisa,
  toRupees,
  multiplyAreaByRate,
  calculatePercentage,
  maxPaisa,
  minPaisa,
  PAISA_SCALE,
  BASIS_POINTS_SCALE
};
