# PKG-02: CALCULATION SPECIFICATION & MATHEMATICAL ALGORITHM ENGINE (RECONCILED)
**Bhūmi Ledger — Sovereign Land Conveyance & Registry Engine**  
**Document Reference:** `PKG02_CALCULATION_SPEC.md`  
**Phase:** Phase 5 Sprint 3 (PKG-02: Circle Rate Valuation & Stamp Duty Calculator)  
**Author:** Backend Engineering Specialist, Bhūmi Ledger  
**Reviewed by:** Chief AI Engineering Orchestrator, System Architect, Product & Legal Specialist  
**Status:** **APPROVED RECONCILED CALCULATION SPECIFICATION (PRE-IMPLEMENTATION GATE)**  
**Target Milestone:** Milestone 5.8 / Sprint 3  
**Date:** November 1, 2026  

---

## 1. System Module Architecture

The valuation engine is implemented as a deterministic off-chain calculation and audit service within the Bhūmi Ledger backend:

```
backend/
├── db.js                           <-- SQLite schemas, circle rate tables & indexes
├── routes/
│   └── valuation.js                <-- REST API endpoints, input validation & error mapping
├── services/
│   └── valuationService.js         <-- Pure calculation algorithms, schedule resolution & receipts
└── test/
    └── valuation.test.js           <-- Ephemeral integration test harness
```

---

## 2. Mathematical Algorithm Specification (First Principles)

### 2.1 Land Valuation ($V_{\text{land}}$)

Under Rule 5 of the *UP Stamp (Valuation of Property) Rules, 1997*, universal statewide percentage multipliers (such as $<9$m $1.0\times$, $9-18$m $1.1\times$, $>18$m $1.2\times$, or corner $+10\%$) **do not exist in parent law**.

Collector circle rate lists in Uttar Pradesh publish rates either as a uniform base rate per village/ward, or as distinct gazetted road-tier rate lines (e.g. "Main Road Frontage" @ ₹28,000/sq.m vs "Internal Colony" @ ₹25,000/sq.m).

$$V_{\text{land}} = \text{Land Area (sq.m)} \times R_{\text{land}}$$

Where $R_{\text{land}}$ is resolved strictly as:
$$R_{\text{land}} = \begin{cases} 
R_{\text{gazetted\_road\_tier}} & \text{if schedule explicitly publishes a distinct rate line for that road category} \\
R_{\text{base}} & \text{standard gazetted village/mohalla rate (road multiplier} \equiv 1.00\times\text{)}
\end{cases}$$

*If the schedule does not contain a specific differential rate, the multiplier is strictly $1.00\times$. Corner plot adjustments default to $1.00\times$ unless published.*

---

### 2.2 Construction Valuation ($V_{\text{const}}$) — Rule 5 Tripartite Pure Branches

Under Rule 5 of the *UP Stamp (Valuation of Property) Rules, 1997*, building valuation is based directly on gazetted Collector construction unit rates per square meter without automated floor discounts or speculative age depreciation curves.

The engine executes three mutually exclusive statutory branches:

#### Branch A: Non-Commercial / Residential Building (Rule 5(1)(b))
$$V_{\text{const}} = \text{Covered Area of Each Floor (sq.m)} \times R_{\text{collector\_non\_commercial\_construction}}$$
*(Calculated as minimum land value + covered area $\times$ Collector construction rate).*

#### Branch B: Single-Unit Shops and Commercial Establishments (Rule 5(1)(c))
$$V_{\text{const}} = \text{Covered Area of Each Floor (sq.m)} \times R_{\text{collector\_commercial\_construction}}$$
*(Calculated as minimum land value, covered or not, + covered area $\times$ Collector commercial construction/rent rate).*

#### Branch C: Commercial Establishments or Shops in Buildings Other than Single-Unit (Rule 5(1)(d))
$$V_{\text{const}} = \text{Carpet Area (sq.m)} \times R_{\text{collector\_commercial\_carpet}}$$
*(In commercial complexes, shopping plazas, and multi-unit shopping floors, valuation is based strictly on carpet area; undivided land share is legally subsumed into the composite carpet circle rate).*

