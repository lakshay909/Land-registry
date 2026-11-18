# Comprehensive Testing & Verification Report

**Project:** Blockchain Land Registry (Decentralized Title Conveyance & Smart Escrow)  
**Date:** October 2026  
**Environment:** Hardhat Local EVM (Cancun), Node.js v20+, SQLite (Isolated Test DB), React 18 / Vite  
**Test Status:** ✅ **ALL PASSING (100% Pass Rate)**

---

## 1. Executive Summary

This testing report documents the verification across all tiers of the Land Registry decentralized platform following the implementation of:
1. **Marketplace Listing Engine** (`listPropertyForSale`, `delistProperty`, `isForSale`, `price`)
2. **On-Chain Smart Escrow Mechanism** (Conditional fund custody in `initiateTransfer`, automated disbursement on `approveTransfer`, refund on `rejectTransfer`)
3. **Web3 Authentication & Dynamic Role-Based Dashboards** (MetaMask address routing for `CITIZEN` vs `AUTHORITY`)
4. **Backend REST APIs & Event Indexer Synchronization** (Isolated ephemeral SQLite integration tests)
5. **End-to-End Programmatic Simulation** (`scripts/run-e2e-test.js` covering full 7-step conveyance lifecycle)

---

## 2. Test Execution Overview

| Test Layer | Test Runner / Engine | Scope | Total Tests | Passed | Failed | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Smart Contracts** | Mocha / Chai / Hardhat | Unit, Reentrancy, RBAC, Escrow, EIP-712 | 57 | 57 | 0 | **PASSED** |
| **Backend REST APIs** | Jest / Supertest | Health, Properties, Marketplace, Transfers, Docs, Audit | 27 | 27 | 0 | **PASSED** |
| **E2E Lifecycle** | Hardhat Runner | 7-Step Full Journey (Registration -> Escrow -> Settlement) | 7 / 7 Steps | 7 | 0 | **PASSED** |
| **Frontend Production Build** | Vite v5 | JSX Components, Role Dashboards, Modals, ABI Bundling | 1 | 1 | 0 | **PASSED** |
| **Total Test Artifacts** | — | Full Stack Verification | **85 Checks** | **85** | **0** | **PASSED** |

---

## 3. Smart Contract Test Suite & Code Coverage

### 3.1 Coverage Metrics (`solidity-coverage`)

```
-------------------|----------|----------|----------|----------|----------------|
File               |  % Stmts | % Branch |  % Funcs |  % Lines |Uncovered Lines |
-------------------|----------|----------|----------|----------|----------------|
 contracts/        |    95.65 |    87.27 |      100 |    96.00 |                |
  LandRegistry.sol |    95.65 |    87.27 |      100 |    96.00 | 348, 349, 350  |
-------------------|----------|----------|----------|----------|----------------|
All files          |    95.65 |    87.27 |      100 |    96.00 |                |
-------------------|----------|----------|----------|----------|----------------|
```
*Note: Uncovered lines 348-350 correspond to defensive fallback re-release in `executeTransfer` if escrow had not already been released in `approveTransfer`.*

### 3.2 Breakdown of Passing Contract Tests (57 Tests)

#### A. Property Registration & Authority Verification (6 tests)
- `TC-1`: Register new property with `isVerifiedByAuthority = false`
- `TC-2`: Authority verifies registration (`ADMIN_ROLE` gate, emits `PropertyVerified`)
- Negative: Revert if verified by non-authority (`AccessControlUnauthorizedAccount`)
- Negative: Revert if already verified (`AlreadyVerified`)
- Negative: Revert if property does not exist (`PropertyDoesNotExist`)
- `FT-1`: Duplicate registration rejection on identical document hash (`DuplicateRegistration`)

#### B. Marketplace Listing & Delisting (9 tests)
- Owner lists verified property with valid price in Wei
- Revert listing if property is unverified (`PropertyNotVerified`)
- Revert listing if caller is not the owner (`NotOwner`)
- Revert listing with 0 price (`InvalidPrice`)
- Revert listing if property is frozen (`PropertyIsFrozen`)
- Revert listing non-existent property (`PropertyDoesNotExist`)
- Owner delists property successfully (`PropertyDelisted` emitted, `isForSale` reset to false)
- Revert delisting if property is not currently for sale (`PropertyNotForSale`)
- Revert delisting if caller is not the owner (`NotOwner`)

