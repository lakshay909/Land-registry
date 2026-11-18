# PKG-02: PRODUCT REQUIREMENTS SPECIFICATION (RECONCILED)
**Bhūmi Ledger — Sovereign Land Conveyance & Registry Engine**  
**Document Reference:** `PKG02_PRODUCT_REQUIREMENTS.md`  
**Phase:** Phase 5 Sprint 3 (PKG-02: Circle Rate Valuation & Stamp Duty Calculator)  
**Authors:** Product & Legal Specialist, Frontend Engineering Specialist, Chief AI Engineering Orchestrator  
**Status:** **APPROVED RECONCILED PRODUCT BASELINE (PRE-IMPLEMENTATION GATE)**  
**Target User Release:** Milestone 5.8 / Sprint 3  

---

## 1. Product Vision & Problem Statement

In real estate transactions across Uttar Pradesh, citizens, advocates, and document writers frequently suffer financial surprises, transaction halts, and undervaluation notices under **Section 47-A of the Indian Stamp Act, 1899**. Commercial online calculators frequently use simplistic flat percentages (e.g. 5% or 7%) without accounting for:
1. Official District Collectorate circle rate schedules by village/ward.
2. Distinct statutory planning authorities and their enabling surcharge legislation (Section 39 UP Planning Act, Section 62 UPAVP Act, Section 128-A UP Municipalities Act).
3. The statutory reality of Rule 5 of the UP Stamp Valuation Rules 1997, which does not contain universal statewide percentage multipliers for road width, corner plots, or floor levels.
4. Statutory female purchaser concessions (1% rebate up to ₹1 Crore on female equity share under Section 9(1)(a)).
5. The 2020 UP legislative amendment abolishing the ₹20,000 registration fee ceiling for standard conveyance deeds.

**PKG-02 delivers an authoritative, transparent, fail-closed valuation and duty estimator that calculates exact statutory dues before deed execution, preventing fiscal fraud and registry delays.**

---

## 2. User Personas & User Stories

### 2.1 Personas
- **Pooja (Citizen Buyer):** Purchasing a residential plot in Lucknow. Needs an itemized breakdown of upfront government charges (Stamp Duty + Registration Fees) and wants to ensure her 1% female purchaser concession is applied accurately.
- **Ramesh (Citizen Seller):** Selling agricultural land in Barabanki. Needs to verify that his asking price exceeds the official circle rate floor to prevent Section 47-A undervaluation litigation and penalty interest.
- **Mohammad Aslam (Tehsil Document Drafter):** Needs an exact, non-repudiable statutory fee certificate with official gazette citations to append to conveyance deed drafts submitted to the Sub-Registrar.

### 2.2 User Stories
- **US-01:** *As a Buyer,* I want to calculate government dues for a specific parcel by selecting its governing planning jurisdiction and entering land dimensions so that I have complete transparency on payable stamp duty and registration fees.
- **US-02:** *As a Female Purchaser,* I want the calculator to automatically compute and apply the statutory 1% rebate up to the ₹1,00,000 ceiling on my equity share without manual calculation errors.
- **US-03:** *As Joint Purchasers (Male + Female),* I want to specify our undivided co-ownership share percentage so that the female concession is calculated legally pro-rata without assuming arbitrary synthetic averages.
- **US-04:** *As a Seller,* I want side-by-side comparison of my agreed sale price against the statutory minimum circle valuation so that I can ensure compliance with Section 47-A.
- **US-05:** *As a Citizen,* I want clear disclaimers explaining that this estimate does not constitute government proof of title or final adjudication.

---

## 3. UI/UX Architecture & Placement Touchpoints