#### Statutory Deactivations & Commercial Non-Depreciation Mandate:
- **Parent Rule 5 Contains Zero Age-Depreciation Curves:** The automated calculation engine applies the applicable Collector-fixed card rates directly and **does not independently introduce an age-depreciation deduction** unless an applicable official instruction explicitly authorizes it.
- **Administrative Practice on Commercial Buildings:** In administrative practice under Collector general instructions (*सामान्य निर्देश*), commercial structures receive zero age depreciation.
- **Floor Reduction Factors (0.7x, 0.8x, 0.9x):** **DEACTIVATED / UNSUPPORTED.** No automated floor discounts are applied unless an explicit local gazette schedule defines floor-specific rates.
- **Unconstructed Plot:** If `structureType == 'UNCONSTRUCTED'`, $V_{\text{const}} \equiv 0.00$.

---

### 2.3 Total Circle Rate Valuation ($V_{\text{circle}}$)
$$V_{\text{circle}} = V_{\text{land}} + V_{\text{const}}$$

---

### 2.4 Taxable Dutiable Base ($V_{\text{dutiable}}$) — Schedule I-B Article 23
Under Schedule I-B, Article 23 of the *Indian Stamp Act, 1899* (UP Amendment):
$$V_{\text{dutiable}} = \max\Big(\text{Declared Consideration}, V_{\text{circle}}\Big)$$
- The substantive charging base is the higher of the declared consideration or the administrative minimum valuation floor ($V_{\text{circle}}$) computed under Rules 4 and 5 of the *UP Stamp (Valuation of Property) Rules, 1997*.
- **Procedural Adjudication vs. Mathematical Base:** Section 47-A of the *Indian Stamp Act, 1899* provides the procedural adjudication and reference mechanism available to the registering officer when an instrument is suspected of being undervalued; it does not itself create a separate calculation formula.

---

### 2.5 Statutory Government Levies Breakdown

#### 1. Base Stamp Duty (5.0%)
Under Schedule 1-B, Article 23 of the *Indian Stamp Act, 1899* (UP Amendment):
$$\text{Base Stamp Duty} = \text{round}(V_{\text{dutiable}} \times 0.05)$$

#### 2. Local Planning Authority Surcharge ($S_{\text{local}}$)
Replaces the simplistic `isUrban` toggle with the authority-specific statutory classification:

| Planning Jurisdiction Code | Enabling Statutory Act | Surcharge Rate ($r_{\text{surcharge}}$) | Statutory Enhancement & Cesser Powers |
|:---|:---|:---:|:---|
| `DEVELOPMENT_AUTHORITY` | Sec 39(1), UP Urban Planning & Development Act, 1973 (LDA, GDA, KDA, ADA) | **2.0% baseline** | State Govt may enhance up to 5.0% by Gazette (Sec 39(1) Proviso). Sec 39(5) cesser terminates conflicting municipal/parishad taxes. |
| `INDUSTRIAL_DEVELOPMENT_AUTHORITY` | Sec 11-B, UP Industrial Area Development Act, 1976 (NOIDA, GNIDA, YEIDA, UPSIDA) | **2.0% fixed** | **NO enhancement power** (strictly fixed at 2.0%). Proviso to Art 243Q(1) bars municipal taxes. Sec 39 does NOT apply. |
| `AVAS_VIKAS_PARISHAD` | Sec 62, UP Avas Evam Vikas Parishad Adhiniyam, 1965 (UPAVP Housing Schemes) | **2.0%** | Applies to standalone housing schemes; extinguished if inside DA limits under Sec 39(5). |
| `SPECIAL_AREA_DEVELOPMENT_AUTHORITY` | Sec 34, UP Special Area Development Authorities Act, 1986 (SADA) | **2.0% baseline** | State Govt may enhance up to 5.0% by Gazette (Sec 34 Proviso). |
| `MUNICIPAL_BOARD_WITH_128A` | Sec 128-A, UP Municipalities Act, 1916 (with notified tax resolution) | **Notified Rate ($\le 2.0\%$)** | Applicable only where notified and not displaced by Sec 39(5) DA boundary. |
| `MUNICIPAL_BOARD_STANDARD` | UP Municipalities Act, 1916 (without tax resolution) | **0.0%** | Standard municipality without special transfer tax resolution. |
| `RURAL_GRAM_PANCHAYAT` | Rural Gram Panchayat outside urban authority boundaries | **0.0%** | Pure rural parcels outside development boundaries. |

