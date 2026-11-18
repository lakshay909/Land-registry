# SPRINT 3 ACCEPTANCE TEST MATRIX & VERIFICATION SPECIFICATION
# PKG-02: Circle Rate Valuation & Stamp Duty Calculator
# Bhūmi Ledger — India Land Transaction & Registry Platform

**Document Version:** 1.0.0  
**Phase:** Phase 5 Sprint 3 Quality Assurance Baseline  
**Author:** QA & Test Engineering Specialist  
**Reviewed by:** Chief AI Engineering Orchestrator, System Architect, Product & Legal Specialist  
**Date:** October 31, 2026  
**Status:** Acceptance Test Matrix Approved • Ready for Test Implementation  

---

## 1. Executive Summary & Quality Strategy

This acceptance test matrix establishes the automated verification baseline for **PKG-02 (Circle Rate Valuation & Stamp Duty Calculator)**.

The testing strategy enforces:
1. **Mathematical Exactness:** Verifying land calculations, road width multipliers, plinth construction rates, and age depreciation deductions.
2. **Statutory Compliance:** Enforcing the 2020 Registration Fee amendment (flat 1% uncapped for standard deeds), 2% urban surcharge geographic boundaries, and the expanded ₹1 Lakh female concession ceiling under UP Government rules.
3. **Strict Fail-Closed Data Integrity:** Verifying that missing or lapsed circle rate schedules reject with explicit diagnostic codes rather than synthetic estimates.
4. **Cryptographic Reproducibility:** Proving that calculated `valuationHash` certificates are deterministic and non-repudiable.
5. **Zero Regression:** Guaranteeing that the 131 pre-existing tests continue to pass 100% green without modification.

---

## 2. Comprehensive Acceptance Test Matrix (24 Test Scenarios)

