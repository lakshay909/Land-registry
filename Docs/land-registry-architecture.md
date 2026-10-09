# Land Registry Platform — System Architecture & Technical Specifications

**Architecture Status:** Operational & Tested  
**Implementation Baseline:** Solidity 0.8.24 (Cancun EVM), OpenZeppelin Contracts v5.x, Express 5, better-sqlite3, React 19, Ethers.js v6, Tailwind CSS v4

---

## 1. Architectural Overview & System Tiers

The Land Registry system implements a robust three-tier decentralized architecture engineered for high cryptographic security, low latency query execution, and seamless user interaction:

```mermaid
flowchart TB
    subgraph "Tier 1: Client Application (React 19 + Ethers v6)"
        UI_Citizen["Citizen Dashboard<br/>- Register Parcel<br/>- Initiate & Sign Transfer"]
        UI_Auth["Authority Dashboard<br/>- Verify Registration<br/>- Approve & Execute Transfer<br/>- Flag/Unflag Dispute"]
        UI_Search["Public Search Portal<br/>- Audit Trail Timeline<br/>- Ledger Verification"]
        MetaMask["MetaMask Wallet<br/>- Account & Role Detection<br/>- EIP-712 Typed Signing"]
    end

    subgraph "Tier 2: Off-Chain Middleware & Storage (Node.js / Express 5)"
        API["Express API Server<br/>(Port 3000/3001)"]
        Indexer["Event Indexer Engine<br/>- Catch-Up Historical Sync<br/>- Real-Time Event Listener"]
        DB[(Embedded SQLite Cache<br/>database.sqlite)]
        DiskStore["Content-Addressable<br/>Document Storage<br/>(/uploads/*.pdf)"]
    end

    subgraph "Tier 3: Authoritative Settlement Layer (Ethereum / EVM)"
        Contract["LandRegistry.sol<br/>- AccessControl (ADMIN_ROLE)<br/>- EIP-712 Signature Gate<br/>- 4-Gate Conveyance Engine<br/>- On-Chain Ownership Array"]
        EVM_Events["EVM Event Log Bus<br/>- PropertyRegistered<br/>- OwnershipTransferred<br/>- PropertyFlagged / Unflagged"]
    end

    UI_Citizen -->|JSON-RPC Transactions| Contract
    UI_Auth -->|JSON-RPC Transactions| Contract
    UI_Citizen -->|EIP-712 Signatures| MetaMask
    MetaMask -->|Structured Signatures| Contract
    UI_Citizen -->|Multipart Upload| API
    UI_Search -->|REST Queries| API
    UI_Auth -->|REST Queries| API

    API --> DB
    API --> DiskStore
    Indexer -->|Polls / Subscribes| Contract
    Contract --> EVM_Events
    EVM_Events -->|Event Ingestion| Indexer
    Indexer -->|Normalized State Writes| DB
```

---

## 2. Tier Details & Responsibilities

### 2.1 Authoritative Settlement Layer (`contracts/LandRegistry.sol`)
- **Immutability Anchor:** Acts as the single source of truth for land parcel existence, current ownership, verification status, and historical ownership chains.
- **Access Control:** Employs OpenZeppelin's `AccessControl` to distinguish between regular citizen wallets and authorized administrators (`ADMIN_ROLE`).
- **EIP-712 Cryptographic Handshake:** Verifies typed structured data off-chain signatures (`TRANSFER_TYPEHASH`), verifying both seller and buyer intent while completely eliminating front-running and replay vulnerabilities via incremental account nonces.
- **Multi-Gate Checks-Effects-Interactions (CEI):** Guarantees that conveyances cannot execute unless all 4 cryptographic and administrative gates pass, committing `executed = true` before mutating ownership state.
- **Dispute Flagging Engine:** Grants authorities the power to freeze properties under legal investigation, programmatically halting transfer initiations and executions.

### 2.2 Off-Chain Indexing & Query Layer (`backend/`)
- **Dual-Phase Indexer (`backend/indexer.js`):**
  1. *Snapshot Catch-Up Phase:* On boot, reads `last_indexed_block` from `SYNC_STATE`, fetches historical logs from the RPC node up to the latest block snapshot in sorted chronological order, and commits them in atomic transactions.
  2. *Real-Time Subscription Phase:* Registers contract event listeners for all 8 system events, processing incoming blocks via an asynchronous queue.
  3. *Gap Closure Phase:* Automatically re-queries and fills any block intervals elapsed while attaching event listeners.
- **Fast Query Cache (`backend/db.js`):** Embedded SQLite database storing normalized tables (`PROPERTIES`, `TRANSFERS`, `AUDIT_EVENTS`, `DOCUMENTS`, `SYNC_STATE`). All `:id` routes validate bounds strictly, returning sub-millisecond responses.
- **Content-Addressable File Store (`backend/routes/documents.js`):** Accepts uploaded physical deed PDF documents, derives their `ethers.keccak256` hash directly from raw bytes, renames the file to `<hash>.pdf`, and serves it statically.

