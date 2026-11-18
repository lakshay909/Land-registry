# PRIVACY DATA-FLOW & THREAT MODEL SPECIFICATION (DPDP ACT, 2023)
# Bhūmi Ledger — India Land Transaction & Registry Platform

**Document Version:** 1.0.0  
**Phase:** Phase 4 (Architecture, Security, Privacy & Regulatory Feasibility Gate — Workstream W02)  
**Authors:** Chief AI Engineering Orchestrator, Department Head of Security (DH-Security), Lead Privacy Architect, DH-Legal  
**Status:** Canonical Architecture Specification  
**Jurisdiction Baseline:** Republic of India / Digital Personal Data Protection Act, 2023 (Act No. 22 of 2023)  

---

## 1. Executive Summary & Privacy Governance Stance

In response to the Project Owner's explicit directive (**C01**), this document establishes the canonical privacy architecture, end-to-end data flows, linkability vector analysis, and STRIDE threat model for Bhūmi Ledger.

### 1.1 Statutory Commencement Reality (DPDP Act, 2023)
- The **Digital Personal Data Protection Act, 2023 (Act No. 22 of 2023)** received the assent of the President of India on August 11, 2023.
- Under **Section 1(2)** of the Act: *"It shall come into force on such date as the Central Government may, by notification in the Official Gazette, appoint and different dates may be appointed for different provisions of this Act."*
- As of 2025–2026, the Central Government (Ministry of Electronics and Information Technology - MeitY) is establishing the **Data Protection Board of India (DPBI)** and rolling out operative rules.
- **Compliance Position:** Bhūmi Ledger does NOT represent this engineering design as a certified legal compliance shield. Instead, the architecture is proactively engineered to comply with the statutory principles of **data minimization (Section 6(1))**, **purpose limitation (Section 4)**, **reasonable security safeguards (Section 8(5))**, and **erasure upon withdrawal of consent (Section 12(3))**.

---

## 2. Data Classification & Inventory Matrix

```
┌────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                                DATA INVENTORY & CLASSIFICATION                                         │
├────────┬─────────────────────────┬────────────────────────────┬──────────────────┬─────────────────┬───────────────────┤
│ Tier   │ Data Element            │ Classification             │ Storage Location │ Sensitivity     │ Retention Limit   │
├────────┼─────────────────────────┼────────────────────────────┼──────────────────┼─────────────────┼───────────────────┤
│ Tier 1 │ Citizen Name, Father's  │ Direct Personal Data       │ Off-Chain DB     │ HIGH (Confid.)  │ 12 Years          │
│        │ Name, Phone, Email      │ (Identifiable Individual)  │ (AES-256-GCM)    │                 │ (Limitation Act)  │
├────────┼─────────────────────────┼────────────────────────────┼──────────────────┼─────────────────┼───────────────────┤
│ Tier 2 │ Permanent Account Number│ Statutory Tax Identifier   │ Off-Chain Vault  │ CRITICAL        │ 7 Years           │
│        │ (PAN)                   │ (Sec 139A Income-tax Act)  │ (Masked/Encr.)   │ (Statutory)     │ (Income Tax Act)  │
├────────┼─────────────────────────┼────────────────────────────┼──────────────────┼─────────────────┼───────────────────┤
│ Tier 3 │ Aadhaar Number          │ Special Identity Data      │ EXCLUDED         │ EXTREME         │ ZERO RETENTION    │
│        │                         │ (Aadhaar Act 2016)         │ (Not Collected)  │ (Regulatory)    │ (Excluded in MVP) │
├────────┼─────────────────────────┼────────────────────────────┼──────────────────┼─────────────────┼───────────────────┤
│ Tier 4 │ 16-Digit Gata Code,     │ Public Administrative Land │ Database &       │ PUBLIC          │ Permanent         │
│        │ Area, Khasra Number     │ Data (UP Bhulekh)          │ EVM Storage      │ (Non-Personal)  │ (Revenue Records) │
├────────┼─────────────────────────┼────────────────────────────┼──────────────────┼─────────────────┼───────────────────┤
│ Tier 5 │ Document Commitment     │ Pseudonymous Technical     │ Cancun EVM Block │ MEDIUM          │ Permanent         │
│        │ Hash (Salted Keccak256) │ Proof (Linkable if abused) │ (Immutable)      │ (Pseudonymous)  │ (Audit Trail)     │
├────────┼─────────────────────────┼────────────────────────────┼──────────────────┼─────────────────┼───────────────────┤
│ Tier 6 │ Ethereum Wallet Address │ Web3 Pseudonym             │ EVM & DB         │ MEDIUM          │ Permanent         │
│        │ (`0x...`)               │ (Secp256k1 Public Key)     │ (Public)         │ (Clusterable)   │ (On-Chain)        │
└────────┴─────────────────────────┴────────────────────────────┴──────────────────┴─────────────────┴───────────────────┘
```

