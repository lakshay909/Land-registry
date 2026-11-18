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
    registeredAt: row.registered_at,
    price: row.price || '0',
    isForSale: Boolean(row.is_for_sale),
    gataCode: row.gata_code || null,
    khasraNumber: row.khasra_number || null,
    ulpin: row.ulpin || null,
    tenureClass: row.tenure_class || null,
    freshnessStatus: row.freshness_status || null,
    fileReference: row.file_reference || null,
    caveatReason: row.caveat_reason || (row.is_frozen ? 'Judicial Injunction / Caveat Active' : null)
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

// GET /api/properties/marketplace (Must be declared before /:id)
router.get('/marketplace', (req, res) => {
    try {
        const query = `
            SELECT 
                p.*,
                m.gata_code,
                m.khasra_number,
                m.ulpin,
                m.tenure_class,
                m.freshness_status,
                d.file_reference,
                NULL AS caveat_reason
            FROM PROPERTIES p
            LEFT JOIN DOCUMENTS d ON p.document_hash = d.document_hash
            LEFT JOIN PARCEL_EXTRACTION_METADATA m ON COALESCE(p.document_hash, 'PROP_ANCHOR_' || p.property_id) = m.document_anchor
            WHERE p.is_for_sale = 1 AND p.is_frozen = 0
        `;
        const rows = db.prepare(query).all();
        res.json(rows.map(formatProperty));
    } catch (err) {
        console.error("GET /api/properties/marketplace error:", err);
        res.status(500).json({ error: 'Internal server error', code: 'SERVER_ERROR' });
    }
});

// GET /api/properties
router.get('/', (req, res) => {
    try {
        const { owner, status } = req.query;
        let query = `
            SELECT 
                p.*,
                m.gata_code,
                m.khasra_number,
                m.ulpin,
                m.tenure_class,
                m.freshness_status,
                d.file_reference,
                CASE 
                    WHEN p.is_frozen = 1 THEN (
                        SELECT a.reason 
                        FROM AUDIT_EVENTS a 
                        WHERE a.property_id = p.property_id AND a.event_type = 'PropertyFlagged'
                        ORDER BY a.block_number DESC, a.log_index DESC, a.event_id DESC
                        LIMIT 1
                    )
                    ELSE NULL 
                END AS caveat_reason
            FROM PROPERTIES p
            LEFT JOIN DOCUMENTS d ON p.document_hash = d.document_hash
            LEFT JOIN PARCEL_EXTRACTION_METADATA m ON COALESCE(p.document_hash, 'PROP_ANCHOR_' || p.property_id) = m.document_anchor
            WHERE 1=1
        `;
        const params = [];

        if (owner) {
            query += ' AND LOWER(p.current_owner) = LOWER(?)';
            params.push(owner);
        }

        if (status) {
            if (status === 'verified') {
                query += ' AND p.is_verified = 1 AND p.is_frozen = 0';
            } else if (status === 'pending') {
                query += ' AND p.is_verified = 0';
            } else if (status === 'frozen') {
                query += ' AND p.is_frozen = 1';
            } else if (status === 'for-sale' || status === 'forSale') {
                query += ' AND p.is_for_sale = 1 AND p.is_frozen = 0';
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
        
        const query = `
            SELECT 
                p.*,
                m.gata_code,
                m.khasra_number,
                m.ulpin,
                m.tenure_class,
                m.freshness_status,
                d.file_reference,
                CASE 
                    WHEN p.is_frozen = 1 THEN (
                        SELECT a.reason 
                        FROM AUDIT_EVENTS a 
                        WHERE a.property_id = p.property_id AND a.event_type = 'PropertyFlagged'
                        ORDER BY a.block_number DESC, a.log_index DESC, a.event_id DESC
                        LIMIT 1
                    )
                    ELSE NULL 
                END AS caveat_reason
            FROM PROPERTIES p
            LEFT JOIN DOCUMENTS d ON p.document_hash = d.document_hash
            LEFT JOIN PARCEL_EXTRACTION_METADATA m ON COALESCE(p.document_hash, 'PROP_ANCHOR_' || p.property_id) = m.document_anchor
            WHERE p.property_id = ?
        `;
        const row = db.prepare(query).get(propertyId);
        
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

// PATCH /api/properties/:id/georeference
router.patch('/:id/georeference', (req, res) => {
    try {
        const propertyId = Number(req.params.id);
        if (!Number.isInteger(propertyId) || propertyId < 1) {
            return res.status(400).json({ error: 'Invalid property ID', code: 'INVALID_ID' });
        }

        const ulpin = req.body && req.body.ulpin;
        if (!ulpin || typeof ulpin !== 'string' || !/^[A-Z0-9]{14}$/.test(ulpin.trim())) {
            return res.status(400).json({
                error: 'Invalid ULPIN format: Must be exactly 14 alphanumeric uppercase characters (e.g. UP09LK41200001)',
                code: 'INVALID_ULPIN_FORMAT'
            });
        }

        const cleanUlpin = ulpin.trim();

        const prop = db.prepare('SELECT * FROM PROPERTIES WHERE property_id = ?').get(propertyId);
        if (!prop) {
            return res.status(404).json({ error: 'Property not found', code: 'NOT_FOUND' });
        }

        const docAnchor = prop.document_hash || `PROP_ANCHOR_${propertyId}`;
        const existingMeta = db.prepare('SELECT metadata_id FROM PARCEL_EXTRACTION_METADATA WHERE document_anchor = ?').get(docAnchor);

        if (existingMeta) {
            db.prepare('UPDATE PARCEL_EXTRACTION_METADATA SET ulpin = ? WHERE document_anchor = ?').run(cleanUlpin, docAnchor);
        } else {
            const now = Math.floor(Date.now() / 1000);
            db.prepare(`
                INSERT INTO PARCEL_EXTRACTION_METADATA (document_anchor, ulpin, is_transferable, freshness_status, created_at)
                VALUES (?, ?, 1, 'VALID_RECENT', ?)
            `).run(docAnchor, cleanUlpin, now);
        }

        return res.json({
            success: true,
            propertyId,
            ulpin: cleanUlpin,
            message: 'Cadastral ULPIN georeferencing successfully recorded'
        });
    } catch (err) {
        console.error(`PATCH /api/properties/${req.params.id}/georeference error:`, err);
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