$$\text{Urban Surcharge} = \text{round}(V_{\text{dutiable}} \times r_{\text{surcharge}})$$

**Section 39 Statutory Ground Truth & Repugnancy (Section 39(5)):**
- Section 39(1) of UP Act 30 of 1974 sets a 2.0% baseline additional duty with statutory power reserved to the State Government to enhance up to 5.0% by Gazette notification. Database constraint in `CIRCLE_RATE_SCHEDULES` enforces:
  `CHECK(applicable_additional_duty_rate >= 0.0 AND applicable_additional_duty_rate <= 0.05)`.
- Section 39(5) is an express **statutory cesser clause**: where a Development Area overlaps with Municipal Corporation limits (Sec 172/173), Municipalities (Sec 128/128-A), or Avas Vikas Parishad (Sec 62), those provisions *cease to have effect* to the extent of repugnancy. Conflicting local levies yield to the Section 39 surcharge.
- Section 39(3) is an **evidentiary disclosure mandate** amending Section 27 Stamp Act. Surcharge applicability is governed strictly by the geographic boundary under Section 39(1). Rural agricultural parcels falling inside a notified Development Authority master plan limit attract the Section 39 surcharge.

#### 3. Female Purchaser Concession (Notifications 462/2006 & 1504/2006)
Under Section 9(1)(a) of the *Indian Stamp Act, 1899* vide **Notification No. स.वि.क.नि.-5-462/11-2006-500(92)2005 dated Feb 23, 2006** as amended July 29, 2025:

- **Sole Female Buyer (`SOLE_FEMALE` / `ALL_FEMALE_JOINT`):**
  1.0% concession on dutiable value up to ₹1 Crore, capped strictly at **₹1,00,000**:
  $$C_{\text{female}} = \min\Big(\text{round}(V_{\text{dutiable}} \times 0.01), 100000\Big)$$

- **Joint Male-Female Buyers (`JOINT_MALE_FEMALE`):**
  - Under **Notification No. 1504 dated July 6, 2006**, if shares are NOT specified in the deed, **ZERO concession** applies.
  - Under strict tax construction (*Dilip Kumar* doctrine, (2018) 9 SCC 1), Section 45 of the Transfer of Property Act, 1882 cannot create an automated tax concession online.
  - The automated engine applies **₹0.00 concession**:
    $$C_{\text{female}} = 0.00$$
  - The engine emits the operational flag:
    $$\texttt{CONCESSION\_CONDITIONAL\_MANUAL\_VERIFICATION}$$
  - The transaction requires manual adjudication by the Sub-Registrar under Section 31/47-A upon physical inspection of deed recitals.

- **Male Buyer or Corporate Entity (`MALE` / `CORPORATE`):**
  $$C_{\text{female}} = 0.00$$

#### 4. Net Stamp Duty Payable
$$\text{Net Stamp Duty} = \max\Big(0, \text{Base Stamp Duty} + \text{Urban Surcharge} - C_{\text{female}}\Big)$$

#### 5. Registration Fee (1.0% Flat Uncapped under Section 78)
Under the *UP Registration (Amendment) Rules, 2020* (repealing the historical ₹20,000 ceiling for standard conveyances) issued under Section 78 of the *Registration Act, 1908*:
$$F_{\text{reg}} = \max\Big(\text{round}(V_{\text{dutiable}} \times 0.01), ₹100\Big)$$

#### 6. Concessional Family Gift Deed Treatment (Jan 8, 2026 Notification)
Under **Notification No. 01/2026/26/XCIV-2-2026-700(29)-2021 dated January 8, 2026**:
- Issued under Section 9(1)(a) of the *Indian Stamp Act, 1899*: Stamp duty is remitted to a flat **₹5,000**.
- Applies to living natural persons among 12 specified family relationships across residential, agricultural, commercial, and industrial properties.
- The 5-year anti-alienation lock-in is a statutory condition of exemption enforced under **Section 48** (recovery of unpaid duties as arrears of land revenue), NOT Section 47-A.
- Section 9(1)(a) remits *stamp duty only*; the Registration Fee is governed independently under Section 78 of the *Registration Act, 1908* (capped at **₹20,000**).
- Official IGRSUP online portal processing charge of **₹1,000**.

