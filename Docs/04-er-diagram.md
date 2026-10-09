# Data Model / ER Diagram — Backend Indexer & Cache

The authoritative source of truth for all land ownership state is the `LandRegistry.sol` smart contract on the blockchain. 

To provide high-performance query capabilities, sub-millisecond filtering, and rapid UI hydration for the React frontend, the Node.js backend maintains an embedded SQLite database (`database.sqlite` initialized in `backend/db.js`). This local cache is deterministically populated and updated by the event indexer (`backend/indexer.js`).

---

## 1. Entity-Relationship (ER) Diagram

```mermaid
erDiagram
    PROPERTIES ||--o{ TRANSFERS : "has conveyance requests"
    PROPERTIES ||--o{ AUDIT_EVENTS : "records lifecycle history"
    DOCUMENTS ||--o{ PROPERTIES : "referenced by initial deed"
    DOCUMENTS ||--o{ TRANSFERS : "referenced by new deed"
    SYNC_STATE {
        INTEGER id PK "Fixed at 1"
        INTEGER last_indexed_block "Highest scanned block"
    }

    PROPERTIES {
        INTEGER property_id PK "Numerical parcel ID (1-indexed)"
        TEXT location_hash "Geographic coordinate / bounds hash"
        INTEGER area "Parcel surface area in sq meters"
        TEXT current_owner "Checksummed EVM owner address"
        TEXT document_hash "32-byte hex hash of active deed"
        INTEGER is_verified "1 if authority verified, 0 if pending"
        INTEGER is_frozen "1 if under dispute, 0 if active"
        INTEGER registered_at "Unix epoch timestamp of registration"
    }

    TRANSFERS {
        INTEGER transfer_id PK "Numerical conveyance ID (1-indexed)"
        INTEGER property_id FK "References PROPERTIES(property_id)"
        TEXT from_address "EVM address of seller"
        TEXT to_address "EVM address of buyer"
        TEXT new_document_hash "32-byte hex hash of conveyance deed"
        INTEGER from_signed "1 if seller EIP-712 signed, else 0"
        INTEGER to_signed "1 if buyer EIP-712 signed, else 0"
        INTEGER authority_approved "1 if government authority approved, else 0"
        INTEGER executed "1 if finalized on-chain, else 0"
        INTEGER created_at "Unix epoch timestamp of initiation"
    }

    AUDIT_EVENTS {
        INTEGER event_id PK "Auto-incrementing surrogate primary key"
        INTEGER property_id FK "References PROPERTIES(property_id)"
        TEXT event_type "Event name (e.g., OwnershipTransferred)"
        TEXT tx_hash "Transaction hash on-chain"
        INTEGER block_number "Block number containing the event"
        INTEGER timestamp "Block timestamp"
        INTEGER log_index "Log index within the block (for ordering)"
        TEXT from_address "Transferee/source address (nullable)"
        TEXT to_address "Recipient/destination address (nullable)"
    }

    DOCUMENTS {
        TEXT document_hash PK "32-byte keccak256 hash of deed file"
        TEXT file_reference "Relative filesystem path / URI (/uploads/...)"
        TEXT uploaded_by "Uploader EVM address"
        INTEGER uploaded_at "Unix epoch timestamp of upload"
    }
```

---

## 2. Table Specifications & Indexes

### `PROPERTIES`
Stores canonical state of registered parcels materialized from `PropertyRegistered`, `PropertyVerified`, `OwnershipTransferred`, `PropertyFlagged`, and `PropertyUnflagged` events.
- **Primary Key:** `property_id` (`INTEGER`)
- **Indexed Lookups:** Filtered by `current_owner` and calculated status (`is_verified`, `is_frozen`).

### `TRANSFERS`
Maintains status of in-flight and completed property transfers materialized from `TransferInitiated`, `TransferSigned`, `TransferApproved`, and `OwnershipTransferred` events.
- **Primary Key:** `transfer_id` (`INTEGER`)
- **Foreign Key:** `property_id` references `PROPERTIES(property_id)`
- **Query Optimizations:** Filtered by participant `from_address` / `to_address` and pending status (`executed = 0`).

### `AUDIT_EVENTS`
Provides an immutable, tamper-evident audit trail capturing every state modification on-chain.
- **Primary Key:** `event_id` (`INTEGER AUTOINCREMENT`)
- **Composite Unique Constraint:** `UNIQUE(tx_hash, log_index)` — guarantees idempotent event insertion during catch-up re-indexing and chain reorganizations.
- **Sorting Default:** `ORDER BY block_number DESC, log_index DESC`.

### `DOCUMENTS`
Content-addressable file index connecting off-chain physical title deed PDFs with their cryptographically verified on-chain hashes.
- **Primary Key:** `document_hash` (`TEXT`, 66-character hex string starting with `0x`).
- **File Storage:** Stored on local disk (under `uploads/<documentHash>.pdf`) or decentralized storage (IPFS CID).

### `SYNC_STATE`
Tracks indexer cursor position to ensure seamless crash-recovery and catch-up syncing across server restarts.
- **Primary Key Constraint:** `id INTEGER PRIMARY KEY CHECK (id = 1)` — singleton row pattern.
- **Fields:** `last_indexed_block` (`INTEGER`), initialized to `CONTRACT_DEPLOYMENT_BLOCK`.
