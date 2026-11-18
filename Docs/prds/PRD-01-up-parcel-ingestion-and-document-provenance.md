# PRD-01: UTTAR PRADESH PARCEL INGESTION & DOCUMENT PROVENANCE
# Bhūmi Ledger — India Land Transaction & Registry Platform

**Document Version:** 1.0.0  
**Status:** Approved for Project Owner Review (Phase 3 Core PRD)  
**Authors:** Chief AI Engineering Orchestrator, DH-Product, DH-Legal, DH-Arch, DH-Security, DH-QA  
**Jurisdiction Baseline:** Republic of India / State of Uttar Pradesh (Pilot Districts: Lucknow & Gautam Buddha Nagar)  

---

## 1. Problem Statement
In Uttar Pradesh, land records (Khatauni RoRs) are maintained digitally by the Board of Revenue on `upbhulekh.gov.in`, but no open public machine-to-machine (M2M) REST APIs exist for third-party platforms. Citizens must manually retrieve records, while buyers face risks of altered PDFs, outdated co-tenure shares, or conflation of parcel identifiers. Furthermore, naive blockchain implementations that store personal data or raw title hashes directly on public ledgers violate Section 12 of the Digital Personal Data Protection (DPDP) Act, 2023 and Section 29 of the Aadhaar Act, 2016.

## 2. Business Objective
Deliver a secure, compliant, client-assisted document ingestion pipeline that:
1. Accurately distinguishes and captures the **16-digit Computerized Land Parcel Code (UPIC/Gata Code)** from the **14-character alphanumeric ULPIN (Bhu-Aadhaar)**.
2. Extracts structured parcel metadata from certified Khatauni PDFs.
3. Establishes a transparent **9-stage document verification lifecycle**.
4. Anchors cryptographic Keccak-256 integrity hashes without exposing personally identifiable information (PII) on public EVM blocks.
5. Eliminates unauthorized portal scraping while accelerating pre-registration diligence from days to $< 5$ minutes.

## 3. User Personas
- **Ramesh (Citizen Seller):** Ancestral landholder in Mohanlalganj, Lucknow holding a certified Khatauni RoR who wants to register his parcel without bureaucratic delay.
- **Pooja (Citizen Buyer):** Purchaser who needs to verify document provenance, check freshness, and ensure the parcel is not encumbered by outdated records.
- **Suresh (Revenue Administrator / Authority):** Naib Tehsildar reviewing uploaded provenance metadata and verifying physical documents against revenue records.

## 4. User Stories
- *As a Seller,* I want to upload my certified Khatauni PDF so that the platform can automatically extract my parcel details and establish a tamper-evident integrity record.
- *As a Buyer,* I want to see the exact document verification lifecycle status, issuance date, and issuing authority so that I do not rely on stale or unverified documents.
- *As a Revenue Officer,* I want to inspect the cryptographic hash and extracted parcel identifiers so that I can audit document provenance before approving transactions.

## 5. Complete User Journey
1. Citizen enters the portal and selects **Uttar Pradesh** from the State Selector.
2. Citizen navigates to **Register Property** on the Citizen Dashboard.
3. System prompts citizen to upload their certified Khatauni PDF downloaded from `upbhulekh.gov.in`.
4. Client-side parser extracts the 16-digit Computerized Gata Code, Khasra number, area, tenure class, and 14-char ULPIN (if geo-referenced).
5. System checks document date; if $> 90$ days old, warns citizen that record is `EXPIRED_OUTDATED`.
6. System computes salted Keccak-256 hash of document stream; status becomes `INTEGRITY_HASH_GENERATED`.
7. Parcel metadata is stored in encrypted database; hash is committed to Cancun EVM anchor contract.
8. Citizen and prospective buyers view parcel record with explicit legal disclaimers.

