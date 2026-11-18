/**
 * backend/services/valuation/valuationDb.js
 * Database schema and table definitions for PKG-02 Safe Foundation.
 */

/**
 * Initializes the versioned circle rate and valuation audit tables.
 * Safe, idempotent, and non-destructive.
 * @param {import('better-sqlite3').Database} db
 */
function initValuationSchema(db) {
  db.exec(`
    -- 1. Versioned Rate Schedules Table (With Provenance & Synthetic Flag)
    CREATE TABLE IF NOT EXISTS CIRCLE_RATE_SCHEDULES (
        schedule_id INTEGER PRIMARY KEY AUTOINCREMENT,
        schedule_code TEXT UNIQUE NOT NULL,
        state_code TEXT NOT NULL DEFAULT 'UP',
        district TEXT NOT NULL,
        tehsil TEXT NOT NULL,
        village_code TEXT NOT NULL,
        authority_code TEXT NOT NULL,             -- e.g. 'NOIDA', 'GNIDA', 'LDA', 'RURAL'
        enabling_statute TEXT NOT NULL CHECK(enabling_statute IN (
            'UP_URBAN_PLANNING_ACT_1973_SEC_39',
            'UP_INDUSTRIAL_AREA_DEV_ACT_1976_SEC_11B',
            'UP_SADA_ACT_1986_SEC_34',
            'UP_AVAS_VIKAS_ADHINIYAM_1965_SEC_62',
            'UP_MUNICIPALITIES_ACT_1916_SEC_128A',
            'RURAL_NON_NOTIFIED',
            'STATUTE_UNVERIFIED'
        )),
        applicable_additional_duty_rate REAL NOT NULL DEFAULT 0.0 CHECK(
            applicable_additional_duty_rate >= 0.0 AND applicable_additional_duty_rate <= statutory_rate_ceiling
        ),
        statutory_rate_ceiling REAL NOT NULL DEFAULT 0.05 CHECK(
            statutory_rate_ceiling >= 0.0 AND statutory_rate_ceiling <= 0.05
        ),
        territorial_notification_ref TEXT NOT NULL, -- e.g. 'Notification No. 4157-HI/XVIII-11'
        gazette_reference TEXT NOT NULL,            -- e.g. 'U.P. Gazette Extraordinary 1976'
        gazette_date TEXT NOT NULL,                 -- ISO date 'YYYY-MM-DD'
        notification_authority TEXT NOT NULL,       -- e.g. 'State Government of Uttar Pradesh'
        source_url TEXT,
        effective_from INTEGER NOT NULL,            -- UNIX timestamp (inclusive)
        effective_to INTEGER,                       -- UNIX timestamp (NULL = open-ended active)
        verified_at INTEGER,                        -- UNIX timestamp (NULL if unverified)
        is_synthetic_illustrative INTEGER NOT NULL DEFAULT 0 CHECK(is_synthetic_illustrative IN (0, 1)),
        status TEXT NOT NULL CHECK(status IN ('DRAFT', 'SCHEDULED', 'ACTIVE', 'SUPERSEDED', 'REVOKED')),
        created_at INTEGER NOT NULL,
        CHECK(effective_to IS NULL OR effective_to > effective_from)
    );

    CREATE INDEX IF NOT EXISTS idx_schedules_safe_lookup 
        ON CIRCLE_RATE_SCHEDULES(district, tehsil, village_code, authority_code, status, is_synthetic_illustrative);

    CREATE INDEX IF NOT EXISTS idx_schedules_effective_window 
        ON CIRCLE_RATE_SCHEDULES(effective_from, effective_to);

    -- 2. Granular Unit Rate Records Table
    CREATE TABLE IF NOT EXISTS CIRCLE_RATE_RECORDS (
        record_id INTEGER PRIMARY KEY AUTOINCREMENT,
        schedule_id INTEGER NOT NULL REFERENCES CIRCLE_RATE_SCHEDULES(schedule_id) ON DELETE CASCADE,
        land_use TEXT NOT NULL CHECK(land_use IN ('AGRICULTURAL', 'RESIDENTIAL', 'COMMERCIAL', 'INDUSTRIAL', 'INSTITUTIONAL')),
        structure_type TEXT NOT NULL DEFAULT 'INDIVIDUAL_PLOT_BUILDING' CHECK(structure_type IN (
            'INDIVIDUAL_PLOT_BUILDING',
            'STANDALONE_COMMERCIAL',
            'COMPLEX_MULTI_UNIT'
        )),
        road_tier TEXT NOT NULL DEFAULT 'STANDARD' CHECK(road_tier IN (
            'INTERNAL_LT_9M',
            'ROAD_9M_TO_18M',
            'ROAD_GT_18M_HIGHWAY',
            'STANDARD'
        )),
        base_rate_sqm REAL NOT NULL CHECK(base_rate_sqm >= 0),
        construction_rate_sqm REAL NOT NULL DEFAULT 0.0 CHECK(construction_rate_sqm >= 0),
        UNIQUE(schedule_id, land_use, structure_type, road_tier)
    );

    CREATE INDEX IF NOT EXISTS idx_records_lookup_safe 
        ON CIRCLE_RATE_RECORDS(schedule_id, land_use, structure_type, road_tier);

    -- 3. Non-Repudiable Valuation Audit Log Table (EVM Cancun keccak256 receipts)
    CREATE TABLE IF NOT EXISTS VALUATION_AUDIT_LOG (
        valuation_id INTEGER PRIMARY KEY AUTOINCREMENT,
        valuation_hash TEXT NOT NULL UNIQUE,        -- 0x-prefixed 64 hex chars (EVM bytes32)
        instrument_type TEXT NOT NULL,
        authority_code TEXT NOT NULL,
        enabling_statute TEXT NOT NULL,
        inputs_json TEXT NOT NULL,                  -- RFC 8785 canonical JSON
        result_json TEXT NOT NULL,                  -- RFC 8785 canonical JSON
        rate_schedule_id INTEGER NOT NULL REFERENCES CIRCLE_RATE_SCHEDULES(schedule_id),
        is_statutory_definitive INTEGER NOT NULL DEFAULT 0 CHECK(is_statutory_definitive IN (0, 1)),
        calculation_basis TEXT NOT NULL CHECK(calculation_basis IN ('STATUTORY_VERIFIED', 'ILLUSTRATIVE_SYNTHETIC', 'PROVISIONAL_ESTIMATE')),
        conditional_flags TEXT NOT NULL DEFAULT '[]',
        calculated_at INTEGER NOT NULL,
        ip_hash TEXT NOT NULL,
        CHECK(length(valuation_hash) = 66 AND valuation_hash LIKE '0x%')
    );

    CREATE UNIQUE INDEX IF NOT EXISTS idx_valuation_audit_hash_safe 
        ON VALUATION_AUDIT_LOG(valuation_hash);

    CREATE INDEX IF NOT EXISTS idx_valuation_audit_basis 
        ON VALUATION_AUDIT_LOG(calculation_basis, calculated_at);
  `);
}

module.exports = { initValuationSchema };