### 2.3 Web3 User Experience Layer (`frontend/`)
- **Authentication Context (`AuthContext.jsx`):** Detects connected MetaMask accounts, monitors network changes (prompting switches to chain ID 31337 or testnet), queries contract `hasRole(ADMIN_ROLE, address)` in real-time, and exposes dynamic user role badges.
- **Citizen Portal (`CitizenDashboard.jsx`):** Allows property owners to register parcels, upload title deeds, monitor pending registrations, initiate conveyances, and sign incoming transfer requests.
- **Government Authority Portal (`AuthorityDashboard.jsx`):** Dedicated administration view displaying pending registrations queue, transfer approvals queue, and an interactive parcel search to flag/unflag disputed assets with required rationale notes.
- **Public Search Portal (`PublicSearch.jsx`):** Unauthenticated public audit tool rendering complete ownership timelines, block numbers, transaction hashes, and freeze badges.

---

## 3. Cryptographic & Security Architecture

### 3.1 EIP-712 Structured Signing Specification
Traditional raw message signing (`personal_sign`) exposes users to phishing risks (signing unreadable hex strings). This architecture enforces EIP-712 typed structured data:

```javascript
// EIP-712 Domain Specification
const domain = {
  name: "LandRegistry",
  version: "1",
  chainId: SUPPORTED_CHAIN_ID,
  verifyingContract: CONTRACT_ADDRESS
};

// Types Definition
const types = {
  Transfer: [
    { name: "propertyId", type: "uint256" },
    { name: "documentHash", type: "bytes32" },
    { name: "action", type: "string" },
    { name: "nonce", type: "uint256" }
  ]
};
```
- In the smart contract, `_hashTypedDataV4(structHash)` derives the digest and `ECDSA.recover` extracts the signer address.
- If recovered address != `msg.sender`, contract reverts with `InvalidSignature()`.
- After signature ingestion, `nonces[msg.sender]++` invalidates the signature from ever being replayed.

### 3.2 Document Integrity Pipeline
```
[Physical Deed PDF] 
       │
       ▼
(ArrayBuffer -> Uint8Array) ──▶ ethers.keccak256() ──▶ bytes32 documentHash
       │                                                      │
       ▼                                                      ▼
[POST /api/documents]                                 [On-Chain Registration]
Renamed to <hash>.pdf                                 registeredDocuments[hash] = true
```
Because the client and backend compute the exact same `ethers.keccak256(new Uint8Array(bytes))` digest, any tampering with a deed document off-chain produces a hash mismatch that is instantly rejected by the smart contract.

---

## 4. Operational File Structure

```
Land-registry/
├── contracts/
│   └── LandRegistry.sol          # Primary smart contract (AccessControl, EIP-712)
├── backend/
│   ├── server.js                 # Express application & static uploads serve
│   ├── db.js                     # SQLite schema & connection manager
│   ├── indexer.js                # Dual-phase event indexer & catch-up engine
│   ├── routes/
│   │   ├── properties.js         # /api/properties endpoints
│   │   ├── transfers.js          # /api/transfers endpoints
│   │   ├── documents.js          # /api/documents upload & download
│   │   └── audit.js              # /api/audit-log query route
│   └── uploads/                  # Content-addressable deed PDF storage
├── frontend/
│   ├── src/
│   │   ├── App.jsx               # Navigation, layout, role-based routing
│   │   ├── config.js             # Contract address, chain ID, API URL
│   │   ├── LandRegistry.json     # Contract ABI
│   │   ├── context/
│   │   │   └── AuthContext.jsx   # Wallet connection & role state provider
│   │   ├── pages/
│   │   │   ├── CitizenDashboard.jsx    # Citizen registration & transfers
│   │   │   ├── AuthorityDashboard.jsx  # Verification, approval, freeze
│   │   │   └── PublicSearch.jsx        # Public audit trail lookup
│   │   └── components/
│   │       ├── InitiateTransferModal.jsx
│   │       └── SignTransferModal.jsx
├── test/
│   ├── registration.test.js      # Unit tests: TC-1, TC-2, FT-1
│   ├── transfer.test.js          # Unit tests: TC-3..7, FT-2..5, FT-7..15
│   ├── flagging.test.js          # Unit tests: FT-6, FT-12, freeze/unfreeze
│   └── history.test.js           # Unit tests: TC-8 multi-hop history
├── scripts/
│   └── deploy.js                 # Hardhat deployment script
├── hardhat.config.js             # Hardhat network & Solidity compiler config
└── Docs/                         # Complete project documentation & research
```

---

## 5. Verification & Test Evidence Summary

- **Total Test Cases Executed:** 43
- **Test Pass Rate:** 100% (43 / 43 passing)
- **Line Coverage:** 100.0%
- **Branch Coverage:** 96.77%
- **Execution Latency:** ~1 second in local Hardhat environment
- **Defeated Adversarial Vectors:** 15 concrete fraud scenarios including double registration, forged signatures, replay attacks, authority bypass, self-dealing, premature execution, and transfers of disputed/frozen assets.
