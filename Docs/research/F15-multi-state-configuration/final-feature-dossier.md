# FEATURE RESEARCH DOSSIER: F15 (REVALIDATED)
# Multi-State Configuration & State Selector Architecture

**Feature ID:** F15  
**Feature Name:** Multi-State Configuration, Revenue Domain Modeling & State Selector  
**Feature Lead:** Lead-F15  
**Supervising Department:** Architecture (DH-Arch) & Product (DH-Product)  
**Readiness Status:** **Uttar Pradesh: Active Pilot Baseline / Pan-India: Architectural Model Verified**  
**Jurisdiction:** Pan-India (Constitutional Federalism Model)  
**Last Revalidated:** October 31, 2026 (Reflecting Project Owner Directives)  

---

## 1. Revision History & Audit Record

| Date | Revision | What Changed | Reason for Change |
| :--- | :--- | :--- | :--- |
| **2026-10-31** | **v2.0.0** | **Validated Multi-State Expansion Boundaries**: Verified pluggable `StateAdapter` interface against UP-first pilot while ensuring total decoupling for future state integration (e.g., Maharashtra 7/12, Karnataka Bhoomi, Haryana Jamabandi). Explicitly defined state isolation boundaries. | Project Owner correction directive; ensuring multi-state design from day one without hardcoding UP rules across the core platform. |
| **2026-10-31** | v1.0.0 | Initial dossier on state configuration schema and UI state selector. | Baseline creation. |

---

## 2. Multi-State Architecture: Strategic Tenets

Under the Constitution of India (Seventh Schedule, State List, Entry 18 & 45), land records, tenures, mutations, and revenue administration differ by state.

To support immediate launch in **Uttar Pradesh** while guaranteeing friction-free multi-state scaling:
1. **Core Platform (State-Agnostic Engine)**:
   - Web3 wallet connectivity (EIP-1193).
   - Smart contract title registry & event emission (`contracts/LandRegistry.sol`).
   - Keccak-256 client-side deed document hashing.
   - Chronological audit log indexing (`backend/indexer.js` & `AUDIT_EVENTS`).
   - Role-Based Access Control (`ADMIN_ROLE`, `CITIZEN`).
2. **State Adapters (`StateAdapter` Interface)**:
   - Completely encapsulates all state-specific revenue terminology, tenure types, statutory ceiling rules, portal links, and registration fee calculators.
   - Adding a new state requires creating a standalone configuration file without refactoring core contracts or backend routes.
3. **India-Wide UI State Selector**:
   - Prominent global dropdown in navigation header.
   - **Uttar Pradesh**: Active pilot with live cadastral query and demo transaction flows.
   - **All other Indian States & UTs (35+)**: Explicitly classified as **"Coming Soon"**, disabling mock execution and displaying regional roadmap transparency.

---

## 3. Pluggable State Abstraction Model

```
                              ┌────────────────────────────────────────┐
                              │       Bhūmi Ledger Core Platform       │
                              │ (Contracts, Auth, Indexer, Audit Logs) │
                              └───────────────────┬────────────────────┘
                                                  │
                       ┌──────────────────────────┴──────────────────────────┐
                       ▼                                                     ▼
           ┌───────────────────────┐                             ┌───────────────────────┐
           │ UP State Adapter      │                             │ Future State Adapters │
           │ (up.config.json)      │                             │ (mh, ka, hr, etc.)    │
           ├───────────────────────┤                             ├───────────────────────┤
           │ - UP Revenue Code 2006│                             │ - Maharashtra MLRC    │
           │ - Khatauni (RoR)      │                             │ - 7/12 Extract        │
           │ - 16-Digit ULPIN Code │                             │ - IGR Maharashtra     │
           │ - Bhulekh & IGRSUP    │                             │ - Bhoomi (Karnataka)  │
           │ - Sec 89 12.5A Ceiling│                             │ - Jamabandi (Haryana) │
           └───────────────────────┘                             └───────────────────────┘
```

---

## 4. State Configuration Schema (`state.schema.json`)

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "StateConfiguration",
  "type": "object",
  "required": ["stateCode", "stateName", "readinessStatus", "revenueCode", "parcelIdFormat", "portals", "tenureClasses"],
  "properties": {
    "stateCode": { "type": "string", "example": "IN-UP" },
    "stateName": { "type": "string", "example": "Uttar Pradesh" },
    "readinessStatus": {
      "type": "string",
      "enum": ["PILOT_ACTIVE", "RESEARCH_VERIFIED", "COMING_SOON", "BLOCKED"]
    },
    "revenueCode": {
      "type": "object",
      "properties": {
        "statuteName": { "type": "string" },
        "mutationRulesName": { "type": "string" },
        "agriculturalCeilingHectares": { "type": "number" },
        "mutationNoticeDays": { "type": "integer" },
        "mutationDisposalDaysUndisputed": { "type": "integer" },
        "mutationDisposalDaysDisputed": { "type": "integer" }
      }
    },
    "parcelIdFormat": {
      "type": "object",
      "properties": {
        "label": { "type": "string" },
        "regex": { "type": "string" },
        "description": { "type": "string" }
      }
    },
    "portals": {
      "type": "object",
      "properties": {
        "landRecords": { "type": "object", "properties": { "name": { "type": "string" }, "url": { "type": "string" } } },
        "cadastralMaps": { "type": "object", "properties": { "name": { "type": "string" }, "url": { "type": "string" } } },
        "registration": { "type": "object", "properties": { "name": { "type": "string" }, "url": { "type": "string" } } },
        "revenueCourts": { "type": "object", "properties": { "name": { "type": "string" }, "url": { "type": "string" } } }
      }
    },
    "tenureClasses": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "className": { "type": "string" },
          "transferable": { "type": "boolean" },
          "statutorySection": { "type": "string" }
        }
      }
    }
  }
}
```

---

## 5. Implementation Acceptance Criteria

1. Global state selector permits switching between Uttar Pradesh and any other Indian state.
2. When a state marked `COMING_SOON` is selected, all action buttons (Register, Buy, List) are replaced with an informative status card explaining regional research status.
3. Zero hardcoded UP strings in `contracts/LandRegistry.sol` or `backend/server.js`.
4. UP-specific revenue attributes (16-digit revenue code, Gata number) are loaded dynamically from `up.config.json`.
