# FEATURE REGISTRY
# Bhūmi Ledger — India Land Transaction & Registry Platform

**Document Version:** 1.0.0  
**Status:** Canonical Feature Catalog & Readiness Tracker  

---

## 1. Feature Readiness Status Legend

- `Not researched`: Initial placeholder; no formal investigation conducted.
- `Research in progress`: Active research wave assigned to specialist agents.
- `Research verified`: Cross-verified with official statutes, circulars, or portal specs.
- `Legal review required`: Contains statutory, regulatory, or compliance ambiguity.
- `Integration unavailable`: External official service lacks public API or legal access.
- `Integration verified`: Official API / endpoint contract confirmed and testable.
- `Product ready`: Specifications, user journeys, and acceptance criteria completed.
- `Enabled`: Fully implemented, tested, and active in current codebase.
- `Coming Soon`: Visible in UI for multi-state or future phased release.
- `Blocked`: Impassable blocker requiring Project Owner escalation or statutory change.

---

## 2. Feature Master Registry (F01 – F17)

| Feature ID | Feature Name | Department Alignment | Assigned Lead | Uttar Pradesh Readiness | Multi-State Readiness | Key Dependencies | Existing Code Reuse |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **F01** | Land Registration & Property Onboarding | Business / Legal | Lead-F01 | `Enabled` (Base EVM) / `Research in progress` (UP RoR) | `Coming Soon` | F10, F14, F15 | `registerProperty` in contract, `CitizenDashboard` |
| **F02** | Land Buying Journey | Product / Business | Lead-F02 | `Research in progress` | `Coming Soon` | F01, F04, F08, F11 | `BuyPropertyModal.jsx`, `initiateTransfer` |
| **F03** | Land Selling Journey | Product / Business | Lead-F03 | `Research in progress` | `Coming Soon` | F01, F05, F08 | `ListPropertyModal.jsx`, `listPropertyForSale` |
| **F04** | Land Records & Ownership History | Research & Integration | Lead-F04 | `Enabled` (On-Chain) / `Research in progress` (Bhulekh) | `Coming Soon` | F01, F16 | `getOwnershipHistory`, `AUDIT_EVENTS`, `PublicSearch` |
| **F05** | Marketplace & Direct Buyer-Seller Discovery | Product / Engineering | Lead-F05 | `Enabled` (Base) / `Research in progress` (Compliance) | `Coming Soon` | F01, F03, F08 | `Marketplace.jsx`, `/api/properties/marketplace` |
| **F06** | Remote Transactions & NRI Workflows | Legal / Security | Lead-F06 | `Legal review required` | `Coming Soon` | F10, F14 | `SignTransferModal.jsx`, EIP-712 Typed Data |
| **F07** | Tehsil Facilitation & Verified Service Providers | Business / Operations | Lead-F07 | `Not researched` | `Coming Soon` | F14, F17 | None (New Domain) |
| **F08** | Government Valuation & Price Comparison | Research / Integration | Lead-F08 | `Research in progress` (Circle Rates) | `Coming Soon` | F05, F16 | `price` attribute in contract/DB |
| **F09** | Land Leasing (Agri vs. Non-Agri) | Legal / Product | Lead-F09 | `Not researched` | `Coming Soon` | F01, F10 | None (New Domain) |
| **F10** | Documents, Verification & Digital Signatures | Legal / Security | Lead-F10 | `Research verified` (EVM) / `Legal review required` (IT Act) | `Coming Soon` | F14, F17 | `keccak256` client hashing, EIP-712 signatures |
| **F11** | Payments, Escrow & Settlement | Legal / Architecture | Lead-F11 | `Enabled` (ETH Escrow) / `Legal review required` (Fiat) | `Coming Soon` | F02, F05 | `approveTransfer`, `rejectTransfer`, `escrowAmount` |
| **F12** | Disputes, Fraud Prevention & Risk | Security / Legal | Lead-F12 | `Enabled` (On-Chain Freeze) / `Research in progress` | `Coming Soon` | F01, F04 | `flagProperty`, `unflagProperty`, `isFrozen` |
| **F13** | Notifications & Transaction Tracking | Product / Engineering | Lead-F13 | `Not researched` | `Coming Soon` | F02, F11 | `AUDIT_EVENTS` table |
| **F14** | Identity, Roles & Permissions | Architecture / Security | Lead-F14 | `Enabled` (RBAC) / `Research in progress` (DigiLocker) | `Coming Soon` | F17 | `ADMIN_ROLE`, `AuthContext.jsx` |
| **F15** | Multi-State Configuration & State Selector | Architecture / Product | Lead-F15 | `Research in progress` | `Coming Soon` | All Features | Global UI Header in `App.jsx` |
| **F16** | Government & Third-Party Integrations | Research & Integration | Lead-F16 | `Research in progress` (Bhulekh/IGRSUP) | `Coming Soon` | F01, F04, F08 | `backend/indexer.js` |
| **F17** | Security, Audit & Data Protection | Security / QA | Lead-F17 | `Enabled` (On-Chain Audit) / `Research in progress` (DPDP) | `Coming Soon` | All Features | `AUDIT_EVENTS`, CEI patterns in contract |

---

## 3. Immediate Research Assignment Waves

- **Wave 1 Priority**:
  - `F15` (Multi-State Configuration & State Selector UI/UX)
  - `F01` (Land Registration & UP Revenue Code Baseline)
  - `F10` (Documents, Digital Signatures & IT Act 2000 Immovable Property Realities)
  - `F11` (Escrow & Settlement: Smart Contract vs. RBI / Indian Banking Frameworks)
- **Wave 2 Priority**:
  - `F04` / `F16` (Bhulekh UP, BhuNaksha GIS, IGRSUP e-Nibandhan API Feasibility)
  - `F08` (Circle Rates & UP Stamp Valuation Rules, 1997)
  - `F05` (Marketplace Direct Discovery & Disintermediation Legalities)
  - `F06` (NRI / Remote Transactions & Special Power of Attorney Rules in UP)
  - `F12` (Vaad / Revenue Court Injunctions & Title Freezing Integration)
