/**
 * backend/services/valuation/scheduleResolver.js
 * Versioned Official Circle Rate Schedule Resolver.
 * Fail-closed: Never synthesizes or defaults missing government rates.
 */

class ScheduleResolutionError extends Error {
  constructor(code, message, details = {}) {
    super(message);
    this.name = 'ScheduleResolutionError';
    this.code = code;
    this.details = details;
    this.httpStatus = 422;
  }
}

/**
 * Resolves an active, verified circle rate schedule and unit rate cards.
 * @param {import('better-sqlite3').Database} db
 * @param {Object} params
 * @param {string} params.district
 * @param {string} params.tehsil
 * @param {string} params.villageCode
 * @param {string} params.authorityCode
 * @param {string} params.landUse
 * @param {string} params.structureType
 * @param {string} [params.roadTier='STANDARD']
 * @param {number} [params.transactionDate] Epoch seconds (defaults to now)
 * @returns {Object} { schedule, landRateSqm, constructionRateSqm }
 */
function resolveSchedule(db, params) {
  const {
    district,
    tehsil,
    villageCode,
    authorityCode,
    landUse,
    structureType = 'INDIVIDUAL_PLOT_BUILDING',
    roadTier = 'STANDARD',
    transactionDate = Math.floor(Date.now() / 1000)
  } = params;

  if (!district || !tehsil || !villageCode) {
    throw new ScheduleResolutionError(
      'STATUS_RATE_UNAVAILABLE',
      'Missing required administrative jurisdiction parameters (district, tehsil, villageCode)',
      { district, tehsil, villageCode }
    );
  }

  // 1. Resolve Schedule record with temporal window and active status
  let query = `
    SELECT * FROM CIRCLE_RATE_SCHEDULES
    WHERE district = ? AND tehsil = ? AND village_code = ?
      AND status = 'ACTIVE'
      AND effective_from <= ?
      AND (effective_to IS NULL OR effective_to >= ?)
  `;
  const queryParams = [district, tehsil, villageCode, transactionDate, transactionDate];

  if (authorityCode) {
    query += ` AND authority_code = ?`;
    queryParams.push(authorityCode);
  }

  query += ` ORDER BY effective_from DESC LIMIT 1`;

  const schedule = db.prepare(query).get(...queryParams);

  if (!schedule) {
    throw new ScheduleResolutionError(
      'STATUS_RATE_UNAVAILABLE',
      `Official circle rate schedule unavailable or expired for village ${villageCode} (${district}/${tehsil}) at timestamp ${transactionDate}`,
      { district, tehsil, villageCode, authorityCode, transactionDate }
    );
  }

  // Fail-closed verification check
  if (!schedule.verified_at && !schedule.is_synthetic_illustrative) {
    throw new ScheduleResolutionError(
      'STATUS_RATE_UNAVAILABLE',
      `Circle rate schedule ${schedule.schedule_code} is UNVERIFIED at primary gazette level`,
      { scheduleCode: schedule.schedule_code, verifiedAt: schedule.verified_at }
    );
  }

  // 2. Resolve Granular Rate Record
  const normLandUse = (landUse || '').toUpperCase();
  const normStructure = (structureType || 'INDIVIDUAL_PLOT_BUILDING').toUpperCase();
  const normRoad = (roadTier || 'STANDARD').toUpperCase();

  const rateRecord = db.prepare(`
    SELECT * FROM CIRCLE_RATE_RECORDS
    WHERE schedule_id = ? AND land_use = ? AND structure_type = ? AND road_tier = ?
  `).get(schedule.schedule_id, normLandUse, normStructure, normRoad);

  if (!rateRecord) {
    // If specific road tier missing, fallback to STANDARD if gazetted
    const fallbackRecord = normRoad !== 'STANDARD' ? db.prepare(`
      SELECT * FROM CIRCLE_RATE_RECORDS
      WHERE schedule_id = ? AND land_use = ? AND structure_type = ? AND road_tier = 'STANDARD'
    `).get(schedule.schedule_id, normLandUse, normStructure) : null;

    if (!fallbackRecord) {
      throw new ScheduleResolutionError(
        'STATUS_RATE_UNAVAILABLE',
        `No gazetted circle rate line exists for land use '${normLandUse}', structure '${normStructure}', roadTier '${normRoad}' in schedule ${schedule.schedule_code}`,
        { scheduleCode: schedule.schedule_code, landUse: normLandUse, structureType: normStructure, roadTier: normRoad }
      );
    }

    return {
      schedule,
      landRateSqm: fallbackRecord.base_rate_sqm,
      constructionRateSqm: fallbackRecord.construction_rate_sqm
    };
  }

  return {
    schedule,
    landRateSqm: rateRecord.base_rate_sqm,
    constructionRateSqm: rateRecord.construction_rate_sqm
  };
}

module.exports = { resolveSchedule, ScheduleResolutionError };
