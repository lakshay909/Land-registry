# Blueprint: Registrar / Authority Dashboard
**Document Reference:** `Docs/08-registrar-dashboard-blueprint.md`  
**Classification:** Technical Architecture & UI/UX Implementation Blueprint  
**Subsystem:** Government Land Authority & Registrar Adjudication Portal  
**Target Roles:** Principal Web3 System Architect, Lead UI/UX Planner, Frontend & Backend Engineers  
**Status:** DRAFT FOR REVIEW (Pending User Approval)

---

## 1. Executive Summary & Architectural Context

In the Indian Land Administration framework—specifically under the **Digital India Land Records Modernization Programme (DILRMP)**, the **Registration Act, 1908 (Section 17)**, and the **Transfer of Property Act, 1882 (Section 54)**—title to immovable property passes solely upon statutory registration before a Sub-Registrar / Tehsildar followed by revenue mutation (*Dakhil-Kharij*).

In the decentralized Land Registry architecture, the **Registrar / Authority Dashboard** serves as the administrative command center for the Land Revenue Department. While citizens initiate registrations, browse listings, lock escrow funds, and exchange cryptographically signed conveyances (EIP-712), **no property is validly traded, no title is reassigned, and no locked escrow is disbursed without explicit, role-gated on-chain adjudication by the Authority.**

```
                                    +-----------------------------------------+
                                    |       CITIZEN / SELLER / BUYER          |
                                    | (Uploads Deed, Signs EIP-712, Deposits) |
                                    +--------------------+--------------------+
                                                         |
                                                         v
+--------------------------------------------------------+--------------------------------------------------------+
|                                        BLOCKCHAIN SMART CONTRACT STATE                                         |
|  [Property Registered] ---------> [Awaiting Authority Verification]                                             |
|  [Transfer Initiated + Escrow] -> [Dual EIP-712 Signed] -----------> [Awaiting Authority Approval / Release]     |
|  [Dispute / Court Order] -------> [Judicial Freeze (Enjoined)] <--- [Authority Flag / Unflag]                  |
+--------------------------------------------------------+--------------------------------------------------------+
                                                         ^
                                                         | (onlyRole(ADMIN_ROLE))
                                    +--------------------+--------------------+
                                    |     REGISTRAR / AUTHORITY DASHBOARD     |
                                    |   (Cadastral Audit, Escrow Release,     |
                                    |      Injunction & Title Mutation)       |
                                    +-----------------------------------------+
```

---

## 2. Comprehensive Contract & Backend Audit

### 2.1 Smart Contract Audit (`contracts/LandRegistry.sol`)

The `LandRegistry` smart contract utilizes OpenZeppelin `AccessControl` and `EIP712`. Role permissions and state-altering functions are audited below:

#### A. Role Definitions & Access Controls
* `DEFAULT_ADMIN_ROLE` (`0x00...00`): Granted to the deployer account. Can grant/revoke roles.
* `ADMIN_ROLE` (`keccak256("ADMIN_ROLE")`): The authoritative operational role representing the Land Revenue Authority / Registrar. All judicial and title verification actions check `onlyRole(ADMIN_ROLE)`.
* `REGISTRAR_ROLE` (`keccak256("REGISTRAR_ROLE")`): Reserved in contract for delegated sub-registrar officers.

#### B. Authority-Gated Functions (`onlyRole(ADMIN_ROLE)`)

