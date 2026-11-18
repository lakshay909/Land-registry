# PHASE 4 OPEN QUESTIONS & UNRESOLVED DECISION REGISTER
# Bhūmi Ledger — India Land Transaction & Registry Platform

**Document Version:** 1.0.0  
**Phase:** Phase 4 (Architecture, Security, Privacy & Regulatory Feasibility Gate)  
**Authors:** Chief AI Engineering Orchestrator, Department Head of Architecture (DH-Arch), Department Head of Legal (DH-Legal)  
**Status:** Canonical Open Questions Tracking for Phase 4  
**Jurisdiction Baseline:** Republic of India / State of Uttar Pradesh (Pilot State)  

---

## 1. Executive Summary & Gating Taxonomy

This register captures all open architectural, regulatory, banking, and government integration questions identified during Phase 4 research. In strict adherence to governance principles, **unapproved hypotheses remain explicitly tagged as UNRESOLVED and cannot be converted into implementation without explicit Project Owner sign-off**.

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                 QUESTION STATUS TAXONOMY                               │
├────────────────────┬───────────────────────────────────────────────────────────────────┤
│ `ESCALATED_OWNER`  │ Requires explicit strategic determination from the Project Owner. │
├────────────────────┼───────────────────────────────────────────────────────────────────┤
│ `EXTERNAL_LEGAL`   │ Requires formal written opinion from external practising counsel. │
├────────────────────┼───────────────────────────────────────────────────────────────────┤
│ `BANKING_PARTNER`  │ Requires institutional commercial discussions with bank escrow.   │
├────────────────────┼───────────────────────────────────────────────────────────────────┤
│ `GOVT_MOU_GATE`    │ Requires formal bilateral administrative partnership with NIC/UP. │
└────────────────────┴───────────────────────────────────────────────────────────────────┘
```

---

## 2. Exhaustive Register of Material Open Questions

| Q-ID | Domain | Subject & Question Statement | Status | Impact & Risks if Unresolved | Target Gate |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **OQ-REG-01** | Regulatory / Banking | **Bank Escrow Minimum Viability:** What are the minimum capital, transaction volume, and legal indemnity terms required by Scheduled Commercial Banks (e.g., ICICI / HDFC / Axis Real Estate Escrow Desks) to operate a tripartite escrow bridge for our platform in Phase 5? | `BANKING_PARTNER` | High (If bank terms require ₹50 Cr annual throughput, tripartite model must be postponed). | Phase 5 Banking Partnership Gate |
| **OQ-LEG-01** | RERA Act, 2016 | **Digital Directory Classification under Section 2(zm):** Does providing an unmonetized (zero-fee) informational directory of ancestral rural agricultural land constitute acting as a "Real Estate Agent" under Section 2(zm) of RERA in Uttar Pradesh? | `EXTERNAL_LEGAL` | High (Statutory penalties under Section 62 if portal is deemed an unregistered broker). | External Counsel Brief Review |
| **OQ-LEG-02** | RERA Act, 2016 | **Planning Area Resale Exception:** In Uttar Pradesh, does the individual resale of an ancestral agricultural plot located within the Lucknow Development Authority (LDA) master plan boundary require RERA project registration if no Section 80 conversion or plotted layout has been undertaken? | `EXTERNAL_LEGAL` | Medium (Determines whether rural listings near urban borders can be displayed). | External Counsel Brief Review |
| **OQ-INT-01** | Govt Integration | **NIC Open Data Gateway MoU:** What are the procedural prerequisites, administrative security clearances (Cert-In audit), and lead time required by the UP State IT Department / NIC UP to execute a formal MoU for authenticated Khatauni and BhuNaksha API gateway access? | `GOVT_MOU_GATE` | High (Assisted citizen PDF workflow remains the permanent primary ingestion engine until MoU). | Phase 6 Institutional Expansion |
| **OQ-DAT-01** | DPDP Act, 2023 | **DPBI Rule Commencement Date:** On what exact date will the Data Protection Board of India (DPBI) rules governing statutory breach notification timelines and data fiduciary registration formally commence? | `EXTERNAL_LEGAL` | Medium (Incident response notification runbooks must be adjusted to the final statutory timeline). | Phase 5 Privacy Governance |
| **OQ-NET-01** | Blockchain Network | **Production Network Designation:** When production EVM deployment is authorized, should Bhūmi Ledger target a public Ethereum L2 (e.g., Arbitrum One / Base / Polygon CDK) or a sovereign state-supported permissioned consortium (e.g., NIC National Blockchain Framework / Hyperledger Besu)? | `ESCALATED_OWNER` | Strategic (Directly affects gas economics, sovereign data compliance, and node validator governance). | Phase 5 EVM Deployment Gate |
| **OQ-SEC-01** | Document Security | **Server-Side Virus Sandbox Overhead:** Does integrating an automated ClamAV scanning container into the Express ingestion pipeline add prohibitive latency ($> 2,000\text{ ms}$) on low-tier cloud instances, necessitating an asynchronous background queue (BullMQ + Redis)? | `INTERNAL_ARCH` | Low (Operational performance optimization). | Phase 5 Ingestion Engineering |

---

## 3. Action Plan for Phase 5 Resolution

1. **RERA Counsel Briefing:** Transmit [`RERA_LEGAL_REVIEW_BRIEF.md`](file:///Users/lakshay/Desktop/Projects/Land-registry/Docs/architecture/RERA_LEGAL_REVIEW_BRIEF.md) to practising advocate at the Allahabad High Court (Lucknow Bench).
2. **Banking Exploratory Calls:** Request formal institutional documentation from ICICI/HDFC Real Estate Escrow desks on tripartite agreement templates.
3. **NIC Outreach Planning:** Prepare technical architecture summary for UP Board of Revenue Open Data committee.

---
*End of Phase 4 Open Questions & Unresolved Decision Register.*