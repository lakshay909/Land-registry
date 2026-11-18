# PKG-02: FINAL STATUTORY ACCURACY CORRECTION REPORT
**Bhūmi Ledger — Sovereign Land Conveyance & Registry Engine**  
**Document Reference:** `PKG02_FINAL_STATUTORY_CORRECTION_REPORT.md`  
**Phase:** Phase 5 Sprint 3 (PKG-02: Circle Rate Valuation & Stamp Duty Calculator)  
**Authors:** Chief AI Engineering Orchestrator, Product & Legal Research Specialist, System Architect, Backend Engineer, QA Specialist  
**Status:** **STATUTORY ACCURACY RECONCILIATION COMPLETE (PRE-IMPLEMENTATION GATE)**  
**Target Milestone:** Milestone 5.8 / Sprint 3  
**Date:** November 1, 2026  

---

## 1. Executive Summary & Purpose

This final correction report resolves the remaining legal and architectural inaccuracies identified during independent review of the PKG-02 reconciliation. In accordance with owner instructions, no implementation code has been written and [`contracts/LandRegistry.sol`](file:///Users/lakshay/Desktop/Projects/Land-registry/contracts/LandRegistry.sol) remains 100% frozen.

This report establishes:
1. **Section 39 Surcharge Correction:** Removal of the unsupported `applicable_additional_duty_rate <= 0.02` database constraint, removal of claims that Section 39(5) establishes a universal 2% cap, verification of the operative 2% rate with statutory power to enhance up to 5% by Gazette, and formalization of Section 39(5) as a statutory cesser/repugnancy clause.
2. **Family Gift Deed Notification Correction:** Official citation and inspection of **Notification No. 01/2026/26/XCIV-2-2026-700(29)-2021 dated January 8, 2026** (superseding August 3, 2023), confirming the flat **₹5,000** stamp duty cap (correcting the previous typographical reference to ₹5,00,000), verifying eligible relatives, the 5-year lock-in restriction, natural-person exclusivity, expansion to commercial/industrial property, and registration fee treatment.
3. **Rural Exemption Citation Correction:** Correcting Section 39(3) from an "exemption" to an evidentiary disclosure provision under Section 27 of the Indian Stamp Act, and establishing that Section 39(1) applies strictly based on actual geographic location within a notified development area rather than abstract Khatauni land classification.
4. **Construction Valuation Wording:** Preserving the exact tripartite distinction under Rule 5 (non-commercial, single-unit commercial, shops in buildings other than single-unit commercial), and clarifying that the automated engine applies Collector card rates without independently introducing age depreciation deductions.
5. **Female Concession and Joint Ownership:** Direct anchoring to **Notification No. स.वि.क.नि.-5-462/11-2006-500(92)2005 dated February 23, 2006** as amended in 2025 (up to ₹1 Crore), rejecting the importation of Section 45 TPA as an automated tax concession, and holding joint male-female purchases strictly conditional under `CONCESSION_CONDITIONAL_MANUAL_VERIFICATION`.
6. **Recalculated Numerical Examples & Boundary Acceptance Tests:** Complete recalculation from first principles.

---

## 2. Item-by-Item Statutory Accuracy Corrections

### Correction 1: Section 39 UP Urban Planning & Development Act, 1973

#### A. The Legal Inaccuracies in Previous Draft
1. The previous draft claimed Section 39(5) establishes a universal 2.0% cap on additional stamp duty.
2. The SQLite database schema in `CIRCLE_RATE_SCHEDULES` enforced a hard constraint: `CHECK(applicable_additional_duty_rate <= 0.02)`.

#### B. The Exact Statutory Text & Ground Truth
- **Section 39(1) Base Levy & Proviso:**
  > *"The duty imposed by the Indian Stamp Act, 1899, on any instrument of sale, gift or usufructuary mortgage ... shall, in the case of an instrument relating to immovable property situated in the development area, be increased by two per cent on the value of the property or in the case of an usufructuary mortgage on the amount secured by the instrument:*  
  > *Provided that the State Government may, by notification in the Gazette, enhance the said percentage of increase in the stamp duty up to five."*
- **Section 39(5) Repugnancy & Cesser Clause:**
  > *"The provisions of clause (g) of sub-section (2) of Section 172 and Section 191 of the Uttar Pradesh Municipal Corporation Act, 1959, clause (xiii-B) of Section 128 and Section 128-A of the U.P. Municipalities Act, 1916, and Section 62 of the Uttar Pradesh Avas Evam Vikas Parishad Adhiniyam, 1965, shall, to the extent of repugnancy with the provisions of this section, cease to have effect..."*

#### C. Corrected Interpretation & System Changes
1. **Section 39(5) is NOT a 2% Cap:** It is an express **statutory cesser clause** that extinguishes conflicting transfer taxes under the Municipal Corporation Act, Municipalities Act, and Avas Vikas Act within a development area. Conflicting levies do not stack because those older enactments *cease to have effect* to the extent of repugnancy.
2. **Database Constraint Corrected:** The check constraint in `CIRCLE_RATE_SCHEDULES` is updated to:
   ```sql
   applicable_additional_duty_rate REAL NOT NULL DEFAULT 0.0 CHECK(
       applicable_additional_duty_rate >= 0.0 AND applicable_additional_duty_rate <= 0.05
   )
   ```
   This accommodates the statutory baseline of 0.02 and any future gazetted enhancement up to the statutory ceiling of 0.05.
3. **Current Operative Rate Status & Statute Differentiation:**
   - For **Urban Development Authorities (LDA, GDA, KDA, ADA)** governed by Section 39(1) of UP Act 30 of 1974, the operative rate remains at the baseline **2.0% (0.02)**; no notification enhancing the rate to 3%, 4%, or 5% has commenced.
   - For **Industrial Development Authorities (NOIDA, GNIDA, YEIDA)**, the surcharge is strictly fixed at **2.0% (0.02)** under **Section 11-B of the UP Industrial Area Development Act, 1976 (UP Act No. 6 of 1976)**, which contains NO executive enhancement power. Section 39 does NOT apply to NOIDA/GNIDA/YEIDA.
   - The engine models enabling statute and rate ceiling dynamically per schedule.

---

### Correction 2: Family Gift Deed Notification (January 8, 2026 Gazette)

#### A. The Legal Inaccuracies in Previous Draft
1. A table in the previous draft erroneously contained a typographical reference of "₹5,00,000" instead of ₹5,000 for family gift deed stamp duty.
2. The notification citation relied on older 2022/2023 orders rather than the superseding **January 8, 2026** notification.
3. The previous draft mischaracterized the 5-year lock-in breach as a Section 47-A undervaluation proceeding instead of Section 48 recovery of arrears.

#### B. Primary Source Details
- **Exact Official Document:** Uttar Pradesh Government Gazette Extraordinary.
- **Notification Number:** `Notification No. 01/2026/26/XCIV-2-2026-700(29)-2021`.
- **Date of Notification:** **January 8, 2026**.
- **Issuing Department:** Stamp and Registration Section-2 (*स्टाम्प एवं रजिस्ट्रेशन अनुभाग-2*), Government of Uttar Pradesh.
- **Enabling Statutory Power:** Section 9(1)(a) of the *Indian Stamp Act, 1899*.
- **Predecessor Enactments Superseded:** Supersedes Notification No. 12/2023/1025/94-एस.आर.-2-2023-700(29)/2021 dated August 3, 2023.

#### C. Verified Substantive Provisions
1. **Fixed Maximum Stamp Duty:** Capped strictly at a flat **₹5,000** under Section 9(1)(a) remission (regardless of property value).
2. **Registration Fee:** Section 9(1)(a) remits *stamp duty only*. The registration fee is governed independently under Section 78 of the *Registration Act, 1908*, capped administratively at **₹20,000 maximum**.
3. **Portal Processing Charge:** Flat **₹1,000** online portal fee on the IGRSUP portal.
4. **Expanded Property Scope:** Unlike the 2023 rules (which were restricted to agricultural and residential property), the January 8, 2026 notification explicitly expands the ₹5,000 cap to include **commercial and industrial properties**.
5. **Exclusively Natural Persons:** Applies strictly to transfers where both donor and donee are living human beings (natural persons). Any transfer involving a juristic entity (company, firm, society, trust, LLP) is strictly excluded.
6. **Eligible Family Members (Exhaustive Statutory Roster of 12 Relatives):**
   - Son (पुत्र), Daughter (पुत्री)
   - Father (पिता), Mother (माता)
   - Husband (पति), Wife (पत्नी)
   - Daughter-in-law / Son's wife (पुत्रवधू)
   - Son-in-law / Daughter's husband (दामाद)
   - Real brother (सगा भाई), Real sister (सगी बहन)
   - Widow of a deceased real brother (दिवंगत सगे भाई की विधवा)
   - Grandson or Granddaughter (पौत्र/पौत्री, नाती/नातिन — children of son or daughter).
7. **5-Year Anti-Alienation Lock-In Condition & Enforcement Mechanism:**
   - The donee must not transfer or alienate the gifted property for **5 years** from the date of registration.
   - If breached, the remission is deemed forfeited, and deficit stamp duty is recovered under **Section 48 of the Indian Stamp Act, 1899** (recovery of duties as arrears of land revenue).
   - Clarified that this is NOT a Section 47-A proceeding, as Section 47-A governs pre-registration market undervaluation references, not post-registration conditional exemption covenants.
8. **Indian Stamp Amendment Bill Status:** The draft Indian Stamp Bill 2024/2026 remains proposed central legislation. In accordance with owner directives, it is treated strictly as proposed and has zero legal force in Uttar Pradesh until state gazette commencement.

---

### Correction 3: Geographic Boundary Scope of Section 39 vs. "Rural Exemption"

#### A. The Legal Inaccuracy in Previous Draft
The previous draft cited Section 39(3) as creating a substantive "Rural Gram Panchayat Exemption".

#### B. The Exact Statutory Mechanism
- Section 39(3) is an **evidentiary disclosure mandate** amending Section 27 of the Indian Stamp Act, 1899:
  > *"Section 27 of the Indian Stamp Act, 1899, shall be read as if it specifically required the particulars to be set forth separately in respect of property situated within the development area and property situated outside such area."*
- Section 39(3) does not grant an exemption; it commands deed writers to disclose whether land falls inside or outside the development area.
- Non-applicability outside a development area flows directly from the substantive geographic scope of **Section 39(1)**, which restricts the additional duty to immovable property *"situated in the development area"*.
- **Critical Operational Implication:** A parcel located in a rural revenue village (with Khatauni agricultural records) that falls **inside** the territorial boundaries of a notified Development Authority (e.g. peri-urban villages within LDA or GDA master plan limits) **DOES attract the Section 39 additional duty**! Development-area status cannot be inferred merely from Khatauni agricultural or rural status. The engine must evaluate the actual cadastral boundary against the relevant gazette notification issued under Section 3 of the 1973 Act.

---

### Correction 4: Rule 5 Construction Valuation Distinction & Automated Depreciation

#### A. The Inaccuracy in Previous Draft
The previous draft described "0% commercial depreciation" as an explicit statutory mandate of Rule 5 and used colloquial terms for building classifications.

#### B. Exact Statutory Distinctions under Rule 5 (UP Stamp Valuation Rules 1997)
Rule 5 establishes three distinct building assessment methodologies:
1. **Clause (b) — Non-Commercial Buildings:**
   Calculation based on the minimum value of land plus the constructed area of each floor multiplied by the minimum construction rate per square metre fixed by the Collector under Rule 4.
2. **Clause (c) — Single-Unit Shops and Commercial Establishments:**
   Calculation based on the minimum value of land (whether covered by construction or not) plus the constructed area of each floor multiplied by the commercial rates/rent fixed by the Collector under Rule 4.
3. **Clause (d) — Commercial Establishments or Shops in Buildings Other than Single-Unit Commercial Buildings:**
   In multi-unit commercial complexes, shopping plazas, and multi-storey commercial buildings, calculation is based strictly on **carpet area** multiplied by the Collector-fixed commercial carpet rate under Rule 4 (undivided land share is subsumed).

#### C. Corrected Formulation on Age Depreciation
- **Parent Rule 5 contains zero age-depreciation schedules for any building category.**
- The automated calculation engine applies the applicable Collector-fixed card rates directly and **does not independently introduce an age-depreciation deduction** unless an applicable official instruction explicitly authorizes it.
- In administrative practice, commercial properties never receive depreciation deductions under Collector general instructions. For non-commercial buildings, any claim of structural obsolescence or physical decay requires physical spot inspection and adjudication by the Sub-Registrar or Collector of Stamps under Section 47-A.

---

### Correction 5: Female Concession & Joint Ownership Tax Strictness (Notifications 462 & 1504)

#### A. The Inaccuracy in Previous Draft
The previous draft assumed that Section 45 of the Transfer of Property Act, 1882 independently creates entitlement to a pro-rata tax concession for joint male-female purchases online.

#### B. Primary Statutory Ground Truth
- **Foundational Notification:** Issued under Section 9(1)(a) of the *Indian Stamp Act, 1899* vide **Notification No. स.वि.क.नि.-5-462/11-2006-500(92)2005 dated February 23, 2006** by Institutional Finance, Tax and Registration Section-5 (*सं.वि.क.नि.-5*), Government of Uttar Pradesh.
- **2025 Cabinet Amendment:** Expanded the eligible valuation threshold from ₹10 Lakhs to **₹1,00,00,000 (₹1 Crore)** (Notification dated July 29, 2025), allowing a 1% rebate up to a maximum benefit of **₹1,00,000**.
- **Joint Purchase Specification Rule (Notification 1504 of July 6, 2006):** Governs joint purchases:
  - If the deed does **not** specify the female purchaser's distinct share, **ZERO concession** applies.
  - Even if shares are specified in deed recitals, Section 45 TPA cannot create an automated tax deduction online under the strict construction doctrine (*Commissioner of Customs v. Dilip Kumar & Co. (2018) 9 SCC 1*).
- **Engine Rule:**
  - `SOLE_FEMALE` / `ALL_FEMALE_JOINT`: 1.0% rebate on dutiable value up to ₹1 Crore (max ₹1,00,000 benefit) is **AUTOMATED**.
  - `JOINT_MALE_FEMALE`: The automated engine applies **₹0.00 rebate** and issues operational flag `CONCESSION_CONDITIONAL_MANUAL_VERIFICATION`. The transaction requires manual adjudication by the Sub-Registrar under Section 31/47-A upon physical inspection of deed recitals.

---

## 3. Recalculated Worked Examples (First Principles)

> [!NOTE]
> **SYNTHETIC ILLUSTRATIVE FIGURES:** The numerical rates, areas, and values used below are synthetic illustrative figures for calculation modeling only and do not represent published government circle rate schedules.

### Example 1: Lucknow Urban Residential Plot (LDA Development Area, Sole Female Buyer)
* **Cadastral & Planning Context:**
  - District: `Lucknow` (`LKO`), Tehsil: `Sadar` (`SDR`), Village: `Chinhat` (`VL042`).
  - Planning Status: Situated within the notified development area of the Lucknow Development Authority (LDA) under UP Act 30 of 1974 $\implies$ **Section 39(1) applies**.
  - Operative Section 39 Surcharge Rate: **2.0%** (no enhanced rate notified; State Government retains power to enhance up to 5% by Gazette).
  - Conflicting Local Levies: Cease to have effect under Section 39(5).
  - Land Area: $200.0\text{ m}^2$ | Land Use: `residential` | Base Circle Rate: ₹$25,000/\text{m}^2$.
  - Road Width Multiplier: Defaults to $1.00\times$ in standard schedule.
  - Construction: `unconstructed` ($0\text{ m}^2$).
  - Declared Consideration: ₹$55,00,000$ (₹55 Lakhs).
  - Buyer Category: `SOLE_FEMALE` (Eligible under Notification 462/2006 as amended).

* **Mathematical Calculations:**
  1. $V_{\text{land}} = 200 \times 25,000 \times 1.00 = \mathbf{₹50,00,000}$
  2. $V_{\text{const}} = \mathbf{₹0}$
  3. $V_{\text{circle}} = \mathbf{₹50,00,000}$
  4. Assessable Dutiable Base (Schedule I-B Art 23): $V_{\text{dutiable}} = \max(55,00,000, 50,00,000) = \mathbf{₹55,00,000}$ *(Declared consideration governs)*
  5. Base Stamp Duty (5.0%, Sch 1-B Art 23): $55,00,000 \times 0.05 = \mathbf{₹2,75,000}$
  6. Development Authority Surcharge (2.0%, Sec 39(1)): $55,00,000 \times 0.02 = \mathbf{₹1,10,000}$
  7. Female Purchaser Concession (1.0% up to ₹1 Cr): $\min(55,00,000 \times 0.01, 100000) = -\mathbf{₹55,000}$
  8. Net Stamp Duty Payable: $2,75,000 + 1,10,000 - 55,000 = \mathbf{₹3,30,000}$
  9. Registration Fee (1.0% Uncapped, min ₹100 under Section 78):
     $$\max(100, 55,00,000 \times 0.01) = \mathbf{₹55,000}$$
  10. **Total Statutory Dues:** $3,30,000 + 55,000 = \mathbf{₹3,85,000}$.

---

### Example 2: Gautam Buddha Nagar Commercial Single-Unit Building (NOIDA Area, Male Buyer)
* **Cadastral & Planning Context:**
  - District: `Gautam Buddha Nagar` (`GBN`), Tehsil: `Dadri` (`DDR`), Locality: `Sector 62` (`SEC062`).
  - Planning Status: Situated within NOIDA Industrial Development Area $\implies$ **Section 11-B of UP Industrial Area Development Act, 1976 applies** (strictly fixed 2.0% surcharge; municipal taxes excluded under Article 243-Q). Section 39 does NOT apply.
  - Operative Surcharge Rate: **2.0% fixed** (zero enhancement power).
  - Municipal Levies: Constitutionally barred under Proviso to Article 243Q(1).
  - Land Area: $150.0\text{ m}^2$ | Commercial Land Base Rate: ₹$85,000/\text{m}^2$ (Road multiplier $\equiv 1.00\times$).
  - Construction: Single-Unit Commercial Building (Rule 5(1)(c)), Covered Area: $220.0\text{ m}^2$.
  - Collector Commercial Construction Card Rate: ₹$24,000/\text{m}^2$.
  - Age: 15 years $\implies$ No age depreciation deduction is introduced by automated engine under Rule 5.
  - Declared Consideration: ₹$2,20,00,000$ (₹2.20 Crore).
  - Buyer Category: `MALE`.

* **Mathematical Calculations:**
  1. $V_{\text{land}} = 150 \times 85,000 \times 1.00 = \mathbf{₹1,27,50,000}$
  2. $V_{\text{const}} = 220 \times 24,000 = \mathbf{₹52,80,000}$
  3. $V_{\text{circle}} = 1,27,50,000 + 52,80,000 = \mathbf{₹1,80,30,000}$
  4. Assessable Dutiable Base (Schedule I-B Art 23): $V_{\text{dutiable}} = \max(2,20,00,000, 1,80,30,000) = \mathbf{₹2,20,00,000}$ *(Declared consideration governs)*
  5. Base Stamp Duty (5.0%): $2,20,00,000 \times 0.05 = \mathbf{₹11,00,000}$
  6. NOIDA Section 11-B Surcharge (2.0%): $2,20,00,000 \times 0.02 = \mathbf{₹4,40,000}$
  7. Female Concession: $\mathbf{₹0}$ *(Male buyer)*
  8. Net Stamp Duty Payable: $11,00,000 + 4,40,000 = \mathbf{₹15,40,000}$
  9. Registration Fee (1.0% Uncapped under Section 78):
     $$2,20,00,000 \times 0.01 = \mathbf{₹2,20,000}$$
  10. **Total Statutory Dues:** $15,40,000 + 2,20,000 = \mathbf{₹17,60,000}$.

---

### Example 3: Barabanki Rural Agricultural Parcel (Outside Development Area, Joint Buyers)
* **Cadastral & Planning Context:**
  - District: `Barabanki` (`BBK`), Tehsil: `Ramnagar` (`RMN`), Village: `Fatehpur` (`VL108`).
  - Geographic Boundary: Verified as lying outside any notified Development Area, Avas Vikas scheme, or Municipal limits $\implies$ **Section 39(1) does not apply; Surcharge = 0.0%**.
  - Land Area: $4,000.0\text{ m}^2$ (0.40 Ha) | Base Agricultural Rate: ₹$800/\text{m}^2$ (Road multiplier $\equiv 1.00\times$).
  - Construction: `unconstructed` ($0\text{ m}^2$).
  - Declared Consideration: ₹$30,00,000$ (₹30 Lakhs).
  - Buyers: Joint Male-Female (`JOINT_MALE_FEMALE`).

* **Mathematical Calculations:**
  1. $V_{\text{land}} = 4,000 \times 800 \times 1.00 = \mathbf{₹32,00,000}$
  2. $V_{\text{const}} = \mathbf{₹0}$
  3. $V_{\text{circle}} = \mathbf{₹32,00,000}$
  4. Assessable Dutiable Base (Schedule I-B Art 23): $V_{\text{dutiable}} = \max(30,00,000, 32,00,000) = \mathbf{₹32,00,000}$ *(Circle rate floor overrides)*
  5. Base Stamp Duty (5.0%): $32,00,000 \times 0.05 = \mathbf{₹1,60,000}$
  6. Development Surcharge: $\mathbf{₹0}$ *(Parcel verified outside development area)*
  7. Female Purchaser Concession:
     - Under Notification 1504 and strict construction of Notification 462/2006, tax remissions do not provide an automated joint pro-rata formula.
     - Section 45 TPA cannot create an automated tax deduction online.
     - **Automated Concession:** $\mathbf{₹0.00}$.
     - **Emitted Operational Audit Flag:** `CONCESSION_CONDITIONAL_MANUAL_VERIFICATION`.
     - *Advisory Notice:* Joint male-female concession requires manual SRO adjudication under Section 31/47-A upon physical inspection of deed recitals.
  8. Net Stamp Duty Payable: $1,60,000 + 0 - 0 = \mathbf{₹1,60,000}$
  9. Registration Fee (1.0% Uncapped under Section 78):
     $$32,00,000 \times 0.01 = \mathbf{₹32,000}$$
  10. **Total Statutory Dues:** $160,000 + 32,000 = \mathbf{₹1,92,000}$.

---

### Example 4: Concessional Family Gift Deed (Jan 8, 2026 Notification)
* **Cadastral & Planning Context:**
  - District: `Lucknow` (`LKO`), Tehsil: `Sadar` (`SDR`), Village: `Chinhat` (`VL042`).
  - Instrument: `FAMILY_GIFT_JAN2026` (Living natural persons, father to son).
  - Circle Rate Valuation: ₹$40,00,000$.
  - Statutory Exemption Covenant: 5-year anti-alienation lock-in (enforced under Section 48 arrears recovery).

* **Mathematical Calculations:**
  1. $V_{\text{circle}} = \mathbf{₹40,00,000}$
  2. Remitted Stamp Duty (Notification 01/2026/26 under Sec 9(1)(a)): **Flat ₹5,000**
  3. Registration Fee (Section 78 Capped): $\min(40,00,000 \times 0.01, 20000) = \mathbf{₹20,000}$
  4. IGRSUP Portal Processing Fee: **₹1,000**
  5. **Total Statutory Dues:** $5,000 + 20,000 + 1,000 = \mathbf{₹26,000}$.

---

## 4. Reconciled Acceptance Test Matrix Additions

The acceptance test matrix ([`PKG02_ACCEPTANCE_TEST_MATRIX.md`](file:///Users/lakshay/Desktop/Projects/Land-registry/Docs/valuation/PKG02_ACCEPTANCE_TEST_MATRIX.md)) is expanded to include dedicated test cases for the corrected statutory vectors:

1. **TC-JUR-034 (Enhanced Section 39 Rate Test):**  
   Verifies that the engine dynamically accepts an officially gazetted enhanced Section 39 rate (e.g. 3.0% / 0.03 or 4.0% / 0.04 up to 5.0% / 0.05) when configured in `CIRCLE_RATE_SCHEDULES`, proving removal of the hardcoded 2% cap constraint.
2. **TC-JUR-035 (Section 39(5) Repugnancy & Anti-Stacking Test):**  
   Asserts that where a parcel falls in an overlapping Development Authority and Municipal Corporation boundary, the Municipal transfer tax under Section 172/173 ceases to have effect, and only the Section 39 surcharge is computed.
3. **TC-JUR-036 (Development Area Boundary vs. Agricultural Status Test):**  
   Verifies that an agricultural parcel situated within LDA peri-urban notified master plan limits correctly attracts the Section 39 additional duty, proving that development-area status is determined by geographic boundary rather than agricultural land-use classification.
4. **TC-GIFT-037 (January 8, 2026 Family Gift Deed Concession Test):**  
   Validates a ₹2 Crore commercial gift deed from father to son under Notification No. 01/2026/26/XCIV-2-2026-700(29)-2021:
   - Stamp Duty: Strictly **₹5,000 flat** (asserts $\neq ₹10,00,000$).
   - Registration Fee: Capped at **₹20,000**.
   - Processing Fee: **₹1,000**.
5. **TC-GIFT-038 (Family Gift Deed Ineligibility Test):**  
   Validates that a gift deed involving a private trust or corporate entity, or an ineligible relation (e.g. cousin), fails-closed and is assessed at standard conveyance rates (5% base + surcharges + 1% uncapped fee).
6. **TC-FEM-039 (Joint Male-Female Manual Verification Flag Test):**  
   Validates that a joint male-female purchase receives ₹0 automated rebate and emits `CONCESSION_CONDITIONAL_MANUAL_VERIFICATION`.
7. **TC-CONST-040 (Rule 5 Tripartite Structure Valuation Test):**  
   Executes non-commercial (land + covered area), single-unit commercial (land + covered area), and multi-unit complex (carpet area only) calculations with zero automated age depreciation deductions.

---

## 5. Master Before vs. After Correction Summary

| Statutory Issue | Previous Reconciliation Draft | Corrected Final Ground Truth | Legal Authority & Citation |
|:---|:---|:---|:---|
| **Section 39 Surcharge Cap** | Asserted Section 39(5) creates a universal 2% cap; database constraint `<= 0.02`. | Section 39(1) sets default 2% with power to enhance up to 5% by Gazette. Section 39(5) is a repugnancy/cesser clause. Database constraint updated to `<= 0.05`. | Section 39(1) proviso & Section 39(5), *UP Act No. 30 of 1974*. |
| **Family Gift Deed Notification** | Typographical error ₹5,00,000; referenced older 2022/2023 orders. | Flat **₹5,000 stamp duty cap**, ₹1,000 fee, ₹20,000 capped reg fee; 5-year lock-in; natural persons only; expanded to commercial/industrial. | Notification No. 01/2026/26/XCIV-2-2026-700(29)-2021 dated **January 8, 2026**. |
| **Rural Area Surcharge Status** | Cited Section 39(3) as a substantive "rural exemption". | Corrected: Section 39(3) is an evidentiary disclosure rule under Sec 27 Stamp Act. Surcharge non-applicability flows from Section 39(1) geographic scope. Rural land inside development boundary attracts surcharge. | Section 39(1) & 39(3), *UP Act No. 30 of 1974*. |
| **Commercial 0% Depreciation** | Characterized as an explicit statutory mandate of Rule 5. | Parent Rule 5 does not contain age-depreciation deductions for any building class. Automated engine applies Collector card rates directly without synthetic deductions. | Rule 5, *UP Stamp Valuation Rules 1997* & Collector General Instructions. |
| **Female Joint Concession** | Imported Section 45 TPA as an automated pro-rata tax rebate engine. | Tax remissions must be strictly construed. Notification 462/2006 does not provide an automated joint pro-rata formula. Joint purchases receive ₹0 automated rebate and flag `CONCESSION_CONDITIONAL_MANUAL_VERIFICATION`. | Section 9(1)(a) Stamp Act; Notification No. 462/2006 (Feb 23, 2006) as amended 2025; *Dilip Kumar* doctrine. |

---

## 6. Final Statutory Accuracy Verdict

### Verdict: **CONDITIONALLY READY**
- **Condition:** All statutory and mathematical specifications are now reconciled against primary Gazette texts and legislative enactments. However, in accordance with the user's explicit directive:
  > *"Specialist-agent sign-off does NOT replace independent legal counsel."*
- Implementation must remain strictly paused pending explicit Project Owner review and formal implementation authorization.
- Zero code modifications have been made to repository implementation files or [`contracts/LandRegistry.sol`](file:///Users/lakshay/Desktop/Projects/Land-registry/contracts/LandRegistry.sol).
