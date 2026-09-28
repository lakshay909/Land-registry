const express = require('express');
const router = express.Router();
const db = require('../db');

// Helper to map SQLite snake_case -> API camelCase
const formatTransfer = (row) => ({
    transferId: row.transfer_id,
    propertyId: row.property_id,
    fromAddress: row.from_address,
    toAddress: row.to_address,
    newDocumentHash: row.new_document_hash,
    fromSigned: Boolean(row.from_signed),
    toSigned: Boolean(row.to_signed),
    authorityApproved: Boolean(row.authority_approved),
    executed: Boolean(row.executed),
    createdAt: row.created_at
});

// GET /api/transfers
router.get('/', (req, res) => {
    try {
        const { status, party } = req.query;
        let query = 'SELECT * FROM TRANSFERS WHERE 1=1';
        const params = [];
        
        if (status === 'pending') {
            query += ' AND executed = 0';
        }

        if (party) {
            if (!/^0x[a-fA-F0-9]{40}$/.test(party)) {
                return res.status(400).json({ error: 'Invalid party address format', code: 'INVALID_ADDRESS' });
            }
            query += ' AND (from_address = ? OR to_address = ?)';
            params.push(party, party);
        }

        const rows = db.prepare(query).all(...params);
        res.json(rows.map(formatTransfer));
    } catch (err) {
        console.error("GET /api/transfers error:", err);
        res.status(500).json({ error: 'Internal server error', code: 'SERVER_ERROR' });
    }
});

// GET /api/transfers/:id
router.get('/:id', (req, res) => {
    try {
        const transferId = Number(req.params.id);
        if (!Number.isInteger(transferId) || transferId < 1) {
            return res.status(400).json({ error: 'Invalid transfer ID', code: 'INVALID_ID' });
        }
        
        const row = db.prepare('SELECT * FROM TRANSFERS WHERE transfer_id = ?').get(transferId);
        
        if (!row) {
            return res.status(404).json({ error: 'Transfer not found', code: 'NOT_FOUND' });
        }
        
        res.json(formatTransfer(row));
    } catch (err) {
        console.error(`GET /api/transfers/${req.params.id} error:`, err);
        res.status(500).json({ error: 'Internal server error', code: 'SERVER_ERROR' });
    }
});

module.exports = router;
