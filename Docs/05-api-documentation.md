# API Documentation — Backend Service (Node.js / Express / SQLite)

**Service Role:** Off-chain indexing, query cache, and content-addressable document store.  
**Authoritative Source:** `contracts/LandRegistry.sol` (Solidity smart contract).  
**Default Base URL:** `http://localhost:3000/api` (Configurable via `PORT` in `backend/.env`; Vite frontend defaults to `http://localhost:3001` or `http://localhost:3000`).

---

## 1. System Architecture & Caching Rationale

The backend service acts as an ultra-fast query layer and off-chain file repository. Direct EVM JSON-RPC calls are expensive and slow for filtering, searching, and pagination.
- **Event Synchronization:** `backend/indexer.js` tracks blockchain events using `ethers.js` (v6) with a dual-phase catch-up and real-time subscription mechanism, populating an embedded SQLite database (`database.sqlite`).
- **Deed File Ingestion:** Document files (PDFs) are uploaded, hashed with `ethers.keccak256`, and stored on local disk under content-addressable naming.

---

## 2. API Endpoints

### 2.1 System & Health

#### `GET /api/health`
Checks backend responsiveness and verified RPC connectivity with the Ethereum node.
- **Request Parameters:** None
- **Response (200 OK):**
```json
{
  "status": "ok",
  "latestBlock": 142
}
```
- **Error Response (500 Internal Server Error):**
```json
{
  "status": "error",
  "message": "RPC connection failed"
}
```

---

### 2.2 Property Management

#### `GET /api/properties`
Fetches all registered properties, with optional filtering by owner and lifecycle verification status.
- **Query Parameters:**
  - `owner` *(optional, string)*: Filter by owner Ethereum address (case-insensitive in SQLite).
  - `status` *(optional, string)*: Filter by status:
    - `verified`: `is_verified == 1 AND is_frozen == 0`
    - `pending`: `is_verified == 0`
    - `frozen`: `is_frozen == 1`
- **Response (200 OK):**
```json
[
  {
    "propertyId": 1,
    "locationHash": "51.5074N,0.1278W",
    "area": 1200,
    "currentOwner": "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
    "documentHash": "0x5a1f6499...a8b3",
    "isVerified": true,
    "isFrozen": false,
    "registeredAt": 1727584800
  }
]
```

#### `GET /api/properties/:id`
Retrieves single property record by ID, including its inline chronological ownership audit history.
- **Path Parameters:**
  - `id` *(integer, required)*: Property ID (`id >= 1`).
- **Validation:** Returns `400 Bad Request` if `id` is not a positive integer. Returns `404 Not Found` if record does not exist.
- **Response (200 OK):**
```json
{
  "propertyId": 1,
  "locationHash": "51.5074N,0.1278W",
  "area": 1200,
  "currentOwner": "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
  "documentHash": "0x89ab...45ef",
  "isVerified": true,
  "isFrozen": false,
  "registeredAt": 1727584800,
  "history": [
    {
      "eventType": "PropertyRegistered",
      "txHash": "0x3b1c...d89a",
      "blockNumber": 12,
      "timestamp": 1727584800,
      "fromAddress": null,
      "toAddress": "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"
    },
    {
      "eventType": "OwnershipTransferred",
      "txHash": "0x91da...66cb",
      "blockNumber": 28,
      "timestamp": 1727588400,
      "fromAddress": "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
      "toAddress": "0x70997970C51812dc3A010C7d01b50e0d17dc79C8"
    }
  ]
}
```

#### `GET /api/properties/:id/history`
Returns dedicated chronological array of ownership transition events for a property.
- **Path Parameters:**
  - `id` *(integer, required)*: Property ID.
- **Response (200 OK):**
```json
[
  {
    "eventType": "PropertyRegistered",
    "txHash": "0x3b1c...d89a",
    "blockNumber": 12,
    "timestamp": 1727584800,
    "fromAddress": null,
    "toAddress": "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"
  }
]
```

---

### 2.3 Transfer Management

#### `GET /api/transfers`
Fetches transfer requests filtered by progress status or involved participant address.
- **Query Parameters:**
  - `status` *(optional, string)*: Pass `pending` to retrieve unexecuted transfers (`executed == 0`).
  - `party` *(optional, string)*: 40-character hex Ethereum address (`0x...`). Matches either `from_address` or `to_address`.
