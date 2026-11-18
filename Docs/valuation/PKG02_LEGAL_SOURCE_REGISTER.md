# PKG-02: LEGAL SOURCE REGISTER & STATUTORY RATE REPOSITORY
**Bhūmi Ledger — Sovereign Land Conveyance & Registry Engine**  
**Document Reference:** `PKG02_LEGAL_SOURCE_REGISTER.md`  
**Phase:** Phase 5 Sprint 3 (PKG-02: Circle Rate Valuation & Stamp Duty Calculator)  
**Author:** Product & Legal Research Specialist, Bhūmi Ledger  
**Reviewed by:** Chief AI Engineering Orchestrator, System Architect, Backend Engineer, QA Specialist, Security & Privacy Specialist  
**Jurisdiction:** State of Uttar Pradesh, Republic of India  
**Date Verified & Reconciled:** November 1, 2026  
**Status:** **APPROVED STATUTORY BASELINE (AUTHORITY-SPECIFIC RECONCILED COMPLIANCE)**  

---

## 1. Executive Legislative Summary & Statutory Authority Regimes

The Bhūmi Ledger PKG-02 Valuation Engine is strictly governed by the statutory framework of the State of Uttar Pradesh. Additional stamp duties (surcharges) are not fungible across authorities; each administrative authority derives its power from distinct parent enactments:

