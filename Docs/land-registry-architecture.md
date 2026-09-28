# Tamper-Proof Land Registry — Architecture & Design Document

## 1. Problem Statement (recap)
A blockchain-based land registry that:
- Registers properties and transfers ownership via smart contracts
- Verifies deed authenticity with digital signatures
- Gives a government authority a dashboard to audit records
- Is tested against simulated fraud scenarios

## 2. Technology Stack & Rationale

| Layer | Choice | Why |
|---|---|---|
| Smart contracts | Solidity ^0.8.x | Matches project tags; mature tooling, easiest to defend in a viva |
| Dev/test framework | Hardhat | Local chain, scripting, testing, deployment all in one |
| Chain | Ethereum-compatible testnet (Sepolia or Polygon Amoy) | Free, public, verifiable, works with MetaMask |
| Contract libraries | OpenZeppelin (`AccessControl`, `ECDSA`) | Audited, standard role-based access + signature verification |
| Off-chain signing | EIP-712 typed data | Human-readable signature prompts in MetaMask; standard way to prove "this specific person approved this specific deed" |
| Document storage | Hash on-chain, file off-chain (IPFS or local server) | Storing full PDFs on-chain is expensive/impractical; hashing preserves tamper-evidence |
| Backend | Node.js + Express | Connects frontend to contract, serves document hash lookups |
| Frontend | React + Ethers.js + MetaMask | Wallet-based login doubles as identity/auth |
| Testing | Hardhat + Mocha/Chai | Used both for correctness tests and fraud simulations |

**Why not Hyperledger Fabric:** Fabric needs a separately administered permissioned network (Docker, ordering service, MSP/certificate authorities, chaincode in Go/JS) — a different problem domain from "Solidity + Smart Contracts" as scoped. It's a valid alternative for a real government deployment, but not a good fit for a weeks-long college project built solo.

## 3. Actors & Roles

| Role | Permissions |
|---|---|
| **Government Authority (Admin)** | Approve new property registrations, verify identity docs, freeze/flag disputed properties, view full audit trail |
| **Registrar (optional sub-role)** | Can initiate registrations on behalf of citizens, cannot approve their own submissions |
| **Property Owner (Citizen)** | Register a property (pending authority approval), initiate a transfer, sign deeds |
| **Buyer (Citizen)** | Accept a transfer, sign acceptance |
| **Public/Auditor (read-only)** | View ownership history of any property (transparency) |

Roles implemented via OpenZeppelin `AccessControl` with `ADMIN_ROLE`, `REGISTRAR_ROLE`; plain wallet addresses act as owners/buyers.

## 4. Smart Contract Design

### 4.1 Core data structures
```solidity
struct Property {
    uint256 id;
    string  locationHash;      // hash/reference of address+geo details (privacy)
    uint256 area;               // sq. ft or sq. m
    address currentOwner;
    bytes32 documentHash;       // hash of the deed PDF
    bool    isVerifiedByAuthority;
    bool    isFrozen;           // disputed/under investigation
    uint256 registeredAt;
}

struct TransferRequest {
    uint256 propertyId;
    address from;
    address to;
    bytes32 newDocumentHash;
    bool    fromSigned;
    bool    toSigned;
    bool    authorityApproved;
    bool    executed;
}
```

### 4.2 Key functions
- `registerProperty(location, area, documentHash)` — citizen submits, status = pending, marks `documentHash` as used globally
- `verifyRegistration(propertyId)` — onlyRole(ADMIN_ROLE), marks verified, emits `PropertyVerified`
- `initiateTransfer(propertyId, to, newDocumentHash)` — only current owner, requires property to be verified, requires `newDocumentHash` is strictly unique/unused
- `signTransfer(transferId, signature)` — verifies EIP-712 signature matches `from`/`to`, records consent
- `approveTransfer(transferId)` — onlyRole(ADMIN_ROLE)
- `executeTransfer(transferId)` — requires both signatures + authority approval + verified status; updates `currentOwner`, appends to history, burns `newDocumentHash`, emits `OwnershipTransferred`
- `flagProperty(propertyId, reason)` / `unflagProperty(propertyId)` — onlyRole(ADMIN_ROLE)
- `getOwnershipHistory(propertyId)` — public view, returns full chain of past owners (built from on-chain array)
- **Concurrent Transfers allowed:** A deliberate business rule allows an owner to initiate multiple concurrent pending transfers for the same property. The first one to execute naturally invalidates the others.