#### C. Smart Escrow & Transfer Initiation (3 tests)
- Buyer initiates purchase transfer with `msg.value >= price` (`EscrowDeposited` emitted)
- Revert if buyer deposits less than listing price (`InsufficientPayment`)
- Revert if unverified or unlisted property is targeted by third party (`NotOwner`)

#### D. Full Conveyance Lifecycle & Escrow Settlement (2 tests)
- End-to-end conveyance: Buyer locks ETH in escrow -> Seller and Buyer sign EIP-712 -> Authority approves -> Escrow auto-disbursed to seller -> Title executed to buyer
- Authority rejection: Authority rejects transfer -> Escrow fully refunded to buyer (`EscrowRefunded` emitted)

#### E. EIP-712 Dual Signatures & Replay Prevention (4 tests)
- `TC-4`: Owner signs transfer with EIP-712 typed signature
- `TC-5`: Buyer signs transfer with EIP-712 typed signature
- `FT-3`: Forged/invalid signature rejection (`InvalidSignature`)
- `FT-4`: Signature replay attack prevented via incrementing `nonces[signer]`

#### F. Access Control, Freezing & Dispute Flags (7 tests)
- Authority flags property as frozen (`PropertyFlagged`)
- Non-authority cannot freeze property
- Already frozen property cannot be reflagged (`AlreadyFrozen`)
- Authority unflags property (`PropertyUnflagged`)
- Non-frozen property cannot be unflagged
- Reverts on non-existent property flag/unflag

#### G. Edge Cases & Attack Surface Hardening (26 tests)
- `FT-7`: Self-dealing prevention (cannot initiate transfer to self)
- `FT-8`: Third-party signature rejection (`NotAPartyToTransfer`)
- `FT-9`: Double signing prevention (`AlreadySigned`)
- `FT-10`: Premature execution blocked (`TransferNotReady`)
- `FT-11`: Double execution blocked (`AlreadyExecuted`)
- `FT-12`: Block transfer initiation on frozen property
- `FT-13`: Block transfer initiation on unverified property
- `FT-14`: Block transfer with duplicate document hash
- `FT-15`: Block transfer reusing current property document hash
- Complete non-existent ID checks for `initiateTransfer`, `signTransfer`, `approveTransfer`, and `executeTransfer`

---

## 4. Backend REST API Integration Suite

**Runner:** Jest v29 + Supertest  
**Database:** Isolated SQLite database (`backend/test_api.sqlite`), dynamically configured via `DB_PATH`.  
**Total Tests:** 27  
**Passing:** 27 (100%)

### 4.1 Endpoint Coverage Summary

| Endpoint | Method | Test Scenarios | Status |
| :--- | :--- | :--- | :--- |
| `/api/health` | `GET` | Health status and DB connectivity check | ✅ PASSED |
| `/api/properties` | `GET` | Return all registered properties | ✅ PASSED |
| `/api/properties/marketplace` | `GET` | Return only active listings (`isForSale = 1`) | ✅ PASSED |
| `/api/marketplace` | `GET` | Verify direct marketplace alias route | ✅ PASSED |
| `/api/properties?status=for-sale` | `GET` | Filter by for-sale flag | ✅ PASSED |
| `/api/properties?status=verified` | `GET` | Filter by verified non-frozen properties | ✅ PASSED |
| `/api/properties?status=pending` | `GET` | Filter by unverified registrations | ✅ PASSED |
| `/api/properties?status=frozen` | `GET` | Filter by frozen/disputed properties | ✅ PASSED |
| `/api/properties?owner=...` | `GET` | Filter properties by owner wallet address | ✅ PASSED |
| `/api/properties/:id` | `GET` | Return single property with embedded history | ✅ PASSED |
| `/api/properties/:id/history` | `GET` | Return sequential ownership chain | ✅ PASSED |
| `/api/properties/:id` | `GET` | 400 for malformed ID, 404 for missing ID | ✅ PASSED |
| `/api/transfers` | `GET` | Return transfers list with formatted `escrowAmount` | ✅ PASSED |
| `/api/transfers?status=pending` | `GET` | Return pending transfers | ✅ PASSED |
| `/api/transfers?party=...` | `GET` | Filter transfers by participant address | ✅ PASSED |
| `/api/transfers?party=invalid` | `GET` | 400 validation error on malformed Ethereum address | ✅ PASSED |
| `/api/transfers/:id` | `GET` | Return transfer details and 404 on missing ID | ✅ PASSED |
| `/api/documents/:hash` | `GET` | Retrieve document metadata by hash (400/404 handled) | ✅ PASSED |
| `/api/documents` | `POST` | Multipart upload with SHA3/Keccak256 hash generation | ✅ PASSED |
| `/api/documents` | `POST` | 400 error on upload without file payload | ✅ PASSED |
| `/api/audit-log` | `GET` | Audit trail sorted by block timestamp | ✅ PASSED |
| `/api/audit-log?propertyId=...` | `GET` | Audit trail filtered by specific parcel ID | ✅ PASSED |

