# SPRINT 2 SECURITY & PRIVACY AUDIT REPORT
# Bhūmi Ledger — India Land Transaction & Registry Platform

**Document Version:** 1.0.0  
**Phase:** Phase 5 (Sprint 2 Closeout Audit)  
**Author:** Security & Privacy Specialist  
**Reviewed by:** Chief AI Engineering Orchestrator, System Architect  
**Date:** October 31, 2026  
**Status:** Audit Complete • Security Findings & Actionable Remediations Documented  

---

## 1. Executive Summary

This formal Security & Privacy Audit examines the code artifacts delivered in **Phase 5 Sprint 2 (PKG-01: Assisted Citizen Ingestion & Document Verification Pipeline)**.

The audit verified mathematical algorithm implementations, inspected temporary file lifecycles, checked for PII exposure across logs, evaluated the cryptographic salt storage architecture, analyzed API access boundaries, and assessed antivirus enforcement policies.

### Summary of Audit Verdicts
| Security Domain | Status | Key Finding |
| :--- | :--- | :--- |
| **Aadhaar Verhoeff Validation** | **EXACT & VERIFIED** | $D_5$ Dihedral Group table multiplication is mathematically exact. Detects 100% of single-digit and adjacent transposition errors. |
| **Aadhaar Ingestion Policy** | **DEFECT IDENTIFIED** | Parser silently masks Aadhaar in extracted memory string, but raw uploaded PDF containing unmasked Aadhaar is persisted to disk because `throwOnDetect` defaults to `false`. |
| **Temporary File Cleanup** | **FUNCTIONAL WITH DEBT** | `fs.unlinkSync` is called across 6 discrete return paths, but lacks a unifying `finally {}` block. |
| **PII & Logging Hygiene** | **SECURE** | Zero raw Aadhaar numbers, unmasked names, or private keys are printed to application logs. |
| **Salt Vault & Offline Recovery** | **CRYPTOGRAPHICALLY SOUND** | 32-byte CSPRNG entropy (`/dev/urandom`). Client can independently verify and prove ownership offline. |
| **Salt Overwrite Risk** | **DEFECT IDENTIFIED** | Route uses `INSERT OR REPLACE INTO CITIZEN_SALT_VAULT`. Duplicate upload can overwrite existing salt and ownership. |
| **Deed File Access Control** | **VULNERABILITY IDENTIFIED** | `express.static('uploads')` in `server.js` exposes raw uploaded deeds to unauthenticated HTTP queries. |
| **Upload Size & Parser Timeout** | **ENFORCED** | 10MB Multer limit and 5,000ms parser timeout verified and working. |
| **Antivirus Fail-Closed Policy** | **POLICY SPECIFIED** | External scanner integration must fail-closed under 503 Service Unavailable if scanner daemon is unreachable. |

---

## 2. Detailed Technical Audit Findings

### 2.1 Mathematical Verhoeff Validation & Aadhaar Masking