| Function Signature | Gas Profile | Input Parameters | Pre-conditions | State & Escrow Mutation | Emitted Event |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `verifyRegistration(uint256 _propertyId)` | ~45,000 | `_propertyId` | Property exists (`id != 0`), not already verified (`!isVerifiedByAuthority`) | `isVerifiedByAuthority = true` | `PropertyVerified(propertyId)` |
| `approveTransfer(uint256 _transferId)` | ~65,000 - 85,000 | `_transferId` | Transfer exists, `!executed`, `!authorityApproved`, dual signatures completed | `authorityApproved = true`. If `escrowAmount > 0`, releases ETH balance directly to `request.from` (seller) via CEI pattern. | `TransferApproved(transferId)`, `EscrowReleased(transferId, seller, amount)` |
| `rejectTransfer(uint256 _transferId, string memory _reason)` | ~55,000 - 75,000 | `_transferId`, `_reason` | Transfer exists, `!executed`, `!authorityApproved` | `executed = true` (finalized cancellation). If `escrowAmount > 0`, refunds ETH balance directly to `request.to` (buyer). | `TransferRejected(transferId, reason)`, `EscrowRefunded(transferId, buyer, amount)` |
| `flagProperty(uint256 _propertyId, string memory _reason)` | ~48,000 | `_propertyId`, `_reason` | Property exists, not currently frozen (`!isFrozen`) | `isFrozen = true` (blocks all listings, purchases, and executions) | `PropertyFlagged(propertyId, reason)` |
| `unflagProperty(uint256 _propertyId)` | ~32,000 | `_propertyId` | Property exists, currently frozen (`isFrozen == true`) | `isFrozen = false` (restores parcel to active commercial circulation) | `PropertyUnflagged(propertyId)` |

#### C. Finalization Helper (`executeTransfer`)
* `executeTransfer(uint256 _transferId)`: Open to any caller, but strictly guarded by all four gates:
  1. `request.fromSigned == true`
  2. `request.toSigned == true`
  3. `request.authorityApproved == true`
  4. `request.executed == false`
  5. `property.isFrozen == false`
* If escrow was not previously cleared, releases funds and assigns `property.currentOwner = request.to`, updates `ownershipHistory`, and clears `isForSale`.

---

### 2.2 Backend Schema & API Routes Audit (`backend/`)

#### A. SQLite Database Schema (`backend/db.js`)
* `PROPERTIES`: Stores `property_id`, `location_hash`, `area`, `current_owner`, `document_hash`, `is_verified`, `is_frozen`, `registered_at`, `price`, `is_for_sale`.
* `TRANSFERS`: Stores `transfer_id`, `property_id`, `from_address`, `to_address`, `new_document_hash`, `from_signed`, `to_signed`, `authority_approved`, `executed`, `created_at`, `escrow_amount`.
* `AUDIT_EVENTS`: Normalized blockchain event log store (`PropertyRegistered`, `PropertyVerified`, `TransferInitiated`, `TransferSigned`, `TransferApproved`, `OwnershipTransferred`, `PropertyFlagged`, `PropertyUnflagged`, `EscrowDeposited`, `EscrowReleased`).
* `DOCUMENTS`: Maps `document_hash` to physical file references in `uploads/`.
* `CITIZEN_SALT_VAULT`: Stores salted cryptographic anchors and raw Keccak-256 digests.
* `PARCEL_EXTRACTION_METADATA`: Stores 16-digit Computerized Gata Code, Khasra Number, 14-character ULPIN, tenure class, freshness, and transferability.

#### B. Existing REST API Endpoints

```http
GET /api/properties?status=pending        -> Returns unverified properties awaiting audit
GET /api/properties?status=frozen         -> Returns judicial enjunction / frozen properties
GET /api/properties/:id                   -> Returns full property details + audit history
GET /api/transfers?status=pending         -> Returns unexecuted transfers
GET /api/transfers/:id                    -> Returns individual transfer request
GET /api/documents/:hash                  -> Returns deed document metadata and Gata/ULPIN
GET /api/documents/:hash/download         -> Streams deed PDF (requires authority or party header)
POST /api/valuation/calculate             -> Computes circle rate evaluation and duties
GET /api/valuation/receipt/:hash          -> Returns immutable circle rate valuation receipt
```

#### C. Architectural Gaps Identified in Existing Backend & Dashboard
1. **Missing Enriched Query for Authority**: The current `GET /api/properties?status=pending` returns only raw columns from the `PROPERTIES` table. The authority dashboard must perform separate queries or lacks inline display of the extracted 16-digit Gata Code, Khasra, ULPIN, and deed file link.
2. **Flagged/Dispute Tab Limitation**: The existing dashboard Tab 3 only had a single-property search input to flag/unflag. It lacked a live table showing **all currently frozen/enjoined parcels** in the jurisdiction.
3. **Pending Georeferencing Resolution**: Land parcels ingested without a 14-character ULPIN have `PARCEL_EXTRACTION_METADATA.ulpin = 'PENDING_GEOREFERENCING'`. The authority lacks a dedicated UI workflow and backend endpoint (`PATCH /api/properties/:id/georeference` or document update) to certify and attach the surveyed GIS coordinates / ULPIN.

