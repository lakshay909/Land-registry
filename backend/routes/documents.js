const express = require('express');
const router = express.Router();
const multer = require('multer');
const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');
const db = require('../db');

// Setup multer for local disk storage
const upload = multer({ dest: 'uploads/' });

// POST /api/documents
// Uploads a deed document reference and returns its hash
router.post('/', upload.single('file'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded', code: 'NO_FILE' });
        }

        // 1. Read file bytes and compute exactly ethers.keccak256
        const fileBytes = fs.readFileSync(req.file.path);
        // ethers.keccak256 strictly requires a Uint8Array (or hex string) to match on-chain hash
        // This guarantees the exact same hash as the frontend's ethers.keccak256(new Uint8Array(await file.arrayBuffer()))
        const documentHash = ethers.keccak256(new Uint8Array(fileBytes));
        
        // 2. Rename the file to its hash for content-addressable storage locally
        const newFilename = documentHash.replace('0x', '') + path.extname(req.file.originalname || '');
        const newPath = path.join('uploads', newFilename);
        
        // If file already exists with same hash, we can just remove the duplicate temp file
        if (fs.existsSync(newPath)) {
            fs.unlinkSync(req.file.path);
        } else {
            fs.renameSync(req.file.path, newPath);
        }

        const fileReference = `/uploads/${newFilename}`;
        
        // Mock uploadedBy for now - in production this comes from signed msg/auth token
        const uploadedBy = req.body.uploader || '0x0000000000000000000000000000000000000000';
        const uploadedAt = Math.floor(Date.now() / 1000);

        // 3. Persist to DB
        const insertDoc = db.prepare(`
            INSERT OR IGNORE INTO DOCUMENTS (document_hash, file_reference, uploaded_by, uploaded_at)
            VALUES (?, ?, ?, ?)
        `);
        insertDoc.run(documentHash, fileReference, uploadedBy, uploadedAt);

        res.json({ documentHash, fileReference });
    } catch (err) {
        console.error("POST /api/documents error:", err);
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        res.status(500).json({ error: 'Internal server error', code: 'SERVER_ERROR' });
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
        
        res.json({
            documentHash: row.document_hash,
            fileReference: row.file_reference,
            uploadedBy: row.uploaded_by,
            uploadedAt: row.uploaded_at
        });
    } catch (err) {
        console.error(`GET /api/documents/${req.params.hash} error:`, err);
        res.status(500).json({ error: 'Internal server error', code: 'SERVER_ERROR' });
    }
});

module.exports = router;