---

## 3. End-to-End Privacy Data-Flow Architecture

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                               PRIVACY DATA-FLOW PIPELINE                               │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ 1. INGESTION (Client-Side HTTPS / TLS 1.3)                                             │
│    Citizen uploads certified Khatauni PDF. Client extracts text fields.                │
│    Client CSPRNG generates 256-bit `CitizenSalt`.                                      │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ 2. CANONICAL HASH COMMITMENT (Client-Side Computation)                                 │
│    CommitmentHash = Keccak-256( CanonicalDocumentBytes ∥ CitizenSalt )                │
│    The pre-image is never transmitted unencrypted.                                     │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ 3. ENCRYPTED OFF-CHAIN VAULT (Backend Gateway)                                         │
│    • PDF and metadata encrypted at rest via AES-256-GCM using Envelope Key.           │
│    • Direct personal identifiers (Name, Masked PAN) stored in secure relational DB.   │
│    • `CitizenSalt` stored in isolated vault table accessible only by the owner wallet. │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ 4. ON-CHAIN AUDIT ANCHOR (Cancun EVM Smart Contract)                                   │
│    • ZERO raw PII transmitted.                                                         │
│    • Only CommitmentHash (`bytes32`), parcelId (`uint256`), and wallet addresses       │
│      are committed to `LandRegistry.sol`.                                              │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ 5. STATUTORY ERASURE WORKFLOW (Section 12(3) DPDP Act)                                 │
│    • Citizen exercises Right to Erasure.                                               │
│    • Platform destroys: (a) Document PDF, (b) `CitizenSalt`, (c) Off-chain metadata.   │
│    • Result: The on-chain CommitmentHash becomes mathematically irreversible and       │
│      permanently de-linked from any identifiable natural person.                       │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Linkability Vector Analysis (Why Hashes Are NOT Anonymous)

In strict accordance with Directive **C01**, the engineering team refutes the myth that cryptographic hashes are inherently anonymous under data protection law:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                             FOUR LINKABILITY ATTACK VECTORS                            │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ Vector 1: Public Registry Triangulation Attack                                         │
│ • State: UP Bhulekh publicly indexes that Gata 412 in Village Mohanlalganj is owned by │
│   Ramesh Kumar.                                                                        │
│ • Exposure: If Bhūmi Ledger commits Gata 412 on-chain alongside Wallet `0x7099...`, an │
│   external observer immediately correlates Wallet `0x7099...` with Ramesh Kumar.       │
│ • Mitigation: Commit only non-reversible parcel hashes on public ledgers; restrict     │
│   cleartext Gata numbers to authenticated off-chain queries.                           │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ Vector 2: Dictionary / Pre-Image Brute-Force Attack                                    │
│ • State: Official government Khatauni PDFs follow rigid, predictable text templates.   │
│ • Exposure: If an attacker knows the template and searches a village with 500 owners,  │
│   they can generate all 500 candidate PDFs, hash them, and match the on-chain hash.    │
│ • Mitigation: High-entropy 256-bit `CitizenSalt` appended to the pre-image.            │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ Vector 3: Transaction Graph & Clustering Attack                                        │
│ • State: Wallet `0x7099...` transacts with KYC-verified exchanges (e.g. CoinDCX/WazirX)│
│   or ENS names.                                                                        │
│ • Exposure: Blockchain analytics tools (Chainalysis / Elliptic) cluster wallet nodes,  │
│   identifying the natural person behind the property transaction.                      │
│ • Mitigation: Inform citizens that wallet addresses constitute pseudonymous data;      │
│   support fresh ephemeral transaction keypairs for conveyance state transitions.       │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ Vector 4: Salt Vault Compromise                                                        │
│ • Exposure: If the off-chain database storing `CitizenSalt` is breached, all historical│
│   on-chain hashes become immediately linkable to their pre-images.                     │
│ • Mitigation: Envelope encryption using AWS KMS / HashiCorp Vault; salts encrypted     │
│   under user-derived public keys.                                                      │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 5. STRIDE Threat Model & Mitigations

