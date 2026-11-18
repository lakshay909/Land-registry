# DECISION REGISTER
# Bhūmi Ledger — India Land Transaction & Registry Platform

**Document Version:** 3.0.0  
**Status:** Canonical Decision Log — Formally Approved Principles & Strict Conditions  
**Last Updated:** October 31, 2026 (Phase 1 Decision Gate Determinations Incorporated)  

---

## 1. Decision Statuses & Governance Taxonomy
- `APPROVED`: Authorized by Project Owner; binding on architecture and implementation.
- `APPROVED IN PRINCIPLE`: Architectural direction confirmed, but implementation and technology selection require separate review/approval.
- `APPROVED WITH CONDITIONS`: Direction permitted strictly within recorded operational, legal, and risk constraints.
- `NOT APPROVED / REJECTED`: Explicitly rejected or denied with statutory/business rationale.
- `PROPOSED`: Formulated by department heads, pending review.
- `SUPERSEDED`: Replaced by a subsequent approved decision.

---

## 2. Project Owner Determinations on Foundational Strategic Gates (Q01–Q05)

### DEC-005 / Q-01: Production Escrow and Settlement Architecture
- **Date:** 2026-10-31
- **Status:** **APPROVED WITH CONDITIONS (Alternative A: Dual-Rail Architecture)**
- **Decision Owner:** Project Owner
- **Governing Constraints & Binding Conditions:**
  1. **Dual-Rail Separation:** Retain EVM smart contract escrow strictly for local development, testing, and testnet demonstrations (demonstrating cryptographic state locks).
  2. **Separate INR Settlement Design:** Design a distinct off-chain regulated INR settlement adapter.
  3. **No Assumed Nodal Availability:** The engineering team **shall not assume** that a nodal banking escrow arrangement is automatically available or granted to our platform.
  4. **Deep Regulatory Research Mandate:** Before any banking provider is recommended, the team must research and establish:
     - The actual RBI regulatory model (e.g., Payment Aggregator escrow guidelines, Section 25A of Payment and Settlement Systems Act, 2007).
     - Provider eligibility criteria.
     - Custody responsibilities and liability allocation.
     - End-to-end payment flows and settlement timeframes (T+1/T+2).
     - Banking and interchange fee structures.
     - Formal contractual and compliance requirements.
  5. **Absolute Embargo on Live Transactions:** Zero live financial transactions, production payment gateway activations, or live bank integrations are permitted until separately and explicitly reviewed and approved by the Project Owner.
- **Implementation Status:** Architecture principle approved; implementation and provider selection **UNAPPROVED / BLOCKED**.

---

### DEC-008 / Q-02: Target Ledger Network & EVM Portability
- **Date:** 2026-10-31
- **Status:** **APPROVED IN PRINCIPLE (Chain-Agnostic EVM Architecture)**
- **Decision Owner:** Project Owner
- **Governing Constraints & Binding Conditions:**
  1. **Strict Portability:** Contracts must remain purely Cancun EVM compatible, compiling without vendor-specific precompiles, proprietary SDKs, or network lock-in.
  2. **Development Boundary:** Local Hardhat (31337) remains the primary active execution environment. Public testnets (e.g., Arbitrum Sepolia, Polygon Amoy) may be used *only where strictly required for multi-party validation*.
  3. **No Production Network Selected:** Selection of a production network (whether a public L2 rollup, Polygon, Arbitrum, Base, or a state-supported consortium like the NIC National Blockchain Framework) is **DEFERRED AND UNAPPROVED**.
  4. **Mandatory Technology Justification:** No blockchain or distributed ledger technology may be introduced into any feature or module without a documented, evidence-based justification demonstrating why a cryptographic audit log in a conventional database is insufficient.
  5. **Comparative Analysis Required:** Maintain active comparative evaluations between public EVMs, permissioned consortium networks, and conventional database-based cryptographic logs.
- **Implementation Status:** Architecture principle approved; production network selection **DEFERRED / UNAPPROVED**.

---

