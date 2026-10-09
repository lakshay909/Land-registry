# Project Changelog & Architecture Evolution

All notable changes, architectural pivots, and gap analyses between the initial project proposal and the current operational system state are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## 📊 Gap Analysis: Original Proposal vs. Current Built State

| Dimension | Original Project Proposal (v0.1) | Current Operational Implementation (v1.0) | Status / Strategic Decision |
|---|---|---|---|
| **Smart Contract Standard** | Generic Solidity contract with simple ownership mappings. | OpenZeppelin v5 `AccessControl` + `EIP712` + `ECDSA` cryptography on Solidity `0.8.24` (Cancun EVM). | **Significantly Upgraded** (Enterprise-grade security standards). |
| **Signature Scheme** | Proposed generic ECDSA / wallet message signing. | Standardized **EIP-712 Typed Structured Data** (`Transfer(...)`) with monotonically increasing per-user nonces. | **Upgraded** (Eliminates opaque hex signing, protects against cross-contract and intra-contract replay attacks). |
| **Revert Handling** | Standard string revert reasons (`require(..., "error")`). | **17 Custom Solidity Errors** (`error AlreadyVerified()`, etc.). | **Optimized** (Saves deployment gas and execution gas; simplifies frontend error decoding). |
| **Conveyance Workflow** | Single-step transfer execution upon approval. | **4-Gate Execution Pipeline**: (1) Seller EIP-712 signature, (2) Buyer EIP-712 signature, (3) Authority approval, (4) Checks-Effects-Interactions (CEI) execution. | **Hardened** (Prevents unilateral transfers, protects buyer consent, guarantees administrative oversight). |
| **Dispute Resolution** | Brief mention of administrative controls. | **On-Chain Freeze/Unfreeze Engine** (`flagProperty`, `unflagProperty`) with emitted justification strings and strict transfer blockers. | **Implemented** (Simulates court injunctions and active title disputes). |
| **Document Storage** | Proposed IPFS hash or local storage concept. | **Content-Addressable Ingestion Pipeline**: Frontend & backend compute identical `ethers.keccak256` of raw file bytes; disk store renames to `<hash>.pdf`. | **Operational** (Tamper-evident, zero byte discrepancy between on-chain proof and off-chain file). |
| **Backend & Caching** | Basic Node.js/Express server. | **Dual-Phase Hybrid Indexer** (`indexer.js`) with snapshot catch-up sync, real-time event listener, gap closer, and embedded SQLite cache (`better-sqlite3`). | **Production-Ready** (Sub-millisecond API response, zero reliance on repetitive EVM polling). |
| **Frontend UI** | Basic demo portal with MetaMask connect. | **Role-Aware Web3 Application** (React 19, Tailwind CSS v4, Ethers v6, headless UI modals, dynamic role discovery, real-time chain switching to chain 31337). | **Complete & Polished**. |
| **Testing & Verification** | Basic happy-path unit tests. | **43 Passing Tests** covering 8 standard functional test cases (TC-1..TC-8) and **15 Adversarial Fraud Scenarios** (FT-1..FT-15), achieving 100% line coverage and 96.77% branch coverage. | **Exceeded Targets** (Comprehensive evidence for fraud resilience). |

---

## [1.0.0] - 2026-10-09 (Operational Baseline)

### Added
- **Smart Contracts (`contracts/LandRegistry.sol`):**
  - Implemented OpenZeppelin `AccessControl` with `DEFAULT_ADMIN_ROLE`, `ADMIN_ROLE`, and `REGISTRAR_ROLE`.
  - Implemented `EIP712("LandRegistry", "1")` domain separator and `TRANSFER_TYPEHASH`.
  - Added `registerProperty` with uniqueness validation via `registeredDocuments` mapping.
  - Added `verifyRegistration` gated to `ADMIN_ROLE`.
  - Added `initiateTransfer` requiring verified status, non-frozen status, and unique new deed hash.
  - Added `signTransfer` verifying EIP-712 ECDSA signatures and incrementing per-signer nonces.
  - Added `approveTransfer` gated to `ADMIN_ROLE`.
  - Added `executeTransfer` enforcing 4 distinct gates, strict Checks-Effects-Interactions (CEI) pattern, and on-chain ownership history logging.
  - Added `flagProperty` and `unflagProperty` for freezing disputed titles.
  - Added `getOwnershipHistory` public view function returning the full array of historical title holders.
  - Emitted comprehensive state events: `PropertyRegistered`, `PropertyVerified`, `TransferInitiated`, `TransferSigned`, `TransferApproved`, `OwnershipTransferred`, `PropertyFlagged`, `PropertyUnflagged`.
  - Declared 17 gas-optimized custom errors.

