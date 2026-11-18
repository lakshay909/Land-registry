# REGULATORY SETTLEMENT & NODAL BANKING FEASIBILITY STUDY
# Bhūmi Ledger — India Land Transaction & Registry Platform

**Document Version:** 1.0.0  
**Phase:** Phase 4 (Architecture, Security, Privacy & Regulatory Feasibility Gate — Workstream W03)  
**Authors:** Chief AI Engineering Orchestrator, Department Head of Legal (DH-Legal), Regulatory Compliance Specialist, DH-Arch  
**Status:** Canonical Regulatory Feasibility Specification  
**Jurisdiction Baseline:** Republic of India / Reserve Bank of India (RBI) Regulations / FEMA / PSSA 2007  

---

## 1. Executive Summary & Regulatory Reality

In response to the Project Owner's explicit directives on **Q01** and Workstream **W03**, this study establishes the legal, regulatory, and operational feasibility of financial settlement for Indian real estate transactions.

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                               THE CRITICAL REGULATORY FINDING                          │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ A software technology company CANNOT hold, pool, or route citizen real-estate funds in  │
│ an un-regulated escrow or internal nodal account. Doing so constitutes operating an     │
│ unauthorized Payment System under Section 4 and Section 25 of the Payment and          │
│ Settlement Systems Act, 2007 (PSSA), exposing directors to criminal prosecution.       │
│                                                                                        │
│ For MVP Release 1, Bhūmi Ledger MUST operate as a Pure Non-Custodial Technology        │
│ Facilitator (Model 4), completely decoupled from money transmission.                   │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Applicable RBI Regulations & Payment Aggregator Directives

### 2.1 The Regulatory Framework
1. **Payment and Settlement Systems Act, 2007 (Act 51 of 2007):** Governs payment systems, netting, and settlement within India. Under Section 4, no person other than the Reserve Bank shall commence or operate a payment system except under and in accordance with an authorization issued by the RBI.
2. **RBI Master Directions on Guidelines on Regulation of Payment Aggregators and Payment Gateways (DPSS.CO.PD.No.1810/02.14.008/2019-20, updated 2024):**
   - *Payment Aggregators (PAs):* Entities that facilitate e-commerce sites and merchants to accept various payment instruments from customers for completion of their payment obligations.
   - PAs must hold funds in a designated **Escrow Account** maintained with a Scheduled Commercial Bank.
   - *Net Worth Requirement:* PAs must maintain a minimum net worth of **₹15 Crores** at the time of application, scaling to **₹25 Crores** within three financial years.
3. **Prevention of Money Laundering Act, 2002 (PMLA) & Master Direction - Know Your Customer (KYC) Direction, 2016:** Real estate transactions exceeding statutory thresholds require customer due diligence (CDD), beneficial ownership identification, and mandatory reporting of suspicious transactions (STRs) to the Financial Intelligence Unit - India (FIU-IND).

---

