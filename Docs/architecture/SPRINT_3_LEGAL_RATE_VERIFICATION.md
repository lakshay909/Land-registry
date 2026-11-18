# SPRINT 3 LEGAL & STATUTORY RATE VERIFICATION DOSSIER
# Uttar Pradesh Stamp Duty, Valuation Rules & Circle Rate Regime
# Bhūmi Ledger — India Land Transaction & Registry Platform

**Document Version:** 1.0.0  
**Phase:** Phase 5 Sprint 3 Planning Gate  
**Author:** Product & Legal Research Specialist  
**Reviewed by:** Chief AI Engineering Orchestrator, System Architect  
**Date:** October 31, 2026  
**Status:** Statutory Verification Complete • Critical Registration Fee Amendment Codified  

---

## 1. Executive Summary & Critical Legislative Finding

This legal verification dossier establishes the statutory foundation for **Phase 5 Sprint 3 (PKG-02: Circle Rate Valuation & Stamp Duty Calculator)**.

### CRITICAL REGULATORY DEFECT WARNING: Registration Fee Cap Abolition
During the multi-agent planning phase, the engineering team initially assumed a universal ₹20,000 registration fee cap based on historical pre-2020 UP practices. 

Our statutory investigation uncovered that under the **Uttar Pradesh Registration (Amendment) Rules, 2020 (Notified February 2020)**, the State Government **completely eliminated the ₹20,000 upper ceiling for standard conveyance / sale deeds**. 

Under current law in Uttar Pradesh:
- Standard Conveyance Deeds: Registration fee is a **flat 1% of total valuation with NO UPPER CEILING**. (e.g., A ₹1.5 Crore conveyance in Lucknow or Noida incurs a registration fee of ₹1,50,000, not ₹20,000).
- Concessional ₹20,000 Cap: Preserved **exclusively for Family Gift Deeds** between direct blood relatives under UP Government Notification No. 817/2022.

Hardcoding a universal ₹20,000 cap would constitute a major legal miscalculation for citizen conveyances above ₹20 Lakhs.

---

## 2. UP Stamp (Valuation of Property) Rules, 1997: Valuation Formulas & Multipliers

### 2.1 Statutory Valuation Formula (Rules 3, 4, and 5)
Under Rules 3, 4, and 5 of the *UP Stamp (Valuation of Property) Rules, 1997* (framed under Sections 27, 47-A, and 75 of the *Indian Stamp Act, 1899*), the statutory minimum market value of built-up immovable property is calculated as:

$$\text{Total Statutory Minimum Valuation} = \text{Land Valuation} + \text{Depreciated Construction Valuation}$$

* **Land Valuation ($\text{V}_{\text{land}}$):**
  $$\text{V}_{\text{land}} = \text{Land Area} \times \text{Base Circle Rate per Unit Area} \times (1 + \sum \text{Location Adjustments})$$
  *(Where Land Area is measured in Square Meters for urban/abadi land, or Hectares for agricultural land).*
* **Construction Valuation ($\text{V}_{\text{const}}$):**
  $$\text{V}_{\text{const}} = \text{Covered (Plinth) Area} \times \text{Prescribed Construction Rate} \times (1 - \text{Depreciation Rate})$$
* **Fundamental Statutory Principle:** **Land never depreciates.** Depreciation is strictly limited to the structural construction component of residential/non-commercial properties.

### 2.2 Road-Width Multiplier Rules
Under the General Instructions (*सामान्य निर्देश*) issued by District Magistrates pursuant to Rules 4 and 5:
* Road width abutting the property directly scales the baseline land valuation:
  * **Road Width $< 9$ meters (Standard interior lanes / sub-ways):** Baseline Circle Rate (**0% enhancement**).
  * **Road Width $9$ meters to $18$ meters (Connecting thoroughfares / secondary roads):** **+10% enhancement** added to the baseline land rate.
  * **Road Width $> 18$ meters / Main Arterials / National & State Highways:** **+20% enhancement** added to the baseline land rate.
* **Planned Development Authorities (Noida / Greater Noida Sector Framework):**
  * Noida categorizes road widths in distinct 4-tier bands:
    1. *Up to 12 meters:* Base Sector Rate.
    2. *12 meters to 18 meters:* **+5% to +10%**.
    3. *18 meters to 24 meters:* **+10% to +15%**.
    4. *Above 24 meters / Expressways:* **+15% to +20%**.
* **Corner Plot Multiplier:** Properties abutting more than one road (corner plots) attract an additional **+5% to +10%** enhancement on the total land value.

