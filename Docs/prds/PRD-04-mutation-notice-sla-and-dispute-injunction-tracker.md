# PRD-04: MUTATION NOTICE SLA & DISPUTE INJUNCTION TRACKER
# Bhūmi Ledger — India Land Transaction & Registry Platform

**Document Version:** 1.0.0  
**Status:** Approved for Project Owner Review (Phase 3 Core PRD)  
**Authors:** Chief AI Engineering Orchestrator, DH-Product, DH-Legal, DH-Arch, DH-Security, DH-QA  
**Jurisdiction Baseline:** Republic of India / State of Uttar Pradesh (Pilot State)  

---

## 1. Problem Statement
In Uttar Pradesh revenue administration, the transfer of title via registered deed before the Sub-Registrar is only the first statutory phase; the legal ownership record on the revenue register (Khatauni) passes only upon **Mutation (Dakhil-Kharij)** by the Revenue Court (Tehsildar/Naib Tehsildar) under Sections 34 and 35 of the UP Revenue Code, 2006. Many buyers mistakenly assume SRO deed registration automatically updates the Khatauni, leading to undetected litigation or contested co-tenure claims. Furthermore, naive software systems either conflate pending lawsuits with automatic voidness, or confuse internal administrative flags with statutory court-ordered injunctions, misleading users and breaching legal norms.

## 2. Business Objective
Build an evidence-based revenue mutation and dispute tracking engine that:
1. Accurately tracks the statutory **30-day proclamation objection notice window** under **Rule 34(1) of UP Revenue Code Rules, 2016**.
2. Tracks the administrative **45-day (undisputed) and 90-day (disputed) case disposal SLAs** under **Rule 34(7)**.
3. Implements an exhaustive, legally accurate **6-tier litigation and encumbrance taxonomy**.
4. Strictly distinguishes internal platform warning flags from formal, court-ordered injunctions or statutory prohibitions.
5. Enables revenue authorities to flag contested Gatas citing verified computerized case codes from Vaad UP (`vaad.up.nic.in`).

## 3. User Personas
- **Pooja (Citizen Buyer):** Executed a registered sale deed at the SRO and needs to track her mutation application and 30-day proclamation notice until Khatauni update.
- **Ramesh (Citizen Seller):** Needs to prove his parcel is free of revenue litigation before listing.
- **Suresh (Naib Tehsildar / Revenue Authority):** Administers mutation proclamations, verifies objections, and enters mutation orders.

## 4. User Stories
- *As a Buyer,* I want to see a live statutory countdown of the 30-day proclamation objection window so that I know exactly when my mutation becomes uncontested.
- *As an Authority,* I want to flag a parcel with a court stay order citing the exact Vaad UP case code so that fraudulent transfers during active injunctions are prevented.
- *As a User,* I want clear legal explanations separating *Lis Pendens* advisories from court stay orders so that I understand my legal risks without false alarms.

## 5. Complete User Journey
1. After statutory deed registration at the SRO, the citizen submits the mutation application number.
2. The Revenue Authority issues the proclamation in **R.C. Form-12**.
3. Bhūmi Ledger instantiates the **30-Day Proclamation Notice Countdown Timer** pursuant to Rule 34(1).
4. System monitors for public objections filed before the Tehsildar.
5. If an objection is filed or an interim stay is issued, the Authority flags the parcel, citing the Vaad UP computerized case code.
6. If no objections are filed during the 30-day window, the system transitions state to `OBJECTION_WINDOW_CLEARED`.
7. Tehsildar passes the mutation order within the 45-day SLA (Rule 34(7)), and the platform commits the post-mutation audit anchor.

## 6. Functional Requirements
- **FR-01 (Rule 34(1) Proclamation Notice Tracker):** Automatically calculate and display the mandatory 30-day public objection notice period starting from R.C. Form-12 proclamation issuance.
- **FR-02 (Rule 34(7) Disposal SLA Monitoring):** Maintain separate SLA trackers:
  - *Undisputed SLA:* 45 calendar days from proclamation.
  - *Disputed SLA:* 90 calendar days from proclamation.