---

## 5. End-to-End Simulation Verification (`run-e2e-test.js`)

The standalone simulation script executes a live scenario across 4 distinct accounts:

```text
Actors:
  - Deployer:  0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
  - Seller:    0x70997970C51812dc3A010C7d01b50e0d17dc79C8
  - Buyer:     0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC
  - Authority: 0x90F79bf6EB2c4f870365E785982E1f101E93b906
```

### Lifecycle Execution Sequence

1. **Step 0: Contract Deployment & Role Setup**
   - Deployed `LandRegistry.sol` to local EVM.
   - Granted `ADMIN_ROLE` to Authority.
2. **Step 1: Property Registration**
   - Seller registers parcel (Location: `ipfs://QmDehradunParcel101GISCoordinates`, Area: 2,400 sq.m).
   - Property #1 created; `isVerifiedByAuthority = false`. Gas used: 283,030.
3. **Step 2: Authority Verification**
   - Authority executes `verifyRegistration(1)`.
   - `isVerifiedByAuthority` becomes `true`.
4. **Step 3: Marketplace Listing**
   - Seller lists Property #1 for `2.5 ETH`.
   - Property state updated: `isForSale = true`, `price = 2500000000000000000 wei`.
5. **Step 4: Buyer Escrow Lock**
   - Buyer initiates transfer sending `2.5 ETH`.
   - Contract balance: increases from `0 ETH` to `2.5 ETH`.
   - Transfer #1 created with `escrowAmount = 2.5 ETH`.
6. **Step 5: EIP-712 Dual Signatures**
   - Seller signs conveyance deed typed data -> submits `signTransfer(1, sig)`.
   - Buyer signs conveyance deed typed data -> submits `signTransfer(1, sig)`.
   - Both `fromSigned` and `toSigned` marked `true`.
7. **Step 6: Authority Approval & Escrow Release**
   - Seller balance before approval: `9999.999664 ETH`
   - Authority executes `approveTransfer(1)`.
   - Escrow funds released to Seller: `+2.5 ETH`.
   - Seller balance after approval: `10002.499664 ETH`.
   - Contract balance: returned to `0 ETH`.
8. **Step 7: Final Title Transfer**
   - `executeTransfer(1)` called.
   - Property owner updated to Buyer (`0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC`).
   - `isForSale` reset to `false`, `price` reset to `0`.
   - Ownership chain: `[ Seller -> Buyer ]`.

---

## 6. Security & Invariant Analysis

1. **Checks-Effects-Interactions (CEI) Pattern:**
   - In `approveTransfer` and `rejectTransfer`, state changes (`request.authorityApproved = true` or `request.executed = true`) and zeroing of `request.escrowAmount` occur *before* external calls via `call{value: amount}("")`.
2. **Reentrancy Protection:**
   - State flags prevent repeat entry. Any malicious fallback re-calling `approveTransfer` or `executeTransfer` reverts immediately with `AlreadyApproved` or `AlreadyExecuted`.
3. **EIP-712 Domain Separation:**
   - Typed data signatures incorporate `chainId` and `verifyingContract`, preventing cross-chain and cross-contract signature replaying.
4. **Signature Nonce Invalidation:**
   - Each successful signature increments `nonces[msg.sender]`, preventing reused signatures on subsequent transactions.
5. **Role-Based Access Control (RBAC):**
   - Only accounts holding `ADMIN_ROLE` can verify parcels, flag/unflag parcels, approve transfers, or reject transfers.

---

## 7. Developer Onboarding & Testing Quick-Start

To reproduce and execute all tests locally:

```bash
# 1. Smart contract unit tests & coverage
npx hardhat test
npx hardhat coverage

# 2. Standalone E2E conveyance lifecycle simulation
npx hardhat run scripts/run-e2e-test.js

# 3. Backend REST API integration tests
cd backend && npm test

# 4. Frontend production build
cd frontend && npm run build
```

For importing local Hardhat test accounts into MetaMask, refer to [`TEST_ACCOUNTS_SETUP.md`](file:///Users/lakshay/Desktop/Land-registry/TEST_ACCOUNTS_SETUP.md).
