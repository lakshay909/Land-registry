# FEATURE RESEARCH DOSSIER: F16
# Government & Third-Party Integrations Assessment

**Feature ID:** F16  
**Feature Name:** Government Portals, API Feasibility & Compliant Data Access  
**Feature Lead:** Lead-F16  
**Supervising Department:** Research & Government Integration (DH-Govt) & Architecture (DH-Arch)  
**Readiness Status:** **Integration Feasibility Audited / Assisted Architecture Approved**  
**Jurisdiction:** Uttar Pradesh & Central Government Portals  

---

## 1. Executive Summary

A critical error in early-stage Web3 land registry projects is assuming that government land registries expose open REST APIs for automated programmatic integration.

Feature F16 rigorously audits the five primary state and central government portals required for land transactions in Uttar Pradesh. For every system, it establishes the four-tier access reality:
1. **Official Public Website**: Citizen UI with session controls and CAPTCHAs.
2. **Documented Open Public API**: **Non-existent** across all state land portals.
3. **Authorized Institutional Integration**: Strictly gated behind formal government Memorandums of Understanding (MoUs), security compliance audits, and VPN connectivity via the National Informatics Centre (NIC).
4. **Legally Permitted Data-Access Method**: Compliant **Assisted Citizen Workflows** where users download certified digitally signed extracts and import them into Bhūmi Ledger for cryptographic verification.

---

## 2. Comprehensive Portal Audit Matrix

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                              PORTAL INTEGRATION MATRIX                                 │
├───────────────┬────────────────────┬──────────────┬───────────────────┬────────────────┤
│ Portal Name   │ Primary Function   │ Open Public  │ Authorized MoU    │ Compliant Path │
│               │                    │ REST API?    │ Integration?      │ For Platform   │
├───────────────┼────────────────────┼──────────────┼───────────────────┼────────────────┤
│ Bhulekh UP    │ Khatauni (RoR) &   │ NO           │ YES (G2G & Banks  │ Assisted PDF   │
│               │ 16-Digit ULPIN     │ (CAPTCHA)    │ via NIC SDC)      │ Ingestion + QR │
├───────────────┼────────────────────┼──────────────┼───────────────────┼────────────────┤
│ BhuNaksha UP  │ Cadastral Maps &   │ NO           │ YES (NIC GIS &    │ User geoJSON / │
│               │ Plot Boundaries    │ (WMS/WFS)    │ State Revenue)    │ Deep-Linking   │
├───────────────┼────────────────────┼──────────────┼───────────────────┼────────────────┤
│ IGRSUP        │ Deed Registration, │ NO           │ YES (Treasuries & │ Pre-filled     │
│ (e-Nibandhan) │ Stamp Valuation    │ (Restricted) │ Banks for Mortg.) │ Appointment URL│
├───────────────┼────────────────────┼──────────────┼───────────────────┼────────────────┤
│ Vaad / RCCMS  │ Revenue Court Suit │ NO           │ YES (Judicial &   │ Case Number    │
│               │ Injunction Status  │ (Session-ID) │ Police Depts)     │ Verification   │
├───────────────┼────────────────────┼──────────────┼───────────────────┼────────────────┤
│ Income Tax    │ Section 393(1) TDS │ NO (Requires │ YES (Authorized   │ Form 141       │
│ e-Filing      │ & Form 141 Filing  │ ERI License) │ ERIs & Banks)     │ Challan Upload │
└───────────────┴────────────────────┴──────────────┴───────────────────┴────────────────┘
```

---

## 3. Deep Portal Analysis

### 3.1 UP Bhulekh (`upbhulekh.gov.in`)
- **Operator:** Board of Revenue, Uttar Pradesh / NIC Lucknow.
- **Data Exposed:** Village-wise Khatauni, recorded tenure holders, land shares, un-mutated transfers, and encumbrance orders.
- **Technical Barrier:** Uses dynamic session tokens, randomized Hindi numerical CAPTCHA, and IP rate-limiting. Automated headless scraping violates the portal terms of use and Section 43/66 of the IT Act.
- **Compliant Platform Approach:**
  - Citizen generates digitally signed certified Khatauni PDF via the official portal.
  - Platform parses the embedded Board of Revenue digital signature and QR verification URL, validates hash integrity, and anchors the proof on-chain.

### 3.2 BhuNaksha UP (`upbhunaksha.gov.in`)
- **Operator:** Revenue Council of UP / NIC.
- **Data Exposed:** Vectorized cadastral village maps showing survey plot boundaries.
- **Technical Barrier:** Cadastral GIS layers are served via proprietary raster map tile caches and internal WMS (Web Map Service) without public developer endpoints.
- **Compliant Platform Approach:** Provide deep-linking with pre-filled District, Tehsil, Village, and Gata parameters allowing users to inspect their physical plot outline directly on BhuNaksha.

### 3.3 IGRSUP (e-Nibandhan / `igrsup.gov.in`)
- **Operator:** Department of Registration and Stamps, Uttar Pradesh.
- **Data Exposed:** Registered deeds, stamp duty calculation, e-Challan payment, appointment booking at SRO, and 12-year encumbrance search (*Barahsala*).
- **Technical Barrier:** Full deed records require user login, mobile OTP authentication, and non-refundable statutory search fees. Open API access is restricted strictly to licensed scheduled banks for mortgage charge creation.
- **Compliant Platform Approach:** Pre-fill stamp duty calculations based on UP Stamp Valuation Rules, generate appointment checklists, and allow upload of final registered SRO deed PDFs.

### 3.4 Vaad / RCCMS UP (`vaad.up.nic.in`)
- **Operator:** Revenue Court Computerized Management System (RCCMS), UP.
- **Data Exposed:** Litigation status across Tehsildar, SDM, Collector, and Revenue Board courts under UP Revenue Code, 2006.
- **Compliant Platform Approach:** Capture pending suit case numbers from users during listing; provide direct reference links to court order sheets on `vaad.up.nic.in`.

---

## 4. Legal Compliance & Anti-Scraping Doctrine

1. **Section 43 & Section 66 of IT Act, 2000**: Accessing a protected computer system or downloading data without authorization from the system custodian constitutes a punishable civil and criminal offense.
2. **Bhūmi Ledger Compliance Rule**: The platform **shall never deploy automated scrapers** targeting government portals. All data ingestion must occur through:
   - Lawful citizen-mediated document uploads.
   - Deep-linked authorized redirection.
   - Future formal institutional MoUs with the Board of Revenue / NIC.

---

## 5. Implementation Acceptance Criteria

1. No background scraping scripts or headless browsers interacting with `upbhulekh.gov.in` or `igrsup.gov.in`.
2. All government references provide direct, clickable links to official portals with pre-filled parameters.
3. Uploaded certified documents are verified via client-side Keccak-256 and digital signature extractors.