#### 7. Total Statutory Dues Payable
$$\text{Total Dues} = \text{Net Stamp Duty} + F_{\text{reg}}$$
*(Plus ₹1,000 online portal processing fee where applicable).*

---

## 3. Recalculated Worked Numerical Examples (From First Principles)

> [!NOTE]
> **SYNTHETIC ILLUSTRATIVE FIGURES:** The numerical rates, areas, and values used below are synthetic illustrative figures for calculation modeling only and do not represent published government circle rate schedules.

### Example 1: Lucknow Urban Residential Plot (Sole Female Buyer, LDA Area)
*Scenario: Purchase of a 200 sq.m residential plot in Lucknow Sadar (Chinhat) within LDA limits by a sole female purchaser.*

- **Cadastral & Property Inputs**:
  - District: `Lucknow` (`LKO`), Tehsil: `Sadar` (`SDR`), Village: `Chinhat` (`VL042`)
  - Jurisdiction: `DEVELOPMENT_AUTHORITY` (LDA Area under UP Planning Act 1973 Sec 39(1) $\implies 2.0\%$ Surcharge; Section 39(5) cesser applies to municipal tax)
  - Land Area: $200.0\text{ m}^2$ | Land Use: `residential` | Base Circle Rate: ₹$25,000\text{ / m}^2$ (Road multiplier $\equiv 1.00\times$)
  - Construction: `unconstructed` ($0\text{ m}^2$)
  - Declared Consideration: ₹$55,00,000$ (₹55 Lakhs)
  - Buyer Category: `SOLE_FEMALE`

#### Step-by-Step Calculation:
1. $V_{\text{land}} = 200 \times 25,000 \times 1.00 = \mathbf{₹50,00,000}$
2. $V_{\text{const}} = \mathbf{₹0}$
3. $V_{\text{circle}} = \mathbf{₹50,00,000}$
4. $V_{\text{dutiable}} = \max(55,00,000, 50,00,000) = \mathbf{₹55,00,000}$ *(Schedule I-B Art 23: declared consideration governs)*
5. $\text{Base Stamp Duty (5.0\%)} = 55,00,000 \times 0.05 = \mathbf{₹2,75,000}$
6. $\text{LDA Surcharge (2.0\%)} = 55,00,000 \times 0.02 = \mathbf{₹1,10,000}$
7. $\text{Female Concession} = \min(55,00,000 \times 0.01, 100000) = \mathbf{₹55,000}$
8. $\text{Net Stamp Duty} = 2,75,000 + 1,10,000 - 55,000 = \mathbf{₹3,30,000}$
9. $\text{Registration Fee (1.0\% Uncapped)} = \max(100, 55,00,000 \times 0.01) = \mathbf{₹55,000}$
10. **Total Statutory Dues:** $3,30,000 + 55,000 = \mathbf{₹3,85,000}$

---

### Example 2: Gautam Buddha Nagar Commercial (NOIDA Authority, Male Buyer)
*Scenario: Commercial single-unit building in NOIDA Sector 62. Declared price exceeds circle rates.*

- **Cadastral & Property Inputs**:
  - District: `Gautam Buddha Nagar` (`GBN`), Tehsil: `Dadri` (`DDR`), Village: `Sector 62` (`SEC062`)
  - Jurisdiction: `INDUSTRIAL_DEVELOPMENT_AUTHORITY` (NOIDA Area under UP Industrial Area Development Act 1976 Sec 11-B $\implies 2.0\%$ fixed surcharge; municipal tax barred under Art 243Q)
  - Land Area: $150.0\text{ m}^2$ | Commercial Land Base Rate: ₹$85,000\text{ / m}^2$ (Road multiplier $\equiv 1.00\times$)
  - Construction: Commercial Single-Unit Building (Rule 5(1)(c)), Covered Area: $220.0\text{ m}^2$
  - Collector Commercial Construction Card Rate: ₹$24,000\text{ / m}^2$
  - Building Age: 15 years $\implies$ No age depreciation deduction is introduced by automated engine under Rule 5
  - Floor Multipliers: **DEACTIVATED** ($1.00\times$)
  - Declared Consideration: ₹$2,20,00,000$ (₹2.20 Crore)
  - Buyer Category: `MALE`

