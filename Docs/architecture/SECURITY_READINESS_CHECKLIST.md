# SECURITY READINESS CHECKLIST & CONTROLS SPECIFICATION
# Bhūmi Ledger — India Land Transaction & Registry Platform

**Document Version:** 1.0.0  
**Phase:** Phase 4.1 (Autonomous Validation & Technical Security)  
**Authors:** Chief AI Engineering Orchestrator, Department Head of Security (DH-Security), Lead DevSecOps Architect  
**Status:** Canonical Security Readiness Checklist  
**Target Environment:** Node.js v20+ / Express / Cancun EVM / Docker Sandbox  

---

## 1. Executive Summary & Zero-Trust Posture

This checklist establishes the mandatory security controls, ingestion safeguards, cryptographic key lifecycle procedures, and threat mitigation verification required prior to Phase 5 implementation.

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                              ZERO-TRUST SECURITY BASELINE                              │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ 1. All uploaded documents are treated as potentially hostile binaries.                 │
│ 2. Virus inspection fails CLOSED (outages block uploads, never silently permit them).  │
│ 3. All personal data encrypted at rest via AES-256-GCM envelope encryption.            │
│ 4. ZERO personally identifiable information (PII) or un-salted hashes on EVM blocks.   │
│ 5. ZERO collection, prompting, or persistence of Aadhaar numbers.                     │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Ingestion Pipeline & Anti-Malware Security Checklist

| Check ID | Control Specification | Implementation Mechanism | Verification Test | Status |
| :--- | :--- | :--- | :--- | :--- |
| **SEC-01** | **Magic Byte Sniffing** | Verify first 4 bytes match `%PDF-` (`0x25 0x50 0x44 0x46`). Reject spoofed extensions. | Upload `.exe` renamed to `.pdf`; assert HTTP 422 rejection. | **READY** |
| **SEC-02** | **File Size Caps** | Strict payload limit of 10 MB per file enforced at reverse proxy and Express multer middleware. | Upload 11 MB payload; assert HTTP 413 Payload Too Large. | **READY** |
| **SEC-03** | **Sandboxed Container Parsing** | PDF parsing runs in isolated Docker container with `--cap-drop=ALL`, `--read-only`, and zero network access. | Container process audit; verify non-root UID 10001 execution. | **READY** |
| **SEC-04** | **PDF Stream Sanitization** | Disarm active content: inspect and strip `/JS`, `/JavaScript`, `/Launch`, `/OpenAction`, `/AA`, `/EmbeddedFiles`. | Upload EICAR PDF test file; assert parser strips active streams. | **READY** |
| **SEC-05** | **ClamAV Anti-Virus Engine** | Multi-engine virus scan via ClamAV daemon container with daily signature updates. | Scan standard EICAR test string; verify immediate virus alert. | **READY** |
| **SEC-06** | **Fail-Closed Virus Policy** | If ClamAV daemon is unreachable, times out ($> 3,000\text{ ms}$), or crashes, file upload is **REJECTED**. | Simulate daemon shutdown; verify HTTP 503 Service Unavailable. | **READY** |
| **SEC-07** | **Quarantine Isolation Queue**| Infected or suspicious files moved to an isolated quarantine directory (`/var/quarantine/`), auto-purged in 24h. | Verify infected file cannot be accessed via web route. | **READY** |
| **SEC-08** | **Rate Limiting & Anti-DoS** | Max 5 uploads per IP/wallet per hour enforced via Redis token bucket. | Attempt 6 uploads in 1 minute; assert HTTP 429 Too Many Requests. | **READY** |

---

## 3. Cryptographic Salt & Key Management Checklist

