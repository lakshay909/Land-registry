const express = require('express');
const router = express.Router();
const multer = require('multer');
const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');
const db = require('../db');
const {
  generateSalt,
  computeSha256,
  verifyClientChecksum,
  computeRawKeccak256,
  computeSaltedAnchor
} = require('../services/hashService');
const {
  validateMagicBytes,
  parsePdfDeed
} = require('../services/pdfParserService');

const HARDHAT_ACCOUNT_0 = '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266';
const AUTHORITY_ADDRESS = (process.env.AUTHORITY_ADDRESS || '0x90F79bf6EB2c4f870365E785982E1f101E93b906').toLowerCase();
const AUTHORIZED_AUTHORITIES = new Set([
  AUTHORITY_ADDRESS,
  HARDHAT_ACCOUNT_0
]);

// Resolve uploads directory with persistent volume support
const defaultUploadsDir = process.env.NODE_ENV === 'production'
  ? '/app/data/uploads'
  : path.resolve(__dirname, '../uploads');

const uploadsDir = process.env.UPLOADS_DIR
  ? (path.isAbsolute(process.env.UPLOADS_DIR) ? process.env.UPLOADS_DIR : path.resolve(__dirname, '..', process.env.UPLOADS_DIR))
  : defaultUploadsDir;

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Setup multer for local disk storage (existing route)
const upload = multer({ dest: uploadsDir });

// Setup multer for ingestion route with in-memory storage (10MB limit, single file)
const uploadIngest = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB maximum limit
    files: 1
  }
});

let activeIngestUploads = 0;

/**
 * Concurrency guard middleware to prevent memory exhaustion by bounding concurrent in-memory uploads.
 * Attaches req.releaseConcurrencySlot() which MUST be called in the route's finally block,
 * ensuring slots are not prematurely freed on client disconnect while server processing is still in flight.
 */
function ingestConcurrencyGuard(req, res, next) {
  const maxLimit = parseInt(process.env.MAX_CONCURRENT_UPLOADS || '10', 10);
  if (activeIngestUploads >= maxLimit) {
    return res.status(429).json({
      error: 'Server is currently processing maximum concurrent uploads. Please retry momentarily.',
      code: 'CONCURRENCY_LIMIT_EXCEEDED'
    });
  }

  activeIngestUploads++;
  let released = false;

  req.releaseConcurrencySlot = () => {
    if (!released) {
      released = true;
      activeIngestUploads = Math.max(0, activeIngestUploads - 1);
    }
  };

  next();
}

/**
 * Safely removes a temporary file from disk.
 * @param {string} filePath
 */
function cleanupFile(filePath) {
  if (filePath && fs.existsSync(filePath)) {
    try {
      fs.unlinkSync(filePath);
    } catch (e) {
      // Ignore cleanup errors
    }
  }
}

// POST /api/documents
// Uploads a deed document reference and returns its hash (PRESERVED FOR BACKWARD COMPATIBILITY)
router.post('/', upload.single('file'), (req, res) => {
  let tempFilePath = req.file ? req.file.path : null;
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded', code: 'NO_FILE' });
    }

    // 1. Read file bytes and compute exactly ethers.keccak256
    const fileBytes = fs.readFileSync(tempFilePath);
    // ethers.keccak256 strictly requires a Uint8Array (or hex string) to match on-chain hash
    const documentHash = ethers.keccak256(new Uint8Array(fileBytes));

    // 2. Content-addressable storage locally
    const newFilename = documentHash.replace('0x', '') + path.extname(req.file.originalname || '');
    const newPath = path.join(uploadsDir, newFilename);

    if (fs.existsSync(newPath)) {
      // Duplicate file content already exists; temp file will be removed in finally
    } else {
      fs.renameSync(tempFilePath, newPath);
      tempFilePath = null; // Successfully moved
    }

    const fileReference = `/uploads/${newFilename}`;
    const uploadedBy = req.body.uploader || '0x0000000000000000000000000000000000000000';
    const uploadedAt = Math.floor(Date.now() / 1000);

    // 3. Persist to DB
    const insertDoc = db.prepare(`
      INSERT OR IGNORE INTO DOCUMENTS (document_hash, file_reference, uploaded_by, uploaded_at)
      VALUES (?, ?, ?, ?)
    `);
    insertDoc.run(documentHash, fileReference, uploadedBy, uploadedAt);

    return res.json({ documentHash, fileReference });
  } catch (err) {
    console.error("POST /api/documents error:", err);
    return res.status(500).json({ error: 'Internal server error', code: 'SERVER_ERROR' });
  } finally {
    if (tempFilePath && fs.existsSync(tempFilePath)) {
      cleanupFile(tempFilePath);
    }
  }
});

