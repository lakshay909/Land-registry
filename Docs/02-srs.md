# Software Requirements Specification (SRS)
## Tamper-Proof Land Registry and Property Ownership Tracking Using Blockchain

**Document Version:** 2.0 (Post-Implementation Sync)  
**Status:** Approved & Operational  
**Core Technologies:** Solidity 0.8.24, OpenZeppelin v5, Hardhat, Node.js / Express 5, better-sqlite3, React 19, Ethers v6

---

## 1. Introduction

### 1.1 Purpose
This document specifies the software requirements for the blockchain-based Land Registry platform. It details the functional and non-functional requirements, data interfaces, cryptographic standards, security constraints, and fraud resistance mechanisms implemented across the smart contracts, backend indexer, and frontend web application.

### 1.2 Intended Audience
- Core Blockchain Developers & Smart Contract Auditors
- Full-Stack Web3 Engineers
- System Evaluators and Academic viva examiners
- Government Registry Administrative Testers

### 1.3 Definitions & Acronyms
- **Deed Hash:** Cryptographic 32-byte digest (`keccak256`) of a title deed document PDF.
- **EIP-712:** Ethereum Improvement Proposal standard for typed, structured data hashing and signing.
- **Authority:** Government administrative official holding `ADMIN_ROLE` on-chain.
- **Registrar:** Delegated administrative staff holding `REGISTRAR_ROLE` on-chain.
- **CEI Pattern:** Checks-Effects-Interactions programming paradigm preventing reentrancy and race conditions.
- **Content-Addressable Storage:** File storage where asset identifiers are derived directly from file contents.

---

## 2. Overall Description

### 2.1 Product Perspective
A three-tier decentralized enterprise application:
1. **On-Chain Settlement Layer:** Solidity smart contract (`contracts/LandRegistry.sol`) on EVM providing authoritative state, cryptographic verification, and dispute resolution.
2. **Off-Chain Indexer & Query Layer:** Node.js backend (`backend/indexer.js` & `server.js`) listening to EVM events, materializing state into an embedded SQLite database (`database.sqlite`), and storing PDF deeds content-addressably.
3. **User & Administrative Interface Layer:** React 19 application (`frontend/`) interacting via MetaMask for client-side signing and wallet-based role detection.

### 2.2 User Roles & Personas
- **Government Authority (`ADMIN_ROLE`):** Verifies submitted property deeds, approves pending transfers, and freezes/unfreezes properties involved in legal disputes.
- **Registrar (`REGISTRAR_ROLE`):** Delegated staff processing initial paperwork without authority to self-approve.
- **Citizen / Property Owner:** Registers real estate parcels, initiates conveyance requests to buyers, and cryptographically authorizes transfers via EIP-712 signatures.
- **Citizen / Buyer:** Reviews conveyance requests, verifies deed hashes, and signs acceptance via EIP-712 signatures.
- **Public Auditor / Citizen (Unauthenticated):** Inspects the public registry, verifies property legitimacy, checks encumbrance/freeze flags, and reviews historical ownership chains.

---

## 3. Functional Requirements

| ID | Requirement Specification | Primary Actor | Enforcement Layer |
|---|---|---|---|
| **FR-1** | System shall allow any user to register a new property specifying parcel location bounds, surface area (sq m), and a unique deed document hash. | Citizen | Contract (`registerProperty`) & Backend |
| **FR-2** | System shall enforce global uniqueness for deed hashes; registering a previously registered or burned deed hash must revert. | System | Contract (`registeredDocuments` mapping) |
| **FR-3** | Newly registered properties shall initialize in an unverified state (`isVerifiedByAuthority = false`) and cannot be transferred until verified. | System | Contract (`verifyRegistration`) |
| **FR-4** | Only accounts holding `ADMIN_ROLE` shall be authorized to verify initial property registrations. | Authority | Contract (`onlyRole(ADMIN_ROLE)`) |
| **FR-5** | Only the registered, current owner of a verified property shall be authorized to initiate a conveyance to a buyer. | Owner | Contract (`initiateTransfer`) |
| **FR-6** | The system shall reject self-transfers where the seller and buyer addresses are identical. | System | Contract (`InvalidTransferToSelf`) |
| **FR-7** | Every transfer initiation shall supply a brand-new, globally unique title deed hash (`newDocumentHash`); reusing any prior deed hash must revert. | Owner / System | Contract (`DuplicateRegistration`) |
| **FR-8** | Transfer authorization shall require dual-party cryptographic consent: both seller and buyer must submit valid EIP-712 typed data signatures. | Owner & Buyer | Contract (`signTransfer`) & Frontend |
| **FR-9** | Signature replay attacks shall be prevented by embedding an incremental per-account nonce into the EIP-712 struct hash. | System | Contract (`nonces` mapping) |
| **FR-10** | Any signature submitted by a third party who is neither the designated seller nor buyer shall be rejected. | System | Contract (`NotAPartyToTransfer`) |
| **FR-11** | Authority approval (`approveTransfer`) shall be mandatory before any conveyance can be executed. | Authority | Contract (`onlyRole(ADMIN_ROLE)`) |
| **FR-12** | Any participant may trigger execution (`executeTransfer`), but execution shall succeed only when all 4 gates (seller signed, buyer signed, authority approved, property active & verified) are satisfied. | Anyone | Contract (`executeTransfer`) |
| **FR-13** | Multiple concurrent unexecuted transfer requests for a single property shall be permitted; execution of any one transfer updates ownership and invalidates competing requests. | System | Contract state machine |
| **FR-14** | Authority shall be authorized to flag/freeze a disputed property with a logged justification reason, immediately blocking transfer initiations and executions. | Authority | Contract (`flagProperty`) |
| **FR-15** | Authority shall be authorized to unflag a resolved property, restoring full transfer capabilities. | Authority | Contract (`unflagProperty`) |
| **FR-16** | The system shall maintain an immutable, chronological on-chain array of every historical title holder accessible via public view. | Public | Contract (`getOwnershipHistory`) |
| **FR-17** | The backend indexer shall track all contract events, populate SQLite tables, and maintain a sync cursor to guarantee zero event loss across restarts. | System | Backend (`indexer.js`) |