- **Validation:** Returns `400 Bad Request` if `party` does not conform to `^0x[a-fA-F0-9]{40}$`.
- **Response (200 OK):**
```json
[
  {
    "transferId": 1,
    "propertyId": 1,
    "fromAddress": "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
    "toAddress": "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
    "newDocumentHash": "0x89ab...45ef",
    "fromSigned": true,
    "toSigned": true,
    "authorityApproved": false,
    "executed": false,
    "createdAt": 1727586000
  }
]
```

#### `GET /api/transfers/:id`
Retrieves details for a specific transfer request.
- **Path Parameters:**
  - `id` *(integer, required)*: Transfer ID (`id >= 1`).
- **Response (200 OK):**
```json
{
  "transferId": 1,
  "propertyId": 1,
  "fromAddress": "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
  "toAddress": "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
  "newDocumentHash": "0x89ab...45ef",
  "fromSigned": true,
  "toSigned": false,
  "authorityApproved": false,
  "executed": false,
  "createdAt": 1727586000
}
```

---

### 2.4 Document Storage & Content-Addressable Registry

#### `POST /api/documents`
Accepts a title deed document (PDF), computes its on-chain compatible `ethers.keccak256` hash, renames the file content-addressably to prevent duplication, and persists metadata in SQLite.
- **Request Type:** `multipart/form-data`
- **Fields:**
  - `file` *(binary, required)*: The deed document file.
  - `uploader` or `uploadedBy` *(string, optional)*: Address of the uploader.
- **Response (200 OK):**
```json
{
  "documentHash": "0x5a1f64996452292f7c0064f243003c27e366b8d2eb4b74b889314ca66479a8b3",
  "fileReference": "/uploads/5a1f64996452292f7c0064f243003c27e366b8d2eb4b74b889314ca66479a8b3.pdf"
}
```
- **Error Response (400 Bad Request):**
```json
{
  "error": "No file uploaded",
  "code": "NO_FILE"
}
```

#### `GET /api/documents/:hash`
Retrieves off-chain document file reference and metadata for a verified on-chain document hash.
- **Path Parameters:**
  - `hash` *(string, required)*: 32-byte hex hash string (`^0x[a-fA-F0-9]{64}$`).
- **Response (200 OK):**
```json
{
  "documentHash": "0x5a1f64996452292f7c0064f243003c27e366b8d2eb4b74b889314ca66479a8b3",
  "fileReference": "/uploads/5a1f64996452292f7c0064f243003c27e366b8d2eb4b74b889314ca66479a8b3.pdf",
  "uploadedBy": "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
  "uploadedAt": 1727584750
}
```

#### `GET /uploads/:filename`
Static file serving route providing access to stored PDF deed files.
- **Request:** `GET /uploads/5a1f6499...pdf`
- **Response:** Raw binary file stream with appropriate MIME type (`application/pdf`).

---

### 2.5 Audit Trail & Governance Log

#### `GET /api/audit-log`
Returns immutable chronological event history captured by the indexer.
- **Query Parameters:**
  - `propertyId` *(optional, integer)*: Filter audit trail to a specific parcel.
- **Sorting:** Strictly ordered newest-first (`ORDER BY block_number DESC, log_index DESC`).
- **Response (200 OK):**
```json
[
  {
    "eventId": 4,
    "propertyId": 1,
    "eventType": "OwnershipTransferred",
    "txHash": "0x91da...66cb",
    "blockNumber": 28,
    "timestamp": 1727588400,
    "logIndex": 0
  },
  {
    "eventId": 3,
    "propertyId": 1,
    "eventType": "TransferApproved",
    "txHash": "0x12fc...33ab",
    "blockNumber": 27,
    "timestamp": 1727588200,
    "logIndex": 0
  }
]
```

---

## 3. Standard Error Responses

All endpoints adhere to standardized structured error JSON payloads:
```json
{
  "error": "Descriptive human-readable explanation",
  "code": "MACHINE_READABLE_CODE"
}
```

| HTTP Status | Error Code | Common Cause |
|---|---|---|
| `400` | `INVALID_ID` | Property or transfer ID is not an integer >= 1. |
| `400` | `INVALID_ADDRESS` | Address does not conform to 20-byte EVM hex string format. |
| `400` | `INVALID_HASH` | Document hash does not conform to 32-byte EVM hex format. |
| `400` | `NO_FILE` | Document upload request without multipart file attachment. |
| `404` | `NOT_FOUND` | Target property, transfer, or document does not exist in SQLite cache. |
| `500` | `SERVER_ERROR` | Internal server or SQLite transaction failure. |
