# PKG-02: ACCEPTANCE TEST MATRIX & VERIFICATION SPECIFICATION (RECONCILED)
**Bhūmi Ledger — Sovereign Land Conveyance & Registry Engine**  
**Document Reference:** `PKG02_ACCEPTANCE_TEST_MATRIX.md`  
**Phase:** Phase 5 Sprint 3 (PKG-02: Circle Rate Valuation & Stamp Duty Calculator)  
**Author:** QA & Test Engineering Specialist, Bhūmi Ledger  
**Reviewed by:** Chief AI Engineering Orchestrator, System Architect, Product & Legal Specialist  
**Status:** **APPROVED RECONCILED ACCEPTANCE CRITERIA (PRE-IMPLEMENTATION GATE)**  
**Target Milestone:** Milestone 5.8 / Sprint 3  
**Date:** November 1, 2026  

---

## 1. Quality Strategy & Acceptance Baseline

This acceptance test matrix establishes the automated verification baseline for **PKG-02 (Circle Rate Valuation & Stamp Duty Calculator)** following the rigorous statutory and mathematical reconciliation.

### Reconciled Testing Principles:
1. **Mathematical Exactness (First Principles):** Verification of land calculations with zero unverified universal multipliers, Rule 5 tripartite construction branches (non-commercial, single-unit commercial, multi-unit complexes), and zero synthetic age depreciation deductions.
2. **Statutory Planning Jurisdiction Verification:** Enforcing enabling legislation for local body surcharges, Section 39(1) baseline (2%) with dynamic gazetted enhancement (up to 5%), Section 39(5) statutory cesser/repugnancy clause, and actual geographic cadastral boundary scope under Section 39(1).
3. **Strict Tax Exemption Construction for Female Buyers:** Enforcing the 1% rebate up to ₹1 Crore (max ₹1,00,000 benefit) for sole female buyers, and applying ₹0.00 automated rebate + `CONCESSION_CONDITIONAL_MANUAL_VERIFICATION` flag for joint male-female buyers under the *Dilip Kumar* strict tax interpretation doctrine.
4. **January 8, 2026 Family Gift Deed Concession:** Enforcing flat **₹5,000** stamp duty cap, ₹1,000 fee, ₹20,000 capped registration fee, 5-year lock-in restriction, natural-person exclusivity, and commercial/industrial scope expansion.
5. **2020 Registration Fee Law:** Enforcing the flat 1.0% uncapped registration fee with a ₹100 floor for standard conveyances.
6. **Strict Fail-Closed Data Integrity:** Verifying that unverified, missing, or expired circle rate schedules reject with HTTP 422 `STATUS_RATE_UNAVAILABLE`.
7. **Zero Regression:** Guaranteeing that all 160 pre-existing baseline checks continue to pass 100% green without modification.

---

## 2. Comprehensive Acceptance Test Matrix (40 Test Specifications)

### Category 1: Road Width Exact Boundary Tests (TC-ROAD-001 to TC-ROAD-004)

| Test ID | Scenario Description | Inputs (Area, Rate, Road Width) | Schedule Lookup & Multiplier Invariant | Expected Valuation | Severity |
|:---|:---|:---|:---|:---|:---|
| **TC-ROAD-001** | Sub-9m Boundary ($W = 8.99\text{m}$) | Area: $200\text{m}^2$, Base Rate: ₹$25,000/\text{m}^2$, $W = 8.99\text{m}$ | Standard Rate Tier (Multiplier $\equiv 1.00\times$) | $200 \times 25,000 \times 1.00 =$ **₹50,00,000** | Blocker |
| **TC-ROAD-002** | Exact $9.0\text{m}$ Boundary | Area: $200\text{m}^2$, Base Rate: ₹$25,000/\text{m}^2$, $W = 9.00\text{m}$ | If separate road tier gazetted: uses tier rate; otherwise standard $1.00\times$ | Tested against schedule rate line lookup | Blocker |
| **TC-ROAD-003** | Exact $18.0\text{m}$ Boundary | Area: $200\text{m}^2$, Base Rate: ₹$25,000/\text{m}^2$, $W = 18.00\text{m}$ | Upper boundary of Tier 2; verifies exact boundary evaluation | Tested against schedule rate line lookup | Blocker |
| **TC-ROAD-004** | Highway Boundary ($W = 18.01\text{m}$) | Area: $200\text{m}^2$, Base Rate: ₹$25,000/\text{m}^2$, $W = 18.01\text{m}$ | Resolves Tier 3 Highway rate if gazetted; no synthetic guessing | Tested against schedule rate line lookup | Blocker |

