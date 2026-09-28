const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/audit-log
// Returns the raw event log (all event types). Optional propertyId filter.
router.get('/', (req, res) => {
    try {
        const { propertyId } = req.query;
        let query = 'SELECT * FROM AUDIT_EVENTS';
        const params = [];
        
        if (propertyId) {
            const pId = Number(propertyId);
            if (!Number.isInteger(pId) || pId < 1) {
                return res.status(400).json({ error: 'Invalid property ID', code: 'INVALID_ID' });
            }
            query += ' WHERE property_id = ?';
            params.push(pId);
        }
        
        // Sort newest first for audit trails
        query += ' ORDER BY block_number DESC, log_index DESC';
        
        const rows = db.prepare(query).all(...params);
        
        const formatAudit = (row) => ({
            eventId: row.event_id,
            propertyId: row.property_id,
            eventType: row.event_type,
            txHash: row.tx_hash,
            blockNumber: row.block_number,
            timestamp: row.timestamp,
            logIndex: row.log_index
        });

        res.json(rows.map(formatAudit));
    } catch (err) {
        console.error("GET /api/audit-log error:", err);
        res.status(500).json({ error: 'Internal server error', code: 'SERVER_ERROR' });
    }
});

module.exports = router;