---

## 3. Proposed UI Layout & Design Specification

### 3.1 Design Philosophy: NIC Government Portal Theme
* **Visual Tone:** Official, trustworthy, clean, institutional, high accessibility.
* **Color System:**
  * **Primary Navy (Deep Imperial Blue):** `#0f2b5a` (Header text, active tabs, primary navigation, institutional identity).
  * **Secondary / Verified Green (Tiranga Green):** `#138808` / `rgb(19, 136, 8)` (Successful certifications, active titles, verified badges, approved transfers).
  * **National Accent (Saffron Gold):** `#FF9933` (Top border accent strip, alert highlights).
  * **Warning / Dispute Red:** `#b91c1c` / `#dc2626` (Judicial freeze, transfer rejection, caveats).
  * **Backgrounds:** Clean `#f8fafc` (slate-50) and white `#ffffff` cards with subtle `#e2e8f0` borders.
* **Typography:** Inter / system-ui sans-serif for UI, monospaced font (`font-mono`) for wallet addresses, 16-digit Gata codes, transaction hashes, and Keccak-256 hashes.

---

### 3.2 Structural Component Hierarchy

```
AuthorityDashboard (Root Page: /authority)
│
├── Top Institutional Strip & Sub-Registrar Header
│   ├── Seal of India / Bhūmi Ledger National Seal (bhumi_ledger_seal.png)
│   ├── Office Designation ("Office of the Sub-Registrar / Land Revenue Tehsildar")
│   ├── Connected Authority Address & Role Verification Badge
│   └── Live Cluster Status & "Refresh Queues" Action
│
├── Global Executive Metrics Cards (KpiStrip)
│   ├── Pending Cadastral Audits Count
│   ├── Pending Conveyances & Escrow Volume (ETH locked)
│   ├── Active Disputed / Enjoined Titles
│   └── Today's Certified Mutations Count
│
├── Primary Navigation Tabs (Headless UI Tab.Group)
│   │
│   ├── TAB 1: Pending Registrations (Initial Cadastral Verification)
│   │   ├── Filter & Search Bar (Filter by Tehsil, Gata Code, or Applicant)
│   │   ├── Registration Queue Grid / Table View
│   │   │   ├── Parcel ID & Status Pill
│   │   │   ├── 16-digit Computerized Gata Code & Khasra Tag
│   │   │   ├── ULPIN Badge ("Georeferenced" vs "Pending Georeferencing")
│   │   │   ├── Applicant Owner Address + Copy Helper
│   │   │   ├── Demarcated Area (sq.m) & Location GIS Hash
│   │   │   └── Action: "Inspect & Certify Parcel"
│   │   └── Cadastral Inspection Drawer / Modal
│   │       ├── Embedded Deed PDF Viewer (via streaming API)
│   │       ├── Extraction Metadata Verification (Tenure Class, Freshness)
│   │       ├── Georeferencing / ULPIN Assignment Action
│   │       └── Button: "Certify & Verify on Blockchain" (Calls contract.verifyRegistration)
│   │
│   ├── TAB 2: Pending Transfers & Escrow Adjudication
│   │   ├── Conveyance Status Filter (All, Dual-Signed Ready, Awaiting Signatures)
│   │   ├── Adjudication Table
│   │   │   ├── Transfer ID & Target Parcel ID
│   │   │   ├── Buyer & Seller Identifiers
│   │   │   ├── Escrow Deposit Indicator (e.g., "2.5 ETH Locked in Vault")
│   │   │   ├── EIP-712 Dual Signature Status Indicator:
│   │   │   │   ├── Seller Signature Status (Signed / Pending)
│   │   │   │   └── Buyer Signature Status (Signed / Pending)
│   │   │   ├── Authority Status Pill (Pending Review / Approved)
│   │   │   └── Adjudication Actions:
│   │   │       ├── "Approve & Release Escrow" (Calls contract.approveTransfer)
│   │   │       ├── "Reject & Refund Escrow" (Opens Justification Modal)
│   │   │       └── "Finalize Title Mutation" (Calls contract.executeTransfer)
│   │   └── Rejection Justification Modal
│   │       ├── Preset Statutory Reasons (Discrepancy, Boundary Dispute, Court Injunction)
│   │       ├── Official Case Reason Text Area
│   │       └── Refund Disclosure Statement ("Releasing X ETH back to Buyer")
│   │
│   ├── TAB 3: Disputed Titles & Judicial Enjunction
│   │   ├── Sub-Section A: Active Judicial Enjunctions (Live Frozen Table)
│   │   │   ├── Parcel ID, Current Titleholder, Demarcated Area
│   │   │   ├── Injunction Caveat Reason (from on-chain PropertyFlagged event)
│   │   │   ├── Action: "Lift Injunction / Restore Title" (Calls contract.unflagProperty)
│   │   └── Sub-Section B: Enjoin / Freeze Inspector
│   │       ├── Search Parcel by ID
│   │       ├── Real-time Status Card (Active vs Frozen)
│   │       ├── Court Order / Judicial Reference Input
│   │       └── Action: "Enjoin Property (Freeze On-Chain)" (Calls contract.flagProperty)
│   │
│   └── TAB 4: Cadastral Survey & Georeferencing Queue
│       ├── List of properties marked PENDING_GEOREFERENCING
│       ├── Drone / Total-Station Survey Input form
│       └── Action to assign certified 14-character ULPIN and update cadastral layer
```