---

### Category 2: Planning Jurisdictions & Authority-Specific Surcharges (TC-JUR-005 to TC-JUR-008, TC-JUR-034 to TC-JUR-036, TC-AUTH-041 to TC-AUTH-044)

| Test ID | Scenario Description | Jurisdictional Configuration | Statutory Authority | Surcharge Rate & Statutory Rule | Severity |
|:---|:---|:---|:---|:---|:---|
| **TC-JUR-005** | Development Authority Area (LDA) | Parcel in Lucknow Development Authority limits | Sec 39(1), UP Urban Planning Act, 1973 | **+2.0% Baseline Surcharge** | Blocker |
| **TC-JUR-006** | Rural Gram Panchayat Area | Parcel in Barabanki rural revenue village | Outside urban authority boundaries | **0.0% Surcharge (Outside Notified Area)** | Blocker |
| **TC-JUR-007** | Municipal Board Sec 128-A Status | Case A: Municipality with approved Sec 128-A tax<br>Case B: Standard Municipality without tax resolution | Sec 128-A, UP Municipalities Act, 1916 | Case A: **+2.0% Notified Tax**<br>Case B: **0.0% Additional Duty** | Critical |
| **TC-JUR-008** | Avas Vikas + Overlapping DA | Property in Housing Scheme within LDA development area | Sec 62 UPAVP Act & Sec 39(5) UP Planning Act | **Strict Max 2.0%** (Cesser clause: municipal/parishad levies yield) | Blocker |
| **TC-JUR-034** | Enhanced Section 39 Rate Test | Schedule with officially gazetted enhanced rate (e.g. 3.0% / 0.03 or 4.0% / 0.04 up to 5.0% / 0.05) | Sec 39(1) Proviso, UP Act 30 of 1974 | Engine dynamically accepts gazetted rate; confirms database constraint allows $\le 0.05$ | Blocker |
| **TC-JUR-035** | Section 39(5) Repugnancy & Anti-Stacking Test | Parcel falling in overlapping Development Authority & Municipal Corporation limits | Sec 39(5) cesser clause | Conflicting Municipal tax ceases to have effect; only Section 39 surcharge is computed | Blocker |
| **TC-JUR-036** | Development Area Boundary vs. Agricultural Status | Agricultural parcel situated inside LDA master plan limits | Sec 39(1) territorial scope | Attracts 2% Section 39 surcharge regardless of Khatauni agricultural classification | Blocker |
| **TC-AUTH-041** | NOIDA / GNIDA Section 11-B Invariant | Industrial Development Authority (NOIDA Sector 62) | Sec 11-B, UP Industrial Area Development Act, 1976 | **2.0% Strictly Fixed Surcharge**; enhancement beyond 2% legally barred | Blocker |
| **TC-AUTH-042** | NOIDA Art 243-Q Municipal Immunity | NOIDA commercial parcel evaluated against municipal tax rules | Proviso to Art 243Q(1), Constitution of India | Rejects municipal transfer tax imposition; Section 39 does NOT apply | Blocker |
| **TC-AUTH-043** | SADA Boundary & Enhancement | Special Area Development Authority (e.g. Shaktinagar SADA) | Sec 34, UP Special Area Development Authorities Act, 1986 | **2.0% baseline**; dynamic acceptance up to 5.0% upon Gazette verification | Critical |
| **TC-AUTH-044** | UPAVP Standalone Scheme | Housing board parcel situated outside any Development Authority | Sec 62, UP Avas Vikas Act, 1965 | **2.0% Surcharge** (Standalone Parishad levy operative) | Critical |

