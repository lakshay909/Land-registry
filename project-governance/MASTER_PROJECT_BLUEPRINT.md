# MASTER PROJECT BLUEPRINT
# Bhūmi Ledger — India Land Transaction & Registry Platform

**Document Version:** 1.0.0  
**Status:** Active Governance Baseline  
**Authority:** Chief AI Engineering Orchestrator  
**Approved Scope:** Phase 0 (Baseline & Governance) & Phase 1 (Domain Research)  
**Primary Launch Jurisdiction:** Uttar Pradesh, India (Architecture: Multi-State Extensible)

---

## 1. Executive Mission & Vision

Bhūmi Ledger is an institutional-grade, legally grounded, decentralized land transaction, record discovery, and conveyance platform for India.

Traditional Indian land transactions are burdened by paper forgery, benami dealings, duplicate deed sales, opaque revenue mutations (Dakhil-Kharij), and uncoordinated state registries. Bhūmi Ledger provides:
1. **Radical Auditability**: Cryptographic title deed commitments and immutable on-chain ownership event history.
2. **Consensual Conveyance**: Multi-party digital validation (EIP-712 structured data and statutory registration alignment).
3. **Financial Protection**: Legally compliant escrow settlement frameworks separating buyer funds from unverified title transfers.
4. **Institutional Alignment**: Full awareness of statutory revenue procedures (Revenue Code 2006, Registration Act 1908, IT Act 2000).

---

## 2. Operating Principles & Engineering Tenets

1. **Evidence-Driven Engineering**: No feature shall be implemented on assumptions. Every workflow must cite official central/state statutes, gazettes, or verified integration contracts.
2. **Strict Codebase Preservation**: Pre-existing working code across `contracts/`, `backend/`, and `frontend/` must be preserved. No destructive resets, force-pushes, or unapproved architectural refactorings.
3. **Checks-Effects-Interactions (CEI) & Least Privilege**: Smart contracts and backend APIs must enforce rigorous role-based access control (RBAC), reentrancy prevention, and input sanitization.
4. **Cryptographic Identity vs. Statutory Identity**: Clearly distinguish between:
   - Web3 wallet addresses (`msg.sender` / EIP-712 signers).
   - Official government identities (Aadhaar / DigiLocker / PAN).
   - Statutory Revenue Authorities (Tehsildars / Sub-Registrars / District Magistrates).
   *A cryptographic keypair does not confer statutory legal authority without official jurisdictional gazetting.*
5. **Decoupled Multi-State Architecture**: Universal platform logic must remain decoupled from state-specific land revenue codes, stamp acts, circle rates, and forms.

---

## 3. Geographic Phasing: Uttar Pradesh First

### 3.1 Pilot Jurisdiction
- **Target State:** **Uttar Pradesh (UP)**.
- **Statutory Frameworks:**
  - *Uttar Pradesh Revenue Code, 2006* (governing Khatauni, tenure rights, agricultural restrictions, and Dakhil-Kharij).
  - *Registration Act, 1908* (governing deed registration at the Sub-Registrar Office / SRO).
  - *Indian Stamp Act, 1899* & *UP Stamp (Valuation of Property) Rules, 1997* (governing circle rates and stamp duty).
- **Primary Government Digital Systems:**
  - **Bhulekh UP** (`upbhulekh.gov.in`): Land records, Khatauni (RoR), 16-digit unique land parcel identification.
  - **BhuNaksha UP** (`upbhunaksha.gov.in`): Digital cadastral maps and parcel boundary demarcation.
  - **IGRSUP** (`igrsup.gov.in`): Integrated Grievance & Registration System (Stamp & Registration, e-Nibandhan).
  - **Vaad / RCSC UP** (`vaad.up.nic.in`): Revenue Court Status System for encumbrance and litigation tracking.

### 3.2 Multi-State Extensibility
- **State Selector Component**: Global UI dropdown permitting state selection across India.
- **Readiness Classification**:
  - `Uttar Pradesh`: **Research Verified / Architectural Pilot**.
  - `Other States (35+ States & UTs)`: Displayed as **Coming Soon** with optional notification interest capture.
- **Granular Feature Readiness Model**:
  Every feature per state is tagged with one of:
  - `Not researched`
  - `Research in progress`
  - `Research verified`
  - `Legal review required`
  - `Integration unavailable`
  - `Integration verified`
  - `Product ready`
  - `Enabled`
  - `Coming Soon`
  - `Blocked`

---

## 4. Product Boundaries & What Bhūmi Ledger Is Not

| Permitted / Intended Scope | Strictly Out of Scope / Prohibited |
| :--- | :--- |
| Verified digital title deed hash tracking on-chain | Storing unencrypted personal KYC or confidential deed PDFs on public EVM |
| EIP-712 structured cryptographic agreement between buyer & seller | Claiming private digital signatures replace statutory Sub-Registrar deed registration |
| Direct buyer-seller discovery and transparent listing | Unlicensed brokerage or unregistered commercial property syndication |
| Official circle rate data comparison & guidance | Providing definitive, speculative, or legally binding market valuations |
| Legal escrow mechanisms complying with RBI / Indian banking norms | Arbitrary cryptocurrency escrow for domestic fiat real estate settlement without regulatory clearance |
| Permitted tehsil facilitator tracking & accountability | Impersonating or delegating statutory powers of Tehsildars / Patwaris |

---

## 5. Decision-Making & Governance Protocol

- **Project Owner (User)**: Retains ultimate decision authority on product scope, legal risk acceptance, external budget, regulatory integrations, and production deployments.
- **Chief AI Engineering Orchestrator**: Manages cross-department dependencies, delegates research, maintains registers, enforces quality, and prepares consolidated decision packages.
- **Department Heads**: Oversee Domain, Legal, Integration, Product, Architecture, Engineering, Security, and QA disciplines.
- **Feature Leads**: Drive feature dossiers from F01 through F17 without code alteration during research phases.
