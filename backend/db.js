const Database = require('better-sqlite3');
const path = require('path');
require('dotenv').config();

const dbPath = process.env.DB_PATH || path.join(__dirname, 'database.sqlite');
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
        registered_at INTEGER
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
        UNIQUE(tx_hash, log_index),
        FOREIGN KEY(property_id) REFERENCES PROPERTIES(property_id)
    );

    CREATE TABLE IF NOT EXISTS DOCUMENTS (
        document_hash TEXT PRIMARY KEY,
        file_reference TEXT,
        uploaded_by TEXT,
        uploaded_at INTEGER
    );

    CREATE TABLE IF NOT EXISTS SYNC_STATE (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        last_indexed_block INTEGER
    );
  `);

  // Initialize SYNC_STATE to deployment block if empty
  const stateRow = db.prepare('SELECT * FROM SYNC_STATE WHERE id = 1').get();
  if (!stateRow) {
    const defaultBlock = parseInt(process.env.CONTRACT_DEPLOYMENT_BLOCK || '0', 10);
    db.prepare('INSERT INTO SYNC_STATE (id, last_indexed_block) VALUES (1, ?)').run(defaultBlock);
  }
}

initializeDatabase();

module.exports = db;