// POST /api/documents/ingest
// Assisted Citizen Ingestion & Document Verification Pipeline
router.post('/ingest', ingestConcurrencyGuard, (req, res, next) => {
  uploadIngest.single('file')(req, res, (err) => {
    if (err) {
      if (req.releaseConcurrencySlot) {
        req.releaseConcurrencySlot();
      }
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(413).json({
            error: 'File size exceeds maximum allowed limit of 10MB',
            code: 'FILE_TOO_LARGE'
          });
        }
        if (err.code === 'LIMIT_FILE_COUNT') {
          return res.status(400).json({
            error: 'Too many files uploaded. Only a single deed document is accepted.',
            code: 'TOO_MANY_FILES'
          });
        }
        return res.status(400).json({ error: err.message, code: 'UPLOAD_ERROR' });
      }
      return res.status(400).json({ error: err.message, code: 'UPLOAD_ERROR' });
    }
    next();
  });
}, async (req, res) => {
  let storedPath = null;
  let fileCreated = false;
  try {
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({ error: 'No file uploaded', code: 'NO_FILE' });
    }

    // 1. Read file bytes directly from memory buffer
    const fileBytes = req.file.buffer;

    // 2. Validate magic bytes (%PDF- at byte offset 0)
    if (!validateMagicBytes(fileBytes)) {
      return res.status(400).json({
        error: 'Invalid file format: Document must start with %PDF- header',
        code: 'INVALID_PDF_FORMAT'
      });
    }

    // 3. Verify client checksum (if provided in body or header)
    const clientSha256 = req.body.clientSha256 || req.body.sha256 || req.headers['x-deed-sha256'];
    if (clientSha256) {
      const isChecksumValid = verifyClientChecksum(fileBytes, clientSha256);
      if (!isChecksumValid) {
        return res.status(400).json({
          error: 'Client checksum verification failed: SHA-256 digest mismatch',
          code: 'CHECKSUM_MISMATCH'
        });
      }
    }
    const computedSha256 = computeSha256(fileBytes);

    // 4. Compute 2-stage salted cryptographic anchor
    const rawKeccak = computeRawKeccak256(fileBytes);
    const salt = generateSalt();
    const documentAnchor = computeSaltedAnchor(rawKeccak, salt);

    // 5. Pre-check: Reject duplicate document anchors/hashes before permanent write (Insert-Only Policy)
    const existingVault = db.prepare(`
      SELECT vault_id FROM CITIZEN_SALT_VAULT
      WHERE document_anchor = ? OR raw_keccak256 = ?
    `).get(documentAnchor, rawKeccak);

    if (existingVault) {
      return res.status(409).json({
        error: 'Document has already been ingested. Duplicate uploads cannot overwrite existing salt vault credentials.',
        code: 'DUPLICATE_DOCUMENT_ANCHOR'
      });
    }

    // 6. Cadastral extraction & Aadhaar detection (throws AADHAAR_DETECTED by default)
    let parseResult;
    try {
      parseResult = await parsePdfDeed(fileBytes);
    } catch (parseErr) {
      if (parseErr.code === 'AADHAAR_DETECTED') {
        return res.status(422).json({
          error: 'Aadhaar number detected in document payload (Section 29 Aadhaar Act violation). Ingestion halted and document discarded.',
          code: 'AADHAAR_DETECTED'
        });
      }
      return res.status(422).json({
        error: 'Failed to extract parcel metadata from PDF: ' + parseErr.message,
        code: parseErr.code || 'PARSING_FAILED'
      });
    }

    // 7. Gata Code validation: 16-digit Computerized Gata Code is mandatory
    if (!parseResult.fields || !parseResult.fields.gataCode) {
      return res.status(422).json({
        error: 'Missing mandatory 16-digit Computerized Gata Code in document',
        code: 'MISSING_GATA_CODE'
      });
    }

    // 8. Store file locally using content-addressed anchor ONLY after all security & parsing checks pass
    const ext = path.extname(req.file.originalname || '') || '.pdf';
    const storedFilename = documentAnchor.replace('0x', '') + ext;
    storedPath = path.join(uploadsDir, storedFilename);

    if (!fs.existsSync(storedPath)) {
      fs.writeFileSync(storedPath, fileBytes);
      fileCreated = true;
    }
    const fileReference = `/uploads/${storedFilename}`;

    const citizenAddress = req.body.citizenAddress || req.body.walletAddress || req.body.uploader || '0x0000000000000000000000000000000000000000';
    const nowSeconds = Math.floor(Date.now() / 1000);

    // 9. Atomic SQLite transaction (Insert-Only into CITIZEN_SALT_VAULT)
    const executeIngestTx = db.transaction(() => {
      // Insert/update DOCUMENTS table
      db.prepare(`
        INSERT OR REPLACE INTO DOCUMENTS (document_hash, file_reference, uploaded_by, uploaded_at)
        VALUES (?, ?, ?, ?)
      `).run(documentAnchor, fileReference, citizenAddress, nowSeconds);

      // Insert-only into CITIZEN_SALT_VAULT (never overwrite)
      db.prepare(`
        INSERT INTO CITIZEN_SALT_VAULT (
          document_anchor, salt_value, raw_keccak256, client_sha256, citizen_address, created_at, access_count
        ) VALUES (?, ?, ?, ?, ?, ?, 0)
      `).run(
        documentAnchor,
        salt,
        rawKeccak,
        clientSha256 ? clientSha256.toLowerCase().replace(/^0x/, '') : computedSha256,
        citizenAddress,
        nowSeconds
      );

      // Insert into PARCEL_EXTRACTION_METADATA
      const isTransferableInt = parseResult.transferability.isTransferable ? 1 : 0;
      db.prepare(`
        INSERT OR REPLACE INTO PARCEL_EXTRACTION_METADATA (
          document_anchor, gata_code, khasra_number, ulpin, tenure_class,
          is_transferable, district, tehsil, issue_date, freshness_status, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        documentAnchor,
        parseResult.fields.gataCode,
        parseResult.fields.khasraNumber || null,
        parseResult.fields.ulpin || null,
        parseResult.fields.tenureClass || null,
        isTransferableInt,
        parseResult.fields.district || null,
        parseResult.fields.tehsil || null,
        parseResult.fields.issueDate || null,
        parseResult.freshness.status,
        nowSeconds
      );
    });

    executeIngestTx();

    const verificationStatus = parseResult.freshness.status === 'EXPIRED_OUTDATED'
      ? 'EXPIRED_OUTDATED'
      : 'INTEGRITY_HASH_GENERATED';

    return res.status(200).json({
      status: 'success',
      documentAnchor,
      rawKeccak256: rawKeccak,
      clientSha256: computedSha256,
      salt,
      fileReference,
      downloadUrl: `/api/documents/${documentAnchor}/download`,
      verificationStatus,
      freshness: parseResult.freshness,
      transferability: parseResult.transferability,
      extractedMetadata: {
        computerizedGataCode: parseResult.fields.gataCode,
        khasraNumber: parseResult.fields.khasraNumber,
        ulpin: parseResult.fields.ulpin || 'PENDING_GEOREFERENCING',
        tenureClass: parseResult.fields.tenureClass,
        district: parseResult.fields.district,
        tehsil: parseResult.fields.tehsil,
        issueDate: parseResult.fields.issueDate
      },
      disclaimer: 'Integrity hash anchors file contents against tampering. Statutory proof of title is established exclusively by registered deeds and official revenue records.'
    });
  } catch (err) {
    if (fileCreated && storedPath && fs.existsSync(storedPath)) {
      cleanupFile(storedPath);
    }
    if (err.code === 'SQLITE_CONSTRAINT') {
      return res.status(409).json({
        error: 'Document has already been ingested. Duplicate uploads cannot overwrite existing salt vault credentials.',
        code: 'DUPLICATE_DOCUMENT_ANCHOR'
      });
    }
    console.error("POST /api/documents/ingest error:", err);
    return res.status(500).json({ error: 'Internal server error during document ingestion', code: 'SERVER_ERROR' });
  } finally {
    if (req.releaseConcurrencySlot) {
      req.releaseConcurrencySlot();
    }
  }
});

// GET /api/documents/:hash/download
// Authenticated streaming download endpoint
router.get('/:hash/download', (req, res) => {
  try {
    const hash = req.params.hash;
    // 1. Validate bytes32 hex syntax
    if (!/^0x[a-fA-F0-9]{64}$/.test(hash)) {
      return res.status(400).json({ error: 'Invalid document hash format', code: 'INVALID_HASH' });
    }

    // 2. Check caller authentication
    const caller = req.headers['x-user-address'] || req.query.userAddress || req.headers['x-wallet-address'] || req.query.address;
    if (!caller) {
      return res.status(401).json({
        error: 'Authentication required: User address header or query parameter missing',
        code: 'AUTHENTICATION_REQUIRED'
      });
    }

    // 3. Query document record
    const docRow = db.prepare('SELECT * FROM DOCUMENTS WHERE document_hash = ?').get(hash);
    const vaultRow = db.prepare('SELECT * FROM CITIZEN_SALT_VAULT WHERE document_anchor = ? OR raw_keccak256 = ?').get(hash, hash);

    if (!docRow && !vaultRow) {
      return res.status(404).json({ error: 'Document not found', code: 'DOCUMENT_NOT_FOUND' });
    }

    // 4. Resolve file path on disk
    let diskPath = null;
    if (docRow && docRow.file_reference) {
      const filename = path.basename(docRow.file_reference);
      const candidatePath = path.join(uploadsDir, filename);
      if (fs.existsSync(candidatePath)) {
        diskPath = candidatePath;
      } else {
        const legacyPath = path.join(__dirname, '..', docRow.file_reference.replace(/^\//, ''));
        if (fs.existsSync(legacyPath)) {
          diskPath = legacyPath;
        }
      }
    }
    if (!diskPath || !fs.existsSync(diskPath)) {
      const candidateExts = ['.pdf', ''];
      for (const ext of candidateExts) {
        const p = path.join(uploadsDir, hash.replace('0x', '') + ext);
        if (fs.existsSync(p)) {
          diskPath = p;
          break;
        }
        const legacyP = path.join('uploads', hash.replace('0x', '') + ext);
        if (fs.existsSync(legacyP)) {
          diskPath = legacyP;
          break;
        }
      }
    }

    if (!diskPath || !fs.existsSync(diskPath)) {
      return res.status(404).json({ error: 'Document file not found on disk', code: 'DOCUMENT_NOT_FOUND' });
    }

    // 5. Authorize access
    const callerLower = String(caller).trim().toLowerCase();
    let isAuthorized = false;

    if (AUTHORIZED_AUTHORITIES.has(callerLower)) {
      isAuthorized = true;
    } else if (docRow && docRow.uploaded_by && docRow.uploaded_by.toLowerCase() === callerLower) {
      isAuthorized = true;
    } else if (vaultRow && vaultRow.citizen_address && vaultRow.citizen_address.toLowerCase() === callerLower) {
      isAuthorized = true;
    } else {
      // Check if caller is property owner linked to this document
      const prop = db.prepare('SELECT current_owner FROM PROPERTIES WHERE document_hash = ?').get(hash);
      if (prop && prop.current_owner && prop.current_owner.toLowerCase() === callerLower) {
        isAuthorized = true;
      }
    }

    if (!isAuthorized) {
      return res.status(403).json({
        error: 'Unauthorized: You do not have permission to access this title deed',
        code: 'UNAUTHORIZED_ACCESS'
      });
    }

    // 6. Stream PDF with inline disposition
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline; filename="certified_deed.pdf"');
    const stream = fs.createReadStream(diskPath);
    stream.on('error', (err) => {
      console.error("Stream error in GET /api/documents/:hash/download:", err);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Internal server error reading document', code: 'SERVER_ERROR' });
      }
    });
    return stream.pipe(res);
  } catch (err) {
    console.error(`GET /api/documents/${req.params.hash}/download error:`, err);
    return res.status(500).json({ error: 'Internal server error', code: 'SERVER_ERROR' });
  }
});

// GET /api/documents/:hash
// Retrieves the stored file reference for a given on-chain document hash
router.get('/:hash', (req, res) => {
  try {
    const hash = req.params.hash;
    // Validate bytes32 hex string
    if (!/^0x[a-fA-F0-9]{64}$/.test(hash)) {
      return res.status(400).json({ error: 'Invalid document hash format', code: 'INVALID_HASH' });
    }

    const row = db.prepare('SELECT * FROM DOCUMENTS WHERE document_hash = ?').get(hash);

    if (!row) {
      return res.status(404).json({ error: 'Document not found', code: 'NOT_FOUND' });
    }

    const metaRow = db.prepare('SELECT * FROM PARCEL_EXTRACTION_METADATA WHERE document_anchor = ?').get(hash);

    const response = {
      documentHash: row.document_hash,
      fileReference: row.file_reference,
      downloadUrl: `/api/documents/${row.document_hash}/download`,
      uploadedBy: row.uploaded_by,
      uploadedAt: row.uploaded_at
    };

    if (metaRow) {
      response.metadata = {
        gataCode: metaRow.gata_code,
        khasraNumber: metaRow.khasra_number,
        ulpin: metaRow.ulpin,
        tenureClass: metaRow.tenure_class,
        isTransferable: Boolean(metaRow.is_transferable),
        district: metaRow.district,
        tehsil: metaRow.tehsil,
        issueDate: metaRow.issue_date,
        freshnessStatus: metaRow.freshness_status
      };
    }

    return res.json(response);
  } catch (err) {
    console.error(`GET /api/documents/${req.params.hash} error:`, err);
    return res.status(500).json({ error: 'Internal server error', code: 'SERVER_ERROR' });
  }
});

router.ingestConcurrencyGuard = ingestConcurrencyGuard;
router.getActiveIngestUploads = () => activeIngestUploads;
router.resetActiveIngestUploads = () => { activeIngestUploads = 0; };

module.exports = router;