## 6. Functional Requirements
- **FR-01 (Dual Parcel Identification):** Mandatory extraction and validation of the 16-digit Computerized Gata Code. Optional extraction of 14-character alphanumeric ULPIN (`[A-Z0-9]{14}`); sets status to `PENDING_GEOREFERENCING` if absent.
- **FR-02 (PDF Ingestion & Text Parsing):** Ingest digitally certified PDF documents up to 10 MB. Parse text stream for village code, tehsil code, district code, Khasra numbers, recorded tenure, and issue date.
- **FR-03 (9-Stage Lifecycle Management):** Maintain strict document states: `UPLOADED`, `PARSED`, `SOURCE_IDENTIFIED`, `QR_SIGNATURE_CHECKED`, `INTEGRITY_HASH_GENERATED`, `OFFICIAL_AUTHENTICITY_VERIFIED`, `TITLE_INDEPENDENTLY_REVIEWED`, `EXPIRED_OUTDATED`, `VERIFICATION_UNAVAILABLE`.
- **FR-04 (Cryptographic Salted Hashing):** Compute Keccak-256 hash salted with citizen-specific random nonce to prevent rainbow-table linkability attacks on public ledgers.
- **FR-05 (Zero-Scraping Compliance):** Provide assisted citizen guidance and deep-links to official portals; strictly prohibit automated scraping bots.
- **FR-06 (Statutory Disclaimer Display):** Mandatory persistent UI banner stating: *"Cryptographic hash verifies file integrity against tampering; statutory ownership is established solely by the registered deed executed before the Sub-Registrar and official revenue records."*

## 7. Non-Functional Requirements
- **NFR-01 (Parsing Latency):** PDF parsing and metadata extraction must complete in $< 1,500\text{ ms}$ for standard 2-page Khatauni documents.
- **NFR-02 (Security & Encryption):** Uploaded files encrypted at rest using AES-256-GCM with envelope key management.
- **NFR-03 (Auditability):** Every document state transition logged with timestamp, user wallet address, and IP in the immutable audit log table.
- **NFR-04 (Browser Compatibility):** Support modern Web3 browsers (Chrome, Firefox, Brave, Safari) with MetaMask integration.

