# PRD-03: DUAL-RAIL SETTLEMENT ARCHITECTURE & FORM 141 TAX ENGINE
# Bhūmi Ledger — India Land Transaction & Registry Platform

**Document Version:** 1.0.0  
**Status:** Approved for Project Owner Review (Phase 3 Core PRD)  
**Authors:** Chief AI Engineering Orchestrator, DH-Product, DH-Legal, DH-Arch, DH-Security, DH-QA  
**Jurisdiction Baseline:** Republic of India / State of Uttar Pradesh (Pilot State)  

---

> [!IMPORTANT]
> **MANDATORY STATUTORY & OPERATIONAL BOUNDARY:**
> This module functions **strictly as a calculation, settlement breakdown, and draft-assistance capability**. Bhūmi Ledger does NOT hold citizen funds, does NOT execute live banking disbursements, does NOT operate an unauthorized nodal escrow account, and does NOT execute live tax filings on the Income Tax portal. Live domestic Indian land transactions must be settled through authorized banking channels pursuant to RBI and FEMA regulations.

---

## 1. Problem Statement
In Indian real estate transactions, tax non-compliance and payment opacity cause severe statutory liabilities for buyers and sellers. Under the recodified **Income-tax Act, 2025**, purchasers must withhold **1% Tax Deducted at Source (TDS)** under **Section 393(1)** on land transfers $\ge ₹50,00,000$ and remit it to the Central Government using **Form 141 (Schedule B)** (replacing legacy Section 194-IA and Form 26QB). Many buyers fail to deduct TDS, resulting in statutory interest and penalties. Meanwhile, naive Web3 platforms attempting to settle real estate directly in cryptocurrency violate Foreign Exchange Management Act (FEMA) guidelines and Reserve Bank of India (RBI) directives, while assuming unverified nodal banking integrations without regulatory licenses.

## 2. Business Objective
Deliver a compliant, dual-rail settlement architecture and tax-drafting engine that:
1. Retains **Sandbox EVM Escrow** on local Hardhat and testnets for academic demonstration of algorithmic state locks.
2. Models production INR settlement through a structured **Dual-Rail Settlement Breakdown Schedule**.
3. Automatically computes statutory **1% TDS under Section 393(1) of the Income-tax Act, 2025**.
4. Produces pre-filled, downloadable **Form 141 (Schedule B)** deduction schedules for the parties.
5. Strictly enforces the boundary that zero live fiat banking movements or live tax payments are executed on the platform.

## 3. User Personas
- **Pooja (Citizen Buyer):** Purchasing property worth ₹75 Lakhs who needs to know how much to pay the seller, how much to withhold for TDS, and how to fill Form 141.
- **Ramesh (Citizen Seller):** Needs transparency on net proceeds receivable after statutory deductions.
- **Developer / Evaluator:** Web3 developer testing the contract escrow mechanics on Hardhat localhost using mock accounts.

## 4. User Stories
- *As a Buyer,* I want the system to calculate statutory 1% TDS under Section 393(1) and generate a pre-filled Form 141 schedule so that I fulfill my legal tax withholding duties without error.
- *As a Seller,* I want a clear, itemized breakdown showing gross consideration, 1% tax withholding, and net receivable balance so that there is no commercial dispute at closing.
- *As a Developer,* I want to test the smart contract escrow flow on testnets using mock ETH without triggering live financial transactions.

## 5. Complete User Journey
1. Buyer and Seller agree on commercial consideration (e.g., ₹75,00,000).
2. The **Payment & Settlement Planning Wizard** opens.
3. User selects the settlement mode:
   - **Mode A (Sandbox / Academic Dev):** Connects MetaMask and tests on-chain EVM escrow using testnet ETH on Hardhat (31337).
   - **Mode B (Regulated INR Planning):** System generates the official financial settlement breakdown schedule.
4. If property consideration $\ge ₹50,00,000$, engine computes:
   - 1% Statutory TDS: ₹75,000.
   - Net payable to Seller: ₹74,25,000.