### DEC-007 / Q-03: Government Portal Data Access & Ingestion
- **Date:** 2026-10-31
- **Status:** **APPROVED WITH CONDITIONS (Assisted Citizen Workflow)**
- **Decision Owner:** Project Owner
- **Governing Constraints & Binding Conditions:**
  1. **User-Provided Ingestion:** The initial approach must rely strictly on citizen-uploaded, government-issued digital documents (e.g., certified Khatauni RoR PDFs, IGRSUP e-Challan receipts).
  2. **Metadata & Provenance Extraction:** Extract structured document metadata, parcel codes (16-digit ULPIN / Khasra numbers), and state authority digital signature references.
  3. **Verification State Lifecycle:** Maintain explicit document provenance and verification status flags (e.g., `UNVERIFIED_UPLOAD`, `METADATA_EXTRACTED`, `PENDING_SRO_EXECUTION`, `REVENUE_OFFICER_CONFIRMED`).
  4. **Cryptographic Tamper Detection:** Compute and store Keccak-256 cryptographic hashes strictly for data integrity and tamper detection.
  5. **No Claims of Title Proof:** The platform and its user interface **shall never claim** that a matching cryptographic hash proves government authenticity, legal title, or unencumbered legal ownership.
  6. **Zero Unauthorized Access / Scraping:** Absolute prohibition against scraping government portals (`upbhulekh.gov.in`, `igrsup.gov.in`, `vaad.up.nic.in`), automated CAPTCHA bypassing, session hijacking, or circumventing access controls (preserving full compliance with Section 43/66 of the IT Act, 2000).
  7. **Modular Extensibility:** Retain clean adapter interfaces (`IGovernmentRecordAdapter`) to enable pluggable integration with future authorized government API gateways (e.g., NIC Open Data APIs) when formally authorized under an official MoU.
- **Implementation Status:** Assisted citizen workflow approved for MVP; scraping banned; direct API integration **UNAPPROVED / AWAITING GOVT MOU**.

---

### DEC-011 / Q-04: Layered Identity & Access Management
- **Date:** 2026-10-31
- **Status:** **APPROVED IN PRINCIPLE (Layered Identity Architecture)**
- **Decision Owner:** Project Owner
- **Governing Constraints & Binding Conditions:**
  1. **Strict Separation of Identities:** The system architecture must decouple:
     - *Account Identity:* Web application user credentials (JWT/session).
     - *Wallet Identity:* Secp256k1 public key address (`0x...`) used for cryptographic non-repudiation and smart contract state locks.
     - *Government Identity:* Official citizen identity (DigiLocker / Aadhaar / PAN) managed strictly off-chain.
     - *Signing Identity:* Statutory electronic or physical signature identity.
     - *Property Ownership Evidence:* Verified land record linkages.
  2. **Minimal Data Collection (DPDP Act, 2023):** Enforce strict data minimization. Sensitive personal data must not be collected or stored unless legally mandatory.
  3. **No Default Aadhaar Storage:** The platform **shall not store Aadhaar numbers or unmasked identity cards by default**. Any verification must use authorized tokenized or masked patterns.
  4. **Authorised Channel Investigation:** Investigate legally permitted, authorized DigiLocker Application Service Provider (ASP) or AUA/KUA mechanisms.
  5. **Gated Implementation:** No third-party identity-provider integration, SDK incorporation, or sensitive data storage may begin until detailed legal, privacy, and security reviews have been conducted and explicitly signed off.
- **Implementation Status:** Layered identity principle approved; vendor onboarding and storage implementation **UNAPPROVED / GATED**.

---

### DEC-009 / Q-05: Marketplace Scope and RERA Legal Applicability
- **Date:** 2026-10-31
- **Status:** **NOT APPROVED AS A LEGAL EXEMPTION / CONDITIONALLY SCOPED**
- **Decision Owner:** Project Owner
- **Governing Constraints & Binding Conditions:**
  1. **No Assumed Legal Exemption:** The platform **shall not presume** that rural agricultural or ancestral land listings enjoy an automatic, blanket legal exemption from the Real Estate (Regulation and Development) Act, 2016 (RERA).
  2. **Proposed MVP Boundary:** Retain standalone rural agricultural and ancestral resale listings strictly as a **proposed MVP product boundary**, pending legal determination.
  3. **Activity-Based RERA Investigation:** Conduct a rigorous legal investigation into whether platform marketplace functionality (listing, buyer-seller matching, escrow facilitation, transaction fee models) constitutes acting as a "Real Estate Agent" under Section 2(zm) and Section 9 of the RERA Act, 2016, regardless of property type.
  4. **Mandatory Qualified Legal Review:** Formal qualified legal review and written compliance opinion must be obtained before any public marketplace listing workflows are activated in code or production.