---

## 4. Detailed Tab Specifications

### 4.1 Tab 1: Pending Registrations (Cadastral Verification)
* **Objective:** Review applications submitted by citizens, verify uploaded deeds against revenue records, validate survey bounds, and commit permanent on-chain certification.
* **Data Source:** `GET /api/properties?status=pending` joined with `GET /api/documents/:hash`.
* **Key Fields Displayed:**
  * Parcel ID & Registration Timestamp
  * Demarcated Area (sq.m) & Location Hash
  * 16-Digit Computerized Gata Code (e.g. `1234567890123456`)
  * Khasra Number & Tehsil
  * ULPIN Status:
    * If ULPIN exists: Green badge `ULPIN: UP09LK41200001`
    * If absent: Amber badge `Pending Georeferencing`
  * PDF Deed View / Download button
* **Primary Interaction:**
  * Clicking **"Certify & Verify On-Chain"** invokes:
    ```javascript
    const tx = await contract.verifyRegistration(propertyId);
    await tx.wait();
    ```
  * Triggers event `PropertyVerified(propertyId)`.
  * Indexer intercepts event and updates SQLite `is_verified = 1`.

---

### 4.2 Tab 2: Pending Transfers & Escrow Adjudication
* **Objective:** Adjudicate bilateral land sale agreements where citizens have submitted mutual EIP-712 digital signatures and the buyer has deposited purchase funds into smart contract escrow.
* **Data Source:** `GET /api/transfers?status=pending`.
* **State Decision Matrix:**

| Seller Signed | Buyer Signed | Escrow Locked | Authority Approved | Action Permitted | Button Label |
| :---: | :---: | :---: | :---: | :--- | :--- |
| ❌ No | ❌ No | Yes/No | No | Disabled | *Waiting on Citizen Signatures* |
| ✅ Yes | ❌ No | Yes/No | No | Disabled | *Waiting on Buyer Signature* |
| ❌ No | ✅ Yes | Yes/No | No | Disabled | *Waiting on Seller Signature* |
| ✅ Yes | ✅ Yes | Yes (> 0 ETH) | No | **Authority Approve / Reject** | **Approve & Release X ETH** / **Reject & Refund** |
| ✅ Yes | ✅ Yes | No (0 ETH) | No | **Authority Approve / Reject** | **Approve Transfer** / **Reject Transfer** |
| ✅ Yes | ✅ Yes | Any | ✅ Yes | **Execute Final Mutation** | **Finalize Title On-Chain** |