5. System displays pre-filled **Form 141 (Schedule B)** draft containing buyer PAN, seller PAN, 16-digit Gata Code, and remittance details.
6. User downloads the Form 141 draft PDF to guide their remittance on `eportal.incometax.gov.in`.
7. Once paid, user uploads the official Income Tax challan receipt to anchor the tax clearance hash.

## 6. Functional Requirements
- **FR-01 (Dual-Rail Architecture Separation):** Complete technical decoupling between testnet EVM escrow contracts and the production INR settlement schedule engine.
- **FR-02 (Section 393(1) TDS Calculation):** Automatically calculate 1% withholding on all transactions where consideration or circle rate valuation is $\ge ₹50,00,000$.
- **FR-03 (Rural Agricultural Land Exemption):** Check land classification; if classified as rural agricultural land outside municipal limits, flag exemption under Section 393(1) and set TDS to ₹0 with statutory citation.
- **FR-04 (Form 141 Schedule B Generator):** Generate standardized PDF/JSON schedule containing:
  - Buyer Name & Masked PAN
  - Seller Name & Masked PAN
  - 16-digit Computerized Gata Code & District
  - Total Consideration & Date of Agreement
  - 1% TDS Amount to be remitted
- **FR-05 (Zero-Custody Enforcement):** Absolute technical bar against receiving citizen fiat deposits, holding banking credentials, or initiating live bank debits.
- **FR-06 (EVM Sandbox Escrow Testing):** Maintain full backward compatibility with `contracts/LandRegistry.sol` for testnet escrow demonstration.

## 7. Non-Functional Requirements
- **NFR-01 (Calculation Accuracy):** Financial figures calculated to the exact rupee without floating-point drift.
- **NFR-02 (Zero PII Exposure):** PAN numbers masked in UI (e.g. `ABCDE****F`); only masked hashes stored.
- **NFR-03 (Export Latency):** Form 141 draft schedule generated and exported in $< 800\text{ ms}$.

