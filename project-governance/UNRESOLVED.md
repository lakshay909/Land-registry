# UNRESOLVED QUESTIONS & BLOCKERS REGISTER
# Bhūmi Ledger — India Land Transaction & Registry Platform

**Document Version:** 3.0.0  
**Status:** Active Tracking of Decisions, Conditions, and Unapproved Proposals  
**Last Updated:** October 31, 2026 (Post-Phase 1 Determinations)  

---

## 1. Material Decisions Requiring Project Owner Escalation

| Q-ID | Domain | Subject | Current Status & Conditions | Next Milestone / Trigger |
| :--- | :--- | :--- | :--- | :--- |
| **Q-01** | Payments & Settlement | **Production Escrow Model** | `APPROVED WITH CONDITIONS (Alt A - Dual Rail)`: EVM escrow retained for local/testnet; INR settlement adapter designed off-chain. Nodal banking escrow is **NOT assumed** to be available. Requires comprehensive regulatory model research (RBI/PA), provider eligibility, custody responsibility, payment flows, fees, and contractual terms. **Zero live financial transactions permitted.** | Phase 4 Architecture & Settlement Gate |
| **Q-02** | Target Blockchain | **Production Network Designation** | `APPROVED IN PRINCIPLE (Chain-Agnostic EVM)`: Strict portability retained. Local Hardhat (31337) active; testnets for validation only. Production network selection **DEFERRED & UNAPPROVED**. Must compare public EVMs, permissioned consortiums, and conventional DB alternatives. Mandatory documented justification required before introducing blockchain into any feature. | Phase 4 Architecture Gate |
| **Q-03** | Government Integration | **Government Portal Data Access** | `APPROVED WITH CONDITIONS (Assisted Citizen Workflow)`: Ingest user-provided certified digital documents; extract metadata/provenance; track verification lifecycle; Keccak-256 hashes for tamper detection. **Shall NOT claim hash proves government authenticity or legal title.** Scraping, CAPTCHA bypass, and unauthorized access **strictly prohibited**. Retain modular interfaces for future authorized NIC APIs. | Phase 3 PRD Gate |
| **Q-04** | Identity & Access | **Identity & KYC Architecture** | `APPROVED IN PRINCIPLE (Layered Architecture)`: Separate account, wallet, government, signing, and ownership identities. Minimize PII; **do NOT store Aadhaar or sensitive identity data by default**. Investigate authorized DigiLocker channels. Provider integration and sensitive data storage **BLOCKED pending legal/privacy/security review**. | Phase 3 PRD Scope Gate |
| **Q-05** | Marketplace Compliance | **Marketplace Scope & RERA Applicability** | `NOT APPROVED AS LEGAL EXEMPTION`: Proposed MVP scope retains standalone rural agricultural/ancestral resale plots. Must investigate RERA applicability based on property classification and platform facilitation activity (Section 2(zm) Real Estate Agent definition). **Mandatory qualified legal review required before activating marketplace workflows.** | Phase 2 Legal Review & Phase 3 Scope Gate |

---

## 2. Unapproved Technology, Provider & Integration Proposals

The following proposals are currently **UNAPPROVED** and cannot be assumed or implemented without explicit future authorization:

1. **Specific Banking / Escrow Partners:**
   - *ICICI Bank / HDFC Bank / Axis Bank Nodal Account:* Unapproved hypothesis.
   - *Razorpay / Cashfree Escrow Payment Aggregator:* Unapproved hypothesis.
   - *Mandate:* Conduct independent legal and operational review of RBI guidelines for payment aggregators and nodal escrow accounts before proposing any specific entity.
2. **Specific Identity Providers:**
   - *DigiLocker ASP (e.g. Setu, Signzy, Karza):* Unapproved hypothesis.
   - *Direct UIDAI AUA/KUA Connection:* Unapproved; requires high capital and compliance infrastructure.
   - *Mandate:* Establish zero-PII or tokenized verification pattern compliant with DPDP Act, 2023.
3. **Production Blockchain Networks:**
   - *Polygon (PoS / zkEVM), Arbitrum (One / Orbit), Base:* Unapproved for production.
   - *NIC National Blockchain Framework (NBF):* Unapproved for production.
   - *Mandate:* Compare objectively with conventional signed audit-log database models before designating any production ledger.
4. **Direct Government Machine-to-Machine Integration:**
   - *NIC UP Bhulekh / IGRSUP REST API Gateway:* Unapproved / Non-existent without bilateral State Government MoU.
   - *Mandate:* Maintain pure Assisted Citizen Workflow for MVP.

---

## 3. Active Legal & Architectural Investigations (Assigned to Specialist Teams)

- **INV-LEG-01 (RERA Marketplace Applicability):** Independent legal investigation into whether platform marketplace functionality (listing, matching, escrow facilitation, transaction fee models) constitutes acting as a "Real Estate Agent" under Section 2(zm) and Section 9 of the RERA Act, 2016, regardless of property type.
- **INV-LEG-02 (Regulatory Escrow Model):** Legal and regulatory study of RBI Master Directions on Payment Aggregators (DPSS.CO.PD.No.1810/02.14.008/2019-20) and Escrow mechanisms for real estate transactions.
- **INV-ARCH-01 (Blockchain vs. Signed Audit-Log):** Architectural Head formal comparison between blockchain-based anchoring and a conventional database + cryptographically signed append-only audit log (e.g., PostgreSQL + PostGIS + Sigstore/Trillian Merkle tree) for land transaction workflows.
- **INV-SEC-01 (Zero-PII Identity Architecture):** Security and privacy architecture ensuring zero storage of Aadhaar numbers or unmasked government credentials, complying strictly with Section 29 of Aadhaar Act and DPDP Act, 2023.