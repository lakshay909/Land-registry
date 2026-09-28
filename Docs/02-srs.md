# Software Requirements Specification (SRS)
## Tamper-Proof Land Registry and Property Ownership Tracking Using Blockchain

### 1. Introduction
#### 1.1 Purpose
Defines the functional and non-functional requirements for a blockchain-based land registry system.

#### 1.2 Intended Audience
Developers, project evaluators, government-authority role testers, documentation team.

#### 1.3 Definitions
- **Deed hash:** cryptographic hash (keccak256) of a property's deed document.
- **Authority:** the on-chain role permitted to verify registrations and approve transfers.
- **EIP-712:** Ethereum standard for signing structured, human-readable data.

### 2. Overall Description
#### 2.1 Product Perspective
A decentralized application (DApp): Solidity smart contract as the source of truth, React frontend, Node/Express backend for indexing and document-hash lookups.

#### 2.2 User Classes
- Government Authority (admin)
- Registrar (optional delegated admin)
- Property Owner
- Buyer
- Public Auditor (read-only)

#### 2.3 Operating Environment
Modern browser with MetaMask extension; Node.js backend server; Ethereum-compatible testnet.

### 3. Functional Requirements

| ID | Requirement | Actor |
|---|---|---|
| FR-1 | System shall allow a user to submit a new property registration with location, area, and deed document hash | Owner |
| FR-2 | System shall require Authority approval before a registration is marked verified | Authority |
| FR-3 | System shall allow only the current verified owner to initiate a transfer | Owner |
| FR-4 | System shall require both parties (from/to) to cryptographically sign the transfer before execution | Owner, Buyer |
| FR-5 | System shall require Authority approval before a transfer executes | Authority |
| FR-6 | System shall reject a transfer if the recovered signature address does not match the claimed party | System |
| FR-7 | System shall reject reused/replayed signatures via nonce checking | System |
| FR-8 | System shall record every state change as an event for audit purposes | System |
| FR-9 | System shall allow any user to view a property's full ownership history | Public |
| FR-10 | System shall allow Authority to flag/freeze a disputed property, blocking transfers on it | Authority |
| FR-11 | Dashboard shall display pending registrations and pending transfers for Authority review | Authority |
| FR-12 | Dashboard shall provide search/filter over registered properties | All |
| FR-13 | System shall require every transfer to produce a new unique deed document hash; reusing any existing hash (including the property's own) is invalid | System |
| FR-14 | System shall permit multiple concurrent unexecuted transfer requests for a property, but execution of one invalidates the rest | System |

### 4. Non-Functional Requirements

| ID | Requirement |
|---|---|
| NFR-1 | All ownership-changing operations must be tamper-evident (immutable once confirmed on-chain) |
| NFR-2 | Signature verification must complete without exposing private keys off-device (MetaMask handles signing client-side) |
| NFR-3 | System should reject fraudulent transactions (see fraud scenarios) with clear revert reasons |
| NFR-4 | Dashboard should load a property's full audit trail in under ~3 seconds on testnet |
| NFR-5 | Smart contract functions should be role-gated; unauthorized calls must revert |
| NFR-6 | Deed documents themselves are not stored on-chain (only hashes), to keep gas costs practical |

### 5. External Interface Requirements
- **MetaMask** for wallet connection, transaction signing, and identity.
- **Testnet RPC endpoint** (Infura/Alchemy or public RPC) for contract interaction.
- **Optional IPFS or local file storage** for the actual deed document referenced by its hash.

### 6. Assumptions & Constraints
- Users have a funded testnet wallet (via faucet).
- Identity is wallet-based; real-world KYC is out of scope.
- Single blockchain network for the demo (no cross-chain).