- **Automated Test Suite (`test/`):**
  - `test/registration.test.js`: Validates registration, authority verification, duplicate deed rejection.
  - `test/transfer.test.js`: Validates multi-party transfer, EIP-712 signing, approval, execution, self-transfer blocking, third-party signature rejection, duplicate deed burning, unverified transfers, replay attacks.
  - `test/flagging.test.js`: Validates freezing, unfreezing, and transfer blocking on frozen assets.
  - `test/history.test.js`: Validates multi-hop ownership history logging.
  - 43 tests passing with 100% line coverage and 96.77% branch coverage.

- **Backend Middleware & Indexer (`backend/`):**
  - Initialized SQLite relational cache (`backend/db.js`) with tables `PROPERTIES`, `TRANSFERS`, `AUDIT_EVENTS`, `DOCUMENTS`, and `SYNC_STATE`.
  - Built robust dual-phase event indexer (`backend/indexer.js`) combining historical catch-up queries, sorted log commits, real-time ethers v6 event subscriptions, and gap-filling.
  - Implemented Express 5 REST API routes:
    - `GET /api/health`: Node and RPC connectivity verification.
    - `GET /api/properties`: Filterable by owner and status (`verified`, `pending`, `frozen`).
    - `GET /api/properties/:id`: Single property with nested ownership timeline.
    - `GET /api/properties/:id/history`: Dedicated timeline query.
    - `GET /api/transfers`: Filterable by status (`pending`) and party wallet address.
    - `GET /api/transfers/:id`: Single transfer details.
    - `POST /api/documents`: Multer-based multipart deed upload computing `ethers.keccak256` matching on-chain hashes.
    - `GET /api/documents/:hash`: Metadata lookup for deed documents.
    - `GET /api/audit-log`: Immutable chronological event stream with optional parcel filtering.
    - `GET /uploads/:filename`: Static deed PDF serving.

- **Frontend Web3 Application (`frontend/`):**
  - Built with React 19, Vite, and Tailwind CSS v4.
  - `AuthContext.jsx`: MetaMask wallet integration, chain ID 31337 auto-switch prompt, account change listeners, and contract-level `ADMIN_ROLE` detection.
  - `PublicSearch.jsx`: Public audit portal displaying parcel details, verification badges, freeze indicators, and full historical timelines.
  - `CitizenDashboard.jsx`: Tabbed user workspace for viewing owned properties, initiating transfers, signing pending conveyances, and registering new parcels with PDF hashing.
  - `AuthorityDashboard.jsx`: Government workspace with pending registrations queue, transfer approvals queue, and an interactive dispute freezing tool requiring justification notes.
  - Modals: `InitiateTransferModal.jsx` and `SignTransferModal.jsx` for EIP-712 MetaMask interaction.

- **Documentation & Research:**
  - Synchronized SRS (`Docs/02-srs.md`), UML Diagrams (`Docs/03-uml-diagrams.md`), ER Diagram (`Docs/04-er-diagram.md`), API Docs (`Docs/05-api-documentation.md`), Smart Contract Docs (`Docs/06-smart-contract-documentation.md`), and Architecture Spec (`Docs/land-registry-architecture.md`).

---

## [0.1.0] - Initial Proposal (Initial Concept)
- Initial conceptual proposal outlining problem statement, basic Solidity smart contract ideas, and high-level 5-week plan.
