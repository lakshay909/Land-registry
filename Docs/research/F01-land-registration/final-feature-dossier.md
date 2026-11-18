# FEATURE RESEARCH DOSSIER: F01 (REVALIDATED)
# Land Registration & Property Onboarding (Uttar Pradesh Focus)

**Feature ID:** F01  
**Feature Name:** Land Registration, Cadastral Onboarding & Revenue Classification  
**Feature Lead:** Lead-F01  
**Supervising Department:** Domain (DH-Domain) & Legal (DH-Legal)  
**Readiness Status:** **Uttar Pradesh: Enabled (Base EVM Hash) / Research Verified (Statutory Qualifications)**  
**Jurisdiction:** Uttar Pradesh, India  
**Last Revalidated:** October 31, 2026 (Reflecting Project Owner Directives)  

---

## 1. Revision History & Audit Record

| Date | Revision | What Changed | Reason for Change |
| :--- | :--- | :--- | :--- |
| **2026-10-31** | **v2.0.0** | **Qualified Section 89 agricultural ceiling**: Added statutory exceptions (Sec 89(3) commercial/industrial permission, Sec 89(4) non-agricultural conversion under Sec 80), purchaser types, family aggregation rules, and Section 75–78 land tenure classifications.<br/>**Qualified mutation timelines**: Cited Rule 34(1) of UP Revenue Code Rules, 2016 for R.C. Form-12 30-day notice period; distinguished from Rule 34(7) 45-day undisputed / 90-day disputed total disposal timelines. | Project Owner correction directive; ensuring statutory accuracy before proposing application business rules. |
| **2026-10-31** | v1.0.0 | Initial dossier on UP Revenue Code and SRO registration. | Baseline creation. |

---

## 2. Comprehensive Land Classification under UP Revenue Code, 2006

Before any property can be listed or transferred on Bhūmi Ledger, its legal tenure class must be verified. The UP Revenue Code, 2006 divides landholders into four distinct classes:

```
┌────────────────────────────────────────────────────────────────────────┐
│ 1. Bhumidhar with Transferable Rights (Section 75 & 76)                │
│    - Full permanent, heritable, and transferable rights.               │
│    - ONLY class permitted to sell, gift, or mortgage land.            │
├────────────────────────────────────────────────────────────────────────┤
│ 2. Bhumidhar with Non-Transferable Rights (Section 76)                 │
│    - Heritable rights, but NO right to transfer (cannot sell or gift). │
│    - Converts to transferable rights only after 5 years of tenure.     │
│    - Transfer is legally VOID under Section 104.                       │
├────────────────────────────────────────────────────────────────────────┤
│ 3. Asami (Section 78)                                                  │
│    - Temporary tenant/licensee of Gram Sabha or disabled landholder.   │
│    - Heritable, but strictly NON-TRANSFERABLE. Cannot be alienated.    │
├────────────────────────────────────────────────────────────────────────┤
│ 4. Government & Public Utility Land (Section 77)                       │
│    - Common pasture, cremation grounds, ponds, riverbeds, roads.       │
│    - Vested in Gram Sabha / State. Transfer is VOID ab initio.         │
└────────────────────────────────────────────────────────────────────────┘
```
- **Evidence Classification:** `VERIFIED FACT` (Sections 74–78, UP Revenue Code, 2006).

---

## 3. Statutory Ceiling & Agricultural Transfer Restrictions (Section 89 Qualified)

### 3.1 The Core Ceiling & Family Aggregation (Section 89(2))
- **Ceiling Limit:** An individual (natural person) cannot acquire by purchase or gift agricultural land that, when aggregated with land already held by them in Uttar Pradesh, exceeds **5.0586 hectares (approx. 12.5 acres)**.
- **Family Unit Definition:** Land held by the purchaser’s spouse (unless judicially separated) and minor children (sons and daughters) is **cumulatively aggregated** toward the 5.0586-hectare ceiling.
- **Geographic Extent:** Includes all agricultural holdings held by the family across all 75 districts of Uttar Pradesh.

### 3.2 Statutory Exceptions & Purchaser Types (Section 89(3) & 89(4))
1. **Commercial / Industrial / Institutional Exemption (Section 89(3)):**
   - **Eligible Entities:** Registered firms, companies, LLPs, trusts, cooperative societies, or educational/charitable institutions.
   - **Permissible Purpose:** Acquisition exceeding 5.0586 hectares is permissible with **prior written permission of the State Government** (or delegated Divisional Commissioner) if:
     - The acquisition is in the **public interest**.
     - The land will be utilized for generating non-agricultural economic activity, industrial development, or employment.
   - **Regularization Proviso:** Excess acquisition without prior approval can be regularized retrospectively by the State Government upon payment of a prescribed penalty/fine.
