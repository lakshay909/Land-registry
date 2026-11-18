# FEATURE RESEARCH DOSSIER: F11 (REVALIDATED)
# Payments, Escrow & Settlement (Indian Real Estate Context)

**Feature ID:** F11  
**Feature Name:** Smart Escrow & Payment Settlement Architecture  
**Feature Lead:** Lead-F11  
**Supervising Department:** Legal (DH-Legal) & Architecture (DH-Arch)  
**Readiness Status:** **EVM Escrow: Enabled (Local Testnet) / Domestic Fiat Settlement: Research & Regulatory Review Active**  
**Jurisdiction:** Central India & Uttar Pradesh  
**Last Revalidated:** October 31, 2026 (Reflecting Project Owner Directives)  

---

## 1. Revision History & Audit Record

| Date | Revision | What Changed | Reason for Change |
| :--- | :--- | :--- | :--- |
| **2026-10-31** | **v2.0.0** | **Revalidated Direct Tax Provisions**: Replaced legacy Section 194-IA and Form 26QB with the current **Section 393(1) [Table Sl. No. 3(i)]** and **Form 141 (Schedule B)** of the **Income-tax Act, 2025**.<br/>**Reclassified Nodal Escrow**: Formally classified proposed banking nodal escrow as an **unapproved research hypothesis**, detailing legal, RBI, and contractual prerequisites before any provider selection. | Project Owner correction directive; updating tax code baseline to current statutory reality and enforcing objective banking model analysis. |
| **2026-10-31** | v1.0.0 | Initial dossier on smart contract escrow and payment settlement. | Baseline creation. |

---

## 2. Revalidated Direct Tax Provisions: Income-tax Act, 2025

### 2.1 Transition from Section 194-IA to Section 393(1)
Under India's overhauled direct tax framework, the withholding tax on immovable property transfers has transitioned:

```
┌───────────────────────────────────────┬────────────────────────────────────────┐
│ Legacy Framework (Income-tax Act 1961)│ Current Framework (Income-tax Act 2025)│
├───────────────────────────────────────┼────────────────────────────────────────┤
│ Section 194-IA                        │ Section 393(1) [Table Sl. No. 3(i)]    │
│ Challan Form 26QB                     │ Form 141 (Schedule B)                  │
│ Form 16B (TDS Certificate)            │ Form 141 Generated Certificate         │
│ Non-Resident Seller: Section 195/TAN  │ Section 393(2) [Table 17] / Form 141 (E)│
└───────────────────────────────────────┴────────────────────────────────────────┘
```

### 2.2 Statutory Rules under Section 393(1) & Form 141
1. **Applicability:** Applies to the purchase of any immovable property (land, residential building, commercial space).
2. **Exclusion:** **Rural agricultural land** is strictly exempt from Section 393 deduction.
3. **Threshold:** The consideration **or** stamp duty circle rate value is **₹50 Lakhs or more**.
4. **Tax Rate:** **1%** calculated on the higher of the actual agreed sale consideration or the stamp duty value. If the seller lacks a valid PAN, the withholding rate escalates under Section 206AA equivalent provisions.
5. **Form 141 (Schedule B) Mechanism:**
   - Unified, PAN-based *challan-cum-statement*.
   - The buyer **does not require a TAN**; transactions are authenticated via the buyer's PAN on the Income Tax e-filing portal.
   - Filing Deadline: Must be deposited and filed electronically within **30 days** from the end of the month in which deduction was made.
- **Evidence Classification:** `VERIFIED FACT` (Income-tax Act, 2025; Central Board of Direct Taxes Rules & Portal Instructions).

---

## 3. Escrow & Settlement: Legal Models Under Investigation

> [!IMPORTANT]
> The proposed Nodal Banking Escrow Adapter is an **unapproved research hypothesis**. No banking partner or fintech provider has been approved or selected. The following analysis evaluates the statutory and structural requirements governing real estate escrow in India.

### 3.1 Model A: Smart Contract EVM Escrow (Current Baseline)
- **Status:** **Active in Local Hardhat Testnet / Educational Prototype**.
- **Mechanism:** Implemented in [`LandRegistry.sol:192-239`](file:///Users/lakshay/Desktop/Land-registry/contracts/LandRegistry.sol#L192-L239). Buyer locks test ETH in contract; auto-disbursed on `approveTransfer` or refunded on `rejectTransfer`.
- **Statutory Constraint in India:** Unbacked cryptocurrency cannot be legally used for domestic real estate settlement under the Foreign Exchange Management Act (FEMA, 1999) and RBI directions. It violates capital account transaction norms and triggers severe PMLA compliance barriers.
- **Role:** Preserved exclusively for testnet benchmarking, cryptographic verification demos, and international pilot modeling.

### 3.2 Model B: Tripartite Bank Escrow Account (Research Hypothesis)
- **Statutory Framework:** Governed by Section 10 of the Indian Contract Act, 1872 and RBI Master Directions on Escrow Accounts.
- **Structure:**
  - Tripartite Escrow Agreement executed among **Buyer**, **Seller**, and an **RBI-Authorized Scheduled Commercial Bank / Escrow Trustee**.
  - Funds are deposited in a designated, ring-fenced Escrow Account.
  - Funds are released to the seller only upon presentation of the registered Sale Deed (*Bainama*) and verification of SRO receipt.
- **Legal Prerequisites to Establish:**
  1. *Trustee Licensing*: Escrow agent must be a SEBI-registered Debenture/Escrow Trustee or an authorized Scheduled Commercial Bank.
  2. *TDS Compliance*: Mechanism must automatically segregate the 1% Section 393(1) TDS for deposit into Form 141 (Schedule B) before releasing the 99% balance to the seller.
  3. *Stamp Duty Pre-Payment*: Stamp duty must be paid prior to SRO registration, requiring conditional pre-release from escrow for e-Challan generation.

### 3.3 Model C: Direct Bilateral Settlement with Milestone Ledger Tracking (Zero-Escrow Alternative)
- **Structure:** The platform does not hold, custody, or intermediate funds.
- **Mechanism:** Parties settle funds directly through regular banking channels (NEFT/RTGS/Cheque). The platform records bank transaction UTR numbers and receipt hashes on-chain, requiring bilateral confirmation before initiating transfer approvals.
- **Advantages:** Completely avoids escrow trustee fees, RBI financial intermediary licensing, and banking regulatory liabilities.

---

## 4. Smart Contract Security: PullPayment Refactoring Recommendation

For the smart contract baseline, the existing push payment pattern (`payable(recipient).call{value: amount}("")`) remains an operational risk. 

**Recommended Action for Phase 4 Architecture:**
- Transition to OpenZeppelin's `PullPayment` pattern, moving funds to `pendingWithdrawals[recipient]` and requiring an independent `withdrawEscrow()` call. This ensures that a reverting fallback in a recipient contract cannot block or revert administrative approvals.

---

## 5. Implementation Acceptance Criteria

1. On local/testnet EVM, `initiateTransfer` requires `msg.value >= property.price`.
2. All UI settlement copy must state that testnet ETH represents simulated settlement.
3. Live transaction documentation must reflect Section 393(1) and Form 141 (Schedule B) for 1% TDS on transactions $\ge ₹50\text{ Lakhs}$.
4. No commercial banking provider shall be integrated or configured without explicit Project Owner authorization.
