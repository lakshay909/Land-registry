# PHASE 4 ARCHITECTURE DECISION RECORD (ADR)
# Bhūmi Ledger — India Land Transaction & Registry Platform

**Document Version:** 1.0.0  
**Phase:** Phase 4 (Architecture, Security, Privacy & Regulatory Feasibility Gate)  
**Authors:** Chief AI Engineering Orchestrator, Department Head of Architecture (DH-Arch), Department Head of Security (DH-Security), Department Head of Legal & Compliance (DH-Legal)  
**Status:** Canonical Architecture Decision Baseline for Phase 4  
**Jurisdiction Baseline:** Republic of India / State of Uttar Pradesh (Pilot State)  

---

## 1. Governance Context & Purpose

This Architecture Decision Record (ADR) codifies the foundational architectural decisions formulated during **Phase 4**. These decisions respond directly to the Project Owner's conditional authorization directives and establish binding technical boundaries for the platform.

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                               PHASE 4 ARCHITECTURAL BOUNDARY                           │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ • Research, Analysis, Threat Modelling & Technical Specifications ONLY.                │
│ • ZERO application source code, smart contract, or database schema modifications.      │
│ • ZERO live financial integrations, live crypto escrow, or unauthorized banking calls. │
│ • All decisions subject to Project Owner explicit sign-off prior to Phase 5.           │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Canonical Architecture Decision Records

### ADR-01: PullPayment Refactoring Timing & Sandbox Escrow Boundary
- **Status:** **APPROVED FOR PHASE 5 DESIGN / CONDITIONAL ON FUND HANDLING**
- **Context:** `contracts/LandRegistry.sol` currently uses direct push payments (`call{value: amount}`) in `approveTransfer` and `rejectTransfer`. In production systems handling live funds, this pattern is susceptible to Denial of Service (DoS) and reentrancy if the recipient is a malicious contract. However, the Project Owner has established that **live citizen funds will not be handled in MVP Release 1**.
- **Decision:**
  1. For **MVP Release 1 (Devnet / Testnet Academic Demonstration)**: Retain existing `contracts/LandRegistry.sol` as-is. This preserves all **57 passing Hardhat unit tests** and avoids breaking the working ABI bindings in `backend/` and `frontend/`.
  2. For **Production EVM Deployment (`LandRegistryV2.sol`)**: Fully specify the OpenZeppelin `PullPayment` pattern (`pendingWithdrawals[address]` + `withdrawEscrow()`), but defer contract replacement until live on-chain tokenized or fiat-bridged escrow is formally approved.
