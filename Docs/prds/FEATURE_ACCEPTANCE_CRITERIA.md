# CANONICAL FEATURE ACCEPTANCE CRITERIA
# Bhūmi Ledger — India Land Transaction & Registry Platform

**Document Version:** 1.0.0  
**Phase:** Phase 3 (Product Definition & Quality Assurance)  
**Authors:** Lead QA Engineer (DH-QA), Lead Product Manager (DH-Product), Chief Architect (DH-Arch)  
**Status:** Approved for Project Owner Review  
**Format:** Behavior-Driven Development (Given / When / Then)  

---

## 1. Feature Package 1: UP Parcel Ingestion & Document Provenance (PRD-01)

### AC-01.1: Ingestion of Certified Khatauni PDF & Hash Commitment
- **Given:** An authenticated citizen user is on the Parcel Registration view (`/dashboard`).
- **When:** The user uploads a digitally signed UP Bhulekh Khatauni (RoR) PDF file ($< 10\text{ MB}$).
- **Then:**
  1. The backend extracts the 16-digit Computerized Gata Code (e.g. `0914285100000412`), Khasra number, recorded tenure holder, and area in hectares.
  2. If a 14-character alphanumeric ULPIN (Bhu-Aadhaar) is present, it is recorded; if absent, status is set to `PENDING_GEOREFERENCING`.
  3. The system computes the Keccak-256 cryptographic hash of the document bytes.
  4. The document verification status is set to `INTEGRITY_HASH_GENERATED`.
  5. The UI displays the mandatory legal banner: *"Integrity hash anchors file contents against tampering. Statutory proof of title is established exclusively by registered deeds and official revenue records."*

### AC-01.2: Rejection of Expired or Outdated Revenue Records
- **Given:** A user uploads an official Khatauni PDF.
- **When:** The extracted date of issuance is older than 90 calendar days from the current date.
- **Then:**
  1. The system marks document verification status as `EXPIRED_OUTDATED`.
  2. The UI displays an amber warning prompting the user to retrieve a fresh certified Khatauni from `upbhulekh.gov.in` to prevent relying on stale co-tenure data.

---

## 2. Feature Package 2: Circle Rate Valuation & Stamp Duty Calculator (PRD-02)

### AC-02.1: Dynamic UP Stamp Duty Calculation with Female Buyer Concession
- **Given:** A buyer Pooja (Female) is purchasing an agricultural parcel in Mohanlalganj, Lucknow for an agreed commercial price of ₹50,00,000.
- **When:** The user triggers the statutory valuation calculation with `purchaserGender = 'FEMALE'`.
- **Then:**
  1. The engine fetches the active Collectorate circle rate for the village and computes the statutory minimum valuation.
  2. If commercial price $\ge$ circle rate value, the base duty is assessed on ₹50,00,000.
  3. Base Stamp Duty (5%) = ₹2,50,000; Local Body Surcharge (2%) = ₹1,00,000.
  4. Female purchaser concession (-1%) is deducted: Net Stamp Duty is calculated as **6% (₹3,00,000)** instead of the standard male 7% (₹3,50,000).
  5. SRO Registration Fee (1%) = ₹50,000 is calculated separately.
  6. The breakdown displays the exact formula, source gazette date, and statutory limitation notice.

### AC-02.2: Road Multiplier Enforcement on Highway Frontages
- **Given:** A parcel is flagged as abutting a State Highway (`roadType = 'STATE_HIGHWAY'`).
- **When:** Circle rate calculation is triggered.
- **Then:**
  1. The engine automatically applies the statutory +15% road frontage multiplier to the base per-hectare rate.
  2. The calculated minimum valuation reflects: $\text{Area} \times \text{Base Rate} \times 1.15$.
  3. If the declared commercial consideration is lower than this minimum valuation, the UI displays a statutory shortfall warning under Section 47A of the Indian Stamp Act.

---

## 3. Feature Package 3: Mutation Notice SLA & Dispute Injunction Tracker (PRD-04)

### AC-03.1: Enforcement of Rule 34(1) 30-Day Objection Notice Window
- **Given:** A transfer request has been initiated for a rural land parcel.
- **When:** The mutation proclamation notice is issued in R.C. Form-12.
- **Then:**
  1. The system instantiates a **30-Day Public Objection Countdown Timer** pursuant to Rule 34(1) of UP Revenue Code Rules, 2016.
  2. The Authority Dashboard locks final mutation approval until the 30-day notice period has elapsed.
  3. The system tracks the 45-day undisputed case disposal SLA and 90-day disputed case SLA pursuant to Rule 34(7), displaying elapsed days.

