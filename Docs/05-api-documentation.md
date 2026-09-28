# API Documentation — Backend (Node.js / Express)

The backend does not hold ownership logic (the contract does) — it indexes events for fast dashboard queries and manages document-hash lookups.

## Base URL
`http://localhost:3000/api` (local dev) — replace with deployed URL once hosted.

## Endpoints

### `GET /properties`
Returns all indexed properties, with optional filters.
**Query params:** 
- `owner` (address)
- `status` (`verified|pending|frozen`)

**Response:**
```json
[
  {
    "propertyId": 1,
    "locationHash": "0xabc...",
    "area": 1200,
    "currentOwner": "0x1234...",
    "documentHash": "0xdef...",
    "isVerified": true,
    "isFrozen": false,
    "registeredAt": 1732000000
  }
]
```

### `GET /properties/:id`
Returns full detail for a property, including an inline ownership timeline under the `history` key (sorted oldest-first).

**Response:**
```json
{
  "propertyId": 1,
  "locationHash": "0xabc...",
  ...
  "history": [
    {
      "eventType": "PropertyRegistered",
      "txHash": "0x123...",
      "blockNumber": 42,
      "timestamp": 1732000000
    }
  ]
}
```

### `GET /properties/:id/history`
Returns just the ownership history timeline array (sorted oldest-first, built from indexed `PropertyRegistered` and `OwnershipTransferred` events).

### `GET /transfers`
Returns transfers with optional filters.
**Query params:**
- `status` (`pending` / `executed`): `pending` returns transfers where `executed = 0`. Used by the Authority dashboard.
- `party` (address): Returns transfers where the address matches either `from_address` or `to_address`. Used by the Citizen dashboard for "My Transfers".

### `POST /documents`
Uploads a deed document reference (off-chain storage) and returns its exact on-chain hash.
**Body:** multipart file (using `file` key)
**Response:** `{ "documentHash": "0xdef...", "fileReference": "/uploads/def..." }`

### `GET /documents/:hash`
Retrieves the stored document metadata for a given on-chain document hash (for verification/download).
**Response:** `{ "documentHash": "0xdef...", "fileReference": "/uploads/def...", "uploadedBy": "0x...", "uploadedAt": 1732000000 }`

### `GET /audit-log?propertyId=1`
Returns the raw event log (all event types) for a property, sorted newest-first. The core of the immutable audit trail view.

## Error Format
All `:id` routes strictly validate that the ID is an integer `>= 1`, returning `400` if malformed. `404` is returned if the record doesn't exist.
```json
{ "error": "message", "code": "ERROR_CODE" }
```
Example: `{ "error": "Invalid property ID", "code": "INVALID_ID" }`