- **Implementation Status:** Architectural scope proposed; public marketplace activation **BLOCKED PENDING QUALIFIED LEGAL REVIEW**.

---

## 3. Approved Canonical Baseline Decisions (Retained)

### DEC-001: Preservation of Existing Multi-Tier Working Codebase
- **Status:** **APPROVED**
- Retain all 19 modified working-tree files, contracts, tests, and frontend components. Read-only policy enforced during research, gap analysis, and planning phases.

### DEC-002: Uttar Pradesh as Primary Pilot Jurisdiction
- **Status:** **APPROVED**
- Pilot bounded strictly to Uttar Pradesh revenue administration (UP Revenue Code, 2006; UP Stamp Rules, 1997; IGRSUP; Bhulekh). Decoupled multi-state adapter (`up.config.json`) ensures pan-India extensibility.

### DEC-003: Legal Reality of Digital Signatures vs. Statutory SRO Deed Registration
- **Status:** **APPROVED / GUIDELINE**
- On-chain EIP-712 signatures serve strictly as **admissible bilateral digital consent and agreement for sale** under Section 10A of the IT Act, 2000 and Section 63 of BSA 2023. They do NOT replace statutory physical/biometric deed registration before a Sub-Registrar under Section 17 of the Registration Act, 1908.

---

## 4. Proposed Architectural Decisions (Pending Phase 4 Gate)

### DEC-004: PullPayment Escrow Pattern
- **Status:** **PROPOSED (Target Phase 4 Architecture Gate)**
- Refactor smart contract escrow disbursement from direct push (`.call{value: amount}`) to OpenZeppelin `PullPayment` (`withdrawEscrow`) to eliminate DoS and reentrancy vectors.

### DEC-006: Hybrid Dual-Layer Persistence Architecture
- **Status:** **PROPOSED (Target Phase 4 Architecture Gate)**
- Off-chain PostgreSQL + PostGIS for rich relational domain state, geospatial queries, and encrypted PII; on-chain Cancun EVM contracts as an immutable settlement and audit anchor holding only state hashes, dispute flags, and bilateral consent roots.

### DEC-010: Remote NRI Special PoA 3-Month Adjudication Window
- **Status:** **PROPOSED (Target Phase 3 PRD Gate)**
- Enforce 90-day statutory countdown timer and District Collectorate stamping alert under Section 18 of the Indian Stamp Act, 1899 for any transaction involving powers of attorney executed abroad.

---

## 5. Unapproved Technology, Vendor & Provider Register

The following specific entities and mechanisms are **EXPLICITLY UNAPPROVED** and remain purely research hypotheses:

| Category | Unapproved Proposal / Entity | Current Status | Required Gate for Consideration |
| :--- | :--- | :--- | :--- |
| **Banking / Escrow** | Specific Commercial Bank (e.g., ICICI / HDFC / Axis Nodal Escrow) | `UNAPPROVED` | Comprehensive regulatory, custody, fee, and legal review (Q01). |
| **Banking / Escrow** | Specific Fintech Escrow PA (e.g., Razorpay / Cashfree Escrow) | `UNAPPROVED` | Comprehensive regulatory, custody, fee, and legal review (Q01). |
| **Network** | Arbitrum One / Arbitrum Orbit (Production Mainnet) | `DEFERRED / UNAPPROVED` | Production network evaluation & justification (Q02). |
| **Network** | Polygon PoS / Polygon zkEVM (Production Mainnet) | `DEFERRED / UNAPPROVED` | Production network evaluation & justification (Q02). |
| **Network** | Base L2 (Production Mainnet) | `DEFERRED / UNAPPROVED` | Production network evaluation & justification (Q02). |
| **Identity / KYC** | Specific DigiLocker ASP / AUA-KUA Partner | `UNAPPROVED` | Formal privacy, security, and DPDP Act review (Q04). |
| **Government** | Direct Machine-to-Machine NIC REST Gateway | `UNAPPROVED / BLOCKED` | Official bilateral Government MoU / Sandbox authorization (Q03). |
| **Operations** | Live Financial INR Transactions | `STRICTLY PROHIBITED` | Project Owner explicit sign-off post-licensing/banking partnership. |