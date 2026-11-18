# FEATURE RESEARCH DOSSIER: F10 (REVALIDATED)
# Documents, Verification & Digital Signatures

**Feature ID:** F10  
**Feature Name:** Cryptographic Title Verification, Digital Signatures & Legal Admissibility  
**Feature Lead:** Lead-F10  
**Supervising Department:** Legal (DH-Legal) & Security (DH-Security)  
**Readiness Status:** **Legal Review Complete (Four-Pillar Framework) / Technical Spec Ready**  
**Jurisdiction:** Central India & Uttar Pradesh  
**Last Revalidated:** October 31, 2026 (Reflecting Project Owner Directives)  

---

## 1. Revision History & Audit Record

| Date | Revision | What Changed | Reason for Change |
| :--- | :--- | :--- | :--- |
| **2026-10-31** | **v2.0.0** | **Disentangled four legal pillars**: (1) Electronic agreement validity, (2) Electronic signature validity, (3) Statutory deed registration, (4) Electronic evidence admissibility. Explicitly qualified that EIP-712 wallet signatures are NOT statutory electronic signatures under Section 3A of the IT Act. | Project Owner correction directive; eliminating false equivalence between Web3 wallet signatures and CCA-approved electronic signatures. |
| **2026-10-31** | v1.0.0 | Initial dossier citing October 2022 MeitY amendment. | Baseline creation. |

---

## 2. The Four-Pillar Legal & Cryptographic Framework

To ensure absolute legal rigor and prevent regulatory exposure, the platform establishes four distinct, unblurred legal layers:

```
┌────────────────────────────────────────────────────────────────────────┐
│ 1. Electronic Agreement Validity                                       │
│    Section 10A, IT Act 2000 (Enforceability of contracts electronically) │
├────────────────────────────────────────────────────────────────────────┤
│ 2. Electronic Signature Validity                                       │
│    Section 3A & Second Schedule, IT Act 2000 (CCA-licensed DSC / eSign)│
├────────────────────────────────────────────────────────────────────────┤
│ 3. Statutory Deed Registration                                         │
│    Section 17, Registration Act 1908 (Mandatory SRO registration)      │
├────────────────────────────────────────────────────────────────────────┤
│ 4. Admissibility of Electronic Evidence                                │
│    Sections 61 & 63, Bharatiya Sakshya Adhiniyam, 2023 (BSA / Sec 65B) │
└────────────────────────────────────────────────────────────────────────┘
```

---

### Pillar 1: Electronic Agreement Validity (IT Act, 2000 — Section 10A)
- **Relevant Statute:** Section 10A of the Information Technology Act, 2000.
- **The 2022 Amendment (MeitY Notification S.O. 4720(E)):** Prior to October 2022, Item 5 of the First Schedule excluded *"any contract for the sale or conveyance of immovable property"* from electronic contracting. The 2022 amendment omitted this exclusion.
- **Legal Reality:** Contracts to sell, bilateral memorandums of understanding (MoUs), and pre-conveyance terms formed electronically via electronic records and communications are now **enforceable civil contracts under Section 10A**.
- **Evidence Classification:** `VERIFIED FACT`.

---

### Pillar 2: Electronic Signature Validity (IT Act, 2000 — Sections 3, 3A, 5, 15 & Second Schedule)
- **Relevant Statutes:** Sections 2(1)(ta), 3, 3A, 5, and 15 read with the Second Schedule of the Information Technology Act, 2000.
- **Statutory Requirements for Legal Signature Parity:** Under Section 5, an electronic signature only has legal parity with a physical handwritten signature if it:
  1. Satisfies the reliability tests under **Section 3A(2)** (exclusive linkage, exclusive control, post-signing tamper detection of signature and document).
  2. Is an approved technique listed in the **Second Schedule** (e.g., Digital Signature Certificates issued by a licensed Certifying Authority under the **Controller of Certifying Authorities - CCA**, or Aadhaar e-KYC based eSign).