2. **Non-Agricultural Conversion Exemption (Section 89(4)):**
   - If land has already been declared non-agricultural (for residential, commercial, or industrial use) under **Section 80 of the UP Revenue Code, 2006**, the agricultural ceiling restriction under Section 89 **does not apply**.
3. **Scheduled Caste Restrictions (Sections 98 & 99):**
   - A Bhumidhar belonging to a Scheduled Caste cannot transfer land to a non-SC purchaser without prior written sanction of the District Magistrate / Collector.

### 3.3 Legal Consequence of Violation (Sections 104 & 105)
- Any transfer executed in contravention of Section 89 or Section 98 is **void** under Section 104.
- Under Section 105, the excess or illegally acquired land **vests automatically in the State Government** free from all encumbrances, without compensation to the purchaser.
- **Evidence Classification:** `VERIFIED FACT` (Sections 80, 89, 98, 104, 105, UP Revenue Code, 2006).

---

## 4. Mutation (*Dakhil-Kharij*) Procedure & Timelines (Rules Qualified)

Under Chapter V (Sections 33–40) of the UP Revenue Code, 2006 and **Rule 34 of the Uttar Pradesh Revenue Code Rules, 2016**:

```
[Sale Deed Registered at SRO]
             │
             ▼
[Section 34 Application Filed via RCCMS / Vaad Portal]
             │
             ▼
[Tehsildar Issues Proclamation in R.C. Form-12 (Rule 34(1))]
             │
             ├── Statutory Notice Period: Hearing date not less than 30 DAYS from issuance.
             ├── Published via Munadi (beat of drum) and Tehsil/Gram Panchayat notice boards.
             │
             ▼
[Lekhpal Field Inspection & Verification Report (Aakhyan)]
             │
             ├──────────────────────────────────────────┐
             ▼ (Uncontested)                            ▼ (Contested / Objections Filed)
[Rule 34(7) Disposal Deadline: 45 DAYS]     [Rule 34(7) Disposal Deadline: 90 DAYS]
   - Summary order by Tehsildar                - Formal revenue trial / adjudication
   - Khatauni updated (Dakhil-Kharij)          - Appeal lies to SDO under Sec 35(2) within 30 days
```

### Critical Distinction: Notice Period vs. Total Completion Time
- **The 30-Day Window (Rule 34(1)):** This is strictly the **statutory notice and proclamation period** (*Ishtihar*) fixed in R.C. Form-12 during which objections must be filed. It is not the total case disposal time.
- **Total Statutory Completion Time (Rule 34(7)):**
  - **Undisputed cases:** Total target disposal is **45 days** from case registration.
  - **Disputed cases:** Total target disposal is **90 days** from case registration.
- **Appeal Window (Section 35(2)):** An appeal against the Tehsildar's mutation order lies before the **Sub-Divisional Officer (SDO) within 30 days** of the order date.
- **Fiscal Nature of Mutation:** Reconfirmed by judicial precedent: *Dakhil-Kharij updates revenue records for land revenue collection; title is conveyed by the registered sale deed under Registration Act, 1908.*
- **Evidence Classification:** `OFFICIAL PROCEDURE` (Rule 34, UP Revenue Code Rules, 2016).

---

## 5. Application Feature Requirements for F01

1. **Pre-Listing Tenure Validation**:
   - The platform must verify that the seller holds `Bhumidhar with Transferable Rights`. Listings claiming `Asami` or `Non-Transferable Rights` must be hard-blocked.
2. **Ceiling Limit Warning Engine**:
   - During transaction initiation for agricultural parcels, the system must prompt the buyer to declare their existing UP agricultural landholdings. If the total exceeds 5.0586 hectares, the system requires uploading Section 89(3) State Government permission or Section 80 non-agricultural conversion order.
3. **Mutation Status Tracking**:
   - Track both:
     - `Deed Registration Verified` (SRO Bainama confirmed).
     - `Mutation Status` (`Notice Period Active - 30 Days`, `Awaiting Lekhpal Aakhyan`, `Mutation Completed - Khatauni Updated`).
