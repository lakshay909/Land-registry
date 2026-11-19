const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const defaultDbPath = process.env.NODE_ENV === 'production'
  ? '/app/data/database.sqlite'
  : path.join(__dirname, 'database.sqlite');

const rawDbPath = process.env.DB_PATH || defaultDbPath;
const dbPath = path.isAbsolute(rawDbPath) ? rawDbPath : path.join(__dirname, rawDbPath);

// Ensure parent directory exists before instantiating database
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(dbPath);

function initializeDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS PROPERTIES (
        property_id INTEGER PRIMARY KEY,
        location_hash TEXT,
        area INTEGER,
        current_owner TEXT,
        document_hash TEXT,
        is_verified INTEGER DEFAULT 0,
        is_frozen INTEGER DEFAULT 0,
        registered_at INTEGER,
        price TEXT DEFAULT '0',
        is_for_sale INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS TRANSFERS (
        transfer_id INTEGER PRIMARY KEY,
        property_id INTEGER,
        from_address TEXT,
        to_address TEXT,
        new_document_hash TEXT,
        from_signed INTEGER DEFAULT 0,
        to_signed INTEGER DEFAULT 0,
        authority_approved INTEGER DEFAULT 0,
        executed INTEGER DEFAULT 0,
        created_at INTEGER,
        escrow_amount TEXT DEFAULT '0',
        FOREIGN KEY(property_id) REFERENCES PROPERTIES(property_id)
    );

    CREATE TABLE IF NOT EXISTS AUDIT_EVENTS (
        event_id INTEGER PRIMARY KEY AUTOINCREMENT,
        property_id INTEGER,
        event_type TEXT,
        tx_hash TEXT,
        block_number INTEGER,
        timestamp INTEGER,
        log_index INTEGER,
        from_address TEXT,
        to_address TEXT,
        reason TEXT,
        UNIQUE(tx_hash, log_index),
        FOREIGN KEY(property_id) REFERENCES PROPERTIES(property_id)
    );

    CREATE TABLE IF NOT EXISTS DOCUMENTS (
        document_hash TEXT PRIMARY KEY,
        file_reference TEXT,
        uploaded_by TEXT,
        uploaded_at INTEGER
    );

    CREATE TABLE IF NOT EXISTS CITIZEN_SALT_VAULT (
        vault_id INTEGER PRIMARY KEY AUTOINCREMENT,
        document_anchor TEXT UNIQUE,
        salt_value TEXT,
        raw_keccak256 TEXT NOT NULL UNIQUE,
        client_sha256 TEXT,
        citizen_address TEXT,
        created_at INTEGER,
        access_count INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS PARCEL_EXTRACTION_METADATA (
        metadata_id INTEGER PRIMARY KEY AUTOINCREMENT,
        document_anchor TEXT UNIQUE,
        gata_code TEXT,
        khasra_number TEXT,
        ulpin TEXT,
        tenure_class TEXT,
        is_transferable INTEGER,
        district TEXT,
        tehsil TEXT,
        issue_date TEXT,
        freshness_status TEXT,
        created_at INTEGER
    );

    CREATE INDEX IF NOT EXISTS idx_vault_anchor ON CITIZEN_SALT_VAULT(document_anchor);
    CREATE UNIQUE INDEX IF NOT EXISTS idx_vault_raw_keccak ON CITIZEN_SALT_VAULT(raw_keccak256);
    CREATE INDEX IF NOT EXISTS idx_metadata_anchor ON PARCEL_EXTRACTION_METADATA(document_anchor);
    CREATE INDEX IF NOT EXISTS idx_metadata_gata ON PARCEL_EXTRACTION_METADATA(gata_code);

    CREATE TABLE IF NOT EXISTS SYNC_STATE (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        last_indexed_block INTEGER
    );
  `);

  // Safe schema migrations for existing databases
  try { db.exec("ALTER TABLE PROPERTIES ADD COLUMN price TEXT DEFAULT '0'"); } catch (e) {}
  try { db.exec("ALTER TABLE PROPERTIES ADD COLUMN is_for_sale INTEGER DEFAULT 0"); } catch (e) {}
  try { db.exec("ALTER TABLE TRANSFERS ADD COLUMN escrow_amount TEXT DEFAULT '0'"); } catch (e) {}
  try { db.exec("ALTER TABLE CITIZEN_SALT_VAULT ADD COLUMN access_count INTEGER DEFAULT 0"); } catch (e) {}
  try { db.exec("ALTER TABLE PARCEL_EXTRACTION_METADATA ADD COLUMN freshness_status TEXT"); } catch (e) {}
  try { db.exec("ALTER TABLE PARCEL_EXTRACTION_METADATA ADD COLUMN is_transferable INTEGER DEFAULT 1"); } catch (e) {}
  try { db.exec("ALTER TABLE AUDIT_EVENTS ADD COLUMN reason TEXT"); } catch (e) {}

  // Enforce robust unique raw_keccak256 migration
  migrateVaultUniqueKeccak(db);

  // Initialize PKG-02 Safe Foundation Valuation schema
  try {
    const { initValuationSchema } = require('./services/valuation/valuationDb');
    initValuationSchema(db);
  } catch (e) {
    console.error('Warning: Failed to initialize valuation schema:', e.message);
  }

  // Initialize SYNC_STATE to deployment block if empty
  const stateRow = db.prepare('SELECT * FROM SYNC_STATE WHERE id = 1').get();
  if (!stateRow) {
    const defaultBlock = parseInt(process.env.CONTRACT_DEPLOYMENT_BLOCK || '0', 10);
    db.prepare('INSERT INTO SYNC_STATE (id, last_indexed_block) VALUES (1, ?)').run(defaultBlock);
  }
}

/**
 * Explicit migration function to enforce unique raw_keccak256 index on CITIZEN_SALT_VAULT.
 * Detects NULL and duplicate records, executes creation within transaction, and validates index existence.
 * @param {import('better-sqlite3').Database} dbInstance
 */
function migrateVaultUniqueKeccak(dbInstance) {
  // Check if CITIZEN_SALT_VAULT exists
  const tableExists = dbInstance.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'CITIZEN_SALT_VAULT'").get();
  if (!tableExists) return;

  // 1. Detect duplicate raw_keccak256
  const duplicates = dbInstance.prepare(`
    SELECT raw_keccak256, COUNT(*) as count 
    FROM CITIZEN_SALT_VAULT 
    WHERE raw_keccak256 IS NOT NULL 
    GROUP BY raw_keccak256 
    HAVING count > 1
  `).all();

  if (duplicates.length > 0) {
    const conflictReport = duplicates.map(d => `${d.raw_keccak256} (${d.count} occurrences)`).join(', ');
    const err = new Error(`MigrationError: Cannot enforce unique raw_keccak256 constraint. Existing duplicate records detected: ${conflictReport}`);
    err.code = 'MIGRATION_DUPLICATE_KECCAK';
    err.duplicates = duplicates;
    throw err;
  }

  // 2. Check for NULL raw_keccak256
  const nullRow = dbInstance.prepare("SELECT COUNT(*) as count FROM CITIZEN_SALT_VAULT WHERE raw_keccak256 IS NULL").get();
  const nullCount = nullRow ? nullRow.count : 0;
  if (nullCount > 0) {
    const err = new Error(`MigrationError: Cannot enforce unique raw_keccak256 constraint. Found ${nullCount} records with NULL raw_keccak256.`);
    err.code = 'MIGRATION_NULL_KECCAK';
    err.nullCount = nullCount;
    throw err;
  }

  // 3. Create unique index and NOT-NULL enforcement trigger within a transaction
  const executeMigration = dbInstance.transaction(() => {
    dbInstance.exec("CREATE UNIQUE INDEX IF NOT EXISTS idx_vault_raw_keccak ON CITIZEN_SALT_VAULT(raw_keccak256)");
    dbInstance.exec(`
      CREATE TRIGGER IF NOT EXISTS trg_vault_raw_keccak_not_null
      BEFORE INSERT ON CITIZEN_SALT_VAULT
      FOR EACH ROW
      WHEN NEW.raw_keccak256 IS NULL OR TRIM(NEW.raw_keccak256) = ''
      BEGIN
        SELECT RAISE(ABORT, 'raw_keccak256 cannot be NULL or empty');
      END;
    `);
  });
  executeMigration();

  // 4. Verify index exists in sqlite_master
  const indexExists = dbInstance.prepare("SELECT name FROM sqlite_master WHERE type = 'index' AND name = 'idx_vault_raw_keccak'").get();
  if (!indexExists) {
    const err = new Error("MigrationError: Unique index idx_vault_raw_keccak verification failed after execution.");
    err.code = 'MIGRATION_VERIFICATION_FAILED';
    throw err;
  }
}

initializeDatabase();

db.migrateVaultUniqueKeccak = migrateVaultUniqueKeccak;
db.initializeDatabase = initializeDatabase;

module.exports = db;
module.exports.migrateVaultUniqueKeccak = migrateVaultUniqueKeccak;
module.exports.initializeDatabase = initializeDatabase;