| Test ID | Category | Scenario Description | Input Parameters | Formula & Expected Behavior | Expected Outputs & Verifications | Severity |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **TC-VAL-001** | Land Boundary | Road width $< 9.0\text{m}$ (Standard Interior Lane) | Area: $200\text{ m}^2$, Base Rate: ₹$25,000/\text{m}^2$, Road: $8.9\text{m}$, Vacant Plot | $200 \times 25,000 \times (1 + 0.00)$ | Land Value: **₹50,00,000**<br>Multiplier: **0% (1.00x)** | Blocker |
| **TC-VAL-002** | Land Boundary | Road width exactly $9.0\text{m}$ (Lower Threshold) | Area: $200\text{ m}^2$, Base Rate: ₹$25,000/\text{m}^2$, Road: $9.0\text{m}$, Vacant Plot | $200 \times 25,000 \times (1 + 0.10)$ | Land Value: **₹55,00,000**<br>Multiplier: **+10% (1.10x)** | Blocker |
| **TC-VAL-003** | Land Boundary | Road width exactly $18.0\text{m}$ (Upper Threshold) | Area: $200\text{ m}^2$, Base Rate: ₹$25,000/\text{m}^2$, Road: $18.0\text{m}$, Vacant Plot | $200 \times 25,000 \times (1 + 0.10)$ | Land Value: **₹55,00,000**<br>Multiplier: **+10% (1.10x)** | Blocker |
| **TC-VAL-004** | Land Boundary | Road width $> 18.0\text{m}$ (Highway / Arterial) | Area: $200\text{ m}^2$, Base Rate: ₹$25,000/\text{m}^2$, Road: $18.1\text{m}$, Vacant Plot | $200 \times 25,000 \times (1 + 0.20)$ | Land Value: **₹60,00,000**<br>Multiplier: **+20% (1.20x)** | Blocker |
| **TC-VAL-005** | Construction Age | Depreciation: Age $0-5\text{ years}$ (Nil Depreciation) | Plinth: $150\text{ m}^2$, Rate: ₹$12,000/\text{m}^2$, Pukka, Age: $4\text{ yrs}$ | $150 \times 12,000 \times (1 - 0.00)$ | Const Value: **₹18,00,000**<br>Depreciation: **0%** | Major |
| **TC-VAL-006** | Construction Age | Depreciation: Age $6-10\text{ years}$ (Bracket 1) | Plinth: $150\text{ m}^2$, Rate: ₹$12,000/\text{m}^2$, Pukka, Age: $8\text{ yrs}$ | $150 \times 12,000 \times (1 - 0.10)$ | Const Value: **₹16,20,000**<br>Depreciation: **10%** | Major |
| **TC-VAL-007** | Construction Age | Depreciation: Age $11-20\text{ years}$ (Bracket 2) | Plinth: $150\text{ m}^2$, Rate: ₹$12,000/\text{m}^2$, Pukka, Age: $15\text{ yrs}$ | $150 \times 12,000 \times (1 - 0.20)$ | Const Value: **₹14,40,000**<br>Depreciation: **20%** | Major |
| **TC-VAL-008** | Construction Age | Depreciation: Dilapidated / Maximum Statutory Cap | Plinth: $150\text{ m}^2$, Rate: ₹$12,000/\text{m}^2$, Pukka, Age: $45\text{ yrs}$ | $150 \times 12,000 \times (1 - 0.50)$ *(Capped at 50%)* | Const Value: **₹9,00,000**<br>Depreciation: **50% (Max Cap)** | Major |
| **TC-VAL-009** | Commercial Rule | Commercial Property Structural Depreciation Exemption | Plinth: $200\text{ m}^2$, Rate: ₹$15,000/\text{m}^2$, Use: Commercial, Age: $25\text{ yrs}$ | Rule: Commercial structures never depreciate | Const Value: **₹30,00,000**<br>Depreciation: **0% (Exempt)** | Critical |
| **TC-VAL-010** | Multi-Floor Slabs | Multi-storey structure (GF + 1st Floor) | GF: $100\text{m}^2$ (1.0x), 1F: $100\text{m}^2$ (0.9x), Rate: ₹$12,000/\text{m}^2$, Age: $2\text{ yrs}$ | GF: $100 \times 12k = 12\text{L}$<br>1F: $100 \times 12k \times 0.9 = 10.8\text{L}$ | Const Value: **₹22,80,000**<br>Depreciation: **0%** | Critical |
| **TC-CONS-011** | Taxable Base | Declared consideration exceeds circle rate | Circle Valuation: ₹$50,00,000$; Declared Consideration: ₹$65,00,000$ | Taxable Base = $\max(50\text{L}, 65\text{L}) = 65\text{L}$ | Taxable Base: **₹65,00,000**<br>Basis: **Consideration** | Blocker |
| **TC-CONS-012** | Taxable Base | Circle rate exceeds declared consideration | Circle Valuation: ₹$60,00,000$; Declared Consideration: ₹$45,00,000$ | Taxable Base = $\max(60\text{L}, 45\text{L}) = 60\text{L}$ (Sec 47-A) | Taxable Base: **₹60,00,000**<br>Basis: **Circle Valuation** | Blocker |
| **TC-DUTY-013** | Surcharge & Gender | Sole Male Buyer in Urban Zone | Valuation: ₹$50,00,000$; Zone: Urban (LDA/Nagar Nigam); Male | Duty = $5\% \text{ Base} + 2\% \text{ Urban} = 7\%$ | Stamp Duty: **₹3,50,000**<br>Reg Fee: **₹50,000** (1%) | Blocker |
| **TC-DUTY-014** | Surcharge & Gender | Sole Female Buyer in Urban Zone ($\le ₹1\text{ Cr}$) | Valuation: ₹$50,00,000$; Zone: Urban; Sole Female | Duty = $7\% - 1\% \text{ Rebate} = 6\%$ (Saving ₹50,000) | Stamp Duty: **₹3,00,000**<br>Concession: **-₹50,000** | Blocker |
| **TC-DUTY-015** | Surcharge & Gender | Sole Female Buyer for High-Value Estate ($> ₹1\text{ Cr}$) | Valuation: ₹$2,00,00,000$ (₹2 Cr); Zone: Urban; Sole Female | $1\%$ rebate capped at ₹$1,00,000$ max benefit | Gross: **₹14,00,000**<br>Rebate: **-₹1,00,000**<br>Net: **₹13,00,000** | Critical |
| **TC-DUTY-016** | Surcharge & Gender | Joint Female-Male Buyer in Urban Zone | Valuation: ₹$50,00,000$; Zone: Urban; Joint Female + Male | Blended rate: $5\% + 2\% - 0.5\% = 6.5\%$ | Stamp Duty: **₹3,25,000**<br>Concession: **-₹25,000** | Critical |
| **TC-DUTY-017** | Rural Exemption | Agricultural / Rural Land Parcel (No Urban Surcharge) | Valuation: ₹$30,00,000$; Zone: Rural Gram Panchayat; Male | Duty = $5\% \text{ Base} + 0\% \text{ Surcharge} = 5\%$ | Stamp Duty: **₹1,50,000**<br>Urban Surcharge: **₹0** | Critical |
| **TC-REG-018** | Registration Fee | High-Value Property: 2020 Uncapped Fee Rule | Valuation: ₹$1,50,00,000$ (₹1.5 Cr); Standard Conveyance | $1\%$ of ₹$1.5\text{ Cr}$ with NO CAP (2020 Rule) | Reg Fee: **₹1,50,000**<br>Cap Applied: **NO (Uncapped)** | Blocker |
| **TC-REG-019** | Registration Fee | Small Property Nominal Floor Check | Valuation: ₹$5,000$; Deed Type: Nominal Release | $1\%$ of ₹$5,000 = ₹50$; Statutory floor is ₹100 | Reg Fee: **₹100**<br>Floor Enforced: **YES** | Minor |
| **TC-FAIL-020** | Fail-Closed | Missing Village Circle Schedule | District: `LKO`, Tehsil: `SDR`, Village: `UNKNOWN_999` | System halts; rejects synthetic interpolation | **HTTP 422** `STATUS_RATE_UNAVAILABLE`<br>Code: `JURISDICTION_NOT_FOUND` | Blocker |
| **TC-FAIL-021** | Fail-Closed | Lapsed / Expired Circle Rate Schedule | District: `LKO`, Village: `VL042`, Date: `2030-01-01` | Schedule expired; no successor gazetted | **HTTP 422** `STATUS_RATE_UNAVAILABLE`<br>Code: `SCHEDULE_EXPIRED` | Blocker |
| **TC-FAIL-022** | Fail-Closed | Land Use Rate Card Missing in Schedule | Rural village schedule queried for `commercial` plot | Commercial rate unindexed in rural pocket | **HTTP 422** `STATUS_RATE_UNAVAILABLE`<br>Code: `LAND_USE_RATE_NOT_PUBLISHED` | Major |
| **TC-NEG-023** | Input Validation | Negative or Zero Land Area | Area: `-100.0\text{ m}^2` or `0.0\text{ m}^2` | Zod schema validation rejection | **HTTP 400** `INVALID_AREA` | Major |
| **TC-HASH-024** | Audit Integrity | Cryptographic Determinism of Valuation Receipt | Identical input parameters submitted across 2 calls | Canonical serialization + `keccak256` hashing | Identical `valuationHash`<br>Verified in SQLite | Blocker |

