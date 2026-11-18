# UPDATED PHASE 5 IMPLEMENTATION PLAN (CORE UP-FIRST MVP)
# Bhūmi Ledger — India Land Transaction & Registry Platform

**Document Version:** 1.0.0  
**Phase:** Phase 4.1 (Autonomous Validation & Phase 5 Readiness)  
**Authors:** Chief AI Engineering Orchestrator, Department Head of Engineering (DH-Eng), Department Head of Architecture (DH-Arch), Lead QA Engineer  
**Status:** Approved for Project Owner Phase 5 Authorization Gate  
**Execution Target:** Controlled Incremental Phase 5 Sprints (Gated)  

---

## 1. Executive Summary & Implementation Governance

This plan translates the canonical specifications into an **actionable, file-bounded engineering roadmap**.

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                              PHASE 5 EXECUTION RESTRICTIONS                            │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ 1. Phase 5 implementation begins ONLY upon explicit Project Owner authorization.       │
│ 2. Smart contracts remain FROZEN: `contracts/LandRegistry.sol` is NOT rewritten.       │
│ 3. ZERO live fiat money movement: Direct citizen banking instructions & Form 141 only. │
│ 4. ZERO collection or storage of Aadhaar numbers: Masking filter enforced.             │
│ 5. Marketplace buyer-seller matching remains GATED pending external RERA legal opinion.│
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Feature-by-Feature Implementation Specifications

### Feature 1: UP Parcel Ingestion & Document Verification (PKG-01 / PRD-01)
- **Agent Owner:** Lead Backend Engineer & Data Sourcing Specialist (DH-Eng / DH-Govt).
- **File Change Boundaries:**
  - Create: `backend/services/pdfParserService.js`
  - Create: `backend/services/hashService.js`
  - Create: `frontend/src/components/DocumentUploadModal.jsx`
  - Modify: `backend/routes/documents.js`
  - Modify: `backend/db.js` (Add `CITIZEN_SALT_VAULT` table)
  - Modify: `frontend/src/pages/PublicSearch.jsx` (Add 16-digit Gata Code display & ULPIN badge)
- **Security Checks:**
  - Sniff magic bytes `%PDF-` at offset 0.
  - Enforce 10 MB limit.
  - Fail-closed ClamAV virus scan.
  - Client-side SHA-256 + Server-side 256-bit CSPRNG salted Keccak-256 commitment hash.
  - Redact accidental 12-digit Aadhaar patterns before saving.
