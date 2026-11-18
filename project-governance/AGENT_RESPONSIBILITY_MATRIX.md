# AGENT RESPONSIBILITY MATRIX (RACI)
# Bhūmi Ledger — India Land Transaction & Registry Platform

**Document Version:** 1.0.0  
**Phase:** Phase 5 (Autonomous Multi-Agent Engineering Organisation)  
**Authors:** Chief AI Engineering Orchestrator  
**Date:** October 31, 2026  
**Status:** Active Canonical RACI Matrix  

---

## 1. RACI Definitions

- **R — Responsible:** The specialist agent assigned to directly design, author, implement, or verify the deliverable.
- **A — Accountable:** The agent with final decision authority, quality ownership, and synthesis sign-off (Chief Orchestrator).
- **C — Consulted:** Specialist agents whose inputs, statutory opinions, threat models, or architecture reviews are required before finalization.
- **I — Informed:** Agents kept updated on state changes, deliverables, and interface agreements.

---

## 2. Feature Package RACI Matrix (PKG-01 to PKG-16)

| Package ID & Name | Chief Orchestrator | Product & Legal | System Architect | Security & Privacy | Backend Engineer | Frontend Engineer | QA & Test Engineer |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **PKG-01: UP Parcel Ingestion & Hashing** | **A** | **C** | **C** | **C** | **R** | **R** | **R** |
| **PKG-02: Circle Rate Valuation Engine** | **A** | **C** | **C** | **I** | **R** | **C** | **R** |
| **PKG-03: Mutation SLA & Dispute Advisory**| **A** | **C** | **C** | **I** | **R** | **R** | **R** |
| **PKG-04: Land Record Verification** | **A** | **C** | **C** | **C** | **R** | **I** | **R** |
| **PKG-05: Non-Custodial Tax Schedule** | **A** | **C** | **C** | **I** | **R** | **R** | **R** |
| **PKG-06: Rural Resale Directory (RERA)** | **A** | **R** | **C** | **C** | **C** | **R** | **R** |
| **PKG-07: Tehsil Facilitation Desk** | **A** | **C** | **C** | **I** | **I** | **R** | **R** |
| **PKG-08: Consular NRI 90-Day PoA** | **A** | **C** | **C** | **I** | **C** | **R** | **R** |
| **PKG-09: Multi-State Config & Selector** | **A** | **C** | **R** | **I** | **C** | **R** | **R** |
| **PKG-10: Electronic Agreements Boundary**| **A** | **R** | **C** | **C** | **C** | **C** | **R** |
| **PKG-11: Settlement Architecture (Model 4)**| **A** | **C** | **R** | **C** | **R** | **C** | **R** |
| **PKG-12: Disputes & Fraud Prevention** | **A** | **C** | **C** | **R** | **R** | **C** | **R** |
| **PKG-15: Multi-State Extensibility** | **A** | **C** | **R** | **I** | **C** | **C** | **R** |
| **PKG-16: Official Portal Integrations** | **A** | **C** | **R** | **C** | **R** | **I** | **R** |

---

## 3. Phase 5 Sprint Execution RACI Matrix

| Sprint & Scope | Primary Deliverable | Responsible (R) | Accountable (A) | Consulted (C) | Informed (I) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Sprint 1 (Done)** | Multi-State Config & State Selector (PKG-09) | Frontend Engineer | Orchestrator | Architect, Legal | All |
| **Sprint 2 (Current Plan)**| Assisted Ingestion & CSPRNG Salt Vault (PKG-01)| Backend & Frontend | Orchestrator | Security, Legal, Arch | QA |
| **Sprint 3** | Dynamic Circle Rate Engine & Concessions (PKG-02)| Backend Engineer | Orchestrator | Legal, Architect | Frontend, QA |
| **Sprint 4** | Non-Custodial Direct Tax Schedule Engine (PKG-05)| Backend Engineer | Orchestrator | Legal, Architect | Frontend, QA |
| **Sprint 5** | Mutation SLA & Dispute Advisory Tracker (PKG-03)| Backend & Frontend | Orchestrator | Legal, Architect | QA |
| **Sprint 6** | Consular NRI 90-Day PoA Countdown (PKG-08) | Frontend Engineer | Orchestrator | Legal, Architect | Backend, QA |
| **Hardening** | End-to-End Regression & Security Audit | QA & Security | Orchestrator | All Specialists | Project Owner |

---

## 4. Operational Handshake Rules

1. **Pre-Implementation Planning Handshake:**
   - Every sprint requires independent reviews from Legal, Architecture, Security, Backend, Frontend, and QA.
   - The Orchestrator reviews all outputs, reconciles contradictions, and obtains explicit Project Owner authorization before editing application files.
2. **Implementation Execution Handshake:**
   - Code modifications are restricted strictly to the designated sprint file boundaries.
   - The Lead Engineer (Frontend or Backend) authors the code; the QA Engineer authors the automated unit tests.
3. **Verification & Exit Gate Handshake:**
   - Every sprint must pass 100% of new unit tests plus 100% of pre-existing baseline checks (Hardhat + Jest + E2E).
   - The Orchestrator audits `git status` and diffs to ensure zero unrelated changes were introduced.