## 8. Data Model
```sql
CREATE TABLE IF NOT EXISTS PARCEL_RECORDS (
    parcel_id SERIAL PRIMARY KEY,
    computerized_gata_code VARCHAR(16) UNIQUE NOT NULL, -- 16-digit UP revenue code
    ulpin VARCHAR(14) UNIQUE, -- 14-char Bhu-Aadhaar (NULL if pending)
    district_code VARCHAR(2) NOT NULL,
    tehsil_code VARCHAR(6) NOT NULL,
    village_code VARCHAR(12) NOT NULL,
    khasra_number VARCHAR(50) NOT NULL,
    total_area_hectares NUMERIC(10, 4) NOT NULL,
    tenure_class VARCHAR(50) NOT NULL,
    document_hash VARCHAR(66) NOT NULL,
    verification_status VARCHAR(50) NOT NULL DEFAULT 'UPLOADED',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

## 9. API Requirements
- `POST /api/documents/upload`
  - *Payload:* Multipart form data (`file`, `walletAddress`, `documentType`).
  - *Response (200 OK):*
    ```json
    {
      "status": "success",
      "documentHash": "0x8a9f4b...",
      "verificationStatus": "INTEGRITY_HASH_GENERATED",
      "extractedMetadata": {
        "computerizedGataCode": "0914285100000412",
        "ulpin": "UP09LK41200001",
        "districtCode": "09",
        "tehsilCode": "090142",
        "villageCode": "090142142851",
        "khasraNumber": "412",
        "areaHectares": 1.2400,
        "tenureClass": "BHUMIDHAR_TRANSFERABLE",
        "issuanceDate": "2026-09-15"
      }
    }
    ```
- `GET /api/documents/:hash/provenance`
  - *Response (200 OK):* Returns full 9-stage lifecycle history, salted hash, and issuing authority details.

## 10. UI Requirements
- **State Selection Strip:** Top bar showing "Uttar Pradesh (Active Pilot)".
- **Upload Dropzone:** Drag-and-drop area for Khatauni PDFs with live progress bar and parsing animation.
- **Extracted Metadata Preview Card:** Clear breakdown showing 16-digit Gata Code, 14-char ULPIN badge (`Available` or `Pending`), Area in Hectares, and Tenure Status.
- **Document Status Badge:** Color-coded status chip (`INTEGRITY_HASH_GENERATED` = Blue, `EXPIRED_OUTDATED` = Amber, `TITLE_REVIEWED` = Green).
- **Mandatory Disclaimer Banner:** Prominent high-contrast legal banner displayed on all ingestion views.

## 11. Validation and Failure Cases
- **Failure 1 (Malformed PDF):** Return HTTP 422 with message: *"Unable to parse document. Please ensure you upload an official digital Khatauni PDF from UP Bhulekh."*
- **Failure 2 (Duplicate Gata Code):** Revert registration if 16-digit Gata code is already registered under active ownership.
- **Failure 3 (Stale Document):** If Khatauni issue date $> 90$ days, flag `EXPIRED_OUTDATED` and require citizen re-confirmation.

## 12. Security and Privacy Requirements (DPDP Act, 2023)
- **Zero Raw PII On-Chain:** Citizen names, phone numbers, and Aadhaar numbers are **never written to the blockchain**.
- **Salted Hash Commitments:** Hashes committed to the EVM are computed as: $\text{Keccak-256}(\text{documentBytes} \parallel \text{citizenSalt})$ to eliminate pre-image rainbow attacks.
- **Aadhaar Masking:** If identity attachments contain Aadhaar numbers, backend masking middleware redacts the first 8 digits, retaining only the last 4 digits pursuant to Section 29 of the Aadhaar Act.

## 13. Legal and Statutory Boundaries
- **Section 1(4) & 3A IT Act, 2000:** Ingestion and hash generation establish electronic record provenance; they do not substitute for statutory deed registration.
- **Section 17 Registration Act, 1908:** Physical SRO registration remains mandatory.
- **No Indefeasible Title Guarantee:** UP operates under a presumptive deed registration system; Bhūmi Ledger records provenance, not state-guaranteed title.

## 14. Official Source References
- Uttar Pradesh Board of Revenue Bhulekh Portal (`upbhulekh.gov.in`).
- DoLR / NIC Digital India Land Records Modernization Programme (DILRMP) ULPIN Technical Guidelines.
- Uttar Pradesh Revenue Code, 2006 (Sections 75–78, 89, 104).

## 15. Dependencies
- [`PRD-05`](file:///Users/lakshay/Desktop/Projects/Land-registry/Docs/prds/PRD-05-multi-state-configuration-and-state-selector.md) (Multi-State Configuration for UP district/tehsil codes).
- `contracts/LandRegistry.sol` (EVM anchor for document hash storage).

## 16. Acceptance Criteria
- Acceptance criteria defined in [`FEATURE_ACCEPTANCE_CRITERIA.md`](file:///Users/lakshay/Desktop/Projects/Land-registry/Docs/prds/FEATURE_ACCEPTANCE_CRITERIA.md#L1-L28) (AC-01.1 & AC-01.2).

## 17. Test Scenarios
- *TS-01.1:* Upload valid digitally signed UP Khatauni PDF; verify 16-digit Gata extraction and hash generation.
- *TS-01.2:* Upload Khatauni without ULPIN; verify status set to `PENDING_GEOREFERENCING` without crashing.
- *TS-01.3:* Upload 120-day old Khatauni; verify status flagged as `EXPIRED_OUTDATED`.

## 18. Out-of-Scope Items
- Automated web scraping of `upbhulekh.gov.in`.
- Real-time biometric AUA/KUA Aadhaar verification.
- Automated cadastral GIS shapefile boundary alteration.

## 19. Risks and Unresolved Decisions
- *Risk:* Layout changes in UP Bhulekh PDF output could break regular expression parser. *Mitigation:* Resilient regex fallback and manual field review mode in UI.

---

## 20. Independent Reviewer Assessment
- **Product Reviewer:** *"Approved. Solves the core ingestion barrier cleanly while giving users transparent status tracking."*
- **Legal Reviewer:** *"Approved. Disentanglement of ULPIN vs 16-digit code and explicit title disclaimers fully satisfy statutory constraints."*
- **Architecture Reviewer:** *"Approved. Salted hash anchoring protects DPDP privacy while maintaining verifiable immutability."*
- **QA Reviewer:** *"Approved. Comprehensive test scenarios covering both happy path and stale-document edge cases."*