- **Acceptance Criteria:** AC-01.1 & AC-01.2 in [`FEATURE_ACCEPTANCE_CRITERIA.md`](file:///Users/lakshay/Desktop/Projects/Land-registry/Docs/prds/FEATURE_ACCEPTANCE_CRITERIA.md#L1-L28).
- **Regression Test Suite:** `backend/test/ingestion.test.js` (8 unit tests asserting PDF parsing, stale date rejection, and magic byte failure).

---

### Feature 2: Statutory Circle Rate Valuation & Stamp Duty Calculator (PKG-02 / PRD-02)
- **Agent Owner:** Lead Backend Engineer & Legal Analyst (DH-Eng / DH-Legal).
- **File Change Boundaries:**
  - Create: `backend/services/valuationService.js`
  - Create: `backend/test/valuation.test.js`
  - Create: `frontend/src/components/ValuationBreakdown.jsx`
  - Create: `frontend/src/pages/ValuationCalculator.jsx`
  - Modify: `backend/server.js` (Mount `/api/valuation`)
  - Modify: `frontend/src/App.jsx` (Add `/valuation` route)
- **Statutory Rules Implemented:**
  - Base Stamp Duty: 5.0% (Indian Stamp Act 1899, UP Sched 1-B, Art 23).
  - Local Body Surcharge: 2.0% (UP Municipalities Act Sec 172 / UP Urban Planning Act Sec 38-A).
  - Female Concession: 1.0% statutory rebate (net 6.0% in urban areas) under UP Govt Order 1383/97. Pro-rata rebate for joint ownership.
  - Road Multipliers: +15% State Highway, +20% National Highway, +10% corner plot (UP Stamp Valuation Rules 1997, Rule 5).
  - Section 47A Undervaluation Warning: Triggers if price < circle rate valuation.
- **Acceptance Criteria:** AC-02.1 & AC-02.2.
- **Regression Test Suite:** `backend/test/valuation.test.js` (Asserting the 4 worked calculation scenarios).

---

### Feature 3: Non-Custodial Direct Tax Schedule Engine (PKG-05 / PRD-03)
- **Agent Owner:** Senior Backend Engineer & Tax Specialist (DH-Eng / DH-Legal).
- **File Change Boundaries:**
  - Create: `backend/services/taxService.js`
  - Create: `backend/services/form141Generator.js`
  - Create: `backend/test/tax.test.js`
  - Create: `frontend/src/components/PaymentScheduleModal.jsx`
  - Modify: `backend/routes/transfers.js`
  - Modify: `frontend/src/components/InitiateTransferModal.jsx`
- **Statutory Rules Implemented:**
  - 1% TDS calculated if consideration $\ge ₹50,00,000$ under Section 393(1) of Income-tax Act, 2025.
  - Rural agricultural land outside municipal limits is statutorily exempt (TDS = ₹0).
  - Produces downloadable pre-filled Form 141 (Schedule B) draft with PAN masking (`ABCDE****F`).
  - ZERO live banking calls; draft assistance only.
- **Acceptance Criteria:** AC-05.1 & AC-05.2.
- **Regression Test Suite:** `backend/test/tax.test.js` (Threshold and exemption edge cases).

---

### Feature 4: Mutation Notice SLA & Dispute Advisory Tracker (PKG-03 / PRD-04)
- **Agent Owner:** Lead Backend Engineer & Revenue Admin Specialist (DH-Eng / DH-Domain).
- **File Change Boundaries:**
  - Create: `backend/services/mutationService.js`
  - Create: `frontend/src/components/MutationSlaWidget.jsx`
  - Create: `frontend/src/components/LitigationAdvisoryBadge.jsx`
  - Modify: `backend/routes/transfers.js`
  - Modify: `frontend/src/pages/AuthorityDashboard.jsx`
- **Statutory Rules Implemented:**
  - Enforces mandatory 30-day public objection countdown under Rule 34(1) of UP Revenue Code Rules, 2016.
  - Tracks 45-day undisputed and 90-day disputed case disposal SLAs under Rule 34(7).
  - 6-Tier Litigation Taxonomy: Distinguishes `COURT_INJUNCTION` (locks transfers) from `LIS_PENDENS` (advisory only) and `INTERNAL_PLATFORM_WARNING`.
- **Acceptance Criteria:** AC-03.1 & AC-03.2.
- **Regression Test Suite:** Asserting API blocks premature mutation approval before Day 30.

---

### Feature 5: Multi-State Config & State Selector (PKG-09 / PRD-05)
- **Agent Owner:** Lead Frontend Engineer & Lead Architect (DH-Frontend / DH-Arch).
- **File Change Boundaries:**
  - Create: `frontend/src/config/up.config.json`
  - Create: `frontend/src/config/central.config.json`
  - Create: `frontend/src/context/StateContext.jsx`
  - Create: `frontend/src/components/StateSelector.jsx`
  - Create: `frontend/src/components/ComingSoonModal.jsx`
  - Modify: `frontend/src/App.jsx`
- **Acceptance Criteria:** AC-08.1.
- **Regression Test Suite:** UI test asserting "Uttar Pradesh" loads by default; selecting "Karnataka" triggers "Coming Soon" opt-in modal.

---

### Feature 6: Consular NRI 90-Day PoA Stamping Countdown (PKG-08)
- **Agent Owner:** Frontend Engineer & Legal Analyst (DH-Frontend / DH-Legal).
- **File Change Boundaries:**
  - Create: `frontend/src/components/NriPoAWidget.jsx`
  - Modify: `frontend/src/components/InitiateTransferModal.jsx`
  - Modify: `backend/routes/transfers.js`
- **Statutory Rules Implemented:**
  - Tracks 90-day statutory stamping deadline under Section 18 of the Indian Stamp Act, 1899.
  - Bounded strictly to instruments executed abroad; in-person executions bypass widget.
- **Acceptance Criteria:** AC-07.1.

---

## 3. Rollback Strategy & Git Checkpoint Discipline

To guarantee zero corruption of the codebase, every sprint enforces a strict Git checkpoint protocol:

```bash
# 1. Before each sprint, tag working state
git tag -a checkpoint-sprint-pre-<N> -m "Stable baseline prior to Sprint <N>"

# 2. If any test fails or regression occurs, execute instant rollback
git checkout HEAD -- <modified_files>
git clean -fd <new_untracked_sprint_files>

# 3. Verify clean baseline restores 85/85 passing tests
npx hardhat test && cd backend && npm test
```

---
*End of Updated Phase 5 Implementation Plan.*