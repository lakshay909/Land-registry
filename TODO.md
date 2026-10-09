# Project TODO & Development Roadmap
## Tamper-Proof Land Registry and Property Ownership Tracking Using Blockchain

Last Updated: September 2026

---

## 📊 Current Status Overview
- **Smart Contracts**: 🟢 Complete (Solidity 0.8.24, Cancun EVM, OpenZeppelin AccessControl & EIP-712)
- **Unit & Security Tests**: 🟢 Complete (43 tests passing: TC-1 to TC-8, FT-1 to FT-15, and boundary guards)
- **Backend API & Indexer**: 🟢 Complete (Express 5, SQLite caching, ethers v6 event indexing)
- **Frontend Portal**: 🟢 Core complete (React 19, Tailwind v4, Citizen/Authority dashboards, Public Search)
- **Deployment & Tooling**: 🟡 Partially Complete (Needs deployment script, environment configurations, and sync automation)
- **Testnet & IPFS**: ⚪ Pending (Optional enhancement / Week 5 milestone)

---

## ✅ Completed Tasks (Based on Architecture & Codebase)

### 1. Smart Contract Architecture (`contracts/LandRegistry.sol`)
- [x] Contract inherits OpenZeppelin `AccessControl` and `EIP712`.
- [x] Defined roles: `DEFAULT_ADMIN_ROLE`, `ADMIN_ROLE` (Government Authority), `REGISTRAR_ROLE` (Delegated registrar).
- [x] Structs: `Property` and `TransferRequest`.
- [x] Core functions implemented with gas-efficient custom errors:
  - [x] `registerProperty`: Registration with location hash, area, and unique document hash.
  - [x] `verifyRegistration`: Authority-only verification gate.
  - [x] `initiateTransfer`: Owner initiates transfer to buyer with unique new deed hash.
  - [x] `signTransfer`: Cryptographic multi-party signing (EIP-712 structured data) with incremental nonces for replay prevention.
  - [x] `approveTransfer`: Authority-only transfer approval gate.
  - [x] `executeTransfer`: Checks-Effects-Interactions pattern execution, burning deed hash, updating on-chain ownership history array.
  - [x] `flagProperty` / `unflagProperty`: Authority dispute freeze/unfreeze mechanism.
  - [x] `getOwnershipHistory`: Public read function for on-chain ownership trail.
- [x] State change events emitted for indexer consumption (`PropertyRegistered`, `PropertyVerified`, `TransferInitiated`, `TransferSigned`, `TransferApproved`, `OwnershipTransferred`, `PropertyFlagged`, `PropertyUnflagged`).

### 2. Smart Contract Testing Suite (`test/`)
- [x] `test/registration.test.js`: Validates TC-1, TC-2, FT-1 (duplicate registration), and authority access controls.
- [x] `test/transfer.test.js`: Validates TC-3 to TC-7, FT-2 (unauthorized initiate), FT-3 (forged signature), FT-4 (replay attacks), FT-5 (missing approval), FT-7 (self-transfer), FT-8 to FT-15.
- [x] `test/flagging.test.js`: Validates FT-6 (frozen transfers), authority flag/unflag rules.
- [x] `test/history.test.js`: Validates TC-8 (full multi-hop ownership history).
- [x] Achieved 100% line coverage and 96.77% branch coverage on the smart contract.

### 3. Backend Caching & Indexer Service (`backend/`)
- [x] SQLite database schema (`backend/db.js`):
  - Tables: `PROPERTIES`, `TRANSFERS`, `AUDIT_EVENTS`, `DOCUMENTS`, `SYNC_STATE`.
- [x] Real-time and historical event indexer (`backend/indexer.js`):
  - Polls and tracks events from contract deployment block.
  - Parses ethers v6 event logs and writes normalized state to SQLite.