| STRIDE Category | Threat Description | Attack Vector | Technical & Architectural Mitigation |
| :--- | :--- | :--- | :--- |
| **Spoofing** | Adversary impersonates revenue authority or property owner. | Submitting forged transfer approvals or false Khatauni uploads. | Strict EIP-712 structured signing; OpenZeppelin `AccessControl` with `ADMIN_ROLE`; digital signature/QR extraction from certified PDFs. |
| **Tampering** | Modification of off-chain circle rate schedules or deed drafts. | Database SQL injection or MITM network interception. | TLS 1.3 in transit; AES-256-GCM with authentication tags (MAC); tamper-evident SQLite audit logs with sha256 checksum chains. |
| **Repudiation** | Seller denies signing conveyance agreement after price rises. | Claiming signature was unauthorized or fabricated. | EIP-712 typed signature binds address, property ID, consideration, and nonce; admissible under Section 10A IT Act & Sec 63 BSA 2023. |
| **Information Disclosure** | Leakage of citizen tax details or unmasked identity cards. | Public EVM block inspection or insecure S3/local file uploads. | Zero PII on-chain; complete exclusion of Aadhaar; PAN masked (`XXXXX1234X`); documents stored in encrypted vault. |
| **Denial of Service** | Malicious smart contract freezes administrative approvals. | Reverting fallback in recipient contract during push payments. | PullPayment refactoring architecture in [`SMART_CONTRACT_REFACTORING_SPEC.md`](file:///Users/lakshay/Desktop/Projects/Land-registry/Docs/architecture/SMART_CONTRACT_REFACTORING_SPEC.md). |
| **Elevation of Privilege** | Citizen calls administrative verification or freeze functions. | Direct contract call to `verifyRegistration` or `flagProperty`. | Solidity `onlyRole(ADMIN_ROLE)` modifiers enforced at the EVM Cancun opcode level. |

---

## 6. Data Retention vs. Legally Required Statutory Retention

A critical operational tension under the DPDP Act is reconciling a citizen's **Right to Erasure (Section 12(3))** with **Statutory Record Retention Mandates**:

1. **Exemption for Legal Compliance (Section 17(1)(b) DPDP Act):** The Act explicitly exempts data fiduciaries from erasure where processing or retention is necessary for compliance with any law for the time being in force, or for the prevention, detection, or prosecution of any legal offence.
2. **Indian Stamp Act, 1899 (Section 47A):** Valuation and stamp duty records must be retained for **up to 6 years** to defend against revenue collectorate undervaluation reassessments.
3. **Limitation Act, 1963 (Article 65):** The statutory period of limitation for suits relating to the recovery of possession of immovable property based on title is **12 years**.
4. **Resolution in Bhūmi Ledger:**
   - *Operational PII (Marketing, cookies, temporary session tokens):* Erased immediately upon request.
   - *Conveyance & Tax Audit Trail (Deed drafts, Form 141 schedules):* Placed in a restricted-access, encrypted **Statutory Legal Hold Vault** for 12 years pursuant to Section 17(1)(b) DPDP Act and Article 65 Limitation Act, completely isolated from active marketing or processing systems.

---

## 7. Key Management & Incident Response Design

- **Encryption Key Management:**
  - Master Key: Managed via hardware security module (HSM) / cloud KMS.
  - Data Encryption Keys (DEKs): Generated uniquely per document upload using AES-256-GCM.
  - Key Rotation: Master keys rotated annually; re-encryption of DEKs without re-encrypting underlying large document blobs.
- **Data Breach Notification (Section 8(6) DPDP Act):**
  - In the event of a personal data breach, the system triggers an automated incident response runbook:
    1. Containment and isolation of affected database shards within 1 hour.
    2. Forensic extraction of impacted data principal wallets/emails within 6 hours.
    3. Mandatory formal breach notification transmitted to the **Data Protection Board of India (DPBI)** and affected citizens within the statutory timeframe prescribed by upcoming DPBI rules.

---
*End of Privacy Data-Flow & Threat Model Specification.*