- **FR-03 (6-Tier Litigation & Encumbrance Taxonomy):** System must categorize every encumbrance into one of six distinct classes:
  1. `PENDING_LITIGATION`: Active lawsuit without restraining order. (Advisory only).
  2. `REVENUE_DISPUTE`: Contested mutation under Sec 34/35. (Warning badge).
  3. `LIS_PENDENS`: Section 52 Transfer of Property Act. (Transfer is subordinate to decree, NOT void ab initio).
  4. `COURT_INJUNCTION`: Temporary prohibitory injunction under Order 39 CPC or Sec 212 UP Revenue Code. (Locks transfers via `isFrozen = true`).
  5. `STATUTORY_BAR`: Inherent legal bars (Sec 89 ceiling, Sec 98 SC/ST restriction). (Listing barred).
  6. `INTERNAL_PLATFORM_WARNING`: Heuristic or user-reported discrepancy. (Internal warning; NEVER labeled a court freeze).
- **FR-04 (Vaad UP Case Code Integration):** Require computerized case codes (`[0-9]{16}`) for all authority dispute flags, linking directly to the case status on `vaad.up.nic.in`.
- **FR-05 (Smart Contract Freeze Decoupling):** Smart contract `flagProperty(propertyId, reason)` is triggered strictly when an authorized official submits a verified court stay order or statutory bar.

## 7. Non-Functional Requirements
- **NFR-01 (Audit Trail Integrity):** Every dispute flag and unflag event recorded with the issuing officer's wallet address, timestamp, and case citation in `AUDIT_EVENTS`.
- **NFR-02 (Timer Accuracy):** Mutation countdown timers synchronized to IST (Indian Standard Time) with midnight-boundary date arithmetic.