- **Consequences:** Eliminates premature refactoring risks, prevents test regressions, and maintains stability while providing an audited production design in [`SMART_CONTRACT_REFACTORING_SPEC.md`](file:///Users/lakshay/Desktop/Projects/Land-registry/Docs/architecture/SMART_CONTRACT_REFACTORING_SPEC.md).

---

### ADR-02: DPDP Privacy Architecture, Salting & Non-Linkability Strategy
- **Status:** **APPROVED ARCHITECTURAL PRINCIPLE**
- **Context:** Under the Digital Personal Data Protection (DPDP) Act, 2023, personal data cannot be stored immutably on a public ledger. Merely hashing a document does not anonymize it if the hash can be re-identified using auxiliary public data, wallet graphs, or dictionary attacks on known document structures.
- **Decision:**
  1. **Zero Raw PII On-Chain:** Citizen names, phone numbers, Aadhaar numbers, and unredacted deeds are strictly prohibited from touching the EVM.
  2. **Client-Side Salting & Hashing:** Document hashes committed to the blockchain must be computed as:
     $$\text{CommitmentHash} = \text{Keccak-256}(\text{CanonicalDocumentBytes} \parallel \text{CitizenSalt})$$
     where `CitizenSalt` is a 256-bit CSPRNG value stored strictly off-chain in the citizen's encrypted session vault.
  3. **Data Minimization & Erasure:** The off-chain PostgreSQL database encrypts all personal metadata using AES-256-GCM. When an erasure request is executed under Section 12(3) of the DPDP Act, the off-chain pre-image and salt are destroyed, rendering the on-chain hash permanently un-linkable to any identifiable natural person.
- **Consequences:** Eliminates rainbow-table linkability on public blocks, protects against correlation attacks, and satisfies DPDP data erasure principles without violating blockchain immutability.

---

### ADR-03: Complete Exclusion of Aadhaar Collection in MVP
- **Status:** **APPROVED AS MANDATORY MVP PRIVACY SAFEGUARD**
- **Context:** The Aadhaar (Targeted Delivery of Financial and Other Subsidies, Benefits and Services) Act, 2016 and subsequent Supreme Court jurisprudence (*K.S. Puttaswamy v. Union of India, 2018*) strictly restrict private entities from mandating or storing Aadhaar numbers. Private entities without AUA/KUA licenses face severe statutory penalties (up to ₹1 Crore under UIDAI regulations and ₹250 Crores under the DPDP Act) for unauthorized Aadhaar handling.
- **Decision:**
  1. **Total Exclusion in MVP:** Bhūmi Ledger **shall not collect, prompt for, verify, or store Aadhaar numbers** in the MVP.
  2. **Alternative Identification:** Pre-registration conveyance drafting and Section 393(1) tax draft schedules will rely strictly on **Permanent Account Number (PAN)** (which is statutorily mandatory under Section 139A of the Income-tax Act for real estate $\ge ₹10$ Lakhs) and standard Voter ID / Passport references.
  3. **Accidental Upload Redaction:** If a citizen accidentally uploads a deed containing an Aadhaar number, server-side ingestion middleware must automatically detect and redact the Aadhaar digits before storage.
- **Consequences:** Dramatically reduces regulatory compliance risk, eliminates UIDAI audit liabilities, and speeds up time-to-market.

---

### ADR-04: Strict Separation of UPIC (16-Digit) and ULPIN (14-Char)
- **Status:** **APPROVED DATA ARCHITECTURE**
- **Context:** Conflating the 16-digit Computerized Gata Code used by the UP Board of Revenue (`upbhulekh.gov.in`) with the 14-character alphanumeric ULPIN (Bhu-Aadhaar) created data confusion in early specifications. Rural UP parcels universally have a 16-digit code, but 14-character ULPIN rollout is phased across districts.
- **Decision:**
  1. The parcel data model must explicitly support both identifiers as distinct fields:
     - `computerized_gata_code`: `VARCHAR(16)` (Mandatory for rural UP revenue parcels).
     - `ulpin`: `VARCHAR(14)` (Optional; marked `PENDING_GEOREFERENCING` if unavailable).
     - `municipal_upic`: `VARCHAR(50)` (Optional; used for urban properties in Lucknow LDA / NOIDA).
  2. Validation rules are implemented separately for each identifier format in [`UP_IDENTIFIER_VALIDATION_SPEC.md`](file:///Users/lakshay/Desktop/Projects/Land-registry/Docs/architecture/UP_IDENTIFIER_VALIDATION_SPEC.md).
- **Consequences:** Guarantees 100% data compatibility with UP Bhulekh while ensuring future-proof interoperability with Central DILRMP ULPIN services.

---

### ADR-05: Non-Custodial Dual-Rail Settlement Architecture
- **Status:** **APPROVED STATUTORY BOUNDARY**
- **Context:** Holding citizen funds in escrow or settling domestic Indian real estate in cryptocurrency violates RBI Payment Aggregator directives and FEMA regulations. Furthermore, operating a nodal escrow account requires formal RBI licensing under Section 25A of the Payment and Settlement Systems Act, 2007.
- **Decision:**
  1. **Sandbox Rail (Devnet/Testnet):** Working EVM smart contract escrow is maintained on local Hardhat and public testnets strictly for academic/prototype evaluation.
  2. **Production Rail (Draft Assistance Only):** For actual Indian domestic transactions, the platform acts strictly as an **informational draft-assistance engine**. It generates payment breakdown schedules and pre-filled Form 141 tax schedules, but **executes zero live money movements, holds zero funds in custody, and connects to zero live banking APIs**.
- **Consequences:** 100% legal compliance with RBI, FEMA, and CBDT regulations; zero financial liability or money transmitter licensing obligations.

---

### ADR-06: Objective 6-Tier Litigation & Platform Restriction Semantics
- **Status:** **APPROVED LEGAL & SYSTEM TAXONOMY**
- **Context:** Describing an internal platform restriction as a "court injunction" creates severe legal slander and tort liability. Conversely, ignoring judicial stay orders risks contempt of court.
- **Decision:**
  1. System strictly enforces a 6-tier classification: `COURT_INJUNCTION`, `PENDING_LITIGATION`, `REVENUE_DISPUTE`, `LIS_PENDENS`, `STATUTORY_BAR`, and `INTERNAL_PLATFORM_WARNING`.
  2. Only verified judicial stay orders with certified case codes can freeze a parcel (`isFrozen = true`).
  3. Internal heuristic alerts are labeled strictly as `INTERNAL_PLATFORM_WARNING` and explicitly disclaim being judicial orders.
- **Consequences:** Prevents defamation/tort liability, ensures statutory accuracy, and informs users transparently.

---

### ADR-07: RERA Risk Mitigation & Gated Marketplace Strategy
- **Status:** **APPROVED SCOPE GATE**
- **Context:** Operating an open digital marketplace facilitating property transactions without registration under Section 9 of the Real Estate (Regulation and Development) Act, 2016 risks statutory penalties under Section 62 (up to ₹10,000/day or 5% of property value).
- **Decision:**
  1. **Proposed MVP Scope:** Informational directory of standalone rural agricultural and ancestral resale plots (which fall outside Section 3 project registration).
  2. **Gated Buyer-Seller Matching:** Active matching, escrow facilitation, and brokerage transaction fees are **LOCKED** until a qualified legal opinion from an external practising advocate is obtained.
- **Consequences:** Completely insulates the platform from RERA broker licensing violations during pilot deployment.

---
*End of Phase 4 Architecture Decision Record.*