---

### Category 3: Female Concession Tiers & Strict Joint Treatment (TC-FEM-009 to TC-FEM-012, TC-FEM-039, TC-FEM-045)

| Test ID | Scenario Description | Valuation & Buyer Context | Statutory Rule (Notification 462/2006 as amended) | Duty Calculation Output | Severity |
|:---|:---|:---|:---|:---|:---|
| **TC-FEM-009** | Sole Female Buyer $\le$ ₹1 Crore | Dutiable Val: ₹$60,00,000$, Urban DA, Sole Female | 1% rebate in full (Max ₹1L cap) | Base: $4\%$, Surcharge: $2\% \implies$ **6.0% (₹3,60,000)** | Blocker |
| **TC-FEM-010** | Sole Female Buyer $>$ ₹1 Crore | Dutiable Val: ₹$1,50,00,000$ (₹1.50 Cr), Urban DA | Rebate capped at flat ₹1,00,000; excess at 5% | Standard: $7.5\text{L} - 1.0\text{L} + 3.0\text{L} \implies$ **₹9,50,000** | Blocker |
| **TC-FEM-011** | All-Female Joint Buyers | Dutiable Val: ₹$80,00,000$, Mother & Daughter | 1% rebate in full (all purchasers female) | Rebate: $80,000 \implies$ Net Base: **₹3,20,000** | Critical |
| **TC-FEM-012** | Joint (Male + Female) Buyers (Unspecified Shares) | Dutiable Val: ₹$50,00,000$, Joint M+F (No deed share specified) | Notification 1504 (6 July 2006) & *Dilip Kumar* | Automated Rebate: **₹0.00**; Emits `CONCESSION_CONDITIONAL` flag | Blocker |
| **TC-FEM-039** | Joint Male-Female Manual Verification Flag | Joint Male-Female conveyance deed inputs | Section 31/47-A SRO adjudication requirement | Zero automated concession; flags `CONCESSION_CONDITIONAL_MANUAL_VERIFICATION` | Blocker |
| **TC-FEM-045** | Joint Male-Female With Explicit Shares Specified | Joint M+F with declared female share (e.g. 50%) | Notification 1504 & *Dilip Kumar* strictness | Zero online deduction; emits `CONCESSION_CONDITIONAL_MANUAL_VERIFICATION` | Blocker |

---

### Category 4: Rule 5 Construction Categories & Commercial Card Rates (TC-CONST-013 to TC-CONST-016, TC-CONST-040)

| Test ID | Scenario Description | Property Structure & Category | Rule 5 Valuation Formulation | Expected Valuation Output | Severity |
|:---|:---|:---|:---|:---|:---|
| **TC-CONST-013** | Non-Commercial Residential Building | Land $150\text{m}^2$ @ 20k + Covered $120\text{m}^2$ @ 12k | Rule 5(1)(b): Land value + (Covered Area $\times R_{\text{const}}$) | Land: $30\text{L} +$ Const: $14.4\text{L} =$ **₹44,40,000** | Critical |
| **TC-CONST-014** | Commercial Single-Unit Building | Land $100\text{m}^2$ @ 50k + Shop $80\text{m}^2$ @ 25k, Age: 25y | Rule 5(1)(c): Card rate applied; zero synthetic depreciation | Land: $50\text{L} +$ Const: $20\text{L} =$ **₹70,00,000** | Blocker |
| **TC-CONST-015** | Commercial Multi-Unit Complex / Shop | Unit in Commercial Mall, Carpet Area: $60\text{m}^2$ | Rule 5(1)(d): $\text{Carpet Area} \times \text{Collector Carpet Rate}$ | Carpet valuation: $60 \times 80,000 =$ **₹48,00,000** | Blocker |
| **TC-CONST-016** | Floor Coefficients Deactivation | Multi-storey structure: Basement, GF, 1F, 2F | Verified no automated 0.7x/0.9x/0.8x discounts | Assessed at uniform card rate unless gazetted | Major |
| **TC-CONST-040** | Rule 5 Tripartite Structure Valuation Check | Non-commercial vs single-unit vs multi-unit execution | UP Stamp Valuation Rules 1997, Rule 5(1)(b), (c), (d) | Verifies distinct formula branches with zero synthetic depreciation | Blocker |

