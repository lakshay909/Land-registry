# DEPENDENCY REGISTER
# Bhūmi Ledger — India Land Transaction & Registry Platform

**Document Version:** 1.0.0  
**Status:** Active Canonical Dependency Map  

---

## 1. Feature-to-Feature Internal Dependencies

```
F15 (Multi-State Configuration) ──┐
                                  ├──> F01 (Registration) ──> F03 (Selling) ──> F05 (Marketplace)
F14 (Identity & Roles) ───────────┘          │                                       │
                                             v                                       v
                                      F04 (Records) <────── F02 (Buying) <───────────┘
                                             │                     │
                                             v                     v
                                      F12 (Disputes)        F11 (Escrow)
                                                                   │
                                                                   v
                                                            F10 (Signatures)
```

---

## 2. Master Dependency Matrix

| Feature | Feature Name | Upstream Dependencies (Must be Ready First) | Downstream Consumers (Blocked Until Ready) |
| :--- | :--- | :--- | :--- |
| **F01** | Land Registration & Onboarding | F14 (Identity/Roles), F15 (Multi-State Config) | F02, F03, F04, F05, F08, F12 |
| **F02** | Land Buying Journey | F01 (Registration), F04 (Records), F05 (Marketplace), F11 (Escrow) | F06 (Remote Transactions), F13 (Notifications) |
| **F03** | Land Selling Journey | F01 (Registration), F08 (Valuation), F14 (Identity) | F05 (Marketplace Listings) |
| **F04** | Land Records & History | F01 (Registration), F16 (Govt Integrations) | F02 (Buying Due Diligence), F12 (Dispute Checks) |
| **F05** | Marketplace & Direct Discovery | F01 (Registration), F03 (Selling Listings) | F02 (Buying), F08 (Valuation Comparison) |
| **F06** | Remote Transactions & NRI Workflows | F10 (Documents/Signatures), F14 (Identity) | F02, F03 (Remote Buyers/Sellers) |
| **F07** | Tehsil Facilitator Directory | F14 (Roles/Perms), F17 (Auditability) | F01, F02 (Assisted Registrations) |
| **F08** | Government Valuation & Circle Rates | F15 (Multi-State), F16 (IGRSUP/Circle Rate Sources) | F03 (Listing Pricing), F05 (Marketplace Comparison) |
| **F09** | Land Leasing | F01 (Registration), F10 (Lease Deed Signatures) | F05 (Lease Listings) |
| **F10** | Documents, Verification & Signatures | F14 (Signer Identity), F17 (Hash Integrity) | F01, F02, F06, F11 |
| **F11** | Payments, Escrow & Settlement | F02 (Buyer Deposit), F10 (Dual Signatures), F14 (Authority Gate) | Final Title Transfer Execution |
| **F12** | Disputes & Injunction Freezes | F01 (Target Parcel), F14 (Registrar Role) | F02, F03, F05, F11 (Freezes all conveyances) |
| **F13** | Notifications & Tracking | F02, F11 (Event Triggers) | User Interface Real-time Alerts |
| **F14** | Identity, Roles & Permissions | None (Foundational Auth Layer) | All Features (RBAC Gatekeeper) |
| **F15** | Multi-State Configuration | None (Foundational Architectural Wrapper) | All Features (State Routing) |
| **F16** | Government & Third-Party Integrations | Central & State Government Portals (External) | F04 (Bhulekh), F08 (Circle Rates), F12 (Vaad) |
| **F17** | Security, Audit & Data Protection | Foundational Architectural Framework | All Features |

---

## 3. External Dependencies & Statutory Prerequisites

1. **Section 17, Registration Act, 1908**: Mandates physical or state-governed biometric execution before an authorized Sub-Registrar.
2. **Section 1(4), Information Technology Act, 2000**: Prohibits electronic execution for title deeds of immovable property.
3. **Sections 88–90, Uttar Pradesh Revenue Code, 2006**: Imposes restrictions on agricultural land transfers to non-agriculturists and ceiling limits (12.5 acres).
4. **Digital Personal Data Protection (DPDP) Act, 2023**: Mandates purpose limitation, consent, and strict minimization of Aadhaar/PAN data.
5. **Reserve Bank of India (RBI) Escrow Guidelines**: Governs domestic INR transaction escrow via scheduled commercial banks.