## 8. Data Model
```sql
CREATE TABLE IF NOT EXISTS SETTLEMENT_SCHEDULES (
    schedule_id SERIAL PRIMARY KEY,
    parcel_id INTEGER NOT NULL,
    gross_consideration NUMERIC(15, 2) NOT NULL,
    is_rural_agricultural_exempt BOOLEAN DEFAULT FALSE,
    is_tds_applicable BOOLEAN DEFAULT FALSE,
    tds_rate_pct NUMERIC(4, 2) DEFAULT 1.00,
    tds_amount NUMERIC(15, 2) DEFAULT 0.00,
    net_payable_seller NUMERIC(15, 2) NOT NULL,
    form_141_draft_hash VARCHAR(66),
    statutory_tax_section VARCHAR(50) DEFAULT 'SECTION_393_1_ITA_2025',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

## 9. API Requirements
- `POST /api/settlement/plan`
  - *Payload:*
    ```json
    {
      "parcelId": 1,
      "consideration": 7500000,
      "isRuralAgricultural": false,
      "buyerPanMasked": "ABCDE1234F",
      "sellerPanMasked": "XYZPK5678L"
    }
    ```
  - *Response (200 OK):*
    ```json
    {
      "status": "success",
      "settlementSchedule": {
        "grossConsideration": 7500000,
        "tdsApplicable": true,
        "statutorySection": "Section 393(1) [Table Sl. No. 3(i)] Income-tax Act, 2025",
        "tdsRatePct": 1.0,
        "tdsAmount": 75000,
        "netPayableToSeller": 7425000,
        "challanFormName": "Form 141 (Schedule B)",
        "remittanceDeadline": "30 days from the end of the month of execution"
      },
      "complianceNotice": "Draft assistance only. Tax must be remitted directly to the Central Government via the official Income Tax portal."
    }
    ```

## 10. UI Requirements
- **Mode Toggle Strip:** Clear segmented toggle: **Sandbox Web3 Escrow (Testnet)** vs. **Regulated INR Settlement Planning**.
- **Financial Breakdown Card:** High-contrast summary showing Gross Amount, Minus 1% TDS, Equals Net to Seller.
- **Form 141 Assistance Modal:** Interactive preview of the Income Tax schedule with a "Download Form 141 Draft Schedule (PDF)" button.
- **Prominent Compliance Callout:** Distinct callout reminding buyer that failure to remit TDS attracts statutory interest under Section 201 / Section 399.

## 11. Validation and Failure Cases
- **Failure 1 (Negative Amount):** Reject invalid consideration amounts $< 0$.
- **Failure 2 (Missing PAN):** If buyer/seller PAN is not provided for transactions $\ge ₹50$ lakhs, alert user that PAN is required for Form 141 generation.

## 12. Security and Privacy Requirements
- **DPDP Act & Income Tax Privacy:** Raw PAN cards are never committed to the blockchain. Only masked strings (`XXXXX1234X`) appear in application logs.
- **Zero Banking Credentials:** The platform does not collect, prompt for, or store citizen net-banking passwords, UPI PINs, or debit card details.

## 13. Legal and Statutory Boundaries
- **Section 393(1) Income-tax Act, 2025:** Governs real estate TDS.
- **RBI / FEMA Regulations:** Domestic property transfers cannot be paid in cryptocurrency.
- **Section 25A Payment and Settlement Systems Act, 2007:** Operating an escrow without RBI licensing is prohibited.

## 14. Official Source References
- Central Board of Direct Taxes (CBDT) notifications on the Income-tax Act, 2025.
- Income Tax Department Tax Information Network (`eportal.incometax.gov.in`).
- Reserve Bank of India Master Directions for Payment Aggregators (2020/2024).

## 15. Dependencies
- [`PRD-02`](file:///Users/lakshay/Desktop/Projects/Land-registry/Docs/prds/PRD-02-circle-rate-valuation-and-stamp-duty-calculator.md) (Valuation figures feed into tax applicability check).
- `contracts/LandRegistry.sol` (EVM sandbox escrow testing).

## 16. Acceptance Criteria
- Acceptance criteria defined in [`FEATURE_ACCEPTANCE_CRITERIA.md`](file:///Users/lakshay/Desktop/Projects/Land-registry/Docs/prds/FEATURE_ACCEPTANCE_CRITERIA.md#L75-L100) (AC-05.1 & AC-05.2).

## 17. Test Scenarios
- *TS-03.1:* Enter ₹75 Lakh commercial consideration; verify 1% TDS (₹75,000) and Form 141 schedule generated.
- *TS-03.2:* Enter ₹40 Lakh commercial consideration; verify TDS is 0 (below ₹50 Lakh statutory threshold).
- *TS-03.3:* Mark parcel as rural agricultural exempt; verify TDS is 0 with statutory citation.

## 18. Out-of-Scope Items
- Live banking APIs or payment gateway checkout.
- Automated API filing with the Income Tax Department e-filing portal.
- Mainnet cryptocurrency settlement.

## 19. Risks and Unresolved Decisions
- *Risk:* Income Tax Department portal updates Form 141 schema. *Mitigation:* Versioned schedule templates decoupled from backend logic.

---

## 20. Independent Reviewer Assessment
- **Product Reviewer:** *"Approved. Solves a major pain point by giving buyers an exact Form 141 schedule without crossing into financial custody."*
- **Legal Reviewer:** *"Approved. Strictly complies with the Income-tax Act, 2025 re-codification and eliminates RBI/FEMA crypto settlement liabilities."*
- **Architecture Reviewer:** *"Approved. Clean separation between testnet smart contract escrow and off-chain tax drafting."*
- **QA Reviewer:** *"Approved. Test specs rigorously verify the ₹50 Lakh threshold and rural agricultural exemption edge cases."*