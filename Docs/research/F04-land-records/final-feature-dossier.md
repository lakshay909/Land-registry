# FEATURE RESEARCH DOSSIER: F04
# Land Records, Khatauni (RoR) & Cadastral GIS Integration

**Feature ID:** F04  
**Feature Name:** Land Records, Cadastral Mapping & Ownership Verification  
**Feature Lead:** Lead-F04  
**Supervising Department:** Research & Government Integration (DH-Govt) & Architecture (DH-Arch)  
**Readiness Status:** **On-Chain Event Ledger: Enabled / UP Bhulekh & BhuNaksha: Research Verified**  
**Jurisdiction:** Uttar Pradesh, India  

---

## 1. Executive Summary

In Uttar Pradesh, land record discovery requires navigating two key state systems:
1. **Bhulekh UP (`upbhulekh.gov.in`)**: The official portal for the **Record of Rights (Khatauni)**, containing tenure details, co-sharers, parcel area, and recorded encumbrances or mutation orders.
2. **BhuNaksha UP (`upbhunaksha.gov.in`)**: The computerized cadastral map portal providing spatial field boundaries for every **Gata / Survey Plot**.

Feature F04 establishes how Bhūmi Ledger indexes and verifies these records. It bridges on-chain transaction history with state revenue records, while strictly distinguishing:
- **Public Website (UI)**: Web interface for citizens with CAPTCHA protection.
- **Documented API**: **Non-existent** for general commercial third parties.
- **Authorized Integration**: Limited to G2G departments and licensed banks via formal National Informatics Centre (NIC) MoUs.
- **Legally Permitted Data Access**: Assisted user ingestion of certified digital Khatauni extracts with cryptographic hash commitment.

---

## 2. Core Uttar Pradesh Land Records

### 2.1 The Khatauni (Record of Rights / RoR)
- **Governing Body:** Board of Revenue, Uttar Pradesh.
- **Key Identifiers:**
  - **Khata Number:** Account number of the landholding group or individual.
  - **Khasra / Gata Number:** Survey plot number demarcating the physical field.
  - **Fasli Year:** Traditional Indian agricultural revenue calendar year (e.g., 1431–1436 Fasli).
  - **Tenure Holder Names:** Recorded co-tenants and share fractions.
  - **Apramarnit / Pramanit Khatauni:**
    - *Uncertified Extract (Apramanit)*: Informational view for public checking without legal standing in court.
    - *Certified Extract (Pramanit / Digital Signed)*: Digitally signed extract issued by the Board of Revenue containing a verification QR code and unique certificate number.

### 2.2 The 16-Digit Unique Land Parcel Identifier (UP ULPIN / Bhu-Aadhaar)
To eliminate duplicate Gata numbers across multiple villages, UP assigned an unambiguous 16-digit code:
- **Digits 1–6:** Census Village LGD Code.
- **Digits 7–10:** Gata / Plot Number.
- **Digits 11–14:** Sub-division / Khata Partition Number.
- **Digits 15–16:** Category Flag (Agricultural, Non-Agri, Gram Sabha, Disputed).

---

## 3. Government Integration Reality Matrix

| Access Channel | Availability | Technical Protocol | Legal / Regulatory Standing | Viability for Bhūmi Ledger |
| :--- | :--- | :--- | :--- | :--- |
| **Official Public Website** | **Live** (`upbhulekh.gov.in`) | HTTP/HTML with session cookies & CAPTCHA | Public citizen viewing portal. Terms prohibit automated crawling. | **Reference Only** (Deep-linking users). |
| **Open Public REST API** | **NON-EXISTENT** | None | NIC does not expose open public API endpoints for third-party commercial developers. | **Unavailable** |
| **Authorized Institutional Integration** | **Restricted** (G2G / Scheduled Commercial Banks) | SOAP / REST over VPN via NIC State Data Centre | Mandates formal MoU with Board of Revenue UP and compliance audit. | **Future Roadmap** (Requires government partnership). |
| **Legally Permitted Access Method** | **VIABLE & COMPLIANT** | Client-side ingestion of certified digital PDF extracts | Citizen downloads digitally signed Khatauni PDF; platform validates QR code, extracts metadata, and commits Keccak-256 hash on-chain. | **RECOMMENDED BASELINE** (Assisted Ingestion). |

---

## 4. Architectural Data Flow: Assisted Record Ingestion

```
[Citizen / Property Seller]
           │
           ├─── (1) Queries UP Bhulekh (upbhulekh.gov.in) via deep-link
           ├─── (2) Downloads digitally signed Khatauni PDF with QR code
           │
           ▼
[Bhūmi Ledger Portal: Assisted Ingestion]
           │
           ├─── (3) Client-side OCR / PDF parser extracts 16-digit code, Gata, & Owner Names
           ├─── (4) Client computes Keccak-256 hash of certified PDF
           │
           ▼
[On-Chain Settlement: LandRegistry.sol]
           │
           └─── (5) registerProperty(16DigitCode, Area, KeccakDeedHash)
```

---

## 5. Implementation Acceptance Criteria

1. Properties display both the 16-digit UP revenue code and Gata number alongside on-chain parcel ID.
2. Platform clearly marks whether an extract is an uncertified informational view or an authorized certified document.
3. Zero automated headless scraping of `upbhulekh.gov.in` to comply with terms of service and Section 43/66 of the IT Act.