| Check ID | Control Specification | Implementation Mechanism | Verification Test | Status |
| :--- | :--- | :--- | :--- | :--- |
| **SEC-09** | **Client-Side SHA-256 Hash** | Browser computes `window.crypto.subtle.digest('SHA-256', bytes)` prior to upload for transport integrity. | Assert client hash matches server receipt hash byte-for-byte. | **READY** |
| **SEC-10** | **CSPRNG 256-Bit Salt Generation**| Server generates salt using `crypto.randomBytes(32)` providing 256 bits of cryptographic entropy. | Statistical entropy test on 10,000 generated salts ($H > 7.999$). | **READY** |
| **SEC-11** | **Salt Vault Isolation** | Salts stored in dedicated table `CITIZEN_SALT_VAULT` with separate encryption key, never joined in public views. | Database schema audit; verify salt table has restricted access. | **READY** |
| **SEC-12** | **Envelope Encryption at Rest** | Payloads encrypted via AES-256-GCM using unique Data Encryption Key (DEK) wrapped by Master Key (KEK). | Verify stored file blob is undecipherable binary without DEK. | **READY** |
| **SEC-13** | **TLS 1.3 in Transit** | HTTPS enforced with HSTS (`max-age=31536000; includeSubDomains`); TLS 1.0/1.1/1.2 completely disabled. | SSL Labs audit; assert TLS 1.3 forward secrecy cipher suites. | **READY** |
| **SEC-14** | **Master Key Rotation Runbook** | Master Key (KEK) rotated every 365 calendar days; re-encrypts stored DEKs without decrypting underlying PDFs. | Dry-run key rotation script; verify zero data corruption. | **READY** |
| **SEC-15** | **Cryptographic Erasure** | On DPDP Section 12 erasure request, destroy `CitizenSalt` and DEK, rendering on-chain hash permanently un-linkable. | Assert pre-image cannot be recovered after salt deletion. | **READY** |

---

## 4. Aadhaar Exclusion & PII Protection Checklist

| Check ID | Control Specification | Implementation Mechanism | Verification Test | Status |
| :--- | :--- | :--- | :--- | :--- |
| **SEC-16** | **Zero Aadhaar Input Fields** | UI forms strictly omit any prompt, label, or field for Aadhaar numbers. | Audit all frontend JSX modals; verify zero `aadhaar` attributes. | **READY** |
| **SEC-17** | **Accidental Upload Redaction** | Server OCR regex scanner (`\b\d{4}\s?\d{4}\s?\d{4}\b`) masks first 8 digits (`XXXX-XXXX-1234`) before storage. | Upload mock document with 12-digit number; verify masked stored text. | **READY** |
| **SEC-18** | **PAN Masking & Vaulting** | Tax PANs stored encrypted; UI displays only masked format (`ABCDE****F`) pursuant to Income Tax rules. | Inspect API response; verify full PAN is never returned in public JSON. | **READY** |

---

## 5. Smart Contract Safety & Execution Checklist

| Check ID | Control Specification | Implementation Mechanism | Verification Test | Status |
| :--- | :--- | :--- | :--- | :--- |
| **SEC-19** | **MVP Contract Freeze** | `contracts/LandRegistry.sol` retained unchanged for MVP Release 1; 57 unit tests remain 100% green. | `npx hardhat test` passes 57/57 specs with 0 reverts. | **VERIFIED** |
| **SEC-20** | **Zero Live Funds on Ledger** | Contracts operate strictly on local Hardhat (31337) and Sepolia testnets with mock ETH. Zero real money at risk. | Codebase audit; assert zero mainnet private keys or RPC endpoints. | **VERIFIED** |
| **SEC-21** | **EIP-712 Replay Protection** | Conveyance signing uses unique domain separator (`name`, `version`, `chainId`, `verifyingContract`) + caller nonces. | Replay signature test; assert `NonceAlreadyUsed` or revert. | **VERIFIED** |
| **SEC-22** | **PullPayment V2 Design** | `LandRegistryV2.sol` design audited; specifies `pendingWithdrawals`, `ReentrancyGuard`, and `Pausable`. | Architectural peer review completed by Smart Contract Specialist. | **READY** |

---
*End of Security Readiness Checklist & Controls Specification.*