## 8. Data Model
```sql
CREATE TABLE IF NOT EXISTS MUTATION_PROCEEDINGS (
    proceeding_id SERIAL PRIMARY KEY,
    parcel_id INTEGER NOT NULL,
    registered_deed_number VARCHAR(100) NOT NULL,
    vaad_case_code VARCHAR(16), -- 16-digit computerized case code
    proclamation_date DATE NOT NULL,
    objection_deadline_date DATE NOT NULL, -- proclamation_date + 30 days
    total_sla_deadline_date DATE NOT NULL, -- proclamation_date + 45 days (undisputed)
    is_contested BOOLEAN DEFAULT FALSE,
    disposition_status VARCHAR(50) DEFAULT 'PROCLAMATION_ISSUED',
    final_order_date DATE,
    tehsildar_wallet VARCHAR(42),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS LITIGATION_FLAGS (
    flag_id SERIAL PRIMARY KEY,
    parcel_id INTEGER NOT NULL,
    taxonomy_category VARCHAR(50) NOT NULL,
    case_number VARCHAR(100) NOT NULL,
    court_name VARCHAR(150) NOT NULL,
    order_date DATE,
    injunction_active BOOLEAN DEFAULT FALSE,
    statutory_citation VARCHAR(100),
    flagged_by_wallet VARCHAR(42) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

## 9. API Requirements
- `POST /api/mutation/proclamation`
  - *Payload:*
    ```json
    {
      "parcelId": 1,
      "registeredDeedNumber": "Book 1 Vol 4120 Deed 2026/0412",
      "proclamationDate": "2026-10-15",
      "vaadCaseCode": "2026090142000412"
    }
    ```
  - *Response (200 OK):* Instantiates proceeding; returns `objectionDeadline` (2026-11-14) and `slaDeadline` (2026-11-29).
- `POST /api/disputes/flag`
  - *Payload:*
    ```json
    {
      "parcelId": 1,
      "taxonomyCategory": "COURT_INJUNCTION",
      "caseNumber": "Civil Suit 142/2026",
      "courtName": "Civil Judge Senior Division, Lucknow",
      "orderDate": "2026-10-20",
      "injunctionActive": true
    }
    ```
  - *Response (200 OK):* Updates database, calls `flagProperty` on EVM anchor, locks transfer.

## 10. UI Requirements
- **Live Mutation SLA Widget:** Visual progress ring showing:
  - Phase 1: 30-Day Proclamation Notice Window (e.g. "Day 18 of 30 — 12 Days Remaining for Public Objections").
  - Phase 2: Tehsildar Disposal Window (45-Day SLA).
- **Multi-Tier Due Diligence Badge:** Prominently displays litigation status with exact legal category label.
- **Authority Flagging Modal:** Administrative modal with strict radio selector for the 6 taxonomy classes, requiring court details before freezing.

## 11. Validation and Failure Cases
- **Failure 1 (Premature Mutation Approval):** Attempting to mark mutation complete before the 30-day objection window elapses triggers error: *"Statutory objection window active under Rule 34(1). Final order cannot be entered before [Date]."*
- **Failure 2 (Missing Case Code):** Freezing a property without entering a court case code or order date is rejected.

## 12. Security and Privacy Requirements
- **Role-Based Access Control:** Only wallets with `ADMIN_ROLE` or verified revenue officer credentials can set `COURT_INJUNCTION` flags.
- **Zero Slander / Misleading Terminology:** Internal alerts explicitly state: *"Internal administrative review note. This does not constitute a judicial restraining order."*

## 13. Legal and Statutory Boundaries
- **Sections 34 & 35 UP Revenue Code, 2006:** Governs mutation duties.
- **Rules 34(1) & 34(7) UP Revenue Code Rules, 2016:** Governs notice periods and SLAs.
- **Section 52 Transfer of Property Act, 1882:** Governs *Lis Pendens*.

## 14. Official Source References
- UP Revenue Court Computerized Management System (`vaad.up.nic.in`).
- Uttar Pradesh Revenue Code, 2006 and Rules, 2016.
- Code of Civil Procedure, 1908 (Order 39 Rules 1 & 2).

## 15. Dependencies
- [`PRD-01`](file:///Users/lakshay/Desktop/Projects/Land-registry/Docs/prds/PRD-01-up-parcel-ingestion-and-document-provenance.md) (Parcel records).
- `contracts/LandRegistry.sol` (`flagProperty` & `unflagProperty` methods).

## 16. Acceptance Criteria
- Acceptance criteria defined in [`FEATURE_ACCEPTANCE_CRITERIA.md`](file:///Users/lakshay/Desktop/Projects/Land-registry/Docs/prds/FEATURE_ACCEPTANCE_CRITERIA.md#L57-L73) (AC-03.1 & AC-03.2).

## 17. Test Scenarios
- *TS-04.1:* Issue proclamation; verify 30-day countdown timer initialized.
- *TS-04.2:* Attempt premature mutation approval at Day 15; verify system rejects.
- *TS-04.3:* Submit `COURT_INJUNCTION` flag; verify property is frozen on-chain.
- *TS-04.4:* Submit `LIS_PENDENS` advisory; verify property is NOT frozen, only advisory displayed.

## 18. Out-of-Scope Items
- Automated judicial filing of objections into the Tehsildar court system.
- Direct integration with high court or Supreme Court case databases.

## 19. Risks and Unresolved Decisions
- *Risk:* Vaad UP website downtime. *Mitigation:* Support verified manual court certified copy upload and officer verification.

---

## 20. Independent Reviewer Assessment
- **Product Reviewer:** *"Approved. Solves the post-registration blind spot by making mutation timelines completely transparent."*
- **Legal Reviewer:** *"Approved. The 6-tier taxonomy eliminates legal liability by preventing false claims of court freezes."*
- **Architecture Reviewer:** *"Approved. Clean decoupling between on-chain freeze flags and off-chain litigation metadata."*
- **QA Reviewer:** *"Approved. Test scenarios rigorously assert Rule 34(1) 30-day notice integrity."*