```
STATUTORY JURISDICTION TAXONOMY FOR ADDITIONAL STAMP DUTY IN UTTAR PRADESH
┌────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ 1. Urban Development Authorities (LDA, GDA, KDA, ADA, BDA, etc.)                                       │
│    ├── Primary Statute: UP Urban Planning and Development Act, 1973 (§ 39(1))                          │
│    ├── Current Surcharge Rate: 2.0%                                                                    │
│    ├── Executive Enhancement Power: YES (State Govt may enhance up to 5% by Gazette under § 39(1) prov)│
│    └── Statutory Cesser Clause: § 39(5) terminates overlapping Avas Vikas & Municipal levies           │
├────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ 2. Industrial Development Authorities (NOIDA, Greater Noida / GNIDA, YEIDA, UPSIDA)                   │
│    ├── Primary Statute: UP Industrial Area Development Act, 1976 (§ 11-B, ins. by UP Act 10 of 2016)   │
│    ├── Current Surcharge Rate: 2.0%                                                                    │
│    ├── Executive Enhancement Power: NO (Fixed at 2%; lacks executive enhancement proviso)              │
│    ├── Boundary Requirement: Section 3 Gazette Declaration of Industrial Development Area              │
│    └── Constitutional Status: Proviso to Art. 243Q(1) Industrial Township (Municipal levies barred)    │
├────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ 3. Special Area Development Authorities (SADA)                                                         │
│    ├── Primary Statute: UP Special Area Development Authorities Act, 1986 (§ 34)                       │
│    ├── Current Surcharge Rate: 2.0%                                                                    │
│    └── Executive Enhancement Power: YES (State Govt may enhance up to 5% by Gazette under § 34 prov)   │
├────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ 4. UP Avas Evam Vikas Parishad (Housing Board Schemes)                                                 │
│    ├── Primary Statute: UP Avas Evam Vikas Parishad Adhiniyam, 1965 (§ 62)                             │
│    ├── Current Surcharge Rate: 2.0%                                                                    │
│    └── Overlap Status: Subordinated / Extinguished by § 39(5) within overlapping Development Areas     │
├────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ 5. Rural Gram Panchayats (Outside Authority / Municipal Boundaries)                                    │
│    ├── Statutory Authority: Section 39(3), UP Act 30 of 1974 & Section 27, Indian Stamp Act, 1899      │
│    └── Current Surcharge Rate: 0.0% (EXEMPT; base 5% stamp duty only)                                  │
└────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Authority-Specific Statutory Applicability Matrix

| Authority Name | Authority Code | Enabling Act & Exact Section | Territorial Boundary Notification | Baseline Additional Duty | Statutory Enhancement Power | Current Operative Rate | Displaced / Inapplicable Local Levies | Exact Statutory Basis |
|:---|:---|:---|:---|:---:|:---:|:---:|:---|:---|
| **Lucknow Development Authority** | `LDA` | *UP Urban Planning and Development Act, 1973 (President's Act 11 of 1973 / UP Act 30 of 1974)*, Section 39(1) | Notified Development Area under Section 3, UP Act 30 of 1974 | 2.0% | Yes, State Government may enhance up to 5.0% by Gazette (Sec 39(1) Proviso) | **2.0%** | Municipal transfer tax (Sec 172/191 UP Municipal Corp Act 1959) & Avas Vikas duty (Sec 62) cease to have effect | Section 39(5) Statutory Cesser Clause |
| **Ghaziabad Development Authority** | `GDA` | *UP Urban Planning and Development Act, 1973*, Section 39(1) | Notified Development Area under Section 3 | 2.0% | Yes, up to 5.0% by Gazette | **2.0%** | Municipal transfer tax ceases | Section 39(5) Statutory Cesser Clause |
| **Kanpur Development Authority** | `KDA` | *UP Urban Planning and Development Act, 1973*, Section 39(1) | Notified Development Area under Section 3 | 2.0% | Yes, up to 5.0% by Gazette | **2.0%** | Municipal transfer tax ceases | Section 39(5) Statutory Cesser Clause |
| **NOIDA (New Okhla Industrial Dev Auth)** | `NOIDA` | *UP Industrial Area Development Act, 1976 (UP Act No. 6 of 1976)*, Section 11-B (inserted by *UP Act No. 10 of 2016*, Sec 6) | Notification No. 4157-HI/XVIII-11 dated April 17, 1976 under Section 3 | 2.0% | **NO.** Section 11-B contains no executive enhancement proviso; strictly fixed at 2.0% | **2.0%** | Municipal taxes are constitutionally barred (Industrial Township) | Proviso to Article 243Q(1), Constitution of India & UP Act 6 of 1976 |
| **Greater NOIDA (GNIDA)** | `GNIDA` | *UP Industrial Area Development Act, 1976*, Section 11-B | Notification No. 1242/77-4-2001-155 N/90 dated January 28, 1991 under Section 3 | 2.0% | **NO.** Strictly fixed at 2.0% | **2.0%** | Municipal taxes barred | Proviso to Article 243Q(1), Constitution of India |
| **Yamuna Expressway Authority (YEIDA)** | `YEIDA` | *UP Industrial Area Development Act, 1976*, Section 11-B | Notified Industrial Development Area under Section 3 (April 24, 2001) | 2.0% | **NO.** Strictly fixed at 2.0% | **2.0%** | Municipal taxes barred | Proviso to Article 243Q(1), Constitution of India |
| **Special Area Dev Authorities (SADA)** | `SADA` | *UP Special Area Development Authorities Act, 1986 (UP Act No. 9 of 1986)*, Section 34 | Declared Special Development Area under Section 3 | 2.0% | Yes, State Government may enhance up to 5.0% by Gazette (Sec 34 Proviso) | **2.0%** | Replaces normal local development surcharges | Section 34(1) & (3) |
| **UP Avas Evam Vikas Parishad** | `UPAVP` | *UP Avas Evam Vikas Parishad Adhiniyam, 1965 (UP Act No. 1 of 1966)*, Section 62 | Areas where Parishad housing schemes are operational outside Development Authorities | 2.0% | No enhancement proviso | **2.0%** | Subordinated/extinguished when scheme falls inside Development Authority boundaries | Section 39(5), UP Act 30 of 1974 |
| **Municipal Councils (with Sec 128-A)** | `MUNICIPAL_128A` | *UP Municipalities Act, 1916 (UP Act No. II of 1916)*, Section 128(1)(xiii-B) & Section 128-A | Municipal limits with special tax resolution approved by State Government | Notified rate (1% to 2%) | Governed by municipal resolution | **Variable** | Extinguished if area is subsequently declared a Development Area | Section 39(5), UP Act 30 of 1974 |
| **Rural Gram Panchayats** | `RURAL` | Outside any notified Development Authority, Industrial Area, or Municipal limits | Rural cadastral revenue villages | 0.0% | None | **0.0%** | Not applicable (no local surcharge levied) | Section 39(1) territorial limitation |

---

## 3. Statutory Master Rate Register

```
========================================================================================================================
BHŪMI LEDGER — STATUTORY PARAMETER GROUND TRUTH REGISTER (PKG-02)
========================================================================================================================
```

| Parameter ID | Parameter Name | Statutory Basis / Gazette Citation | Geographic Scope | Statutory Status | Statutory Ground Truth & Architectural Guidance |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **STAT-BASE-01** | **Base Conveyance Stamp Duty (5%)** | *Indian Stamp Act, 1899*, Schedule 1-B, Article 23 (UP Amendment) | Statewide (All 75 UP Districts) | **VERIFIED** | Base duty is **5%** on the higher of declared consideration or market value. Dutiable base is prescribed in Schedule 1-B, Art 23. |
| **STAT-REG-01** | **Uncapped Registration Fee (1%)** | *Registration Act, 1908*, Section 78 read with *UP Registration (Amendment) Rules, 2020* (Notified Feb 2020) | Statewide (All 75 UP Districts) | **VERIFIED** | Registration fee is an **uncapped 1%** (minimum floor ₹100). The historical ₹20,000 cap was abolished for standard conveyance deeds. |
| **STAT-GIFT-01** | **Concessional Family Gift Deed** | *Notification No. 01/2026/26/XCIV-2-2026-700(29)-2021 dated January 8, 2026* | Statewide (All 75 UP Districts) | **VERIFIED** | Flat **₹5,000** stamp duty cap under Sec 9(1)(a) Indian Stamp Act. Applies strictly to 12 natural-person relatives. 5-year lock-in is enforced under **Section 48** (recovery of arrears), NOT Section 47-A. Registration fee governed under Sec 78 Registration Act (with administrative ₹20k cap). |
| **STAT-SUR-01** | **Development Authority Surcharge (2% - 5%)** | *UP Urban Planning and Development Act, 1973 (Act No. 30 of 1974)*, Section 39(1) | Notified Development Areas (LDA, GDA, KDA, etc.) | **VERIFIED** | Increases stamp duty by **2%** baseline. Proviso authorizes State Government to enhance up to 5% by Gazette. Current operative rate is 2.0%. Section 39(5) extinguishes municipal and parishad levies. |
| **STAT-SUR-02** | **Industrial Development Area Surcharge (2%)** | *UP Industrial Area Development Act, 1976 (Act No. 6 of 1976)*, Section 11-B (ins. by UP Act 10 of 2016) | Notified Industrial Areas (NOIDA, GNIDA, YEIDA) | **VERIFIED** | Fixed **2.0%** additional stamp duty. **No 5% enhancement power exists in Sec 11-B.** Municipal taxes constitutionally barred under Art. 243Q proviso. |
| **STAT-SUR-03** | **SADA Surcharge (2% - 5%)** | *UP Special Area Development Authorities Act, 1986*, Section 34 | Notified Special Development Areas | **VERIFIED** | Baseline 2.0%, enhancement up to 5.0% by Gazette. Current operative rate is 2.0%. |
| **STAT-SUR-04** | **Avas Vikas Surcharge (2%)** | *UP Avas Evam Vikas Parishad Adhiniyam, 1965*, Section 62 | Parishad scheme areas outside Development Authorities | **VERIFIED** | 2.0% additional duty. **Extinguished by Section 39(5)** inside Development Authority limits. |
| **STAT-FEM-01** | **Sole Female Concession (1% up to ₹1 Cr)** | *Notification No. स.वि.क.नि.-5-462/11-2006-500(92)2005* (Feb 23, 2006) as amended July 29, 2025 | Statewide (All 75 UP Districts) | **VERIFIED** | 1% rebate on valuation up to ₹1 Crore (max benefit **₹1,00,000**). Valuation above ₹1 Crore charged at standard rate. Applicable to `SOLE_FEMALE` and `ALL_FEMALE_JOINT`. |
| **STAT-FEM-02** | **Joint Male-Female Concession** | *Notification No. सं0 क0नि0-5-1504/11-2006-500(92)-2005 dated July 6, 2006* | Statewide (All 75 UP Districts) | **VERIFIED (STRICT TAX STRICTNESS)** | If female share is unspecified, **ZERO concession** applies. Section 45 TPA cannot create an automated tax deduction. If shares are specified, online engine applies **₹0.00 automated rebate** and emits `CONCESSION_CONDITIONAL_MANUAL_VERIFICATION`, requiring manual Sub-Registrar deed inspection under Notification 1504. |
| **VAL-CONST-01** | **Rule 5 Tripartite Structure Valuation** | *Rule 5(1)(b), (c), (d), UP Stamp Valuation Rules 1997* | Statewide (All 75 UP Districts) | **VERIFIED** | Distinguishes non-commercial (5(1)(b): land + covered area), single-unit commercial (5(1)(c): land + covered area), and multi-unit complexes (5(1)(d): carpet area only). Engine applies card rates directly with zero synthetic age depreciation deductions. |

---

## 4. Statutory Verification Matrix & Fail-Closed Behavior

| Parameter ID | Parameter Name | Statutory Rate / Rule | Legal Authority | Fail-Closed Fallback |
|:---|:---|:---|:---|:---|
| **STAT-BASE-01** | Base Stamp Duty | 5.0% of Dutiable Base | Indian Stamp Act 1899, Sch 1-B Art 23 | Halt on missing consideration (HTTP 400) |
| **STAT-SUR-01** | Urban Development Surcharge | 2.0% baseline; up to 5% by Gazette | UP Planning Act 1973, Sec 39(1) | Enforce dynamic rate with `<= 0.05` constraint; cesser under Sec 39(5) |
| **STAT-SUR-02** | Industrial Development Area Surcharge | Strictly fixed 2.0% | UP Ind Area Dev Act 1976, Sec 11-B | Enforce fixed 2.0% rate; zero enhancement power; Art 243Q municipal exclusion |
| **STAT-FEM-01** | Female Concession | 1.0% rebate up to ₹1 Cr (Max ₹1 Lakh) | Notification 462 (Feb 2006) as amended July 2025 | Automated for sole/all female; flag joint male-female `CONCESSION_CONDITIONAL_MANUAL_VERIFICATION` |
| **STAT-REG-01** | Registration Fee | 1.0% flat UNCAPPED (₹100 min floor) | Registration Act 1908, Sec 78 (2020 UP Rule) | Reject historical ₹20k cap for standard conveyances |
| **STAT-GIFT-01** | Family Gift Deeds | Flat ₹5,000 duty cap under Sec 9(1)(a) | Notification 01/2026/26 dated Jan 8, 2026 | Strict natural persons & 12 relative roster; 5-yr lock-in under Sec 48 |
| **DISC-STAT-01** | Valuation Charging Basis | Dutiable Base = $\max(\text{Consideration}, \text{Rule 5 Value})$ | Indian Stamp Act 1899, Sch 1-B Art 23 & UP Rules 1997 | If dutiable base is uncertain, emit `VALUATION_ESTIMATE_MANUAL_VERIFICATION_REQUIRED` |
