const express = require('express');
const router = express.Router();
const db = require('../db');

// Helper to map SQLite snake_case -> API camelCase as per 05-api-documentation.md
const formatProperty = (row) => ({
    propertyId: row.property_id,
    locationHash: row.location_hash,
    area: row.area,
    currentOwner: row.current_owner,
    documentHash: row.document_hash,
    isVerified: Boolean(row.is_verified),
    isFrozen: Boolean(row.is_frozen),
    registeredAt: row.registered_at
});

// Helper to fetch and format ownership history
const getPropertyHistory = (propertyId) => {
    const historyRows = db.prepare(`
        SELECT event_type, tx_hash, block_number, timestamp, from_address, to_address
        FROM AUDIT_EVENTS
        WHERE property_id = ? AND event_type IN ('PropertyRegistered', 'OwnershipTransferred')
        ORDER BY block_number ASC, log_index ASC
    `).all(propertyId);
    
    return historyRows.map(h => ({
        eventType: h.event_type,
        txHash: h.tx_hash,
        blockNumber: h.block_number,
        timestamp: h.timestamp,
        fromAddress: h.from_address,
        toAddress: h.to_address
    }));
};

// GET /api/properties
router.get('/', (req, res) => {
    try {
        const { owner, status } = req.query;
        let query = 'SELECT * FROM PROPERTIES WHERE 1=1';
        const params = [];

        if (owner) {
            query += ' AND current_owner = ?';
            params.push(owner);
        }

        if (status) {
            if (status === 'verified') {
                query += ' AND is_verified = 1 AND is_frozen = 0';
            } else if (status === 'pending') {
                query += ' AND is_verified = 0';
            } else if (status === 'frozen') {
                query += ' AND is_frozen = 1';
            }
        }

        const rows = db.prepare(query).all(...params);
        res.json(rows.map(formatProperty));
    } catch (err) {
        console.error("GET /api/properties error:", err);
        res.status(500).json({ error: 'Internal server error', code: 'SERVER_ERROR' });
    }
});

// GET /api/properties/:id
router.get('/:id', (req, res) => {
    try {
        const propertyId = Number(req.params.id);
        if (!Number.isInteger(propertyId) || propertyId < 1) {
            return res.status(400).json({ error: 'Invalid property ID', code: 'INVALID_ID' });
        }
        
        const row = db.prepare('SELECT * FROM PROPERTIES WHERE property_id = ?').get(propertyId);
        
        if (!row) {
            return res.status(404).json({ error: 'Property not found', code: 'NOT_FOUND' });
        }
        
        const property = formatProperty(row);
        property.history = getPropertyHistory(propertyId);
        
        res.json(property);
    } catch (err) {
        console.error(`GET /api/properties/${req.params.id} error:`, err);
        res.status(500).json({ error: 'Internal server error', code: 'SERVER_ERROR' });
    }
});

// GET /api/properties/:id/history
router.get('/:id/history', (req, res) => {
    try {
        const propertyId = Number(req.params.id);
        if (!Number.isInteger(propertyId) || propertyId < 1) {
            return res.status(400).json({ error: 'Invalid property ID', code: 'INVALID_ID' });
        }
        
        res.json(getPropertyHistory(propertyId));
    } catch (err) {
        console.error(`GET /api/properties/${req.params.id}/history error:`, err);
        res.status(500).json({ error: 'Internal server error', code: 'SERVER_ERROR' });
    }
});

module.exports = router;
