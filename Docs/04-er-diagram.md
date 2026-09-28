# Data Model / ER Diagram — Backend Event Cache

The blockchain itself is the source of truth (no traditional "database" for ownership). However, the Node/Express backend keeps a local cache of indexed events and document metadata so the dashboard doesn't have to re-scan the whole chain on every page load. This is the data model for that cache.

```mermaid
erDiagram
    PROPERTIES ||--o{ TRANSFERS : has
    PROPERTIES ||--o{ AUDIT_EVENTS : generates
    PROPERTIES ||--|| DOCUMENTS : references

    PROPERTIES {
        uint256 property_id PK
        string location_hash
        uint256 area
        address current_owner
        bytes32 document_hash
        bool is_verified
        bool is_frozen
        uint256 registered_at
    }

    TRANSFERS {
        uint256 transfer_id PK
        uint256 property_id FK
        address from_address
        address to_address
        bytes32 new_document_hash
        bool from_signed
        bool to_signed
        bool authority_approved
        bool executed
        uint256 created_at
    }

    AUDIT_EVENTS {
        uint256 event_id PK
        uint256 property_id FK
        string event_type
        string tx_hash
        uint256 block_number
        uint256 timestamp
    }

    DOCUMENTS {
        bytes32 document_hash PK
        string file_reference
        string uploaded_by
        uint256 uploaded_at
    }
```

**Notes:**
- `PROPERTIES`, `TRANSFERS`, and `AUDIT_EVENTS` are populated by listening to contract events (`PropertyRegistered`, `TransferInitiated`, etc.) and mirrored into a local SQLite/Postgres DB purely for fast querying — the contract state remains authoritative.
- `DOCUMENTS.file_reference` points to wherever the actual deed PDF lives (IPFS CID or local backend storage path); only its hash is trusted on-chain.
