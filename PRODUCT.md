# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Government Authority (`ADMIN_ROLE`) / Registrar (`REGISTRAR_ROLE`)**: Municipal or state officials responsible for reviewing submitted property title deeds, validating parcel attributes, approving or rejecting conveyance handshakes, and placing or lifting dispute/judicial freezes.
- **Citizen / Property Owner**: Individuals or entities registering parcels of land, managing owned assets, creating transfer conveyance agreements, and signing off cryptographically via EIP-712.
- **Citizen / Buyer**: Prospective property buyers reviewing title validity, verifying deed hashes, inspecting parcel boundaries, and completing dual-party EIP-712 signature agreements.
- **Public Auditor / Evaluator / Citizen**: Unauthenticated visitors inspecting the public ledger, searching title deed keccak256 digests, and verifying historical ownership chains.

## Product Purpose

Traditional land registries suffer from paper forgery, opaque administrative alterations, and vulnerable centralized records. This platform provides an immutable, transparent, and tamper-evident decentralized registry where land parcel registration, deed provenance, and ownership transfers are cryptographically enforced and publicly auditable.

Success means seamless dual-party cryptographic conveyance, zero tolerance for double registration or replay attacks, clear administrative oversight, and verifiable public trust.

## Positioning

Unlike centralized government databases vulnerable to unilateral modifications or single-point failures, this system requires:
1. **Cryptographic Title Deed Digests**: Raw title documents are fingerprinted using client-side `keccak256` hashing with global uniqueness checks on-chain.
2. **Dual-Party EIP-712 Structured Consent**: Both seller and buyer must cryptographically sign typed transfer data with incrementing nonces to prevent replay attacks.
3. **Decentralized Settlement with Regulatory Oversight**: Transfers require on-chain government authority approval before final ownership reassignment occurs.

## Operating Context

- **Interface**: Desktop web application connecting to Ethereum-compatible Web3 providers (MetaMask / EIP-1193).
- **Network Environment**: Local Hardhat EVM (chainId 31337) and Ethereum testnets (Sepolia / Polygon Amoy).
- **Architecture**: Three-tier system combining an on-chain Solidity settlement contract (`contracts/LandRegistry.sol`), an off-chain Express/SQLite event indexer (`backend/`), and a React 19 / Vite / Tailwind v4 frontend (`frontend/`).
- **Document Handling**: Digital title deed PDFs are hashed client-side (`keccak256`) and stored in a content-addressable document store.

## Capabilities and Constraints

- **Confirmed Capabilities**:
  - Global uniqueness enforcement on deed document hashes.
  - Property registration lifecycle: `Pending Verification` → `Verified` → `Transfer Pending` → `Approved & Transferred`.
  - Seller-initiated transfers with mandatory exclusion of self-transfers (`InvalidTransferToSelf`).
  - Brand-new deed hash required for every change of hands (`newDocumentHash`).
  - Dual-party EIP-712 typed signature collection with nonce replay protection.
  - Authority-level approval or rejection of pending transfers.
  - Emergency judicial freeze and unfreeze functions (`freezeProperty`, `unfreezeProperty`) by administrators.
  - Complete transparent ownership history queryable on-chain (`getOwnershipHistory`).
- **Confirmed Constraints**:
  - Platform is pure web (React 19, Vite, Tailwind CSS v4, Ethers v6).
  - Out of scope: National legal KYC integration, physical biometrics, production mainnet financial settlement.

## Brand Commitments

- **Name**: Land Registry (Tamper-Proof Land Registry and Property Ownership Tracking Using Blockchain).
- **Voice**: Institutional, secure, precise, and transparent. Clear state indicators without superficial Web3 jargon.
- **Visual Stance**: High-clarity operational dashboard balancing scanability for administrative auditors with accessible self-service for citizens.

## Evidence on Hand

- **Smart Contracts**: [`contracts/LandRegistry.sol`](file:///Users/lakshay/Desktop/Projects/Land-registry/contracts/LandRegistry.sol) (Solidity 0.8.24, OpenZeppelin v5 AccessControl & EIP712).
- **Backend & Indexer**: [`backend/server.js`](file:///Users/lakshay/Desktop/Projects/Land-registry/backend/server.js), [`backend/indexer.js`](file:///Users/lakshay/Desktop/Projects/Land-registry/backend/indexer.js).
- **Frontend**: [`frontend/src/`](file:///Users/lakshay/Desktop/Projects/Land-registry/frontend/src/) (React 19, React Router v7, Ethers v6, Headless UI).
- **Test Suite & Reports**: [`test/LandRegistry.test.js`](file:///Users/lakshay/Desktop/Projects/Land-registry/test/LandRegistry.test.js), [`TESTING_REPORT.md`](file:///Users/lakshay/Desktop/Projects/Land-registry/TESTING_REPORT.md), [`Docs/02-srs.md`](file:///Users/lakshay/Desktop/Projects/Land-registry/Docs/02-srs.md).

## Product Principles

1. **Cryptographic Truth**: The on-chain smart contract is the single source of truth. UI states reflect confirmed blockchain events and contract queries.
2. **Mutual Consent**: Property transfers require verified, un-reusable cryptographic signatures (EIP-712) from both parties before authority ratification.
3. **Radical Auditability**: Anyone can verify title deed authenticity and provenance without special access rights or intermediary gatekeepers.
4. **Institutional Clarity**: Administrative and legal states (verified, pending, frozen, transferred) are unmistakable, preventing accidental approvals or disputed actions.

## Accessibility & Inclusion

- High-contrast visual cues for security-critical actions (freezes, approvals, signature requests).
- Plain-language legal explanations accompanying raw cryptographic hashes and hex addresses.
- Accessible keyboard navigation and semantic HTML for all audit tables, modals, and property inspection cards.
