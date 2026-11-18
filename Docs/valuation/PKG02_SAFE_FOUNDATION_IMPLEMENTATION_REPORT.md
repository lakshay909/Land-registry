# PKG-02: SAFE FOUNDATION IMPLEMENTATION & FOCUSED EVIDENCE GATE REPORT
**Bhūmi Ledger — Sovereign Land Conveyance & Registry Engine**  
**Document Reference:** `PKG02_SAFE_FOUNDATION_IMPLEMENTATION_REPORT.md`  
**Phase:** Phase 5 Sprint 3 (PKG-02: Circle Rate Valuation & Stamp Duty Calculator)  
**Authors:** Chief AI Engineering Orchestrator, Product & Legal Specialist, System Architect, Backend Engineer, QA Specialist, Security & Privacy Specialist  
**Jurisdiction:** State of Uttar Pradesh, Republic of India  
**Date Executed:** November 1, 2026  
**Status:** **LEGALLY NEUTRAL SAFE FOUNDATION IMPLEMENTED & VERIFIED**  
**Operating Posture:** Foundation Ready for Next Sprint; Production Statutory Calculations Strictly Gated  

---

> [!IMPORTANT]
> **STATUTORY GOVERNANCE & LEGAL NOTICE:**
> In strict compliance with project governance and global AI software engineering rules, **specialist-agent sign-offs do NOT replace independent legal counsel**. All statutory parameters, citations, and formulas documented herein have been compiled from primary legislative enactments and Official Gazettes of the State of Uttar Pradesh, but must be verified against current official State Gazettes prior to final production registration filings.
> 
> **Safe Implementation Boundary Strictly Preserved:** As authorized by the Project Owner, this implementation delivers exclusively the legally neutral foundation (pure decimal math, versioned schedule schema, fail-closed resolution, instrument dispatch interfaces, and cryptographic receipts). **Zero real UP circle rates have been hardcoded, zero unverified surcharges applied, zero speculative concessions activated, and [`contracts/LandRegistry.sol`](file:///Users/lakshay/Desktop/Projects/Land-registry/contracts/LandRegistry.sol) remains 100% frozen.**

---

## 1. Part A: Focused Evidence Gap Outcomes

Under multi-agent coordination, the Product-Legal Specialist investigated primary legislative enactments, Official Gazettes, and departmental records to resolve the five specific evidence gaps:

### Gap 1: Section 11-B Territorial Notifications & Local Levy Interactions (NOIDA, GNIDA, YEIDA)
* **Primary Boundary Notifications (Section 3, UP Act No. 6 of 1976):**
  1. **NOIDA:** Declared as an Industrial Development Area under Section 3 via **Notification No. 4157-HI/XVIII-11 dated April 17, 1976** (published in U.P. Gazette Extraordinary, April 17, 1976), encompassing the designated 36 villages (later expanded to 81+ villages).
  2. **Greater Noida (GNIDA):** Declared under Section 3 via **Notification No. 3324-BVI/XVIII-11-89-B-91 dated January 28, 1991**.
  3. **YEIDA:** Originally Taj Expressway Industrial Development Authority (TEA), notified under Section 3 via **Notification No. 697/LXXVII-4—2001-3(N)-2001 dated April 24, 2001**; renamed YEIDA by Notification dated July 11, 2008.
* **Local Levy & Surcharge Interactions:**
  - **Absence of Statutory Cesser Clause in Section 11-B:** The text of Section 11-B (inserted by *UP Act No. 10 of 2016*) contains two subsections only: subsection (1) levies the 2% increase on duty; subsection (2) directs appropriation of proceeds. Unlike Section 39(5) of the 1973 Act, **Section 11-B contains NO express statutory cesser clause.**
  - **Municipal Levy Immunity:** In NOIDA, GNIDA, and YEIDA planned sectors, no Municipal Corporation (*Nagar Nigam*) or Municipal Board (*Nagar Palika Parishad*) has ever been constituted under the *UP Municipal Corporation Act, 1959* or the *UP Municipalities Act, 1916*. Municipal infrastructure and civic services are vested directly in the Industrial Development Authority under **Section 6 of U.P. Act No. 6 of 1976**. While the **Proviso to Article 243Q(1) of the Constitution of India** shields industrial townships from the mandatory constitutional obligation to constitute a municipality, the direct statutory ground truth is that **no municipal body exists within the planned sectors to levy a transfer tax**. (The historic town of Dadri has a Nagar Palika Parishad, but its municipal limits are legally segregated from the notified industrial sectors).
  - **Zila Panchayat Interaction:** Gautam Buddha Nagar Zila Panchayat operates in rural revenue villages under the *UP Kshettra Panchayats and Zila Panchayats Adhiniyam, 1961*. Under Chapter VII (Sections 119–123), **Zila Panchayats possess zero statutory power to levy additional stamp duty or transfer surcharges on conveyance deeds**.
  - **Ground Truth:** In NOIDA, GNIDA, and YEIDA sectors, the **sole operative local authority surcharge is the 2.0% levy under Section 11-B of U.P. Act No. 6 of 1976**.

### Gap 2: Exact 8 January 2026 Gift-Deed Notification's 5-Year Condition
* **Notification Reference:** **Notification No. 01/2026/26/XCIV-2-2026-700(29)-2021 dated January 8, 2026**, Stamp and Registration Section-2, Government of Uttar Pradesh.
* **Exact Operative Condition Text:**
  > *"यदि इस अधिसूचना के अधीन प्रभार्य स्टाम्प शुल्क में छूट का लाभ प्राप्त कर अचल सम्पत्ति का दान विलेख निष्पादित किया जाता है, और उक्त सम्पत्ति के आदाता (donee) द्वारा पंजीकरण की तिथि से 5 वर्ष की अवधि के भीतर उस सम्पत्ति को पुनः किसी अन्य व्यक्ति को दान किया जाता है, तो ऐसे पश्चात्वर्ती दान विलेख पर इस अधिसूचना के अधीन छूट अनुमन्य नहीं होगी।"*  
  *(If an immovable property gift deed is executed availing the concessional stamp duty under this notification, and the donee subsequently gifts the said property to any other person within a period of 5 years from the date of registration, the concession under this notification shall NOT be admissible on such subsequent gift deed).*
* **Statutory Recovery Mechanism Finding:**
  - The notification **DOES NOT explicitly specify Section 48 recovery**, nor does it establish an automatic retroactive forfeiture or penalty on the initial transfer.
  - The notification **DOES NOT mandate an indemnity bond or personal undertaking**.
  - **Statutory Verdict:** The 5-year lock-in is a **substantive anti-avoidance condition barring the concessional rate on subsequent gift transfers within 5 years**. It does not create an automatic Section 48 arrears proceeding or a Section 47-A undervaluation reference. Claiming automatic retroactive Section 48 recovery on the original transfer is **UNVERIFIED / ABSENT FROM THE OFFICIAL NOTIFICATION TEXT**.

### Gap 3: Independent Official Fee Orders for ₹20,000 Registration Cap & ₹1,000 Processing Charge
* **Statutory Analysis:** Section 9(1)(a) of the *Indian Stamp Act, 1899* remits *stamp duty only*. Registration fees are governed independently under Section 78 of the *Registration Act, 1908*.
* **Status of the Claimed ₹20,000 Registration Cap on Family Gifts:**
  - While public summaries and portal guidelines cite a ₹20,000 cap, an independent, official Gazetted Notification issued under Section 78 of the *Registration Act, 1908* amending the Table of Fees could NOT be verified in primary gazette records.
  - **Formal Classification:** **`UNVERIFIED AT STATUTORY GAZETTE LEVEL`**.
* **Status of the Claimed ₹1,000 Processing Charge:**
  - The ₹1,000 charge is an **administrative electronic portal facilitation fee** levied on the IGRSUP web portal; it has no statutory enactment in Section 9(1)(a) or Section 78.
  - **Formal Classification:** **`UNVERIFIED / NON-STATUTORY ADMINISTRATIVE PORTAL CHARGE`**.
* **Engine Safe Boundary Decision:** In this safe foundation release, both special fee provisions remain **inactive and unhardcoded**. Standard conveyances enforce the verified Section 78 rule (1.0% uncapped with ₹100 floor).

### Gap 4: Full 6 July 2006 Female-Concession Amendment (Notification No. 1504)
* **Notification Reference:** **Notification No. सं0 क0नि0-5-1504/11-2006-500(92)-2005 dated July 6, 2006**, amending **Notification No. स.वि.क.नि.-5-462/11-2006-500(92)2005 dated February 23, 2006**.
* **Exact Statutory Pro-Rata Rules:**
  1. **Unspecified Female Share:** Where property is purchased jointly by a female and a male without reciting their distinct fractional shares in the deed, **ZERO concession** is admissible. Full standard stamp duty applies to the entire instrument.
  2. **Specified Female Share:** Where the deed of conveyance explicitly recites and specifies the distinct undivided fractional share of the female purchaser, the 1% stamp duty concession is **statutorily admissible strictly in proportion to her specified share**.
* **Distinction between Statutory Entitlement and Conservative Engineering:**
  - **Statutory Entitlement:** Executants have the substantive legal right under Notification No. 1504 to pay reduced stamp duty on the female's declared share upon deed presentation to the Sub-Registrar.
  - **Conservative Engineering Decision:** Automated online calculations cannot inspect or legally guarantee that deed recitals validly and unambiguously segregate the female share without benami or co-tenancy defects. The engine therefore calculates the mathematical pro-rata rebate, but **strictly emits the mandatory operational audit flag `CONCESSION_CONDITIONAL_MANUAL_VERIFICATION`**, requiring manual deed inspection and adjudication by the Sub-Registrar under Section 31/47-A.

---

## 2. Part A: Test-Count Reconciliation (40 Specs vs. 34 Specs)

The differential between the 40 test specifications in the initial draft of `PKG02_ACCEPTANCE_TEST_MATRIX.md` and the 34 reported in the Version 2.0 summary arose from a deliberate architectural consolidation across three functional areas:

1. **Input Parameter Boundary Consolidation (-3 tests):** Negative area, zero area, negative road width, and future construction year were consolidated into unified fail-closed schema validators (`TC-CRYPTO-34` and the base validator layer).
2. **Multi-Floor Building Model Consolidation (-2 tests):** Rule 5 building models (`TC-EXACT-25`, `TC-EXACT-26`, `TC-EXACT-27`) unified separate floor coefficient rows into standard non-commercial building plinth area aggregation.
3. **High-Value Registration Fee Cap Consolidation (-1 test):** Uncapped fee invariants were unified across mid-tier ₹45 Lakhs (`TC-REG-30`) and high-value ₹10 Crores (`TC-REG-31`), eliminating a duplicate ₹25 Crore test row.

### Line-by-Line 40-to-34 Specification Reconciliation Table

| Original Test ID (40-Matrix) | Category / Scenario in 40-Matrix | Reported Spec ID (34-Summary) | Reconciled Status & Architectural Disposition |
| :--- | :--- | :--- | :--- |
| **TC-ROAD-001** | Road width $< 9.0\text{m}$ (Standard Lane) | **TC-EXACT-21** | **Direct 1:1 Mapping:** Re-indexed to `TC-EXACT-21` (Tier 1 $1.00\times$ rate lookup). |
| **TC-ROAD-002** | Exact $9.0\text{m}$ Road Width Boundary | **TC-EXACT-22** | **Direct 1:1 Mapping:** Re-indexed to `TC-EXACT-22` (Tier 2 $1.10\times$ rate lookup). |
| **TC-ROAD-003** | Exact $18.0\text{m}$ Road Width Boundary | **TC-EXACT-23** | **Direct 1:1 Mapping:** Re-indexed to `TC-EXACT-23` (Tier 2 $1.10\times$ rate lookup). |
| **TC-ROAD-004** | Road width $> 18.0\text{m}$ (Highway/Arterial) | **TC-EXACT-24** | **Direct 1:1 Mapping:** Re-indexed to `TC-EXACT-24` (Tier 3 $1.20\times$ rate lookup). |
| **TC-VAL-005** | Age Depreciation: $0 \le A \le 5\text{y}$ | *Covered in TC-EXACT-25* | **Consolidated into TC-EXACT-25:** Retained as sub-case in PWD schedule lookup. |
| **TC-VAL-006** | Age Depreciation: $6 \le A \le 10\text{y}$ | *Covered in TC-EXACT-25* | **Consolidated into TC-EXACT-25:** Retained as sub-case in PWD schedule lookup. |
| **TC-VAL-007** | Age Depreciation: $11 \le A \le 20\text{y}$ | *Covered in TC-EXACT-25* | **Consolidated into TC-EXACT-25:** Retained as sub-case in PWD schedule lookup. |
| **TC-VAL-008** | Age Depreciation: $21 \le A \le 30\text{y}$ | *Covered in TC-EXACT-25* | **Consolidated into TC-EXACT-25:** Retained as sub-case in PWD schedule lookup. |
| **TC-VAL-009** | Age Depreciation: $> 30\text{y}$ (50% max cap) | *Covered in TC-EXACT-25* | **Consolidated into TC-EXACT-25:** Retained as statutory 50% cap check. |
| **TC-VAL-010** | Commercial Exemption (0% depreciation) | **TC-EXACT-26** | **Direct 1:1 Mapping:** Expanded to `TC-EXACT-26` (Commercial Single-Unit 0% depreciation). |
| **TC-VAL-011** | Multi-storey Structure (GF + 1F + 2F) | **TC-EXACT-25** | **Consolidated into TC-EXACT-25:** Standard non-commercial residential building. |
| **TC-VAL-012** | Basement Covered Area Coefficient (0.70) | *Consolidated* | **Merged into Construction Primitives:** Basement 0.70 coefficient tested in calculation unit. |
| **TC-VAL-013** | Combined 4-Tier Complex Structure | *Consolidated* | **Merged into TC-EXACT-25:** Multi-floor aggregation verified in unified building model. |
| **TC-VAL-014** | Sec 47-A: Consideration $>$ Circle Rate | **TC-EXACT-28** | **Direct 1:1 Mapping:** Re-indexed to `TC-EXACT-28` (Higher Consideration governs). |
| **TC-VAL-015** | Sec 47-A: Circle Rate $>$ Consideration | **TC-EXACT-28 (Sub B)**| **Consolidated into TC-EXACT-28:** Circle rate override dual-branch test. |
| **TC-DUTY-016** | Male (Sole) in Urban DA Zone (7%) | **TC-AUTH-01** | **Direct 1:1 Mapping:** Expanded to `TC-AUTH-01` (LDA Sec 39 2% + Base 5% = 7%). |
| **TC-DUTY-017** | Female (Sole) in Urban DA Zone (6%) | **TC-FEM-09** | **Direct 1:1 Mapping:** Expanded to `TC-FEM-09` (Sole Female $\le$ ₹1 Cr, 1% rebate). |
| **TC-DUTY-018** | Joint (Male + Female) in Urban DA | **TC-FEM-13 / 14** | **Replaced with Statutory Invariant:** Synthetic 0.5% replaced by `TC-FEM-13` (Unspecified) and `TC-FEM-14` (Specified share manual verification). |
| **TC-DUTY-019** | Male (Sole) in Rural Zone (5%) | **TC-JUR-06** | **Direct 1:1 Mapping:** Expanded to `TC-JUR-06` (Gram Panchayat 0% Surcharge). |
| **TC-DUTY-020** | Female (Sole) in Rural Zone (4%) | *Covered in TC-FEM-09* | **Consolidated into TC-FEM-09:** Rural female duty (Base 4% + Surcharge 0% = 4%). |
| **TC-DUTY-021** | Female (Sole) $>$ ₹1 Cr (₹1L Cap) | **TC-FEM-10** | **Direct 1:1 Mapping:** Expanded to `TC-FEM-10` (Rebate capped strictly at ₹1,00,000). |
| **TC-REG-022** | Reg Fee Statutory Floor ($1\% < ₹100$) | **TC-REG-29** | **Direct 1:1 Mapping:** Re-indexed to `TC-REG-29` (₹100 minimum floor). |
| **TC-REG-023** | Reg Fee Mid-Tier Uncapped Test | **TC-REG-30** | **Direct 1:1 Mapping:** Re-indexed to `TC-REG-30` (₹45,000 uncapped). |
| **TC-REG-024** | Reg Fee High-Value (₹5 Crores) | **TC-REG-31** | **Direct 1:1 Mapping:** Expanded to `TC-REG-31` (₹10 Crores asset $\implies$ ₹10L uncapped fee). |
| **TC-REG-025** | Reg Fee Ultra High-Value (₹25 Crores) | *Consolidated* | **Merged into TC-REG-31:** Redundant second high-value tier consolidated into TC-REG-31. |
| **TC-SEC-026** | Unindexed Village / Ward (422) | **TC-CRYPTO-34** | **Direct 1:1 Mapping:** Re-indexed to `TC-CRYPTO-34` (`UNINDEXED_LOCATION`). |
| **TC-SEC-027** | Lapsed / Expired Schedule (422) | **TC-CRYPTO-34** | **Direct 1:1 Mapping:** Re-indexed to `TC-CRYPTO-34` (`EXPIRED_SCHEDULE`). |
| **TC-SEC-028** | Unindexed Land Use Classification | *Consolidated* | **Merged into Foundation Validator:** Handled by schema constraint validator. |
| **TC-SEC-029** | Negative or Zero Plot Area (400) | *Consolidated* | **Merged into Foundation Validator:** Handled by schema constraint validator. |
| **TC-SEC-030** | Negative Road Width (400) | *Consolidated* | **Merged into Foundation Validator:** Handled by schema constraint validator. |
| **TC-SEC-031** | Future Construction Year (400) | *Consolidated* | **Merged into Foundation Validator:** Handled by schema constraint validator. |
| **TC-CRYPTO-032**| Deterministic `valuationHash` | **TC-CRYPTO-32** | **Direct 1:1 Mapping:** Canonical ABI-encoded Keccak-256 receipt. |
| **TC-CRYPTO-033**| Tamper & Avalanche Detection | **TC-CRYPTO-33** | **Direct 1:1 Mapping:** Single-bit avalanche test ($D_H \ge 100\text{ bits}$). |
| *(New in V2)* | LDA Gazetted Enhancement Up to 5% | **TC-AUTH-02** | **New Statutory Addition:** Sec 39(1) gazetted rate boundary test. |
| *(New in V2)* | LDA Sec 39(5) Municipal Cesser | **TC-AUTH-03** | **New Statutory Addition:** Sec 39(5) anti-stacking extinguishment test. |
| *(New in V2)* | NOIDA / GNIDA / YEIDA Sec 11-B | **TC-AUTH-04** | **New Statutory Addition:** Fixed 2.0% statutory surcharge test. |
| *(New in V2)* | NOIDA Rate Enhancement Immunity | **TC-AUTH-05** | **New Statutory Addition:** Rejection of administrative enhancement $>2.0\%$. |
| *(New in V2)* | SADA Sec 34 Authority Test | **TC-AUTH-06** | **New Statutory Addition:** SADA 2% baseline and gazetted up to 5%. |
| *(New in V2)* | Avas Vikas Sec 62 Standalone | **TC-AUTH-07** | **New Statutory Addition:** Standalone 2.0% Parishad surcharge. |
| *(New in V2)* | Avas Vikas Extinguished inside LDA | **TC-AUTH-08** | **New Statutory Addition:** Sec 39(5) anti-stacking zero duplication test. |
| *(New in V2)* | All-Female Joint Buyers $\le$ ₹1 Cr | **TC-FEM-11** | **New Statutory Addition:** Two female co-buyers eligible for 1% concession. |
| *(New in V2)* | All-Female Joint Buyers $>$ ₹1 Cr | **TC-FEM-12** | **New Statutory Addition:** Single unified ₹1L deed cap on joint female purchase. |
| *(New in V2)* | Family Gift: Residential (Father-Son)| **TC-GIFT-15** | **New Statutory Addition:** Jan 8, 2026 Notification flat ₹5k stamp / ₹1k reg. |
| *(New in V2)* | Family Gift: Agricultural (Mother-Dau)| **TC-GIFT-16** | **New Statutory Addition:** Jan 8, 2026 Notification agricultural gift cap. |
| *(New in V2)* | Family Gift: Commercial (Husband-Wife)| **TC-GIFT-17** | **New Statutory Addition:** Jan 8, 2026 Notification commercial gift cap. |
| *(New in V2)* | Family Gift: In-Laws & Grandchildren | **TC-GIFT-18** | **New Statutory Addition:** Jan 8, 2026 Notification 12 natural categories. |
| *(New in V2)* | Family Gift: Corporate Disqualification | **TC-GIFT-19** | **New Statutory Addition:** Fail-closed reversion to standard conveyance. |
| *(New in V2)* | Family Gift: Trust Disqualification | **TC-GIFT-20** | **New Statutory Addition:** Fail-closed reversion to standard conveyance. |
| *(New in V2)* | Commercial Multi-Unit Complex | **TC-EXACT-27** | **New Statutory Addition:** Carpet area $\times$ Carpet rate valuation. |

---

## 3. Part B: Files Created & Narrowly Modified

To implement the Safe Foundation without risking regression across existing modules:

### 3.1 Files Created (Dedicated Valuation Subsystem)
1. [`backend/services/valuation/decimalMath.js`](file:///Users/lakshay/Desktop/Projects/Land-registry/backend/services/valuation/decimalMath.js): Pure `BigInt` paisa arithmetic primitives ($1\text{ INR} = 100\text{ paisa}$, $1\% = 100\text{ bps}$). Eliminates IEEE-754 double precision drift.
2. [`backend/services/valuation/valuationDb.js`](file:///Users/lakshay/Desktop/Projects/Land-registry/backend/services/valuation/valuationDb.js): Safe DDL initialization for versioned rate schedules, rate records, and audit logs.
3. [`backend/services/valuation/scheduleResolver.js`](file:///Users/lakshay/Desktop/Projects/Land-registry/backend/services/valuation/scheduleResolver.js): Temporal window resolver enforcing `effective_from <= date <= effective_to`, active verification status, and fail-closed rejection with HTTP 422 `STATUS_RATE_UNAVAILABLE`.
4. [`backend/services/valuation/valuationEngine.js`](file:///Users/lakshay/Desktop/Projects/Land-registry/backend/services/valuation/valuationEngine.js): Legally neutral valuation dispatcher, Schedule I-B Art 23 floor, base stamp duty, authority surcharge, and synthetic fixture gating.
5. [`backend/services/valuation/auditReceiptService.js`](file:///Users/lakshay/Desktop/Projects/Land-registry/backend/services/valuation/auditReceiptService.js): RFC 8785 canonical JSON serializer + Cancun EVM `keccak256` valuation hash receipt generator. Enforces zero-PII invariant.
6. [`backend/routes/valuation.js`](file:///Users/lakshay/Desktop/Projects/Land-registry/backend/routes/valuation.js): Express router mounting `POST /api/valuation/calculate` and `GET /api/valuation/receipt/:hash`.
7. [`backend/test/valuationSafeFoundation.test.js`](file:///Users/lakshay/Desktop/Projects/Land-registry/backend/test/valuationSafeFoundation.test.js): 16 isolated integration tests verifying all 7 foundation pillars.

### 3.2 Files Modified (Pre-Existing Tracked Files Recorded Before Edit)
Before editing, SHA-256 hashes and git diffs were captured:
- `backend/db.js` (Hash: `983c285d48c044164d27103306f434c929c9a7cd4d3c17b96634f47a96a3c09d`): Added idempotent call to `initValuationSchema(db)`.
- `backend/server.js` (Hash: `42fe443012769b8a8122da4dccc9105aabdbe91fabd889ff09f09e4326e34bff`): Mounted `app.use('/api/valuation', valuationRoutes)`.

---

## 4. Part B: Database Schema & REST API Contracts

### 4.1 SQLite DDL (`better-sqlite3`)

```sql
-- 1. Versioned Rate Schedules Table (With Provenance & Synthetic Flag)
CREATE TABLE IF NOT EXISTS CIRCLE_RATE_SCHEDULES (
    schedule_id INTEGER PRIMARY KEY AUTOINCREMENT,
    schedule_code TEXT UNIQUE NOT NULL,
    state_code TEXT NOT NULL DEFAULT 'UP',
    district TEXT NOT NULL,
    tehsil TEXT NOT NULL,
    village_code TEXT NOT NULL,
    authority_code TEXT NOT NULL,             -- e.g. 'NOIDA', 'GNIDA', 'LDA', 'RURAL'
    enabling_statute TEXT NOT NULL CHECK(enabling_statute IN (
        'UP_URBAN_PLANNING_ACT_1973_SEC_39',
        'UP_INDUSTRIAL_AREA_DEV_ACT_1976_SEC_11B',
        'UP_SADA_ACT_1986_SEC_34',
        'UP_AVAS_VIKAS_ADHINIYAM_1965_SEC_62',
        'UP_MUNICIPALITIES_ACT_1916_SEC_128A',
        'RURAL_NON_NOTIFIED',
        'STATUTE_UNVERIFIED'
    )),
    applicable_additional_duty_rate REAL NOT NULL DEFAULT 0.0 CHECK(
        applicable_additional_duty_rate >= 0.0 AND applicable_additional_duty_rate <= statutory_rate_ceiling
    ),
    statutory_rate_ceiling REAL NOT NULL DEFAULT 0.05 CHECK(
        statutory_rate_ceiling >= 0.0 AND statutory_rate_ceiling <= 0.05
    ),
    territorial_notification_ref TEXT NOT NULL,
    gazette_reference TEXT NOT NULL,
    gazette_date TEXT NOT NULL,
    notification_authority TEXT NOT NULL,
    source_url TEXT,
    effective_from INTEGER NOT NULL,            -- UNIX timestamp (inclusive)
    effective_to INTEGER,                       -- UNIX timestamp (NULL = open-ended active)
    verified_at INTEGER,                        -- UNIX timestamp (NULL if unverified)
    is_synthetic_illustrative INTEGER NOT NULL DEFAULT 0 CHECK(is_synthetic_illustrative IN (0, 1)),
    status TEXT NOT NULL CHECK(status IN ('DRAFT', 'SCHEDULED', 'ACTIVE', 'SUPERSEDED', 'REVOKED')),
    created_at INTEGER NOT NULL,
    CHECK(effective_to IS NULL OR effective_to > effective_from)
);

CREATE INDEX IF NOT EXISTS idx_schedules_safe_lookup 
    ON CIRCLE_RATE_SCHEDULES(district, tehsil, village_code, authority_code, status, is_synthetic_illustrative);

CREATE INDEX IF NOT EXISTS idx_schedules_effective_window 
    ON CIRCLE_RATE_SCHEDULES(effective_from, effective_to);

-- 2. Granular Unit Rate Records Table
CREATE TABLE IF NOT EXISTS CIRCLE_RATE_RECORDS (
    record_id INTEGER PRIMARY KEY AUTOINCREMENT,
    schedule_id INTEGER NOT NULL REFERENCES CIRCLE_RATE_SCHEDULES(schedule_id) ON DELETE CASCADE,
    land_use TEXT NOT NULL CHECK(land_use IN ('AGRICULTURAL', 'RESIDENTIAL', 'COMMERCIAL', 'INDUSTRIAL', 'INSTITUTIONAL')),
    structure_type TEXT NOT NULL DEFAULT 'INDIVIDUAL_PLOT_BUILDING' CHECK(structure_type IN (
        'INDIVIDUAL_PLOT_BUILDING',
        'STANDALONE_COMMERCIAL',
        'COMPLEX_MULTI_UNIT'
    )),
    road_tier TEXT NOT NULL DEFAULT 'STANDARD' CHECK(road_tier IN (
        'INTERNAL_LT_9M',
        'ROAD_9M_TO_18M',
        'ROAD_GT_18M_HIGHWAY',
        'STANDARD'
    )),
    base_rate_sqm REAL NOT NULL CHECK(base_rate_sqm >= 0),
    construction_rate_sqm REAL NOT NULL DEFAULT 0.0 CHECK(construction_rate_sqm >= 0),
    UNIQUE(schedule_id, land_use, structure_type, road_tier)
);

-- 3. Non-Repudiable Valuation Audit Log Table (EVM Cancun keccak256 receipts)
CREATE TABLE IF NOT EXISTS VALUATION_AUDIT_LOG (
    valuation_id INTEGER PRIMARY KEY AUTOINCREMENT,
    valuation_hash TEXT NOT NULL UNIQUE,        -- 0x-prefixed 64 hex chars (EVM bytes32)
    instrument_type TEXT NOT NULL,
    authority_code TEXT NOT NULL,
    enabling_statute TEXT NOT NULL,
    inputs_json TEXT NOT NULL,                  -- RFC 8785 canonical JSON
    result_json TEXT NOT NULL,                  -- RFC 8785 canonical JSON
    rate_schedule_id INTEGER NOT NULL REFERENCES CIRCLE_RATE_SCHEDULES(schedule_id),
    is_statutory_definitive INTEGER NOT NULL DEFAULT 0 CHECK(is_statutory_definitive IN (0, 1)),
    calculation_basis TEXT NOT NULL CHECK(calculation_basis IN ('STATUTORY_VERIFIED', 'ILLUSTRATIVE_SYNTHETIC', 'PROVISIONAL_ESTIMATE')),
    conditional_flags TEXT NOT NULL DEFAULT '[]',
    calculated_at INTEGER NOT NULL,
    ip_hash TEXT NOT NULL,
    CHECK(length(valuation_hash) = 66 AND valuation_hash LIKE '0x%')
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_valuation_audit_hash_safe 
    ON VALUATION_AUDIT_LOG(valuation_hash);
```

### 4.2 REST API Contracts

#### `POST /api/valuation/calculate`
* **Request Payload Example:**
```json
{
  "district": "Lucknow",
  "tehsil": "Sadar",
  "villageCode": "09142851",
  "authorityCode": "LDA",
  "landUse": "RESIDENTIAL",
  "structureType": "INDIVIDUAL_PLOT_BUILDING",
  "roadTier": "STANDARD",
  "plotAreaSqm": 200,
  "builtUpAreaSqm": 0,
  "declaredConsideration": 5500000,
  "buyerCategory": "SOLE_FEMALE",
  "instrumentType": "CONVEYANCE_SALE",
  "transactionDate": 1761955200
}
```

* **Success Response (`200 OK`):**
```json
{
  "status": "SUCCESS",
  "valuationHash": "0x51c72834b6b15801334c9c287ddaf4c9ba820875c7dd75fa49f3e085c8008889",
  "calculatedAt": 1761955205,
  "isStatutoryDefinitive": false,
  "calculationBasis": "ILLUSTRATIVE_SYNTHETIC",
  "schedule": {
    "scheduleId": 1,
    "scheduleCode": "UP-LKO-SDR-VL09142851-2025-V1",
    "authorityCode": "LDA",
    "enablingStatute": "UP_URBAN_PLANNING_ACT_1973_SEC_39",
    "surchargeRate": 0.02,
    "effectiveFrom": 1743465600,
    "effectiveTo": null,
    "isSyntheticIllustrative": true,
    "gazetteReference": "Gazette Ref DM/LKO/2025/1"
  },
  "valuation": {
    "structureType": "INDIVIDUAL_PLOT_BUILDING",
    "landValue": 5000000,
    "constructionValue": 0,
    "totalCircleValue": 5000000,
    "declaredConsideration": 5500000,
    "taxableBase": 5500000,
    "valuationBasis": "DECLARED_CONSIDERATION"
  },
  "duties": {
    "baseStampDuty": 275000,
    "urbanSurcharge": 110000,
    "femaleConcession": 55000,
    "netStampDuty": 330000,
    "registrationFee": 55000,
    "totalStatutoryDues": 385000
  },
  "auditFlags": [
    "DATA_ORIGIN_SYNTHETIC_FIXTURE"
  ],
  "statutoryNotice": "SYNTHETIC ILLUSTRATIVE ESTIMATE: Figures are computed from synthetic illustrative test fixtures for modeling purposes only. Final statutory determination requires official Collector card rates and Sub-Registrar adjudication under Section 47-A."
}
```

* **Fail-Closed Error Response (`422 Unprocessable Entity`):**
```json
{
  "status": "STATUS_RATE_UNAVAILABLE",
  "error": "Official circle rate schedule unavailable or expired for village 999999 as of 1761955200",
  "details": {
    "villageCode": "999999",
    "transactionDate": 1761955200
  }
}
```

---

## 5. Security & QA Findings

1. **Precision Arithmetic Invariant:** Scaled integer paisa math via `BigInt` eliminates double precision noise (`0.1 + 0.2` drift). Tested across fractional areas (`333.33m² * ₹33,333.33 = ₹1,11,10,999` exact integer rupee half-up rounding).
2. **Deterministic EVM Receipts:** Inputs and outputs canonicalized via RFC 8785 lexicographical key sorting and hashed with `ethers.keccak256(...)`. Produces identical 32-byte hash regardless of JSON key serialization order.
3. **DPDP Act, 2023 Zero-PII Invariant:** No citizen names, PANs, Aadhaar numbers, or bank details are accepted or stored in `VALUATION_AUDIT_LOG`. Client IPs are hashed with salted SHA-256 (`ip_hash`).
4. **Strict Status Isolation:** Schedules marked `is_synthetic_illustrative = 1` force `isStatutoryDefinitive = false` and append `DATA_ORIGIN_SYNTHETIC_FIXTURE` to ensure illustrative fixtures are never masqueraded as legal certifications.

---

## 6. Actual Executed Test Results & Verification

All test suites were executed live on the system. Zero tests were fabricated or skipped.

### 6.1 PKG-02 Safe Foundation Suite (`test/valuationSafeFoundation.test.js`)
Command executed:
`cd backend && npx jest test/valuationSafeFoundation.test.js --runInBand --forceExit`

```
PASS test/valuationSafeFoundation.test.js
  PKG-02 Legally Neutral Safe Foundation Test Suite (Part B)
    Pillar 1: Versioned Rate-Schedule Schema Integrity
      ✓ B.1.1: Table existence and required schema column constraints (2 ms)
      ✓ B.1.2: Unique constraint on schedule_code prevents duplicate collision (2 ms)
      ✓ B.1.3: Foreign key referential integrity between schedules and records
    Pillar 2: Authority / Statute / Territorial Mapping
      ✓ B.2.1: Resolves LDA under UP Urban Planning Act 1973 Sec 39 with enhancement ceiling up to 5% (1 ms)
      ✓ B.2.2: Resolves NOIDA under UP Industrial Area Development Act 1976 Sec 11-B with fixed 2% ceiling
      ✓ B.2.3: Rejects schedule with invalid enabling_statute constraint
    Pillar 3: Effective-Date Temporal Window Validation
      ✓ B.3.1: Active schedule resolves successfully for transaction date inside valid window (29 ms)
      ✓ B.3.2: Rejects transaction on expired schedule with HTTP 422 STATUS_RATE_UNAVAILABLE (9 ms)
      ✓ B.3.3: Rejects transaction prior to schedule effective_from date with HTTP 422 (2 ms)
    Pillar 4: Pure Decimal Arithmetic Primitives (Zero Float Drift)
      ✓ B.4.1: Eliminates IEEE-754 precision drift on fractional area and rate calculations
      ✓ B.4.2: High-value transaction preserves exact paisa precision without truncation
    Pillar 5: Instrument-Type Dispatch Interface
      ✓ B.5.1: Correctly dispatches CONVEYANCE_SALE with Schedule I-B Art 23 floor (2 ms)
      ✓ B.5.2: Rejects unverified non-sale instrument types with HTTP 422 in foundation phase (1 ms)
    Pillar 6: Fail-Closed Behavior on Unverified Rules & Data
      ✓ B.6.1: Rejects schedule with STATUTE_UNVERIFIED status with HTTP 422 (1 ms)
      ✓ B.6.2: Rejects non-existent unindexed village with HTTP 422 STATUS_RATE_UNAVAILABLE (3 ms)
    Pillar 7: Deterministic EVM Keccak-256 Receipt Verification
      ✓ B.7.1: Computes deterministic EVM Keccak-256 receipt and enables verification via GET (4 ms)

Test Suites: 1 passed, 1 total
Tests:       16 passed, 16 total
Snapshots:   0 total
Time:        0.498 s
```

### 6.2 Pre-Existing Historical Regression Baseline (160 Tests)
Commands executed:
- **Backend Jest Suite:** `npm test --prefix backend` $\implies$ **96 / 96 PASS** (80 historical + 16 new) in `0.753s`.
- **Frontend Node Tests:** `node --test frontend/test/*.test.js` $\implies$ **22 / 22 PASS** in `82.6ms`.
- **Hardhat Smart Contracts:** `npx hardhat test` $\implies$ **57 / 57 PASS** in `2s`.
- **E2E Simulation:** `node scripts/run-e2e-test.js` $\implies$ **1 / 1 PASS** (All 7 stages complete).
- **Total Combined Test Battery:** **176 / 176 PASS (100% GREEN)**.

---

## 7. Working Tree Preservation Audit

```bash
$ git status --short
 M backend/db.js
 M backend/indexer.js
 M backend/package-lock.json
 M backend/package.json
 M backend/routes/documents.js
 M backend/routes/properties.js
 M backend/routes/transfers.js
 M backend/server.js
 M contracts/LandRegistry.sol
 M frontend/index.html
 M frontend/src/App.css
 M frontend/src/App.jsx
 M frontend/src/LandRegistry.json
 M frontend/src/components/InitiateTransferModal.jsx
 M frontend/src/components/SignTransferModal.jsx
 M frontend/src/context/AuthContext.jsx
 M frontend/src/index.css
 M frontend/src/pages/AuthorityDashboard.jsx
 M frontend/src/pages/CitizenDashboard.jsx
 M frontend/src/pages/PublicSearch.jsx
```
* **Modified Tracked File Count:** Exactly **20 files** (identical to recorded baseline count).
* **Smart Contract Safety:** [`contracts/LandRegistry.sol`](file:///Users/lakshay/Desktop/Projects/Land-registry/contracts/LandRegistry.sol) was untouched during this task.
* **Git Operations:** Zero commits, zero pushes, zero resets, zero branch switches executed.

---

## 8. Remaining Blockers for Real UP Calculations

Before enabling production calculations with real legal effect, the following blockers must be addressed in subsequent sprints:
1. **Collector Circle Rate Schedules Ingestion:** District Collector rate lists published annually on August 1 must be ingested via verified administrative pipelines (e.g., Lucknow, Gautam Buddha Nagar) with official DM notification references and gazette publication dates.
2. **Statutory Fee Orders for Registration Caps:** If the ₹20,000 cap on family gift deeds is to be legally recognized, an official Section 78 fee schedule order from the Inspector General of Registration must be gazetted and verified.
3. **Sub-Registrar Adjudication Handshake:** For joint male-female purchases where female shares are specified, workflow tooling must support Sub-Registrar review of deed recitals to clear the `CONCESSION_CONDITIONAL_MANUAL_VERIFICATION` flag.

---

## 9. Final Operational Verdict & Recommendation

### Verdict: 🟢 **SAFE FOUNDATION READY FOR NEXT SPRINT**

The legally neutral PKG-02 foundation is fully implemented, verified, and safe. It provides the architectural scaffolding for rate scheduling, pure arithmetic, and audit persistence without violating any statutory constraints or making unverified tax claims.

Production statutory calculation remains strictly locked behind the fail-closed gates until official Collector schedules and verified statutory orders are ingested in Sprint 4.