### 3.1 Platform Placement
1. **Primary Workspace Action in [`CitizenDashboard.jsx`](file:///Users/lakshay/Desktop/Projects/Land-registry/frontend/src/pages/CitizenDashboard.jsx)**:
   - Primary action button rendered in the dashboard action bar:
     ```
     [ + Register Property ]   [ ⚖️ Valuation & Duty Estimator ]   [ 🔄 Refresh ]
     ```
   - Launches a dedicated, 2-column interactive calculator modal.
2. **Integrated Conveyance Pre-Check in [`InitiateTransferModal.jsx`](file:///Users/lakshay/Desktop/Projects/Land-registry/frontend/src/components/InitiateTransferModal.jsx)**:
   - Rendered as an accordion drawer when initiating a land transfer.
   - Pre-populates parcel Gata, area, and district from `PARCEL_EXTRACTION_METADATA`.
   - Prevents parties from setting transfer consideration below the circle rate minimum.
3. **Public Search Property Details in [`PublicSearch.jsx`](file:///Users/lakshay/Desktop/Projects/Land-registry/frontend/src/pages/PublicSearch.jsx)**:
   - "Calculate Statutory Dues for this Parcel" CTA card on verified land records.

---

## 4. 4-Step Interactive Calculator Wizard

The frontend calculator operates as a 4-step wizard with real-time responsive updates:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│  Step 1: Location & Zone  ──►  Step 2: Land & Road  ──►  Step 3: Building  ──►  Step 4: Buyer  │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

### Step 1: Location & Planning Authority Jurisdiction
- **State Selection**: Fixed to `Uttar Pradesh` (driven by `StateContext`).
- **District Selector**: Cascading dropdown (`Lucknow`, `Gautam Buddha Nagar`, `Barabanki`).
- **Tehsil Selector**: Dynamically filtered by chosen district (e.g. *Sadar, Mohanlalganj, Dadri*).
- **Revenue Village / Ward Autocomplete**: Searchable input matching verified LGD village codes.
- **6-Tier Planning Jurisdiction Selector (Replaces Binary Urban/Rural Toggle)**:
  1. `Development Authority Area (LDA, NOIDA, GNIDA, YEIDA)` $\rightarrow$ **+2.0% Surcharge** (UP Planning Act 1973 § 39).
  2. `UP Avas Evam Vikas Parishad Notified Scheme` $\rightarrow$ **+2.0% Surcharge** (UPAVP Act 1965 § 62).
  3. `Special Area Development Authority (SADA)` $\rightarrow$ **+2.0% Surcharge** (UP SADA Act 1986 § 34).
  4. `Municipal Corporation / Nagar Palika (Sec 128-A Tax Notified)` $\rightarrow$ **Notified %** (UP Municipalities Act 1916 § 128-A).
  5. `Standard Municipality (Without Sec 128-A Resolution)` $\rightarrow$ **0.0% Additional Duty**.
  6. `Rural Gram Panchayat Area` $\rightarrow$ **0.0% Additional Duty (Statutorily Exempt)**.
- **Section 39(5) Anti-Stacking Rule**: Multi-selection is prevented; maximum total local surcharge is strictly capped at **2.0%**.

### Step 2: Parcel Dimensions & Access Infrastructure
- **Dual-Unit Demarcated Area Input**:
  - Live bidirectional unit conversion:
    - **Metric**: Square Meters ($\text{sq.m}$) or Hectares ($\text{Ha}$).
    - **Regional (UP)**: *Pucca Bigha* ($2,529.3\text{ m}^2$) and *Biswa* ($126.465\text{ m}^2$).
  - Displays statutory alert if agricultural land exceeds the $5.0586\text{ Hectare}$ ceiling under Section 89 of the UP Revenue Code, 2006.
- **Road Width Input & Contextual Rule 5 Schedule Notice**:
  - Width in meters.
  - Informational Banner: *"Rule 5 Notice: Road-width multipliers apply ONLY where explicitly published in the notified District Circle Rate Schedule. Where not published, valuation defaults to base land rate (1.00x)."*
  - Contextual toggle: `[✓] Apply notified district road width & corner plot multipliers (Default for LKO / GBN schedules)` vs `[ ] District schedule specifies a flat base rate without road tiers`.
- **Corner Plot Input**:
  - Checkbox: `[✓] Corner Plot (Frontage on two or more intersecting roads)`.
  - Contextual Note: Applied only if the district circle rate schedule specifies a corner plot tier; otherwise marked informational at $1.00\times$.

### Step 3: Structural & Construction Details (Rule 5 Pure Branches)
- **Structure Type Categorization**:
  1. `INDIVIDUAL_PLOT_BUILDING`: Residential or individual non-commercial building $\rightarrow (\text{Plot Area} \times \text{Land Rate}) + (\text{Covered Area} \times \text{Construction Rate})$.
  2. `STANDALONE_COMMERCIAL`: Commercial single-unit building $\rightarrow (\text{Plot Area} \times \text{Commercial Land Rate}) + (\text{Covered Area} \times \text{Commercial Construction Rate})$.
  3. `COMPLEX_MULTI_UNIT`: Flat or shop in multi-unit complex $\rightarrow \text{Carpet Area} \times \text{Complex Carpet Rate}$ (undivided land share subsumed).
  4. `UNCONSTRUCTED`: Vacant land $\rightarrow \text{Construction Value} = 0$.
- **Deactivation of Unverified Multipliers**:
  - Floor coefficients ($0.7\times, 0.9\times, 0.8\times$) and PWD age depreciation curves are **deactivated from the automated engine**.
  - Commercial properties strictly enforce **0% depreciation**.
  - Physical structural deterioration claims require Sub-Registrar spot inspection under Section 47-A.

### Step 4: Transaction & Buyer Demographic Profile
- **Instrument Category**:
  - `CONVEYANCE_SALE_DEED` (Standard sale: 5% base stamp duty, 1% uncapped reg fee).
  - `FAMILY_GIFT_DEED_CONCESSIONAL` (Direct blood relations under UP Govt Order: Flat ₹5,000 duty cap, ₹20,000 capped reg fee).
- **Agreed Transaction Consideration**: Formatted numerical input in INR (`₹ 55,00,000`).
- **Buyer Demographic Profile & Joint Share Input**:
  - `SOLE_FEMALE`: Full 1.0% concession up to ₹1,00,000 max rebate.
  - `JOINT_MALE_FEMALE`:
    - Shows input field: `Female Co-owner Undivided Share (%) [Optional]`.
    - If entered: Concession applied pro-rata to female equity share up to ₹1 Crore.
    - If omitted: Concession line item is ₹0, accompanied by amber warning:
      *"Notice: For joint male-female purchases with unspecified shares, statutory concession cannot be automatically applied online. Assessment is subject to manual verification of deed recital by the Sub-Registrar."*
  - `SOLE_MALE` / `CORPORATE`: Standard statutory rates (0% concession).

---

## 5. Three-Tier Reliability Framework (`ValuationBreakdownCard.jsx`)

Every line item in the breakdown card is classified under an explicit visual reliability badge:

```
┌────────────────────────────────────────────────────────────────────────┐
│  RELIABILITY TIER 1: VERIFIED STATUTORY RULES                          │
│  [ 🟢 VERIFIED STATUTORY RULES ]                                       │
│  • Base Stamp Duty (5.00% under UP Stamp Act Schedule 1-B)             │
│  • Registration Fee (1.00% Uncapped under Registration Act Sec 78)     │
│  • Planning Surcharges (2.00% under UP Planning Act Sec 39 / UPAVP)    │
├────────────────────────────────────────────────────────────────────────┤
│  RELIABILITY TIER 2: DISTRICT-SPECIFIC SCHEDULE RATES                  │
│  [ 🔵 DISTRICT-SPECIFIC SCHEDULE RATES ]                               │
│  • Base Land Circle Rate (₹/sq.m for Revenue Village / Ward)           │
│  • Collector Construction Unit Rates (Rule 5 categories)               │
│  • Gazetted Road-Tier Rate Lines (where published in District Gazette) │
├────────────────────────────────────────────────────────────────────────┤
│  RELIABILITY TIER 3: CONDITIONAL SRO REVIEW                            │
│  [ 🟡 CONDITIONAL SRO REVIEW ]                                         │
│  • Joint Male-Female Undivided Share Concession (Recital audit needed) │
│  • Building Physical Deterioration / Age Claims (Sec 47-A inspection)  │
│  • Land Classification Spot Audit (Section 47-A)                       │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 6. Functional Requirements (FR-01 to FR-08 Reconciled)

| Req ID | Title | Technical Requirement |
|:---|:---|:---|
| **FR-01** | **Composite Valuation Engine** | Computes assessed circle value following Rule 5 structure branches (`INDIVIDUAL`, `STANDALONE_COMMERCIAL`, `COMPLEX_MULTI_UNIT`). |
| **FR-02** | **District Road Multipliers** | Applies road-tier rate lines strictly from loaded district schedules; defaults to $1.00\times$ if no tiers are published. Corner plots default to $1.00\times$ unless gazetted. |
| **FR-03** | **Rule 5 Construction Valuation** | Calculates construction value using gross plinth/carpet Collector card rates. Deactivates unverified floor coefficients and PWD age depreciation. Enforces **0.0% depreciation on commercial buildings**. |
| **FR-04** | **6-Tier Surcharge Engine** | Maps local authority surcharges to specific enabling acts (UP Planning Act, UPAVP Act, SADA Act, Municipalities Act Sec 128-A). Enforces Section 39(5) anti-stacking ($\text{Max Surcharge} \le 2.0\%$). |
| **FR-05** | **Pro-Rata Female Concession** | Applies 1.0% rebate for sole female buyers (capped at ₹1,00,000). For joint buyers, computes rebate pro-rata on specified female share; flags unspecified shares for manual SRO review. |
| **FR-06** | **Uncapped Registration Fee** | Computes registration fee as flat 1.0% of taxable base with ₹100 floor and **zero upper ceiling** (2020 UP Amendment). |
| **FR-07** | **Concessional Family Gifts** | Caps stamp duty at flat ₹5,000 (+ ₹1,000 fee) and registration fee at ₹20,000 for verified blood-relation gift deeds. |
| **FR-08** | **Fail-Closed Staleness Gating** | Rejects unverified, missing, or expired schedules ($>365$ days) with HTTP 422 `STATUS_RATE_UNAVAILABLE`. Forbids synthetic rate guessing. |

---

## 7. Mandatory Legal & Statutory Disclaimers

The calculator API response and frontend UI components **MUST** render the following statutory notices verbatim:

### 7.1 Indicative Estimate Notice (Section 47-A Indian Stamp Act)
> **Statutory Estimate Notice • Section 47-A, Indian Stamp Act, 1899**  
> *This calculation is an automated indicative estimate based on published circle rate schedules under Rule 3 of the UP Stamp (Valuation of Property) Rules, 1997. Final stamp duty determination and property characterization are vested exclusively in the Sub-Registrar and Collector of Stamps under Section 47-A of the Indian Stamp Act, 1899. Any deliberate misstatement of road width, plinth area, or construction grade constitutes an offense punishable with penalty under Section 64.*

### 7.2 Supreme Court Title Precedent Notice
> **Statutory Notice on Title & Ownership (*Suraj Lamp* Doctrine)**  
> *Payment of stamp duty, registration of conveyance instruments, or subsequent mutation in revenue records (Khatauni) does not confer or guarantee absolute, indefeasible proprietary title. Pursuant to settled Supreme Court doctrine (Suraj Lamp & Industries v. State of Haryana (2012) 1 SCC 656; Suraj Bhan v. Financial Commissioner (2007) 6 SCC 186), revenue records serve exclusively for fiscal collection and do not extinguish judicial title claims.*