### 2.3 Construction Type Multipliers (Plinth Area Rates)
The District Magistrate’s annual circle rate schedule prescribes fixed minimum construction rates per square meter of covered plinth area across three recognized statutory classes:
1. **Pukka (Class-I / RCC Frame Structure):** Reinforced cement concrete (RCC) roof, brick/concrete walls, finished plaster, standard sanitary fittings. Prescribed rate ranges from **₹8,000 to ₹12,000 per sq. meter** (scaling up to ₹15,000/sq. m. in high-density urban zones).
2. **Semi-Pukka (Class-II / RBC or Tin-Shed / Masonry Structure):** Brick masonry with RBC (reinforced brick concrete) roof, asbestos sheets, tin shade, or iron girders. Prescribed rate ranges from **₹4,500 to ₹7,000 per sq. meter**.
3. **Kachha (Class-III / Mud & Temporary Structure):** Mud walls, unburnt bricks, thatched or tile roofing. Prescribed rate ranges from **₹2,000 to ₹3,500 per sq. meter**.

### 2.4 Age-Based Depreciation Slabs
* **Commercial Property Exclusion:** Under UP circle rate guidelines, **commercial buildings are statutorily ineligible for depreciation** (Depreciation = 0% regardless of age).
* **Residential Structural Depreciation Schedule:**
  * **Structure Age $0$ to $5$ years:** **0%** (Nil depreciation).
  * **Structure Age $> 5$ to $10$ years:** **10%** deduction from construction cost.
  * **Structure Age $> 10$ to $20$ years:** **20%** deduction from construction cost.
  * **Structure Age $> 20$ to $30$ years:** **30%** deduction from construction cost.
  * **Structure Age $> 30$ years (or dilapidated):** **40% to 50% maximum cap**.
  * *Statutory Floor:* The depreciated value of a habitable structure cannot be written down by more than **50%** of its base construction cost.

---

## 3. Applicable Stamp Duty Rates in Uttar Pradesh

### 3.1 Base Stamp Duty Rate (Indian Stamp Act, 1899 — UP Amendment)
* Governed by **Schedule 1-B, Article 23 (Conveyance)** of the *Indian Stamp Act, 1899* (as amended by UP Acts).
* The statutory base stamp duty on an instrument of conveyance is **5%** of the higher of:
  1. The declared consideration amount set forth in the instrument; or
  2. The minimum market value calculated under the circle rate guidelines.

### 3.2 Municipal / Urban Development Surcharge (2% Surcharge)
* **Statutory Basis:** Levied under **Section 39 of the Uttar Pradesh Urban Planning and Development Act, 1973** (*"Additional stamp duty on certain transfers of property"*).
  * *Section 39(1):* The stamp duty payable on any deed of transfer of immovable property situated within a designated "Development Area" shall be increased by **2%** on the valuation of the property.
  * Equivalent provisions are enacted under the *Uttar Pradesh Municipal Corporation Act, 1959* (Section 172/173) and the *Uttar Pradesh Municipalities Act, 1916* for urban local bodies.
* **Territorial Applicability:** 
  * The 2% surcharge is **NOT universal**.
  * It applies **ONLY** to properties situated within:
    1. Notified Development Authority areas (e.g., LDA in Lucknow, NOIDA, GNIDA, YEIDA in Gautam Buddha Nagar, ADA, KDA, GDA, etc.);
    2. Municipal Corporations (*Nagar Nigam*);
    3. Municipal Boards (*Nagar Palika Parishad*); and
    4. Town Areas (*Nagar Panchayat*).
  * **Rural Agricultural Exclusion:** Agricultural lands and rural properties situated **outside** municipal limits and outside notified Development Authority jurisdictions are **EXEMPT** from the 2% surcharge.

### 3.3 Female-Buyer Concession & Joint Ownership Framework
* **Statutory Origin:** UP Government Order No. 1383/97 and subsequent Finance Department notifications.
* **Historical vs. Current Threshold:**
  * *Historical Rule (Pre-Amendment):* 1% rebate was restricted to properties valued up to ₹10 Lakhs, resulting in a strict ceiling of **₹10,000**.
  * *Current Statutory Framework:* The UP State Cabinet expanded the concession threshold to properties valued up to **₹1 Crore**. Eligible female buyers receive a **1% rebate** on stamp duty, yielding a maximum discount of **₹1,00,000 (₹1 Lakh)**.
* **Buyer Demographics & Effective Duty Matrix:**