- [x] Express REST API endpoints (`backend/routes/`):
  - `GET /api/properties`: Filter by owner or status (`verified`, `pending`, `frozen`).
  - `GET /api/properties/:id`: Detailed property record with chronological history.
  - `GET /api/properties/:id/history`: Dedicated timeline array.
  - `GET /api/transfers`: Filter by status (`pending`, `executed`) and party wallet address.
  - `POST /api/documents`: Multer-based deed upload computing exact `ethers.keccak256` matching on-chain hashes.
  - `GET /api/documents/:hash`: Metadata lookup for deed documents.
  - `GET /api/audit-log`: Raw event log sorted for immutable audit trail.
  - `GET /api/health`: Node and RPC connectivity status.
- [x] End-to-end integration test pipeline script (`scripts/test-e2e-backend.js`).

### 4. Frontend Application (`frontend/`)
- [x] React 19 + Vite setup with Tailwind CSS v4.
- [x] Wallet authentication context (`frontend/src/context/AuthContext.jsx`):
  - MetaMask connection, account change listeners, chain ID detection, and on-chain `ADMIN_ROLE` detection.
- [x] Pages:
  - `PublicSearch.jsx`: Property ID search, ledger status, and audit history timeline.
  - `CitizenDashboard.jsx`: Register new property with PDF deed upload, view owned properties, initiate transfer, and sign pending transfers.
  - `AuthorityDashboard.jsx`: Verify pending registrations, approve pending transfers, execute transfers, freeze/unfreeze disputed properties.
- [x] Modals:
  - `InitiateTransferModal.jsx`: Prepares transfer request with new deed hash computation.
  - `SignTransferModal.jsx`: Triggers MetaMask EIP-712 `signTypedData` signature flow.

---

## 🚀 What Needs to Be Coded / Completed Next

### Phase 1: Local Tooling & Deployment Automation (Immediate)
- [ ] **Create `scripts/deploy.js`**:
  - Script to deploy `LandRegistry` to local Hardhat node or live testnets.
  - Automatically setup `ADMIN_ROLE` for the test authority account.
  - Export contract address and ABI directly to `frontend/src/LandRegistry.json` and update `.env` files.
- [ ] **Root `package.json` Scripts**:
  - Add convenient npm scripts:
    - `"node:local"`: Runs `npx hardhat node`
    - `"deploy:local"`: Runs `npx hardhat run scripts/deploy.js --network localhost`
    - `"test:all"`: Runs smart contract tests and e2e backend tests
- [ ] **Environment Configuration**:
  - Populate `.env` in root, `backend/.env`, and `frontend/.env` based on `.env.example`.

### Phase 2: Local E2E Verification & Polish
- [ ] **Run Full Local Pipeline**:
  1. Start local Hardhat node (`npx hardhat node`).
  2. Deploy `LandRegistry.sol` to localhost.
  3. Start backend indexer (`node backend/indexer.js`) and API (`node backend/server.js`).
  4. Start frontend (`cd frontend && npm run dev`).
  5. Test complete user flow in browser with MetaMask (Import local Hardhat accounts #0, #1, #2).
- [ ] **Standalone Fraud Scenarios Demo Script (`scripts/demo-fraud.js`)**:
  - Console script that executes each fraud scenario (double registration, forged signature, replay attack, authority bypass) and prints clear colored terminal output for demonstration and viva defense.

### Phase 3: Testnet Deployment & Storage Enhancements (Week 5)
- [ ] **Public Testnet Deployment**:
  - Configure Sepolia or Polygon Amoy in `hardhat.config.js`.
  - Fund deployer wallet via testnet faucet.
  - Deploy and verify `LandRegistry.sol` on Etherscan / Polygonscan.
- [ ] **Decentralized Storage (IPFS) Integration (Optional)**:
  - Add Pinata / Web3.Storage integration to `backend/routes/documents.js` for uploading deed PDFs to IPFS instead of purely local disk.
- [ ] **Academic Report & Presentation Assets**:
  - Generate gas consumption report using `hardhat-gas-reporter`.
  - Export Mermaid diagrams from `Docs/03-uml-diagrams.md` into PNG/SVG.
  - Fill out `Docs/08-test-report-template.md` with final execution evidence.
  - Prepare final presentation slides based on `Docs/11-presentation-outline.md`.