---

## 4. Non-Functional Requirements (NFR)

| ID | Category | Specification |
|---|---|---|
| **NFR-1** | **Immutability & Integrity** | All property state transitions and ownership changes must be recorded on an EVM ledger; historical records cannot be overwritten, altered, or pruned. |
| **NFR-2** | **Client-Side Key Isolation** | Private keys must never leave the user's local environment. All signing operations must be delegated to MetaMask via standard Web3 provider prompts. |
| **NFR-3** | **Gas Optimization** | The smart contract must utilize Solidity custom errors (`error Name()`) rather than string revert reasons, minimizing bytecode size and execution overhead. |
| **NFR-4** | **Reentrancy Immunity** | The transfer execution sequence must strictly implement the Checks-Effects-Interactions (CEI) pattern, setting `request.executed = true` prior to updating property and history state. |
| **NFR-5** | **Query Latency** | Public search and ownership timeline queries served by the backend SQLite cache must respond in under 50 milliseconds. |
| **NFR-6** | **Storage Practicality** | Raw deed PDF files shall not be stored on-chain; only cryptographic 32-byte hashes are committed on-chain, keeping transaction gas predictable and low. |

---

## 5. Security & Fraud Simulation Scenarios

The codebase explicitly tests and defeats 15 concrete fraud and abuse scenarios:

1. **FT-1 (Duplicate Registration):** Attempting to register an already registered deed document hash (`revert DuplicateRegistration`).
2. **FT-2 (Unauthorized Transfer):** Non-owner attempting to initiate a conveyance (`revert NotOwner`).
3. **FT-3 (Forged Signature):** Providing a signature from an unauthorized wallet or corrupted payload (`revert InvalidSignature`).
4. **FT-4 (Replay Attack):** Reusing a previously accepted EIP-712 signature on a subsequent transfer (`revert InvalidSignature`).
5. **FT-5 (Bypass Authority Approval):** Attempting to execute conveyance without official authority approval (`revert NotApproved`).
6. **FT-6 (Frozen Asset Transfer):** Attempting to execute conveyance on a property frozen under legal dispute (`revert PropertyIsFrozen`).
7. **FT-7 (Self-Dealing):** Owner initiating transfer to their own address (`revert InvalidTransferToSelf`).
8. **FT-8 (Third-Party Forgery):** Third-party wallet attempting to sign a transfer (`revert NotAPartyToTransfer`).
9. **FT-9 (Double Signing):** A party submitting their signature twice (`revert AlreadySigned`).
10. **FT-10 (Premature Execution):** Attempting execution before both parties sign (`revert TransferNotReady`).
11. **FT-11 (Double Execution):** Attempting to execute an already finalized transfer (`revert AlreadyExecuted`).
12. **FT-12 (Initiate on Frozen):** Attempting to initiate conveyance on a disputed parcel (`revert PropertyIsFrozen`).
13. **FT-13 (Transfer Unverified):** Attempting conveyance before initial authority verification (`revert PropertyNotVerified`).
14. **FT-14 (Reused New Deed Hash):** Attempting transfer with a deed hash registered elsewhere in the system (`revert DuplicateRegistration`).
15. **FT-15 (Circular Deed Hash):** Attempting transfer reusing the property's own existing deed hash (`revert DuplicateRegistration`).
