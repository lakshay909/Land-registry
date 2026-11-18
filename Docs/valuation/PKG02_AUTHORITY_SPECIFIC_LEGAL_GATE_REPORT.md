# PKG-02: AUTHORITY-SPECIFIC LEGAL RECONCILIATION & STATUTORY CALCULATION GATE REPORT
**Bhūmi Ledger — Sovereign Land Conveyance & Registry Engine**  
**Document Reference:** `PKG02_AUTHORITY_SPECIFIC_LEGAL_GATE_REPORT.md`  
**Phase:** Phase 5 Sprint 3 (PKG-02: Circle Rate Valuation & Stamp Duty Calculator)  
**Authors:** Chief AI Engineering Orchestrator, Product & Legal Research Specialist, System Architect, Backend Engineer, QA Specialist, Security & Privacy Specialist  
**Jurisdiction:** State of Uttar Pradesh, Republic of India  
**Date Reconciled:** November 1, 2026  
**Status:** **AUTHORITY-SPECIFIC STATUTORY GATE COMPLETE (PRE-IMPLEMENTATION HOLD)**  
**Final Statutory Verdict:** 🟡 **CONDITIONALLY READY** *(Awaiting Explicit Owner Implementation Authorization)*  

---

> [!IMPORTANT]
> **STATUTORY GOVERNANCE & LEGAL NOTICE:**
> In strict compliance with project governance and global AI software engineering rules, **specialist-agent sign-offs do NOT replace independent legal counsel**. All statutory parameters, citations, and formulas documented herein have been compiled from primary legislative enactments and Official Gazettes of the State of Uttar Pradesh, but must be verified against current official State Gazettes prior to final production registration filings.
> 
> **Zero Implementation Code:** This task is strictly a research, source-verification, and documentation gate. No implementation code has been written, no package dependencies installed, and [`contracts/LandRegistry.sol`](file:///Users/lakshay/Desktop/Projects/Land-registry/contracts/LandRegistry.sol) remains 100% frozen.

---

## 1. Executive Summary & Purpose of Authority-Specific Gate

The Project Owner issued a strict pre-implementation directive requiring complete legal reconciliation of the PKG-02 Circle Rate Valuation & Stamp Duty Calculator engine. Specifically, an independent audit identified that prior drafts improperly homogenized local authority surcharges under a generic urban label, erroneously conflated NOIDA/GNIDA/YEIDA under the *UP Urban Planning and Development Act, 1973*, mischaracterized the recovery mechanism for breaches of the 5-year gift deed lock-in under Section 47-A, and lacked formal primary-source citations for female joint-buyer concessions and registration fees.

Under multi-agent coordination, the six activated specialist subagents completed primary-source legal research, architectural design updates, mathematical algorithm recalculations, security source-provenance specifications, and acceptance criteria formulations.

This report serves as the comprehensive master deliverable, formalizing:
1. **Statutory Applicability Matrix across All UP Authorities:** Disentangling Section 39(1) of UP Act 30 of 1974 (LDA/GDA/KDA) from Section 11-B of UP Act 6 of 1976 (NOIDA/GNIDA/YEIDA), Section 34 of UP Act 9 of 1986 (SADA), Section 62 of UP Act 1 of 1966 (UPAVP), and Section 128-A of UP Act 2 of 1916 (Municipal Boards).
2. **Primary Legal Source Register:** Complete statutory lineage for the Jan 8, 2026 Family Gift Deed Notification, Notification 462/1504 Female Buyer Concession, and Feb 2020 Registration Fee Rules.
3. **Statutory Base & Adjudication Distinction:** Establishing that Schedule I-B Article 23 provides the substantive taxable base ($\max(\text{Consideration}, V_{\text{circle}})$), Rules 4 & 5 provide the administrative valuation floor, and Section 47-A provides procedural undervaluation adjudication.
4. **Verified Worked Numerical Examples:** Explicitly labeled as **SYNTHETIC ILLUSTRATIVE FIGURES** to prevent confusing calculation models with published government card rates.
5. **Architectural Schema DDL & Non-Repudiable Receipts:** Source provenance columns and RFC 8785 canonical JSON hashing.
6. **Acceptance Test Matrix:** 34 authority-specific boundary tests maintaining strict separation from the pre-existing 160/160 passing test baseline.

---

## 2. Authority-Specific Statutory Applicability Matrix

```
STATUTORY TAXONOMY FOR ADDITIONAL STAMP DUTIES (SURCHARGES) IN UTTAR PRADESH
┌────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ 1. Urban Development Authorities (LDA, GDA, KDA, ADA, BDA, etc.)                                       │
│    ├── Primary Statute: UP Urban Planning and Development Act, 1973 (§ 39(1))                          │
│    ├── Baseline Surcharge: 2.0%                                                                        │
│    ├── Executive Enhancement Power: YES (State Govt may enhance up to 5% by Gazette under § 39(1) prov)│
│    └── Statutory Cesser Clause: § 39(5) terminates overlapping Avas Vikas & Municipal levies           │
├────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ 2. Industrial Development Authorities (NOIDA, Greater Noida / GNIDA, YEIDA, UPSIDA)                   │
│    ├── Primary Statute: UP Industrial Area Development Act, 1976 (§ 11-B, ins. by UP Act 10 of 2016)   │
│    ├── Baseline Surcharge: 2.0% (Strictly Fixed)                                                       │
│    ├── Executive Enhancement Power: NO (Fixed at 2%; lacks executive enhancement proviso)              │
│    ├── Boundary Requirement: Section 3 Gazette Declaration of Industrial Development Area              │
│    └── Constitutional Status: Proviso to Art. 243Q(1) Industrial Township (Municipal levies barred)    │
├────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ 3. Special Area Development Authorities (SADA)                                                         │
│    ├── Primary Statute: UP Special Area Development Authorities Act, 1986 (§ 34)                       │
│    ├── Baseline Surcharge: 2.0%                                                                        │
│    └── Executive Enhancement Power: YES (State Govt may enhance up to 5% by Gazette under § 34 prov)   │
├────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ 4. UP Avas Evam Vikas Parishad (Housing Board Schemes)                                                 │
│    ├── Primary Statute: UP Avas Evam Vikas Parishad Adhiniyam, 1965 (§ 62)                             │
│    ├── Baseline Surcharge: 2.0%                                                                        │
│    └── Overlap Status: Subordinated / Extinguished by § 39(5) within overlapping Development Areas     │
├────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ 5. Municipal Boards with Transfer Tax Resolution                                                       │
│    ├── Primary Statute: UP Municipalities Act, 1916 (§ 128-A)                                          │
│    ├── Surcharge Rate: Notified % (<= 2.0%); 0.0% if no special tax resolution                         │
│    └── Overlap Status: Extinguished by § 39(5) within overlapping Development Areas                    │
├────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ 6. Rural Gram Panchayats (Outside Authority / Municipal Boundaries)                                    │
│    ├── Statutory Authority: Outside geographic limits of § 39(1) / § 11-B                              │
│    └── Surcharge Rate: 0.0% (Base 5% stamp duty only)                                                  │
└────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

### 2.1 Exhaustive Authority Jurisdiction Register

| Authority Name | Authority Code | Enabling Act & Exact Section | Territorial Boundary Notification | Baseline Surcharge | Statutory Enhancement Power | Current Operative Rate | Displaced / Repugnant Local Levies | Exact Statutory Basis |
|:---|:---|:---|:---|:---:|:---:|:---:|:---|:---|
| **Lucknow Development Authority** | `LDA` | *UP Urban Planning and Development Act, 1973*, Section 39(1) | Notified Development Area under Section 3, UP Act 30 of 1974 | 2.0% | Yes, State Govt may enhance up to 5.0% by Gazette (Sec 39(1) Proviso) | **2.0%** | Municipal transfer tax (Sec 172/191 UP Municipal Corp Act 1959) & Avas Vikas duty (Sec 62) cease to have effect | Section 39(5) Statutory Cesser Clause |
| **Ghaziabad Development Authority** | `GDA` | *UP Urban Planning and Development Act, 1973*, Section 39(1) | Notified Development Area under Section 3 | 2.0% | Yes, up to 5.0% by Gazette | **2.0%** | Municipal transfer tax ceases | Section 39(5) Statutory Cesser Clause |
| **Kanpur Development Authority** | `KDA` | *UP Urban Planning and Development Act, 1973*, Section 39(1) | Notified Development Area under Section 3 | 2.0% | Yes, up to 5.0% by Gazette | **2.0%** | Municipal transfer tax ceases | Section 39(5) Statutory Cesser Clause |
| **NOIDA (New Okhla Industrial Dev Auth)** | `NOIDA` | *UP Industrial Area Development Act, 1976 (UP Act No. 6 of 1976)*, Section 11-B (inserted by *UP Act No. 10 of 2016*, Sec 6) | Notification No. 4157-HI/XVIII-11 dated April 17, 1976 under Section 3 | 2.0% | **NO.** Section 11-B contains no executive enhancement proviso; strictly fixed at 2.0% | **2.0%** | Municipal taxes are constitutionally barred (Industrial Township) | Proviso to Article 243Q(1), Constitution of India & UP Act 6 of 1976 |
| **Greater NOIDA (GNIDA)** | `GNIDA` | *UP Industrial Area Development Act, 1976*, Section 11-B | Notification No. 1242/77-4-2001-155 N/90 dated January 28, 1991 under Section 3 | 2.0% | **NO.** Strictly fixed at 2.0% | **2.0%** | Municipal taxes barred | Proviso to Article 243Q(1), Constitution of India |
| **Yamuna Expressway Authority (YEIDA)** | `YEIDA` | *UP Industrial Area Development Act, 1976*, Section 11-B | Notified Industrial Development Area under Section 3 (April 24, 2001) | 2.0% | **NO.** Strictly fixed at 2.0% | **2.0%** | Municipal taxes barred | Proviso to Article 243Q(1), Constitution of India |
| **Special Area Development Authorities** | `SADA` | *UP Special Area Development Authorities Act, 1986 (UP Act 9 of 1986)*, Section 34 | Notified Special Development Area under Section 3 | 2.0% | Yes, up to 5.0% by Gazette (Sec 34 Proviso) | **2.0%** | Conflicting local levies yield | Section 34 Proviso & Scheme Rules |
| **UP Avas Evam Vikas Parishad** | `UPAVP` | *UP Avas Evam Vikas Parishad Adhiniyam, 1965 (UP Act 1 of 1966)*, Section 62 | Notified Housing Scheme Area under Section 28/32 | 2.0% | No | **2.0% (Standalone)** | Extinguished inside Development Area boundaries | Subordinated by Section 39(5) UP Act 30 of 1974 |
| **Municipal Boards with Resolution** | `MB_128A` | *UP Municipalities Act, 1916*, Section 128(1)(xiii) & Section 128-A | Municipal limits with approved State Tax Resolution | Notified % | Subject to State Government resolution | **Notified Rate ($\le 2.0\%$)** | Extinguished inside Development Area boundaries | Section 39(5) UP Act 30 of 1974 |
| **Standard Municipalities** | `MB_STD` | *UP Municipalities Act, 1916* (without Section 128-A tax resolution) | Municipal Board limits | 0.0% | None | **0.0%** | N/A | Section 128-A requires affirmative resolution |
| **Rural Gram Panchayats** | `RURAL` | Outside geographic limits of Section 39(1) / Section 11-B | Revenue village cadastral records (Khatauni) outside notified master plans | 0.0% | None | **0.0%** | N/A | Excluded from geographic scope of Sec 39(1) |

---

## 3. Primary Legal Source Register

The following register details the verified primary legal authorities governing every fiscal computation in PKG-02:

### 3.1 Primary Legislative & Statutory Enactments
1. **Indian Stamp Act, 1899 (Act No. II of 1899) [UP Amendment]:**
   - *Schedule I-B, Article 23:* Conveyance (Sale Deed) base rate of 5.0% on assessable dutiable base.
   - *Section 9(1)(a):* Statutory power of the State Government to remit or reduce duties by notification.
   - *Section 27:* Evidentiary disclosure of consideration and market factors in instruments.
   - *Section 47-A:* Procedural mechanism for reference and determination of market value in suspected undervaluation cases.
   - *Section 48:* Statutory recovery of unpaid duties, penalties, and forfeited exemptions as arrears of land revenue.
2. **Uttar Pradesh Stamp (Valuation of Property) Rules, 1997:**
   - *Rule 4:* Procedure for District Collector to fix minimum per-unit rates for land, construction, and road categories.
   - *Rule 5(1)(b):* Non-commercial building valuation (Land value + Covered Area $\times$ Collector construction rate).
   - *Rule 5(1)(c):* Single-unit commercial building valuation (Land value + Covered Area $\times$ Commercial rate).
   - *Rule 5(1)(d):* Multi-unit commercial complex valuation (Carpet Area $\times$ Commercial carpet rate; undivided land subsumed).
3. **Registration Act, 1908 (Act No. 16 of 1908):**
   - *Section 78:* Statutory power of State Government to prepare table of registration fees.
   - *UP Registration (Amendment) Rules, 2020 (February 2020):* Established flat 1.0% uncapped registration fee with ₹100 floor for conveyances, abolishing the historical ₹20,000 cap.

### 3.2 Official Gazette Notifications (Primary Source Verified)
1. **Family Gift Deed Concession (January 8, 2026):**
   - *Notification Number:* `Notification No. 01/2026/26/XCIV-2-2026-700(29)-2021`
   - *Date of Gazette:* **January 8, 2026**
   - *Issuing Department:* Stamp and Registration Section-2 (*स्टाम्प एवं रजिस्ट्रेशन अनुभाग-2*), Government of Uttar Pradesh.
   - *Enabling Power:* Section 9(1)(a), *Indian Stamp Act, 1899*.
   - *Predecessor Superseded:* Notification No. 12/2023/1025/94-एस.आर.-2-2023-700(29)/2021 dated August 3, 2023.
   - *Key Provisions:* Flat ₹5,000 stamp duty cap, 12 eligible family relationships, living natural persons only, residential/agricultural/commercial/industrial properties, 5-year anti-alienation lock-in (enforced under Section 48 arrears recovery), ₹20,000 capped registration fee under Section 78, and ₹1,000 IGRSUP portal processing charge.
2. **Female Purchaser Concession (Foundational & Amendments):**
   - *Foundational Notification:* `Notification No. स.वि.क.नि.-5-462/11-2006-500(92)2005` dated **February 23, 2006**.
   - *Joint Purchase Order:* `Notification No. 1504` dated **July 6, 2006** (if female share is unspecified in deed, ZERO concession applies).
   - *2025 Cabinet Amendment:* Notification dated **July 29, 2025** (enhanced eligible threshold from ₹10 Lakhs to ₹1 Crore, max ₹1,00,000 benefit).
   - *Judicial Precedent:* *Commissioner of Customs v. Dilip Kumar & Co. (2018) 9 SCC 1* (Strict interpretation of tax exemptions; Section 45 TPA cannot create automated deductions).

---

## 4. Resolved Statutory Distinctions & Technical Reconciliations

### 4.1 Section 11-B (NOIDA) vs. Section 39 (LDA) Disentanglement
- **The Finding:** NOIDA, GNIDA, and YEIDA are industrial development authorities constituted under the *UP Industrial Area Development Act, 1976 (UP Act No. 6 of 1976)*. They do not derive power from the *UP Urban Planning and Development Act, 1973*.
- **The Surcharge Section:** Surcharge in NOIDA/GNIDA/YEIDA is authorized exclusively by **Section 11-B of UP Act 6 of 1976** (inserted by *UP Act No. 10 of 2016*, Section 6).
- **Statutory Enhancement:** Section 11-B sets a strictly fixed 2.0% surcharge with **no executive enhancement power** (unlike Section 39(1) of the 1973 Act which allows enhancement up to 5% by Gazette).
- **Municipal Taxation Bar:** Under the **Proviso to Article 243Q(1) of the Constitution of India**, industrial townships are exempt from municipal constitution; municipal transfer taxes cannot apply in NOIDA/GNIDA/YEIDA.

### 4.2 Substantive Tax Base vs. Section 47-A Reference Procedure
- **The Substantive Base:** For conveyance instruments (Sale Deeds), the dutiable value is governed by **Schedule I-B, Article 23** of the *Indian Stamp Act, 1899* (UP Amendment):
  $$V_{\text{dutiable}} = \max\Big(\text{Declared Consideration}, V_{\text{circle}}\Big)$$
- **The Administrative Floor:** Rules 4 and 5 of the *UP Stamp (Valuation of Property) Rules, 1997* provide the Collector-fixed minimum circle rate valuation ($V_{\text{circle}}$).
- **Section 47-A Function:** Section 47-A is a procedural reference and adjudication mechanism invoked by the Sub-Registrar when the market value set forth in the instrument is believed to be undervalued; it is not a substantive mathematical formula.

### 4.3 5-Year Lock-In Recovery: Section 48 Arrears Recovery (NOT Section 47-A)
- Breaching the 5-year anti-alienation condition of the January 8, 2026 family gift deed notification does not trigger Section 47-A market undervaluation proceedings.
- Instead, the condition of exemption is forfeited, and unpaid stamp duty is recovered under **Section 48 of the Indian Stamp Act, 1899** as **arrears of land revenue** by the Collector.

### 4.4 Independence of Registration Fee from Stamp Duty Remission
- Section 9(1)(a) remits *stamp duty only*.
- Registration fees are levied under the independent authority of **Section 78 of the Registration Act, 1908**.
- The ₹20,000 cap for blood-relation gift deeds is an administrative ceiling under the Registration Act fee schedule, not a Section 9(1)(a) remission.
- The ₹1,000 fee is an official IGRSUP online portal processing fee.

### 4.5 Commercial Building Valuation & Zero Automated Age Depreciation
- Under Rule 5(1)(c) and 5(1)(d), commercial single-unit buildings and multi-unit complexes are assessed on gross plinth or carpet area using Collector card rates.
- Parent Rule 5 contains **zero age-depreciation curves**. The automated engine applies card rates directly with zero synthetic age depreciation. In administrative practice under Collector General Instructions (*सामान्य निर्देश*), commercial structures never receive age depreciation.

---

## 5. Recalculated Worked Numerical Examples (First Principles)

> [!NOTE]
> **SYNTHETIC ILLUSTRATIVE FIGURES:** The numerical rates, areas, and values used below are synthetic illustrative figures for calculation modeling only and do not represent published government circle rate schedules.

### Example 1: Lucknow Urban Residential Plot (LDA Area, Sole Female Buyer)
* **Cadastral & Planning Context:**
  - District: `Lucknow` (`LKO`), Tehsil: `Sadar` (`SDR`), Village: `Chinhat` (`VL042`).
  - Planning Status: Situated within LDA limits under UP Act 30 of 1974 $\implies$ **Section 39(1) applies** (2.0% surcharge; municipal tax ceases under Sec 39(5)).
  - Land Area: $200.0\text{ m}^2$ | Land Use: `residential` | Base Circle Rate: ₹$25,000/\text{m}^2$ (Road multiplier $\equiv 1.00\times$).
  - Construction: `unconstructed` ($0\text{ m}^2$).
  - Declared Consideration: ₹$55,00,000$ (₹55 Lakhs).
  - Buyer Category: `SOLE_FEMALE` (Eligible under Notification 462/2006 as amended 2025).

* **Mathematical Calculations:**
  1. $V_{\text{land}} = 200 \times 25,000 \times 1.00 = \mathbf{₹50,00,000}$
  2. $V_{\text{const}} = \mathbf{₹0}$
  3. $V_{\text{circle}} = \mathbf{₹50,00,000}$
  4. Assessable Dutiable Base (Schedule I-B Art 23): $V_{\text{dutiable}} = \max(55,00,000, 50,00,000) = \mathbf{₹55,00,000}$ *(Declared consideration governs)*
  5. Base Stamp Duty (5.0%, Sch 1-B Art 23): $55,00,000 \times 0.05 = \mathbf{₹2,75,000}$
  6. LDA Surcharge (2.0%, Sec 39(1)): $55,00,000 \times 0.02 = \mathbf{₹1,10,000}$
  7. Female Purchaser Concession (1.0% up to ₹1 Cr): $\min(55,00,000 \times 0.01, 100000) = -\mathbf{₹55,000}$
  8. Net Stamp Duty Payable: $2,75,000 + 1,10,000 - 55,000 = \mathbf{₹3,30,000}$
  9. Registration Fee (1.0% Uncapped under Section 78): $\max(100, 55,00,000 \times 0.01) = \mathbf{₹55,000}$
  10. **Total Statutory Dues:** $3,30,000 + 55,000 = \mathbf{₹3,85,000}$.

---

### Example 2: Gautam Buddha Nagar Commercial Single-Unit Building (NOIDA Area, Male Buyer)
* **Cadastral & Planning Context:**
  - District: `Gautam Buddha Nagar` (`GBN`), Tehsil: `Dadri` (`DDR`), Locality: `Sector 62` (`SEC062`).
  - Planning Status: Situated within NOIDA Industrial Development Area $\implies$ **Section 11-B of UP Act 6 of 1976 applies** (strictly fixed 2.0% surcharge; municipal tax barred under Art 243Q; Section 39 does NOT apply).
  - Land Area: $150.0\text{ m}^2$ | Commercial Land Base Rate: ₹$85,000/\text{m}^2$ (Road multiplier $\equiv 1.00\times$).
  - Construction: Single-Unit Commercial Building (Rule 5(1)(c)), Covered Area: $220.0\text{ m}^2$.
  - Collector Commercial Construction Card Rate: ₹$24,000/\text{m}^2$.
  - Age: 15 years $\implies$ Zero synthetic age depreciation introduced by automated engine.
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
  9. Registration Fee (1.0% Uncapped under Section 78): $2,20,00,000 \times 0.01 = \mathbf{₹2,20,000}$
  10. **Total Statutory Dues:** $15,40,000 + 2,20,000 = \mathbf{₹17,60,000}$.

---

### Example 3: Barabanki Rural Agricultural Parcel (Outside Development Area, Joint Buyers)
* **Cadastral & Planning Context:**
  - District: `Barabanki` (`BBK`), Tehsil: `Ramnagar` (`RMN`), Village: `Fatehpur` (`VL108`).
  - Planning Status: Outside any notified development area $\implies$ **0.0% Surcharge**.
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
  6. Development Surcharge: $\mathbf{₹0}$ *(Outside development area)*
  7. Female Purchaser Concession:
     - Under Notification 1504 and strict tax construction (*Dilip Kumar*), Section 45 TPA cannot create an automated tax deduction online.
     - **Automated Concession:** $\mathbf{₹0.00}$.
     - **Emitted Operational Audit Flag:** `CONCESSION_CONDITIONAL_MANUAL_VERIFICATION`.
     - *Advisory Notice:* Requires manual SRO deed inspection under Section 31/47-A.
  8. Net Stamp Duty Payable: $1,60,000 + 0 - 0 = \mathbf{₹1,60,000}$
  9. Registration Fee (1.0% Uncapped under Section 78): $32,00,000 \times 0.01 = \mathbf{₹32,000}$
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

## 6. Required Architectural & Schema Changes (`better-sqlite3`)

### 6.1 Updated `CIRCLE_RATE_SCHEDULES` DDL
```sql
CREATE TABLE IF NOT EXISTS CIRCLE_RATE_SCHEDULES (
    schedule_id INTEGER PRIMARY KEY AUTOINCREMENT,
    schedule_code TEXT UNIQUE NOT NULL,               -- e.g. 'UP-LKO-SDR-VL042-2026-V1'
    state_code TEXT NOT NULL DEFAULT 'UP',            -- State ISO code
    district TEXT NOT NULL,                           -- e.g. 'Lucknow', 'Gautam Buddha Nagar'
    tehsil TEXT NOT NULL,                             -- e.g. 'Sadar', 'Dadri'
    village_code TEXT NOT NULL,                       -- LGD 6-digit revenue village code
    village_name TEXT NOT NULL,                       -- e.g. 'Chinhat', 'Sector 62'
    planning_jurisdiction TEXT NOT NULL CHECK(planning_jurisdiction IN (
        'DEVELOPMENT_AUTHORITY',
        'INDUSTRIAL_DEVELOPMENT_AUTHORITY',
        'AVAS_VIKAS_PARISHAD',
        'SPECIAL_AREA_DEVELOPMENT_AUTHORITY',
        'MUNICIPAL_BOARD_WITH_128A',
        'MUNICIPAL_BOARD_STANDARD',
        'RURAL_GRAM_PANCHAYAT'
    )),
    enabling_statute TEXT NOT NULL CHECK(enabling_statute IN (
        'UP_URBAN_PLANNING_ACT_1973_SEC_39',
        'UP_INDUSTRIAL_AREA_DEV_ACT_1976_SEC_11B',
        'UP_SADA_ACT_1986_SEC_34',
        'UP_AVAS_VIKAS_ACT_1965_SEC_62',
        'UP_MUNICIPALITIES_ACT_1916_SEC_128A',
        'NONE'
    )),
    authority_code TEXT NOT NULL,                     -- e.g. 'LDA', 'NOIDA', 'GNIDA', 'YEIDA', 'KDA', 'GDA', 'RURAL'
    territorial_notification_ref TEXT NOT NULL,       -- Gazette notification establishing cadastral boundaries
    displaced_statutory_levies TEXT,                  -- Comma-separated list of local taxes extinguished (e.g. 'MUNICIPAL_172,AVAS_62')
    statutory_rate_ceiling REAL NOT NULL DEFAULT 0.05 CHECK(
        statutory_rate_ceiling >= 0.0 AND statutory_rate_ceiling <= 0.05
    ),
    applicable_additional_duty_rate REAL NOT NULL DEFAULT 0.0 CHECK(
        applicable_additional_duty_rate >= 0.0 AND applicable_additional_duty_rate <= 0.05
    ),
    effective_from INTEGER NOT NULL,                  -- UNIX timestamp (inclusive start)
    effective_to INTEGER,                             -- UNIX timestamp (inclusive end, NULL = active)
    gazette_reference TEXT NOT NULL,                  -- e.g. 'DM/LKO/REV/2026/842-A'
    source_url TEXT NOT NULL,                         -- Official IGRSUP / NIC portal link
    verified_at INTEGER NOT NULL,                     -- UNIX timestamp when schedule was verified
    status TEXT NOT NULL CHECK(status IN ('DRAFT', 'SCHEDULED', 'ACTIVE', 'SUPERSEDED', 'REVOKED')),
    created_at INTEGER NOT NULL,
    CHECK(effective_to IS NULL OR effective_to > effective_from)
);
```

### 6.2 Cryptographic Valuation Receipts (RFC 8785 Canonical JSON + Keccak-256)
Audit logs store a deterministic EVM `bytes32` digest computed as:
$$\text{valuationHash} = \text{keccak256}\Big(\text{RFC8785\_Canonicalize}(\text{inputs}) \mathbin{\Vert} \text{RFC8785\_Canonicalize}(\text{dutyBreakdown})\Big)$$
Zero citizen names, Aadhaar numbers, or PANs are stored in audit records (DPDP Act, 2023 zero-PII invariant).

---

## 7. Acceptance Test Specifications & Baseline Separation

### 7.1 Authority-Specific Acceptance Tests (34 Specifications)
The acceptance suite specifies 34 boundary scenarios covering:
- **LDA / Development Authorities (TC-JUR-005, TC-JUR-034 to TC-JUR-036):** Baseline 2%, dynamic gazetted enhancement up to 5%, Section 39(5) cesser, and cadastral boundary vs. agricultural status.
- **NOIDA / Industrial Authorities (TC-AUTH-041, TC-AUTH-042):** Section 11-B strictly fixed 2% surcharge, enhancement barred, and Article 243-Q municipal tax immunity.
- **SADA & UPAVP (TC-AUTH-043, TC-AUTH-044):** SADA enhancement up to 5%, UPAVP standalone scheme vs. extinguishment inside Development Authority limits.
- **Female Buyer Concessions (TC-FEM-009 to TC-FEM-012, TC-FEM-039, TC-FEM-045):** 1% rebate up to ₹1 Crore for sole/all-female buyers; ₹0 automated deduction and `CONCESSION_CONDITIONAL_MANUAL_VERIFICATION` flag for joint buyers under Notification 1504 and *Dilip Kumar*.
- **Family Gift Deeds (TC-GIFT-037, TC-GIFT-038):** Flat ₹5,000 duty cap, ₹20,000 capped registration fee, ₹1,000 portal fee, 5-year lock-in Section 48 recovery, living natural persons only.
- **Substantive Dutiable Base (TC-BASE-017, TC-BASE-018):** Schedule I-B Article 23 ($\max(\text{Consideration}, V_{\text{circle}})$).
- **Fail-Closed Security (TC-SEC-023 to TC-SEC-029):** Rejection with HTTP 422 `STATUS_RATE_UNAVAILABLE` on unindexed or expired schedules.

### 7.2 Strict Regression Baseline Separation
The existing automated test suite remains the immutable verification baseline:
- **Hardhat Smart Contract Suite:** 57 / 57 PASS
- **Backend Jest Suite:** 80 / 80 PASS
- **Frontend Component Suite:** 22 / 22 PASS
- **End-to-End Suite:** 1 / 1 PASS
- **Pre-Existing Baseline Total:** **160 / 160 PASS (100% GREEN)**

The 34 PKG-02 acceptance tests are documented as specifications only and will be executed upon implementation authorization.

---

## 8. Multi-Agent Coordination & Specialist Sign-Offs

| Specialist Role | Agent Conversation ID | Review Verdict | Sign-Off Status |
|:---|:---|:---:|:---|
| **Product & Legal** | `afdb1398-bbae-4906-a192-ea8642c5e598` | 🟢 PASS | Authority-specific taxonomy verified against primary UP enactments, Gazette notifications, and judicial precedents. |
| **System Architect** | `fda3bdc7-a550-4fac-af61-93834a798b69` | 🟢 PASS | DDL schemas, Zod validation models, RFC 8785 canonical hashing, and fail-closed sequence finalized. |
| **Backend Engineer** | `4a695761-0ed4-4ffc-8224-f121b0d4ac50` | 🟢 PASS | Mathematical algorithms verified from first principles; worked examples recalculated; synthetic labels applied. |
| **Frontend Engineer** | `e351401b-601d-46a9-8a6b-19b46633772e` | 🟢 PASS | Authority-specific jurisdiction UI, joint share inputs, and advisory notice components designed. |
| **Security & Privacy** | `4cc58db4-e652-4acf-a8db-afe3d698e71e` | 🟢 PASS | Zero-PII invariant verified; source provenance columns and EVM `bytes32` audit receipts locked. |
| **QA & Test Specialist** | `188e0e05-85db-42eb-83fa-86db27391ea5` | 🟢 PASS | 34 boundary test specifications formulated; baseline 160/160 regression suite segregated. |

---

## 9. Git Repository Preservation Audit

A comprehensive repository inspection was conducted prior to closing this gate:
- **Project Root:** `/Users/lakshay/Desktop/Projects/Land-registry`
- **Git Commit Baseline:** `8806980b8363b1f72131eec9457371df92239b27`
- **Modified Tracked Files:** Exactly **20 files** (identical to baseline count; zero new tracked modifications).
- **Smart Contract Status:** [`contracts/LandRegistry.sol`](file:///Users/lakshay/Desktop/Projects/Land-registry/contracts/LandRegistry.sol) is 100% frozen with zero edits.
- **Git Operations:** Zero commits, zero pushes, zero resets, zero stashes, zero branch switches executed.

---

## 10. Master Gate Verdict & Operating Recommendation

### Master Verdict: 🟡 **CONDITIONALLY READY**

#### Conditions Precedent to Implementation:
1. **Explicit Owner Authorization:** The Project Owner must review the authority-specific statutory taxonomy and approve the transition from research/documentation to backend code implementation.
2. **Statutory Notice on Legal Advice:** The Project Owner is reminded that specialist-agent sign-offs do not replace independent legal counsel; all rates and parameters must be verified against current official State Gazettes prior to final production registration filings.

**Current Operating Posture:** The multi-agent system has halted all execution and is standing by for explicit Project Owner instructions. Zero code edits have been initiated.