### 4.3 Events (critical for the dashboard/audit trail)
`PropertyRegistered`, `PropertyVerified`, `TransferInitiated`, `TransferSigned`, `TransferApproved`, `OwnershipTransferred`, `PropertyFlagged`

Events are the backbone of the audit dashboard — indexers/frontends read event logs rather than re-querying full state repeatedly.

## 5. Digital Signature / Deed Authenticity Flow
1. Deed document (PDF) is hashed client-side (keccak256).
2. Owner signs an EIP-712 structured message containing `{propertyId, documentHash, action: "TRANSFER", nonce}` via MetaMask.
3. Contract recovers the signer address using `ECDSA.recover` and checks it matches the claimed `from`/`to` address.
4. Nonce prevents replay attacks (a captured signature can't be reused).
5. Only after both parties' signatures are verified on-chain **and** the authority approves does `executeTransfer` succeed.

This gives you two independent authenticity layers to talk about in the report: (a) the transaction itself is signed by the sender's wallet key (baseline Ethereum security), (b) the deed-specific EIP-712 signature proves deliberate, informed consent to that exact document hash.

## 6. Government Authority Dashboard
- **Auth:** MetaMask wallet connect; contract checks `hasRole(ADMIN_ROLE, msg.sender)`
- **Views:**
  - Pending registrations queue (approve/reject)
  - Pending transfers queue (approve/reject)
  - Full property registry (search/filter)
  - Per-property audit trail (timeline built from events)
  - Flag/freeze tool with reason logging
- **Stack:** React frontend → Ethers.js → contract; Node/Express backend optionally caches event logs into a local DB (e.g., SQLite) for fast search without re-scanning the chain every time.

## 7. Fraud Simulation Test Scenarios
Each becomes a Hardhat test asserting the contract **reverts**:
1. **Double registration** — same property registered twice by different accounts
2. **Unauthorized transfer** — non-owner tries `initiateTransfer`
3. **Forged signature** — signature from a random wallet submitted as if it were the owner's
4. **Replay attack** — reusing a valid signature/nonce for a second transfer
5. **Authority bypass** — trying to `executeTransfer` without authority approval
6. **Self-dealing** — owner tries to transfer to themselves to manipulate history
7. **Frozen property transfer** — attempting a transfer on a flagged/disputed property

This test file doubles as your "resilience testing" evidence for the report — each test's pass/fail output is citable proof.

## 8. Suggested Repo Structure
```
land-registry/
├── contracts/
│   ├── LandRegistry.sol
│   └── AccessControl inherited from OpenZeppelin
├── test/
│   ├── registration.test.js
│   ├── transfer.test.js
│   └── fraud-scenarios.test.js
├── scripts/
│   └── deploy.js
├── frontend/
│   ├── src/ (React app: dashboard, citizen portal)
└── backend/
    └── server.js (Express, event indexing)
```

## 9. Suggested Build Order (weeks)
1. **Week 1:** Contract skeleton + registration flow + unit tests
2. **Week 2:** Transfer flow + EIP-712 signature verification + more tests
3. **Week 3:** Fraud simulation test suite + fixes
4. **Week 4:** Dashboard frontend + backend event indexing
5. **Week 5 (buffer):** Testnet deployment, polish, demo script, report handoff

## 10. What Your Doc/Report Partner Needs From This
- This document as the technical basis for the "System Design" chapter
- Contract event logs / test output as evidence for "Results & Testing"
- A sequence diagram of the transfer flow (registration → sign → approve → execute) — can be generated once the flow is finalized
- Screenshots of the dashboard once built

---
*Next step: once you confirm this, I'll scaffold the actual Hardhat project and start with `LandRegistry.sol` (registration + roles first).*