### AC-03.2: Distinction Between Court Injunctions and Internal Warnings
- **Given:** A revenue authority or user inputs a pending litigation record.
- **When:** The litigation category is selected.
- **Then:**
  1. If categorized as `COURT_INJUNCTION` (Order 39 CPC or Section 212 UP Revenue Code stay order), the parcel transfer is locked (`isFrozen = true`), citing the court case number and date.
  2. If categorized as `PENDING_LITIGATION` without stay or `LIS_PENDENS`, the transfer is NOT locked; an informational advisory badge is displayed with statutory Section 52 Transfer of Property Act risk disclosures.
  3. Internal heuristic alerts are labeled strictly as `INTERNAL_PLATFORM_WARNING` and never termed a court-ordered freeze.

---

## 4. Feature Package 4: EIP-712 Conveyance Intent & Deed Draft Generator (PKG-04)

### AC-04.1: Cryptographic Dual Signing of Pre-Registration Agreement
- **Given:** A buyer and seller have agreed on parcel terms and valuation schedule.
- **When:** Both parties submit EIP-712 structured signatures via MetaMask.
- **Then:**
  1. The smart contract validates signatures using `ECDSA.recover` over `TRANSFER_TYPEHASH`.
  2. Smart contract emits `TransferSigned` for both addresses without executing title transfer.
  3. The platform generates an official, standardized statutory Sale Deed draft pre-filled with parcel coordinates, consideration amount, and circle rate schedules for physical SRO execution.

---

## 5. Feature Package 5: Dual-Rail Settlement & Form 141 Tax Engine (PRD-03)

### AC-05.1: Statutory 1% TDS Calculation under Section 393(1) of Income-tax Act, 2025
- **Given:** A property transaction consideration or circle rate value is $\ge ₹50,00,000$ (e.g. ₹60,00,000).
- **When:** The payment settlement breakdown is generated.
- **Then:**
  1. The engine calculates statutory 1% TDS = ₹60,000 pursuant to Section 393(1) [Table Sl. No. 3(i)] of the Income-tax Act, 2025.
  2. The system produces a pre-filled **Form 141 (Schedule B)** tax deduction schedule showing buyer PAN, seller PAN, property computerized Gata code, and tax amount.
  3. Net consideration payable to seller is displayed as ₹59,40,000.
  4. The UI displays an explicit compliance notice: *"Form 141 schedule is an assistance draft; tax remittance must be completed directly on the official Income Tax portal."*

### AC-05.2: Sandbox Escrow vs. Zero Live Banking Transactions
- **Given:** The application is operating in development/testnet mode.
- **When:** A buyer initiates a purchase on the marketplace.
- **Then:**
  1. Testnet ETH is locked in the Cancun smart contract escrow state.
  2. The system logs that zero live INR banking transactions, debit orders, or live payments are initiated.
  3. If user toggles to "Regulated Bank Escrow Planning Mode", the UI displays an informational escrow sub-account schedule with no external API calls to banking rails.

---

## 6. Feature Package 6: Rural Resale Directory with RERA Safeguards (PKG-06)

### AC-06.1: Agricultural Ceiling & Bhumidhar Transferable Affidavit
- **Given:** A seller lists a rural land parcel on the marketplace.
- **When:** The seller submits the listing form.
- **Then:**
  1. The system verifies that tenure classification is `BHUMIDHAR_TRANSFERABLE`.
  2. The seller must sign a digital affidavit affirming that their total family holding does not exceed 5.0586 hectares pursuant to Section 89 of the UP Revenue Code, 2006.
  3. The listing is published with a prominent RERA disclaimer: *"Facilitation restricted strictly to standalone ancestral rural agricultural resale plots exempt under Section 3 of RERA Act, 2016."*

---

## 7. Feature Package 7: Consular NRI 90-Day PoA Stamping Countdown (PKG-08)

### AC-07.1: Statutory Stamping Countdown Alert
- **Given:** A transaction involves a seller executing a Special Power of Attorney abroad.
- **When:** The user inputs the consular PoA details and arrival date in India.
- **Then:**
  1. The system calculates the statutory 90-day deadline under Section 18 of the Indian Stamp Act, 1899.
  2. The dashboard displays a live countdown timer showing days remaining to adjudicate stamp duty before the District Collector.
  3. If elapsed days exceed 90, the platform flags the transaction as `UNADJUDICATED_POA_EXPIRED`, preventing deed generation until Collectorate penalty adjudication is cleared.

---

## 8. Feature Package 8: Multi-State Config & State Selector (PRD-05)

### AC-08.1: State Selector Navigation & Dynamic Config Loading
- **Given:** An unauthenticated or authenticated citizen is on any page.
- **When:** The user opens the top navigation State Selector.
- **Then:**
  1. "Uttar Pradesh (Active Pilot)" is selected by default, loading all administrative units and circle rates from `up.config.json`.
  2. If user clicks on another state (e.g. Maharashtra, Karnataka), the system opens the standardized "Coming Soon" modal with an opt-in notification email input.
  3. The core application logic remains completely decoupled from state-specific code.

---
*End of Canonical Feature Acceptance Criteria.*