- **The Critical Distinction Regarding EIP-712 Wallet Signatures:**
  - An EIP-712 wallet signature (ECDSA on `secp256k1`) is an **application-layer cryptographic proof**.
  - It is **NOT** specified in the Second Schedule of the IT Act, 2000.
  - It is **NOT** backed by a digital signature certificate issued by a CCA-licensed Certifying Authority (e.g., e-Mudhra, Capricorn, NSDL).
  - **Explicit Platform Stance:** EIP-712 signatures in Bhūmi Ledger represent **bilateral cryptographic consents and unalterable intent records** between parties. They **do NOT constitute statutory "secure electronic signatures" under Section 3A / Section 5 of the IT Act**.
- **Evidence Classification:** `VERIFIED FACT`.

---

### Pillar 3: Statutory Deed Registration (Registration Act, 1908 — Section 17 & 49)
- **Relevant Statute:** Section 17(1)(b) & Section 49 of the Registration Act, 1908.
- **Statutory Mandate:** Any non-testamentary instrument which purports or operates to create, declare, assign, limit, or extinguish any right, title, or interest of the value of ₹100 and upwards to or in immovable property **must be registered** before the jurisdictional Sub-Registrar (SRO).
- **Effect of Non-Registration (Section 49):** An unregistered document affecting immovable property **shall not affect any immovable property comprised therein**, nor be received as evidence of any transaction affecting such property (except as evidence of a contract in a suit for specific performance under the Specific Relief Act, 1963).
- **Explicit Platform Stance:** Bhūmi Ledger does **not** effectuate final legal conveyance on-chain. On-chain transfers represent digital title synchronization that occurs **only after** an authorized registrar audits and confirms the physical or state-governed e-registration before the SRO.
- **Evidence Classification:** `OFFICIAL PROCEDURE`.

---

### Pillar 4: Admissibility of Electronic Evidence (Bharatiya Sakshya Adhiniyam, 2023 — Sections 61 & 63)
- **Relevant Statute:** Sections 61, 62, and 63 of the Bharatiya Sakshya Adhiniyam, 2023 (BSA, which replaced Section 65B of the Indian Evidence Act, 1872 effective July 1, 2024).
- **Legal Principle:** Electronic records (including smart contract transaction logs, Keccak-256 digests, and server database entries) are admissible as primary or secondary evidence, provided a certificate under Section 63(4) is furnished authenticating device custody, continuous operation, and hash integrity.
- **Evidence Classification:** `VERIFIED FACT`.

---

## 3. Cryptographic Implementation vs. Statutory Signing Alignment

| Platform Layer | Mechanism | Cryptographic Primitive | Statutory Legal Standing |
| :--- | :--- | :--- | :--- |
| **Pre-Registration Intent** | EIP-712 Typed Data (`TRANSFER_TYPEHASH`) | ECDSA (`secp256k1`) + Monotonic Nonce | Admissible electronic record of bilateral consent under Section 10A IT Act & Section 63 BSA 2023. *Not a Section 3A statutory e-sign.* |
| **Document Integrity** | Client-Side File Hashing | Keccak-256 (32 bytes) | Tamper-evident cryptographic fingerprint. Admissible under Section 63(2) BSA 2023. |
| **State Mutation Gate** | On-Chain Registrar Approval (`approveTransfer`) | OpenZeppelin `AccessControl` (`ADMIN_ROLE`) | Administrative ratification indicating physical/SRO registration verified. |
| **Future Statutory E-Sign** | Layered Aadhaar eSign / ESP Integration | PKI (RSA / ECDSA) via CCA Licensed CA | Full statutory parity with handwritten signature under Section 3A & Section 5 IT Act. |

---

## 4. Implementation Acceptance Criteria

1. The UI and documentation must explicitly state that EIP-712 wallet signatures constitute bilateral digital agreements, while statutory title transfer remains contingent on SRO registration.
2. Deed document hashes committed on-chain must be verifiable against original unredacted files via standard Keccak-256 routines.
3. Exportable audit certificates must conform to the evidentiary requirements of Section 63(4) of the Bharatiya Sakshya Adhiniyam, 2023.