* **Authority Actions:**
  1. **Approve:**
     ```javascript
     const tx = await contract.approveTransfer(transferId);
     await tx.wait();
     // Releases escrow automatically to seller via contract internal call
     ```
  2. **Reject (with Justification):**
     ```javascript
     const tx = await contract.rejectTransfer(transferId, justificationReason);
     await tx.wait();
     // Refunds escrow automatically to buyer via contract internal call
     ```
  3. **Execute:**
     ```javascript
     const tx = await contract.executeTransfer(transferId);
     await tx.wait();
     // Mutates ownership, assigns new deed hash, updates history
     ```

---

### 4.3 Tab 3: Disputed Titles & Judicial Enjunction
* **Objective:** Enforce court orders (*stay orders / injunctions*), bank caveats, or boundary conflict freezes. Frozen properties are locked from being listed, sold, or mutated.
* **Component Features:**
  * **Active Injunctions Table:** Real-time table of all properties with `is_frozen == 1`. Displays Parcel ID, Owner, Demarcated Area, and Caveat Reason extracted from the `PropertyFlagged` audit log. Includes a direct **"Lift Injunction"** action button.
  * **Inspect & Freeze Panel:** Search input for any Parcel ID. Displays title status and, if active, provides a form with a required **Justification / Judicial Order Reference** input (min 5 characters) and a prominent **"Enjoin Property (Freeze Title On-Chain)"** button.
* **Smart Contract Calls:**
  ```javascript
  // Freeze
  await contract.flagProperty(propertyId, "High Court Stay Order No. 402/2026");
  
  // Unfreeze
  await contract.unflagProperty(propertyId);
  ```

---

### 4.4 Tab 4: Cadastral Survey & Georeferencing Queue
* **Objective:** Address properties flagged as `PENDING_GEOREFERENCING` during document ingestion.
* **Workflow:**
  * Lists all properties where `ulpin == 'PENDING_GEOREFERENCING'`.
  * Enables the Tehsildar / Cadastral Surveyor to enter the 14-character alphanumeric Bhu-Aadhaar / ULPIN (format: `^[A-Z0-9]{14}$`) and certified GIS boundary polygon/centroid.
  * Submits an administrative update to certify that the parcel has been georeferenced.

---

## 5. Data Fetching Strategy & Indexer Synchronization

### 5.1 Hybrid Architecture: Indexer + On-Chain Verification

```
+------------------------------------------------------------------------------------+
|                                    REACT FRONTEND                                  |
+------------------------------------+-----------------------------------------------+
                                     |
                +--------------------+--------------------+
                | (Fast Query: SQLite)                    | (State Mutation & Verification)
                v                                         v
   +--------------------------+              +--------------------------+
   |   REST API & INDEXER     |              |   ETHEREUM / HARDHAT     |
   |   (Express + SQLite)     |              |   SMART CONTRACT RPC     |
   |                          |              |                          |
   | • /api/properties?status |              | • contract.verifyReg()   |
   | • /api/transfers?status  |              | • contract.approveTrf()  |
   | • /api/documents/:hash   |              | • contract.flagProp()    |
   +--------------------------+              +--------------------------+
                ^                                         |
                | (Block Listener & Polling)              | (Emits Events)
                +-----------------------------------------+
```

### 5.2 Fetching Strategy Specifications
1. **Initial Page Load:**
   * Frontend performs parallel HTTP `Promise.all` requests:
     * `GET /api/properties?status=pending`
     * `GET /api/transfers?status=pending`
     * `GET /api/properties?status=frozen`
2. **Metadata Enrichment:**
   * For pending properties, frontend queries `GET /api/documents/:hash` to retrieve the extracted 16-digit Gata Code, Khasra, and ULPIN.
3. **Reactive Updates & Refresh Policy:**
   * **Post-Transaction:** After `tx.wait()` confirms a block on-chain, frontend invokes `fetchData()` with a 500ms delay to allow the local block indexer to process events.
   * **Periodic Heartbeat:** SWR / interval polling every 4 seconds to sync any multi-party signatures or marketplace actions made by other accounts.
   * **Manual Refresh:** Header "Refresh Queues" button with animated spin state.