---

### Category 5: Section 47-A Dutiable Base Assessment (TC-BASE-017 to TC-BASE-018)

| Test ID | Scenario Description | Inputs (Circle Val, Agreed Consideration) | Formula & Governing Law | Expected Dutiable Base | Severity |
|:---|:---|:---|:---|:---|:---|
| **TC-BASE-017** | Declared Consideration $>$ Circle Value | Circle Val: ₹$50,00,000$<br>Declared Consideration: ₹$75,00,000$ | $V_{\text{dutiable}} = \max(50\text{L}, 75\text{L}) = 75\text{L}$ (Sec 47-A) | Dutiable Base: **₹75,00,000** (Consideration governs) | Blocker |
| **TC-BASE-018** | Circle Value $>$ Declared Consideration | Circle Val: ₹$60,00,000$<br>Declared Consideration: ₹$40,00,000$ | $V_{\text{dutiable}} = \max(60\text{L}, 40\text{L}) = 60\text{L}$ (Sec 47-A) | Dutiable Base: **₹60,00,000** (Circle rate floor overrides) | Blocker |

---

### Category 6: 2020 Registration Fee Law & Family Gift Deeds (TC-REG-019 to TC-REG-022, TC-GIFT-037 to TC-GIFT-038)

| Test ID | Scenario Description | Document Type & Valuation | Statutory Enactment & Fee Formula | Expected Fee Output | Severity |
|:---|:---|:---|:---|:---|:---|
| **TC-REG-019** | Standard Conveyance ($\le$ ₹10 Lakhs) | Sale Deed: ₹$8,00,000$ | $1\%$ of $8,00,000 = ₹8,000 \ge ₹100$ | Reg Fee: **₹8,000** | Blocker |
| **TC-REG-020** | Standard Conveyance High-Value (Historical Cap Test) | Sale Deed: ₹$5,00,00,000$ (₹5 Crores) | $1\%$ of ₹5 Cr (Uncapped under 2020 Amendment) | Reg Fee: **₹5,00,000** (Assert $\neq ₹20,000$) | Blocker |
| **TC-REG-021** | Concessional Family Gift Deed | Blood Gift Deed: ₹$2,00,00,000$ (Father to Son) | Notification 01/2026/26/XCIV-2-2026-700(29)-2021 | Stamp Duty: **Flat ₹5,000**; Reg Fee: **Capped at ₹20,000** | Blocker |
| **TC-REG-022** | Statutory Minimum Floor | Small easement deed: ₹$5,000$ | $\max(5,000 \times 0.01, ₹100) \implies \max(50, 100)$ | Reg Fee: **₹100** (Statutory Floor) | Major |
| **TC-GIFT-037** | Jan 8, 2026 Commercial Family Gift Deed | Commercial property ₹2 Crore gifted from mother to daughter | Notification 01/2026/26/XCIV-2-2026-700(29)-2021 | Stamp Duty: **Flat ₹5,000**; Processing Fee: **₹1,000**; Reg Fee: **₹20,000** | Blocker |
| **TC-GIFT-038** | Family Gift Deed Ineligibility (Juristic/Cousin) | Gift deed from uncle to nephew, or involving Private Trust | Not on 12-relative roster / non-natural person | Fails-closed: assesses at standard 5% base + 1% uncapped reg fee | Blocker |

---

### Category 7: Fail-Closed Security & Input Validation (TC-SEC-023 to TC-SEC-029)