- **Step-by-Step Calculation**:
  1. $V_{\text{land}} = 150 \times 85,000 \times 1.00 = \mathbf{₹1,27,50,000}$
  2. $V_{\text{const}} = 220 \times 24,000 = \mathbf{₹52,80,000}$
  3. $V_{\text{circle}} = 1,27,50,000 + 52,80,000 = \mathbf{₹1,80,30,000}$
  4. $V_{\text{dutiable}} = \max(2,20,00,000, 1,80,30,000) = \mathbf{₹2,20,00,000}$ *(Declared consideration governs)*
  5. $\text{Base Stamp Duty (5.0\%)} = 2,20,00,000 \times 0.05 = \mathbf{₹11,00,000}$
  6. $\text{NOIDA Sec 11-B Surcharge (2.0\%)} = 2,20,00,000 \times 0.02 = \mathbf{₹4,40,000}$
  7. $\text{Female Concession} = \mathbf{₹0}$ *(Male buyer)*
  8. $\text{Net Stamp Duty} = 11,00,000 + 4,40,000 = \mathbf{₹15,40,000}$
  9. $\text{Registration Fee (1.0\% Uncapped)} = 2,20,00,000 \times 0.01 = \mathbf{₹2,20,000}$
  10. **Total Statutory Dues:** $15,40,000 + 2,20,000 = \mathbf{₹17,60,000}$

---

### Example 3: Barabanki Rural Agricultural (Outside Development Area, Joint Buyers)
*Scenario: Purchase of a 4,000 sq.m (0.40 Ha) agricultural parcel outside development boundaries by husband and wife.*

- **Cadastral & Property Inputs**:
  - District: `Barabanki` (`BBK`), Tehsil: `Ramnagar` (`RMN`), Village: `Fatehpur` (`VL108`)
  - Geographic Boundary: Verified outside notified Development Area $\implies \mathbf{0.0\%}$ Surcharge
  - Land Area: $4,000.0\text{ m}^2$ | Base Rate: ₹$800\text{ / m}^2$ (Road multiplier $\equiv 1.00\times$)
  - Construction: `unconstructed` ($0\text{ m}^2$)
  - Declared Consideration: ₹$30,00,000$ (₹30 Lakhs)
  - Buyers: Joint Male-Female (`JOINT_MALE_FEMALE`)

- **Step-by-Step Calculation**:
  1. $V_{\text{land}} = 4,000 \times 800 \times 1.00 = \mathbf{₹32,00,000}$
  2. $V_{\text{const}} = \mathbf{₹0}$
  3. $V_{\text{circle}} = \mathbf{₹32,00,000}$
  4. $V_{\text{dutiable}} = \max(30,00,000, 32,00,000) = \mathbf{₹32,00,000}$ *(Circle rate floor overrides)*
  5. $\text{Base Stamp Duty (5.0\%)} = 32,00,000 \times 0.05 = \mathbf{₹1,60,000}$
  6. $\text{Development Surcharge} = \mathbf{₹0}$ *(Parcel verified outside development area)*
  7. $\text{Female Concession}$:
     - Under Notification 1504 and strict construction of tax remissions (*Dilip Kumar*), Section 45 TPA cannot create an automated tax deduction.
     - **Automated Concession:** $\mathbf{₹0.00}$
     - **Emitted Operational Audit Flag:** $\texttt{CONCESSION\_CONDITIONAL\_MANUAL\_VERIFICATION}$
  8. $\text{Net Stamp Duty} = 1,60,000 + 0 - 0 = \mathbf{₹1,60,000}$
  9. $\text{Registration Fee (1.0\% Uncapped)} = 32,00,000 \times 0.01 = \mathbf{₹32,000}$
  10. **Total Statutory Dues:** $160,000 + 32,000 = \mathbf{₹1,92,000}$

---

### Example 4: Concessional Family Gift Deed (Jan 8, 2026 Notification)
*Scenario: Transfer of residential parcel valued at ₹40,00,000 between father and son (living natural persons).*