---

## 3. Test Execution Architecture & Performance Gates

### 3.1 Isolated Test Harness (`backend/test/valuation.test.js`)
To ensure zero interference with the existing database and smart contracts, the valuation test suite will run against an isolated ephemeral SQLite database:
```javascript
const path = require('path');
const fs = require('fs');

const testDbPath = path.join(__dirname, 'test-valuation-ephemeral.sqlite');
process.env.DB_PATH = testDbPath;

if (fs.existsSync(testDbPath)) {
  fs.unlinkSync(testDbPath);
}

// Initialize tables and seed verified pilot rates
const db = require('../db');
```

### 3.2 Quantitative Performance Gates
Before Sprint 3 implementation is accepted, the automated test harness must satisfy these metrics:
1. **Pass Rate:** **24 / 24 tests passing (100%)** in `backend/test/valuation.test.js`.
2. **Repository-Wide Test Pass Count:** **$\ge 155$ tests** (131 existing tests + 24 new valuation tests).
3. **Valuation Engine Latency:** `POST /api/valuation/calculate` latency **$< 35\text{ms}$** for complete calculation and audit log persistence.
4. **Zero Regression:** All 57 Hardhat smart contract tests, 27 core API tests, 24 ingestion tests, 22 frontend Node unit tests, and the E2E multi-actor simulation must pass with 0 modifications.

---

## 4. Test Sign-Off & Verification Readiness

The QA Engineering team has reviewed the mathematical formulas, legislative amendments, and fail-closed security rules. The test specifications are complete, concrete, and ready for automated test development.

*Acceptance test matrix approved for Sprint 3 execution.*