| Test ID | Scenario Description | Malformed / Edge Input | Expected Response | Failure Code | Severity |
|:---|:---|:---|:---|:---|:---|
| **TC-SEC-023** | Unindexed Village / Ward | Village: `UNKNOWN_VILLAGE_999` | **HTTP 422 Unprocessable** | `STATUS_RATE_UNAVAILABLE` | Blocker |
| **TC-SEC-024** | Expired Circle Rate Schedule | Schedule Date: `2021-01-01` (Lapsed $>365$ days) | **HTTP 422 Unprocessable** | `STATUS_RATE_UNAVAILABLE` | Blocker |
| **TC-SEC-025** | Negative or Zero Plot Area | Area: `-150.0` or `0.0` | **HTTP 400 Bad Request** | `INVALID_AREA` | Blocker |
| **TC-SEC-026** | Complex Multi-Unit Missing Carpet Area | Structure: `COMPLEX_MULTI_UNIT`, Carpet: `0.0` | **HTTP 400 Bad Request** | `INVALID_CARPET_AREA` | Blocker |
| **TC-SEC-027** | Invalid Planning Jurisdiction | Jurisdiction: `INVALID_SUB_DISTRICT` | **HTTP 400 Bad Request** | `INVALID_JURISDICTION` | Major |
| **TC-SEC-028** | Negative Declared Consideration | Consideration: `-500000` | **HTTP 400 Bad Request** | `INVALID_CONSIDERATION` | Major |
| **TC-SEC-029** | Excessive Land Holding Warning | Agricultural Land: $> 5.0586\text{ Hectares}$ | **200 OK + Warning Flag** | `CEILING_LIMIT_EXCEEDED` | Major |

---

### Category 8: Non-Repudiable Cryptographic Receipts (TC-CRYPTO-030 to TC-CRYPTO-033)

| Test ID | Scenario Description | Action & Verification | Mathematical Expectation | Severity |
|:---|:---|:---|:---|:---|
| **TC-CRYPTO-030** | Deterministic `valuationHash` Generation | Calculate valid valuation for Chinhat Gata | Valid 32-byte hex (`^0x[a-f0-9]{64}$`), canonical RFC 8785 sorting | Blocker |
| **TC-CRYPTO-031** | Avalanche Effect on Surcharge Variation | Change jurisdiction from `DEVELOPMENT_AUTHORITY` to `RURAL` | $H(P) \neq H(P')$, Hamming distance $D_H \ge 100\text{ bits}$ | Blocker |
| **TC-CRYPTO-032** | Avalanche Effect on Female Share Input | Change `femaleSharePercentage` from `50` to `51` | Complete digest divergence ($>120\text{ bits flipped}$) | Blocker |
| **TC-CRYPTO-033** | Zero-PII Audit Log Verification | Query `VALUATION_AUDIT_LOG` for committed record | Zero citizen names, zero Aadhaar, zero PAN; salted SHA-256 IP only | Blocker |

---

## 3. Test Harness Architecture & Ephemeral Execution

All 40 tests will be executed within `backend/test/valuation.test.js` using an isolated ephemeral SQLite database:

```javascript
// backend/test/valuation.test.js
const path = require('path');
const fs = require('fs');
const request = require('supertest');

const testDbPath = path.join(__dirname, 'test-valuation-ephemeral.sqlite');
process.env.DB_PATH = testDbPath;
if (fs.existsSync(testDbPath)) fs.unlinkSync(testDbPath);

const db = require('../db');
const app = require('../server');
```

---

## 4. Regression Gate Criteria (Sign-off Checkpoints)

| Gate ID | Checkpoint | Minimum Threshold | Status Check |
|:---|:---|:---|:---|
| **GATE-01** | **PKG-02 Acceptance Pass Rate** | **40 / 40 tests passing (100%)** | `npx jest backend/test/valuation.test.js` |
| **GATE-02** | **Existing Baseline Regression** | **160 / 160 existing tests passing (100%)** | Hardhat (57) + Backend Jest (80) + Frontend (22) + E2E (1) |
| **GATE-03** | **Total Repository Suite** | **$\ge 200$ tests passing** | Full continuous integration battery |
| **GATE-04** | **Static Analysis & Build** | **0 errors, 0 warnings** | `npm run build --prefix frontend` && `oxlint` |

*Reconciled acceptance test matrix approved for PKG-02 implementation planning.*