## 3. Escrow vs. Nodal vs. Internal Settlement Accounts

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        ACCOUNT STRUCTURES UNDER INDIAN LAW                             │
├───────────────────────┬────────────────────────────┬───────────────────────────────────┤
│ Account Structure     │ Governing Statute          │ Legal Status & Availability       │
├───────────────────────┼────────────────────────────┼───────────────────────────────────┤
│ **Nodal Account**     │ RBI Circular DPSS.PD.CO.   │ **SUPERSEDED / RESTRICTED.**      │
│                       │ No.1102/02.14.08/2009-10   │ Historically allowed for e-com;   │
│                       │                            │ largely replaced by formal Escrow │
│                       │                            │ Accounts under 2020 Master Direct.│
├───────────────────────┼────────────────────────────┼───────────────────────────────────┤
│ **RBI PA Escrow**     │ Section 25A PSSA 2007 &    │ **PERMISSIBLE ONLY FOR LICENSED   │
│                       │ RBI Master Directions 2020 │ ENTITIES.** Requires PA license,  │
│                       │                            │ ₹25 Cr capital, and daily audits. │
├───────────────────────┼────────────────────────────┼───────────────────────────────────┤
│ **Tripartite Bank     │ Indian Contract Act, 1872  │ **PERMISSIBLE VIA SCHEDULED BANK**│
│ Escrow Desk**         │ (Section 126 Bailment /    │ Bank acts as escrow agent;        │
│                       │ Agency Principles)         │ software platform is purely a     │
│                       │                            │ technological instruction provider│
├───────────────────────┼────────────────────────────┼───────────────────────────────────┤
│ **Non-Custodial Direct│ Direct Citizen Banking     │ **100% PERMISSIBLE FOR MVP.**     │
│ Settlement (Model 4)**│ (RTGS / NEFT / IMPS /      │ Citizen pays seller directly via  │
│                       │ State Treasury e-Challan)  │ bank; platform holds zero funds.  │
└───────────────────────┴────────────────────────────┴───────────────────────────────────┘
```

---

## 4. Evaluation of Four Settlement Operating Models

### Model 1: Direct RBI-Licensed Payment Aggregator
- **Mechanism:** Bhūmi Ledger applies for a Payment Aggregator license from the RBI, maintains a ₹25 Crore net worth, and opens a Section 25A Escrow Account.
- **Feasibility:** **FATAL / NOT FEASIBLE FOR MVP.** Extreme regulatory lead time (18–24 months), massive capital requirement, and ongoing compliance burden.

### Model 2: Sub-Merchant Partnership under an Authorized Payment Aggregator
- **Mechanism:** Integrate with an RBI-licensed Payment Aggregator (e.g., Razorpay, Cashfree Escrow, or PayU) where the PA provides the escrow framework and merchant settlement.
- **Feasibility:** **COMPLEX / POST-MVP ONLY.** Payment aggregators are restricted by RBI rules from processing high-ticket real estate transactions without specialized physical KYC and merchant underwriting. Real estate is classified as high-risk under AML categories.

### Model 3: Tripartite Escrow via a Scheduled Commercial Bank
- **Mechanism:** The Buyer, Seller, and an authorized Scheduled Commercial Bank (e.g., ICICI Bank Real Estate Escrow Desk, HDFC Bank, Axis Bank) execute a tripartite escrow agreement. The bank acts as the escrow agent, disbursing funds upon formal SRO deed registration.
- **Feasibility:** **VIABLE FOR PHASE 5 PILOT WITH INSTITUTIONAL BANK.** Requires legal partnership agreement with bank; platform acts as technological workflow bridge.

### Model 4: Pure Non-Custodial Software Assistant (Recommended for MVP Release 1)
- **Mechanism:** Bhūmi Ledger provides complete financial transparency without touching money:
  1. Computes circle rate minimum valuation and statutory Stamp Duty.
  2. Computes **1% TDS under Section 393(1) of the Income-tax Act, 2025** and outputs pre-filled **Form 141 (Schedule B)** drafts.
  3. Outputs an itemized settlement schedule detailing exact bank remittance instructions.
  4. Citizen pays seller directly through their own bank via RTGS/NEFT, and pays stamp duty directly on the state treasury portal (`e-Gras / IGRSUP`).
- **Feasibility:** **IMMEDIATELY VIABLE & 100% REGULATORILY SAFE.** Zero capital requirements, zero money transmission licenses, zero RBI audit liability.

---

## 5. Merchant-of-Record (MoR) & Tax Liabilities

- **Merchant-of-Record Liability:** If Bhūmi Ledger were to act as the Merchant of Record, it would become legally responsible for:
  - Goods and Services Tax (GST) invoicing and liability under the Central Goods and Services Tax Act, 2017.
  - Consumer Protection (E-Commerce) Rules, 2020 liabilities for delivery delays or cancellation disputes.
  - TDS deduction liabilities under Section 194-O (TDS on e-commerce operators).
- **Architecture Mandate:** Bhūmi Ledger **SHALL NOT ACT AS THE MERCHANT OF RECORD** for real estate purchase consideration. The transaction is strictly a bilateral conveyance between citizen seller and citizen buyer.

---

## 6. Open Legal & Commercial Questions for Bank Partnership (Phase 5)

| Q-ID | Domain | Strategic Open Question | Gating Authority |
| :--- | :--- | :--- | :--- |
| **BQ-01** | Bank Partnership | What is the minimum transaction volume and fee schedule required by ICICI/HDFC Escrow Desks for a pilot in Lucknow? | Bank Institutional Sales |
| **BQ-02** | RBI Regulatory | Does the RBI's draft digital lending and escrow guidelines restrict conditional milestone escrow for secondary real estate resale? | External Banking Counsel |
| **BQ-03** | Stamp Act | In Uttar Pradesh, does a tripartite escrow agreement require independent stamp duty adjudication under Article 5 of the Indian Stamp Act? | UP IGRS Legal Cell |

---
*End of Regulatory Settlement & Nodal Banking Feasibility Study.*