- **Cadastral & Property Inputs**:
  - District: `Lucknow` (`LKO`), Tehsil: `Sadar` (`SDR`), Village: `Chinhat` (`VL042`)
  - Instrument Type: `FAMILY_GIFT_JAN2026` (Eligible relative roster, living natural persons)
  - Circle Rate Valuation: ₹$40,00,000$
  - Anti-alienation lock-in: 5-year lock-in enforced under Section 48 arrears recovery

- **Step-by-Step Calculation**:
  1. $V_{\text{circle}} = \mathbf{₹40,00,000}$
  2. $\text{Remitted Stamp Duty (Notification 01/2026/26)} = \mathbf{₹5,000}$ *(Flat statutory cap)*
  3. $\text{Registration Fee (Section 78 Capped)} = \min(40,00,000 \times 0.01, 20000) = \mathbf{₹20,000}$
  4. $\text{IGRSUP Portal Processing Fee} = \mathbf{₹1,000}$
  5. **Total Statutory Dues:** $5,000 + 20,000 + 1,000 = \mathbf{₹26,000}$

---

## 4. REST API Interface Contracts

### 4.1 `POST /api/valuation/calculate`

#### Reconciled Request Body
```json
{
  "district": "Lucknow",
  "tehsil": "Sadar",
  "villageCode": "VL042",
  "planningJurisdiction": "DEVELOPMENT_AUTHORITY",
  "landUse": "residential",
  "structureType": "INDIVIDUAL_PLOT_BUILDING",
  "roadTier": "STANDARD",
  "plotAreaSqm": 200.0,
  "builtUpAreaSqm": 0,
  "declaredConsideration": 5500000,
  "isCornerPlot": false,
  "buyerCategory": "SOLE_FEMALE",
  "femaleSharePercentage": 100,
  "transactionDate": 1729000000
}
```

#### Reconciled Success Response (`200 OK`)
```json
{
  "status": "SUCCESS",
  "valuationHash": "0x4f82a170b24016a1c5d99b24479e95089312ab486e92d04a601265c719ef8421",
  "calculatedAt": 1729000050,
  "rateSchedule": {
    "scheduleId": 1,
    "scheduleCode": "UP-LKO-SDR-VL042-2026-V1",
    "planningJurisdiction": "DEVELOPMENT_AUTHORITY",
    "enablingStatute": "UP_URBAN_PLANNING_AND_DEVELOPMENT_ACT_1973_SEC_39",
    "surchargeRate": 0.02,
    "effectiveFrom": 1722470400,
    "baseRateSqm": 25000.0,
    "constructionRateSqm": 0.0
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
  "dutyBreakdown": {
    "baseStampDuty": 275000,
    "urbanSurcharge": 110000,
    "femaleConcession": 55000,
    "netStampDuty": 330000,
    "registrationFee": 55000,
    "totalPayable": 385000
  },
  "conditionalFlags": [],
  "statutoryDisclaimer": "Advisory Notice: This calculation is an indicative estimate under Rule 3 of UP Stamp Valuation Rules 1997. Final duty is determined exclusively by the Sub-Registrar / Collector of Stamps under Section 47-A of the Indian Stamp Act, 1899."
}
```

---

## 5. Cryptographic Valuation Receipt Generation Algorithm

```javascript
const { ethers } = require('ethers');

/**
 * Generates an immutable, canonical EVM Keccak-256 valuation receipt hash.
 * Follows RFC 8785 JSON Canonicalization Scheme (JCS).
 * @param {object} inputs
 * @param {object} results
 * @param {Array<string>} flags
 * @returns {string} 0x-prefixed 32-byte hex string
 */
function generateValuationHash(inputs, results, flags = []) {
  const canonicalObj = {
    flags: [...flags].sort(),
    inputs: Object.keys(inputs).sort().reduce((acc, key) => {
      acc[key] = inputs[key];
      return acc;
    }, {}),
    results: Object.keys(results).sort().reduce((acc, key) => {
      acc[key] = results[key];
      return acc;
    }, {})
  };

  const canonicalString = JSON.stringify(canonicalObj);
  return ethers.keccak256(ethers.toUtf8Bytes(canonicalString));
}

module.exports = { generateValuationHash };
```