| Area Classification | Sole Male Buyer | Sole Female Buyer (Valuation $\le$ ₹1 Cr) | Joint (Female + Male) | Joint (Female + Female) |
| :--- | :--- | :--- | :--- | :--- |
| **Urban / Development Authority Limits** | **7%** (5% base + 2% surcharge) | **6%** (7% less 1% rebate up to ₹1L cap) | **6.5%** (Blended 0.5% effective concession) | **6%** (Full 1% rebate up to ₹1L cap) |
| **Rural / Outside Development Limits** | **5%** (5% base + 0% surcharge) | **4%** (5% less 1% rebate up to ₹1L cap) | **4.5%** (Blended 0.5% effective concession) | **4%** (Full 1% rebate up to ₹1L cap) |

*(Note on Properties > ₹1 Crore: For a sole female buyer purchasing an urban property valued at ₹2 Crore, the 1% rebate applies to the first ₹1 Crore [saving ₹1,00,000], and the remaining ₹1 Crore is charged at the full 7% rate).*

---

## 4. Registration Fees in Uttar Pradesh & Statutory Cap Status

### 4.1 Standard Registration Fee Rate
* Under **Section 78 of the Registration Act, 1908** (as amended by UP Registration Rules):
* The registration fee on conveyance deeds is a flat **1%** of the gross market value or declared consideration (whichever is higher), subject to a nominal floor of ₹100.

### 4.2 Statutory Cap Analysis: The ₹20,000 Cap is ABOLISHED for Standard Deeds
* **The Legislative Shift (February 2020):**
  * Under the **Uttar Pradesh Registration (Amendment) Rules, 2020 (Notified February 2020)**, the UP Government **eliminated the maximum ceiling of ₹20,000 on standard conveyance / sale deeds**.
  * Registration fee in Uttar Pradesh is now **uncapped**: a flat 1% of total property valuation across all property brackets.
  * *Example:* For a property valued at ₹1.5 Crore in Noida or Lucknow, the registration fee is **₹1,50,000**, NOT ₹20,000.
* **Where Does the ₹20,000 Cap Still Apply?**
  * The ₹20,000 cap is preserved **exclusively for concessional Family Gift Deeds** executed between direct blood relatives (parents, children, spouse, siblings, grandparents, grandchildren) pursuant to UP Government Notification No. 817/2022 (and subsequent renewal notifications). For these specific instruments, stamp duty is capped at ₹5,000 and registration fee is capped at **₹20,000**.
* **Engine Implementation Rule for PKG-02:** Standard conveyance calculations must apply `registration_fee = total_valuation * 0.01` without applying any ceiling.

---

## 5. Official District Circle Rate Sources & Pilot District Profiles

### 5.1 Official Government Repository
* **Primary Authority:** **IGRSUP Portal (Stamps & Registration Department, Uttar Pradesh)**: `https://igrsup.gov.in` under *"मूल्यांकन सूची" (Evaluation List)*.
* **Secondary Administrative Mirrors:** Official District Administration Portals (`lucknow.nic.in`, `gautambuddhnagar.nic.in`).

### 5.2 Pilot District Circle Rate Profiles

```
Pilot District 1: LUCKNOW
 ├── Sadar Tehsil (Urban Core / SRO I-V)
 │    ├── Units: Measured in ₹ / Square Meter
 │    ├── Residential Plots: ₹25,000 to ₹40,000 / sq. m. (Outer municipal areas)
 │    ├── Prime / Arterial (Hazratganj, Gomti Nagar): ₹65,000 to ₹90,000+ / sq. m.
 │    └── Commercial Space: ₹1,00,000 to ₹1,80,000+ / sq. m.
 └── Mohanlalganj Tehsil (Peri-Urban & Agricultural Transition)
      ├── Agricultural Land: Measured in ₹ / Hectare (₹25 Lakh to ₹1.2+ Crore/Hectare)
      └── Abadi / Roadside Residential: ₹4,000 to ₹14,000 / sq. m.

Pilot District 2: GAUTAM BUDDHA NAGAR (NOIDA / GREATER NOIDA / DADRI)
 ├── Noida SRO (Categorized Sectors A+ to E, adjusted by Road Width)
 │    ├── Category A+ (Sectors 14, 14A, 15A, 44): ₹1,03,000 to ₹1,55,000+ / sq. m.
 │    ├── Category A (Sectors 17, 19, 21, 30, 36, 50): ₹85,000 to ₹1,10,000 / sq. m.
 │    ├── Category B (Sectors 15, 20, 26, 40, 41, 62): ₹72,000 to ₹90,000 / sq. m.
 │    └── Category C-E (Developing Sectors): ₹40,000 to ₹55,000 / sq. m.
 └── Dadri & Greater Noida (Sadar) SRO
      ├── Urban / Institutional Sectors: ₹32,000 to ₹58,000 / sq. m.
      └── Rural Dadri Agricultural Tracts: Measured in ₹ / Hectare
```