4. **Resilience & Fallback:**
   * If the indexer is temporarily desynchronized, the authority can inspect any parcel by ID directly via `contract.properties(propertyId)` on-chain.

---

## 6. End-to-End Testing & Demo Simulation Plan

### 6.1 Actor Matrix (Hardhat Localhost)

| Actor Role | Account Index | Address | Seeded ETH | Responsibilities |
| :--- | :---: | :--- | :--- | :--- |
| **Registrar Authority** | `#0` | `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266` | 10,000 ETH | Verifies registrations, approves transfers, releases escrow, freezes/unfreezes titles. |
| **Citizen / Seller** | `#1` | `0x70997970C51812dc3A010C7d01b50e0d17dc79C8` | 10,000 ETH | Ingests Khatauni deed, registers parcel, lists on marketplace, signs EIP-712 conveyance deed. |
| **Citizen / Buyer** | `#2` | `0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC` | 10,000 ETH | Deposits escrow on marketplace, signs EIP-712 deed, receives minted/mutated title. |

### 6.2 Step-by-Step Test Execution Flow

```
[Step 1: Seller] Registers Parcel #1 with Deed Hash (Status: Pending Verification)
        │
        ▼
[Step 2: Authority] Opens Authority Dashboard -> Tab 1 (Pending Registrations)
        │           Inspects Deed, Gata Code, Area (1200 sq.m)
        │           Clicks "Certify & Verify On-Chain" (verifyRegistration)
        ▼
[Step 3: Seller] Lists Parcel #1 on Marketplace for 2.5 ETH
        │
        ▼
[Step 4: Buyer] Purchases on Marketplace: Deposits 2.5 ETH into Smart Contract Escrow
        │
        ▼
[Step 5: Seller & Buyer] Both sign EIP-712 Typed Data transfer authorization
        │
        ▼
[Step 6: Authority] Opens Authority Dashboard -> Tab 2 (Transfers & Escrow)
        │           Verifies Dual Signatures: "Both Parties Signed"
        │           Verifies Escrow: "2.5 ETH Locked"
        │           Clicks "Approve & Release 2.5 ETH" (approveTransfer)
        │           --> Seller receives 2.5 ETH instantly from Escrow Vault
        ▼
[Step 7: Final Execution] Title mutated to Buyer on-chain (executeTransfer)
        │
        ▼
[Step 8: Dispute Test] Authority opens Tab 3 -> Flags Parcel #1 with Injunction Reason
        │           --> Verify all marketplace purchases/listings are rejected
        │           Authority clicks "Lift Injunction"
        │           --> Title restored to active circulation
```

---

## 7. Recommended Backend Enhancements

To fully support this blueprint, the following two narrow backend additions are recommended during execution:

1. **Enriched Properties Endpoint:**
   * Extend `GET /api/properties` to perform a `LEFT JOIN` on `PARCEL_EXTRACTION_METADATA` and `DOCUMENTS`, eliminating N+1 requests on the frontend:
   ```sql
   SELECT p.*, m.gata_code, m.khasra_number, m.ulpin, m.tenure_class, m.freshness_status, d.file_reference
   FROM PROPERTIES p
   LEFT JOIN DOCUMENTS d ON p.document_hash = d.document_hash
   LEFT JOIN PARCEL_EXTRACTION_METADATA m ON p.document_hash = m.document_anchor;
   ```
2. **Active Disputed Properties Query:**
   * Add endpoint or expand `GET /api/properties?status=frozen` to return the associated flagging reason from `AUDIT_EVENTS` where `event_type = 'PropertyFlagged'`.

---

## 8. Summary of Deliverables & Next Steps

* **Blueprint Document:** Persisted at `Docs/08-registrar-dashboard-blueprint.md`.
* **Execution Readiness:**
  * All smart contract functions identified and verified.
  * UI layout, component hierarchy, and NIC Government theme defined.
  * Data fetching, polling, and escrow release workflows specified.
* **Handoff Notice:**
  * Awaiting user review and approval before executing the code implementation.
