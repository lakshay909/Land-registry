# FEATURE RESEARCH DOSSIER: F06
# Remote Transactions, NRI Workflows & Power of Attorney

**Feature ID:** F06  
**Feature Name:** Remote Conveyance, NRI Real Estate & Power of Attorney Legalities  
**Feature Lead:** Lead-F06  
**Supervising Department:** Legal (DH-Legal) & Security (DH-Security)  
**Readiness Status:** **Statutory Workflow Verified / Legal Review Complete**  
**Jurisdiction:** Central India, Uttar Pradesh & Cross-Border (Diaspora)  

---

## 1. Executive Summary

A critical segment of Indian landholders consists of **Non-Resident Indians (NRIs)**, Overseas Citizens of India (OCIs), and domestic interstate migrants who live far from their ancestral land parcels in Uttar Pradesh.

Feature F06 investigates the legal and operational reality of remote land transactions:
1. **Can a Land Sale in India be Executed 100% Remotely?**: **No.** Under Section 32 of the Registration Act, 1908, physical presentation before the Sub-Registrar by the parties or their authorized agents holding a valid Power of Attorney (PoA) remains mandatory.
2. **Special Power of Attorney (SPA) Legal Procedure**: An NRI seller or buyer living abroad executes an SPA. The document must be executed before an Indian Consular Officer or notarized with an Apostille certificate, sent to India, and **adjudicated for stamp duty within 3 months under Section 18 of the Indian Stamp Act, 1899**.
3. **Suraj Lamp Doctrine**: The Supreme Court of India (*Suraj Lamp & Industries v. State of Haryana*, 2011) firmly established that a Power of Attorney is not an instrument of transfer and does not convey title. A PoA can only authorize an agent to present and register a formal sale deed.

---

## 2. Statutory Legal Framework for NRI Land Conveyance

### 2.1 FEMA & RBI Regulations on NRI Land Acquisition
- **Permissible Acquisitions:** Under Foreign Exchange Management (Non-debt Instruments) Rules, 2019, an NRI or OCI can acquire any immovable property in India **other than agricultural land, farmhouses, or plantation properties**.
- **Agricultural Land Exception:** An NRI **can inherit** agricultural land in Uttar Pradesh from a resident ancestor, but **cannot purchase** new agricultural land.
- **Selling Agricultural Land:** An NRI who inherits agricultural land can sell it **only to a citizen of India who is an agriculturist** residing in India.

### 2.2 Special Power of Attorney (SPA) Execution Protocol

```
[NRI Landowner Abroad: e.g., USA, UK, UAE]
                     │
                     ├─── (1) Drafts transaction-specific Special Power of Attorney (SPA)
                     ├─── (2) Signs before Indian Embassy / Consulate or Notary Public (Apostille)
                     │
                     ▼
[Physical SPA Dispatched to India]
                     │
                     ├─── (3) Physical receipt in India (Track airway bill / customs date)
                     │
                     ▼
[Section 18, Indian Stamp Act, 1899 Mandate]
                     │
                     ├─── (4) Must be presented to District Collector / SRO within 3 MONTHS
                     ├─── (5) Collector adjudicates proper stamp duty & affixes stamp certificate
                     │
                     ▼
[Section 33, Registration Act, 1908 Mandate]
                     │
                     └─── (6) Authorized agent presents SPA & signs registered Sale Deed at SRO
```

### 2.3 Section 18 Stamp Duty Adjudication Timeline (Critical Constraint)
- Under Section 18(1) of the Indian Stamp Act, 1899, an instrument executed out of India must be stamped within **three months after it has been first received in India**.
- If presented after 3 months, it attracts heavy statutory penalties (up to 10 times the stamp duty) under Section 35/40, and the Sub-Registrar will refuse to register the deed.

---

## 3. Remote Verification & Cryptographic Architecture

While physical deed registration at the SRO must be executed by the authorized agent, Bhūmi Ledger provides digital transparency for the remote principal:

1. **Pre-Conveyance EIP-712 Dual Signing**:
   - The remote NRI principal connects their MetaMask wallet from abroad and signs the typed conveyance data (`TRANSFER_TYPEHASH`).
   - This records the principal's explicit, unalterable digital consent on-chain, preventing unauthorized or rogue transfers by local agents.
2. **SPA Document Hash Commitment**:
   - The authenticated SPA document (including consular seal, apostille, and Section 18 Collector endorsement) is hashed client-side and attached to the transfer metadata.
3. **Livestream / Video KYC Protocol**:
   - Real-time video verification between the registrar and remote principal prior to `approveTransfer` authorization.

---

## 4. Implementation Acceptance Criteria

1. NRI land registration workflows enforce agricultural property restrictions under FEMA Non-debt Instruments Rules, 2019.
2. SPA workflows mandate recording the date of physical receipt in India and enforce an automated 3-month countdown alert for Section 18 stamp duty adjudication.
3. Both the remote principal and local attorney-in-fact must execute bilateral digital consent before authority approval.