### 5.3 Mandatory Data Safeguard Policy for PKG-02
Because circle rates vary down to the specific revenue village code (LGD), sub-registrar circle, and Gata number, the PKG-02 engine must implement the following safeguard:
> **Hard Safeguard Rule:** If the automated ingestion or API resolver cannot match a verified, active circle rate from the official IGRSUP schedule for the queried parcel, the platform must display:  
> **`"STATUS: UNAVAILABLE / PENDING REVENUE CIRCLE PUBLICATION"`**  
> Under no circumstances may the system estimate, interpolate, or extrapolate numerical circle rates.

---

## 6. Statutory Disclaimers for Platform UI & API Responses

To ensure full legal insulation against deficit duty liability under the *Indian Stamp Act, 1899*, the following statutory disclaimer must be hardcoded into the calculation output screen and API response payloads for PKG-02:

```markdown
> ### STATUTORY VALUATION & STAMP DUTY DISCLAIMER
> **1. Estimation Assistant Status:** This Circle Rate Valuation & Stamp Duty Calculator 
> operates strictly as an automated **"Estimation Assistant"** under Rule 3 of the 
> *Uttar Pradesh Stamp (Valuation of Property) Rules, 1997*.
> 
> **2. Non-Binding Nature:** The values, rates, road-width multipliers, and duty figures 
> generated herein represent preliminary approximations based on public circle rate lists 
> published on the IGRSUP portal. This calculation does NOT constitute a formal statutory 
> valuation certificate.
> 
> **3. Sole Competent Authority (Section 47-A):** Final determination of true market value, 
> structural depreciation, and applicable duty is vested exclusively in the **Sub-Registrar 
> (Registering Officer) and the Collector of Stamps** under **Section 47-A of the Indian 
> Stamp Act, 1899** (as amended by Uttar Pradesh).
> 
> **4. Deficit Duty, Penalties & Interest:** If upon presentation or inspection under 
> Section 47-A, the property is determined to be undervalued, the executant(s) shall remain 
> solely liable to pay any deficit stamp duty, along with statutory penalty and interest 
> at the rate of 1.5% per month from the date of execution. Bhūmi Ledger and its operators 
> assume zero financial or legal liability for discrepancies arising from official reassessments.
```

---

## 7. Actionable Implementation Check-List for PKG-02 Engineering Team

1. **Calculator Engine Logic:**
   * Calculate Base Land Value = `area * circle_rate`.
   * Apply Road-Width Multipliers: `0%` (<9m), `+10%` (9–18m), `+20%` (>18m).
   * Apply Plinth Area Construction Rates based on structural class (Pukka / Semi-Pukka / Kachha).
   * Apply Age-Based Depreciation (0% for $0-5$ yrs; 10% for $5-10$ yrs; 20% for $10-20$ yrs; 30% for $20-30$ yrs; capped at 50%).
   * Set Depreciation to `0%` if property usage is flagged `Commercial`.
2. **Stamp Duty Computation Logic:**
   * Determine Location Flag: `is_urban` (within Development Authority / Municipal limits) vs. `is_rural`.
   * If `is_urban == True`: Rate = 7% (Male) / 6% (Sole Female up to ₹1 Cr) / 6.5% (Joint M+F).
   * If `is_urban == False`: Rate = 5% (Male) / 4% (Sole Female up to ₹1 Cr) / 4.5% (Joint M+F).
   * Cap female 1% rebate at ₹1,00,000 maximum benefit.
3. **Registration Fee Computation Logic:**
   * Compute `registration_fee = max(declared_consideration, statutory_valuation) * 0.01`.
   * **DO NOT CAP AT ₹20,000.** (Cap applies only if instrument type is explicitly flagged `FAMILY_GIFT_DEED_CONCESSIONAL`).
4. **Data Fallback Safeguard:**
   * Flag unverified parcel rates as `"UNAVAILABLE / PENDING REVENUE CIRCLE PUBLICATION"`.
5. **UI / API Output:**
   * Embed the mandatory Section 47-A / Rule 3 statutory disclaimer in all calculator responses.

---
*Dossier submitted for Sprint 3 architectural and implementation sign-off.*