#### A. Algebraic Verhoeff Exactness ($D_5$ Dihedral Group)
In [`backend/services/pdfParserService.js`](file:///Users/lakshay/Desktop/Projects/Land-registry/backend/services/pdfParserService.js#L10-L101):
- The $10 \times 10$ multiplication table `dTable` over the dihedral group of order 10 ($D_5$) and the $8 \times 10$ permutation table `pTable` were verified against the canonical algebraic specification.
- Check digit evaluation:
  $$c = \sum_{i=0}^{n-1} d\left(c, p(i \bmod 8, \text{reversed}[i])\right)$$
- The digit reversal correctly places the check digit at position $i = 0$ (identity permutation $pTable[0]$).
- **Result:** Valid 12-digit Aadhaar numbers (e.g. `2345 6789 0124`) are detected with 100% precision. Invalid checksum sequences (e.g. `2345 6789 0129`) pass through without false-positive masking.

#### B. Critical Defect: Silent Masking vs. Ingestion Rejection Disconnect
- **Code Inspection:**
  In `pdfParserService.js` (line 370):
  ```javascript
  const cleanedText = detectAndRedactAadhaar(rawText);
  ```
  `detectAndRedactAadhaar` defaults to `{ throwOnDetect: false }`. When a valid 12-digit Aadhaar number is found in the text, it silently masks it to `XXXX-XXXX-1234` in the returned `cleanedText`.
  In `backend/routes/documents.js` (lines 154–160):
  ```javascript
  } catch (parseErr) {
    cleanupFile(tempFilePath);
    if (parseErr.code === 'AADHAAR_DETECTED') {
      return res.status(422).json({
        error: 'Aadhaar number detected in document payload (Section 29 Aadhaar Act violation)',
        code: 'AADHAAR_DETECTED'
      });
    }
  ```
  The route handler specifically includes logic to reject uploads with HTTP 422 if `parseErr.code === 'AADHAAR_DETECTED'`. However, because `parsePdfDeed` **never** passes `{ throwOnDetect: true }` to `detectAndRedactAadhaar`, the error is **never thrown**!
- **Consequence:**
  While the extracted in-memory string `cleanedText` has the Aadhaar masked, **the raw binary PDF file containing the unmasked Aadhaar number is moved directly to `uploads/<documentAnchor>.pdf`** (lines 178–185)!
  This violates the DPDP Act 2023 and Section 29 of the Aadhaar Act: an unmasked physical/e-Aadhaar is permanently stored on the disk of the registry backend.
- **Required Remediation:**
  In `pdfParserService.js` (line 370), update the invocation to:
  ```javascript
  const cleanedText = detectAndRedactAadhaar(rawText, { throwOnDetect: true });
  ```
  This immediately triggers the rejection workflow, ensuring no PDF containing unmasked Aadhaar is ever committed to disk or database.

---

### 2.2 Temporary File Lifecycle & Storage Exhaustion Risks

#### A. Temporary File Unlinking
- In `backend/routes/documents.js`, helper `cleanupFile(filePath)` wraps `fs.unlinkSync` inside a try/catch block.
- In `POST /api/documents/ingest`, `cleanupFile(tempFilePath)` is called manually across individual error branches (invalid magic bytes line 123, checksum mismatch line 135, parse error line 154, missing gata code line 169, duplicate file line 182, and top-level catch line 265).
- **Vulnerability:** Relying on manual cleanup across 6 discrete return paths is fragile. An unhandled asynchronous exception or unmapped return path can leave orphaned temporary files in `uploads/`.
- **Remediation:** Refactor the route handler to wrap all operations in a standard `try / finally` construct:
  ```javascript
  let tempFilePath = req.file ? req.file.path : null;
  try {
    // Process, validate, rename...
    tempFilePath = null; // Set to null once successfully moved to permanent storage
  } finally {
    if (tempFilePath) cleanupFile(tempFilePath);
  }
  ```

#### B. Storage Exhaustion & Denial of Service (DoS) Risk
- `uploadIngest` strictly enforces `limits: { fileSize: 10 * 1024 * 1024 }` (10 MB).
- However, there is zero rate-limiting, IP throttling, or disk quota management. An attacker submitting automated POST requests with valid 9.9 MB synthetic PDFs can exhaust disk storage.
- **Remediation:** Implement Express rate-limiting middleware (`express-rate-limit`: max 10 uploads per IP/wallet per hour) and reject uploads if disk capacity exceeds 85%.

---

### 2.3 Application Logging & PII Leakage Audit

- **Audit Findings:**
  - `backend/services/pdfParserService.js`: Zero `console.log` statements exist.
  - `backend/routes/documents.js`: Logging is limited to generic error headers:
    - Line 85: `console.error("POST /api/documents error:", err);`
    - Line 267: `console.error("POST /api/documents/ingest error:", err);`
    - Line 313: `console.error("GET /api/documents/${req.params.hash} error:", err);`
  - `backend/server.js`: Standard system initialization logs only.
- **Verdict:** **No raw Aadhaar numbers, unmasked citizen names, or private keys are printed to stdout/stderr.**
- **Recommendation:** Replace generic `console.error(..., err)` with a structured logger (e.g. Pino) configured with explicit redaction paths (`err.config`, `req.body`) to prevent incidental stack-trace leakage in production.

---

### 2.4 Salt Storage in `CITIZEN_SALT_VAULT` & `ClientSaltReceipt` Verification

#### A. Salt Generation & Entropy Standards
- In [`backend/services/hashService.js`](file:///Users/lakshay/Desktop/Projects/Land-registry/backend/services/hashService.js#L14-L16):
  `generateSalt()` utilizes `crypto.randomBytes(32).toString('hex')`.
- Sourced from `/dev/urandom` (ChaCha20 DRBG), providing 256 bits of true cryptographic entropy.
- **Verdict:** Cryptographically secure.

#### B. Offline Ownership Proof (`ClientSaltReceipt`)
- The ingestion response provides:
  ```json
  {
    "documentAnchor": "0x...",
    "rawKeccak256": "0x...",
    "clientSha256": "...",
    "salt": "..."
  }
  ```
- **Citizen Verification Flow:**
  1. Citizen computes $H_{\text{raw}} = \text{keccak256}(\text{LocalFileBytes})$.
  2. Citizen verifies $H_{\text{raw}} == \text{rawKeccak256}$.
  3. Citizen computes $H_{\text{anchor}} = \text{keccak256}(\text{abi.encodePacked}(H_{\text{raw}}, \text{salt}))$.
  4. Citizen verifies $H_{\text{anchor}} == \text{documentAnchor} == \text{onChainProperty.documentHash}$.
- **Verdict:** The citizen can independently prove title deed authenticity and ownership offline without relying on the central registry server.

#### C. Critical Vulnerability: Overwrite & Leakage in Salt Storage
- In `backend/routes/documents.js` line 201:
  ```sql
  INSERT OR REPLACE INTO CITIZEN_SALT_VAULT (...) VALUES (...)
  ```
- If a second user or attacker uploads the same document, `INSERT OR REPLACE` overwrites the existing salt and reassigns ownership to the new uploader!
- **Remediation:** Replace with `INSERT INTO CITIZEN_SALT_VAULT ...` and abort with HTTP 409 (`DUPLICATE_DOCUMENT_ANCHOR`) if the raw document has already been ingested.

---

### 2.5 API Authentication & File Access Control

#### A. Missing Authentication on Ingestion
- In `backend/routes/documents.js` line 189:
  ```javascript
  const citizenAddress = req.body.citizenAddress || req.body.walletAddress || req.body.uploader || '0x0000000000000000000000000000000000000000';
  ```
  There is no JWT token, session check, or EIP-712 wallet signature verification on `POST /api/documents/ingest`. Any client can attribute uploads to arbitrary wallet addresses.

#### B. Critical Vulnerability: Static Exposure of Raw Deeds
- In `backend/server.js` line 31:
  ```javascript
  app.use('/uploads', express.static('uploads'));
  ```
  All uploaded PDF deeds are served publicly over HTTP without authorization. Anyone who discovers or guesses a filename (`/uploads/<hash>.pdf`) can view and download another citizen's complete legal deed.
- **Remediation:** Remove `express.static('uploads')`. Implement an authenticated, authorization-checked streaming route (`GET /api/documents/:hash/download`) that verifies the caller is either the parcel owner or an authorized registrar.

---

### 2.6 Upload Size & Parser Timeout Enforcement

- **Multer 10MB Limit:** Verified in `uploadIngest` (`limits: { fileSize: 10 * 1024 * 1024 }`). Proper HTTP 413 response returned.
- **Parser 5,000ms Timeout:** Verified in `pdfParserService.js` (lines 344–396) using `Promise.race([parsePromise, timeoutPromise])` and HTTP 422 mapping.
- **Architectural Limitation:** Node.js is single-threaded. While `Promise.race` cancels the asynchronous wait, synchronous CPU operations (such as catastrophic regex backtracking) still block the V8 event loop. Parser execution should eventually be moved to a dedicated `worker_thread` for true CPU preemption.

---

### 2.7 Antivirus Threat Boundary & Fail-Closed Analysis

- **Threat Boundary:** The server currently relies entirely on magic-byte inspection (`%PDF-`) and AST text extraction. Malformed PDFs with weaponized JBIG2 streams or parser exploits bypass all controls.
- **Policy Enforcement:** When ClamAV is wired in, it **must fail closed**:
  ```javascript
  if (scannerError || scannerTimeout) {
    return res.status(503).json({
      error: 'Antivirus inspection service unavailable. Ingestion halted under fail-closed security policy.',
      code: 'ANTIVIRUS_SERVICE_UNAVAILABLE'
    });
  }
  ```

---

## 3. Concrete Action Plan & Remediation Checklist

Before entering Phase 5 Sprint 3 production deployment:
1. [ ] Update `detectAndRedactAadhaar(rawText, { throwOnDetect: true })` in `pdfParserService.js` to reject any deed containing raw Aadhaar numbers.
2. [ ] Remove `app.use('/uploads', express.static('uploads'))` in `server.js` and implement authorization-gated document streaming.
3. [ ] Change `INSERT OR REPLACE INTO CITIZEN_SALT_VAULT` to `INSERT INTO` to prevent duplicate salt overwrites.
4. [ ] Refactor temporary file cleanup in `documents.js` into a robust `try / finally` block.
5. [ ] Wire fail-closed ClamAV daemon verification into the ingestion middleware pipeline.

*Report signed off by Security & Privacy Specialist.*
