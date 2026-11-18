# ASSUMPTIONS REGISTER
# Bhūmi Ledger — India Land Transaction & Registry Platform

**Document Version:** 2.0.0  
**Status:** Active Canonical Assumption Tracking  
**Last Updated:** October 31, 2026 (Post-Wave 1 Revalidation & Wave 2 Research)  
**Operating Rule:** *Never silently convert an assumption into a verified fact without statutory or integration evidence.*

---

## 1. Legal & Regulatory Assumptions

| ID | Assumption Statement | Domain / Feature | Status | Verification Evidence / Ground Truth | Risk / Mitigation |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **ASM-LEG-01** | Bilateral EIP-712 digital signatures can serve as admissible evidence of agreement under Section 65B of Indian Evidence Act / BSA 2023. | F06, F10 | **VERIFIED & QUALIFIED** | Validated under **Section 10A of IT Act, 2000** (enforceability of electronic agreements) and **Section 61/63 of Bharatiya Sakshya Adhiniyam, 2023** (electronic evidence admissibility). **Qualified:** It is NOT a statutory electronic signature under Section 3A of the IT Act, and cannot substitute SRO deed registration under Section 17 of the Registration Act, 1908. | Mitigated: Documented as digital intent and agreement for sale; formal deed executed at SRO. |
| **ASM-LEG-02** | Agricultural land in Uttar Pradesh cannot be acquired beyond 5.0586 hectares (12.5 acres) without statutory permission. | F01, F02, F09 | **VERIFIED & QUALIFIED** | Validated under **Section 89(2) of UP Revenue Code, 2006**. Individual and family holdings are aggregated. **Exceptions verified:** Section 89(3) permits excess acquisition for industrial/commercial projects with State Government permission; Section 89(4) exempts land converted under Section 80. | Mitigated: Listing validation checks ceiling and classification (Bhumidhar with transferable rights). |
| **ASM-LEG-03** | Tokenized or cryptocurrency real-estate escrow cannot be legally settled in India under RBI regulations. | F11 | **VERIFIED** | Validated under **RBI circulars on Virtual Digital Assets**, **FEMA guidelines**, and direct tax compliance. Settlement of domestic Indian immovable property in crypto is legally impermissible. | Mitigated: Testnet ETH reserved for academic/prototype demo; INR Nodal Escrow adapter designed for production. |
| **ASM-LEG-04** | Mutation proclamation period in UP is fixed at 30 days. | F01, F04 | **VERIFIED & QUALIFIED** | Validated under **Rule 34(1) of UP Revenue Code Rules, 2016**: Hearing date must be set not less than 30 days from issuance of proclamation (R.C. Form-12). **Rule 34(7)** mandates total disposal within 45 days (undisputed) and 90 days (disputed). | Mitigated: System models 30-day notice window distinct from 45/90 day SLA tracking. |
| **ASM-LEG-05** | TDS on land transactions in India is governed by Section 194-IA and Form 26QB. | F11 | **VERIFIED AS SUPERSEDED** | Under the **Income-tax Act, 2025**, provisions transitioned to **Section 393(1) [Table Sl. No. 3(i)]** and Form 26QB is replaced by **Form 141 (Schedule B)** (1% TDS on transactions $\ge ₹50,00,000$, rural agricultural land exempt). | Mitigated: Updated statutory tax calculation engine specifications to ITA 2025 standards. |
| **ASM-LEG-06** | Special Power of Attorney executed abroad by NRIs requires stamping within 3 months in India. | F06 | **VERIFIED** | Validated under **Section 18 of the Indian Stamp Act, 1899**. Failure to adjudicate stamp duty within 3 months of arrival invalidates registration under Section 32/33 of the Registration Act, 1908. | Mitigated: Built-in 90-day statutory countdown and District Collectorate stamping alert. |
| **ASM-LEG-07** | Digital marketplace platforms facilitating property sales must hold RERA agent registration. | F05 | **VERIFIED & QUALIFIED** | Validated under **Section 9 of RERA Act, 2016** for projects registered under Section 3. Standalone ancestral rural agricultural land is exempt from RERA registration. | Mitigated: Project-based listings require RERA agent registration; rural agricultural land is disclaimed. |

---

## 2. Government & Integration Assumptions

| ID | Assumption Statement | Domain / Feature | Status | Verification Evidence / Ground Truth | Risk / Mitigation |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **ASM-INT-01** | Bhulekh UP provides open public REST APIs for fetching certified Khatauni (RoR) records without CAPTCHA. | F04, F16 | **VERIFIED AS FALSE** | Audited `upbhulekh.gov.in`. The portal uses JSP/ASP.NET, session cookies, and alphanumeric CAPTCHAs. No open public REST API exists. | Mitigated: Adopted Assisted Citizen Workflow with client-side certified PDF ingestion and hash anchoring. |
| **ASM-INT-02** | BhuNaksha cadastral GIS boundary shapefiles are publicly downloadable by 16-digit ULPIN. | F04, F16 | **VERIFIED AS FALSE** | Audited BhuNaksha UP. Maps are rendered via GeoServer WMS tiles on citizen portal; raw shapefiles and REST APIs are restricted to intranet NIC nodes. | Mitigated: Visual GIS tile overlay and manual KML/GeoJSON boundary import support. |
| **ASM-INT-03** | IGRSUP allows automated online appointment booking and e-Challan stamp duty generation via external webhooks. | F08, F16 | **VERIFIED AS FALSE** | Audited `igrsup.gov.in`. External commercial webhooks do not exist. User registration and payment require citizen session. | Mitigated: Platform pre-fills application data and redirects citizen to IGRSUP via deep-linking. |
| **ASM-INT-04** | Vaad UP / RCCMS revenue court disputes can be queried via automated API. | F12, F16 | **VERIFIED AS FALSE** | Audited `vaad.up.nic.in`. Portal requires manual CAPTCHA solving. | Mitigated: Guided dispute search by computerized case code and seller self-declaration affidavit. |

---

## 3. Product & Operational Assumptions

| ID | Assumption Statement | Domain / Feature | Status | Verification Plan / Ground Truth | Risk if Invalid |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **ASM-PRD-01** | Users will accept a "Coming Soon" notification opt-in for states outside Uttar Pradesh. | F15 | `Standard Assumption` | Benchmarked against multi-state government and fintech platforms. | Low (Standard industry convention). |
| **ASM-PRD-02** | Tehsil document writers (*Wasiqa Navis*) are licensed by District Magistrates and follow statutory fee schedules. | F07 | **VERIFIED** | Validated under UP Document Writers Licensing Rules. Document writers are licensed by the Collector/DM. | Low (Direct alignment with administrative structure). |
| **ASM-PRD-03** | District circle rates in UP follow UP Stamp (Valuation of Property) Rules, 1997. | F08 | **VERIFIED** | Validated under UP Stamp Rules, 1997. Urban properties assessed per square meter; rural properties per hectare; road multipliers apply. | Low (Mathematical formula codified). |