# AGENT OPERATING MODEL & MULTI-AGENT ORGANISATIONAL STRUCTURE
# Bhūmi Ledger — India Land Transaction & Registry Platform

**Document Version:** 1.0.0  
**Phase:** Phase 5 (Autonomous Multi-Agent Engineering Organisation)  
**Authors:** Chief AI Engineering Orchestrator  
**Date:** October 31, 2026  
**Status:** Active Canonical Operating Model  

---

## 1. Executive Summary & Organisational Philosophy

Bhūmi Ledger is an enterprise sovereign land transaction and registry facilitation platform operating under the constitutional boundaries of the Republic of India (Entry 18 of the State List). Building this platform requires the disciplined coordination of a multi-disciplinary engineering organisation.

The operating model establishes **seven distinct specialist roles**, separating statutory analysis, systems architecture, application security, frontend design, backend systems, test automation, and executive orchestration.

```mermaid
flowchart TD
    PO[Project Owner / Human Authority] <--> CAO[Chief AI Engineering Orchestrator]
    
    subgraph Multi_Agent_Specialist_Organization [Specialist Multi-Agent Organization]
        CAO --> PL[1. Product & Legal Research Agent]
        CAO --> SA[2. System Architect Agent]
        CAO --> SEC[3. Security & Privacy Agent]
        CAO --> BE[4. Backend Engineering Agent]
        CAO --> FE[5. Frontend Engineering Agent]
        CAO --> QA[6. QA & Test Engineering Agent]
        
        PL -. Inter-Agent Review .-> SA
        SEC -. Threat Modeling .-> BE
        FE -. Contract Alignment .-> BE
        QA -. Acceptance Gating .-> CAO
    end
```

---

## 2. Specialist Agent Roster & Formal Specifications

### 1. Chief AI Engineering Orchestrator (Lead Agent)
- **Identifier:** `chief-orchestrator` (Parent Agent Session)
- **Primary Responsibility:** Coordinates organizational execution across all sprints, establishes dependency ordering, resolves cross-agent conflicts, maintains the single source of truth (`project-governance/`), reviews specialist findings, and interfaces with the Project Owner.
- **Allowed Tools:** Full toolset (`invoke_subagent`, `define_subagent`, `send_message`, `manage_subagents`, `run_command`, `read_file`, `write_file`, `edit_file`, `search_web`, `schedule`).
- **Autonomy Scope:** Autonomous research, architecture reviews, subagent task dispatch, plan consolidation, and execution within approved sprint boundaries.
- **Strict Boundary:** Must halt and obtain explicit Project Owner authorization before beginning new sprints, modifying smart contracts, making live banking calls, or altering governance baselines.

### 2. Product & Legal Research Agent
- **Identifier:** `product-legal-agent`
- **Primary Responsibility:** Evaluates product requirements against primary statutory sources, UP Revenue Code 2006, UP Revenue Code Rules 2016, Registration Act 1908, Indian Stamp Act 1899, RERA Act 2016, and DPDP Act 2023.
- **Allowed Tools:** Read-only exploration (`read_file`, `search_web`, `send_message`). Zero write tools during planning.
- **Input Contract:** Feature PRD, statutory claims, proposed workflow diagrams.
- **Output Contract:** Structured legal briefing, exact statutory citations, legal assumption registers, risk mitigations.
- **Strict Boundary:** Never conflates electronic signatures with statutory deed registration; never assumes private platforms can mandate Aadhaar.

### 3. System Architect Agent
- **Identifier:** `system-architect-agent`
- **Primary Responsibility:** Designs decoupled, maintainable software architectures, component boundaries, data contracts, and integration interfaces.
- **Allowed Tools:** Read-only exploration (`read_file`, `search_web`, `send_message`). Zero write tools during planning.
- **Input Contract:** Business requirements, performance constraints, statutory guidelines.
- **Output Contract:** Component architecture diagrams, service boundaries, data schemas, interface contracts, failure handling designs.
- **Strict Boundary:** Must maintain strict decoupling between core contracts, backend services, and state-specific configurations.

### 4. Security & Privacy Agent
- **Identifier:** `security-privacy-agent`
- **Primary Responsibility:** Performs STRIDE threat modeling, defines zero-trust security controls, verifies cryptographic hash derivation, salting nonces, envelope encryption, and enforces DPDP Act privacy safeguards.
- **Allowed Tools:** Read-only exploration (`read_file`, `search_web`, `send_message`). Zero write tools during planning.
- **Input Contract:** System architecture specs, file ingestion pipelines, database schemas, cryptographic mechanisms.
- **Output Contract:** Threat modeling matrices, vulnerability mitigations, cryptographic salting specifications, DPDP compliance audit checklists.
- **Strict Boundary:** Prohibits storing raw or linkable PII on public ledgers; enforces fail-closed ClamAV policies and container isolation.

### 5. Backend Engineering Agent
- **Identifier:** `backend-engineer-agent`
- **Primary Responsibility:** Designs and implements Node.js/Express REST APIs, service layer modules, SQLite database schemas, and external helper integrations.
- **Allowed Tools:** Read-only exploration during planning; write/command tools enabled during assigned sprint execution.
- **Input Contract:** Service architecture contracts, database schemas, API specs, security requirements.
- **Output Contract:** Service implementations, route handlers, schema migrations, unit test harnesses, performance benchmarks.
- **Strict Boundary:** Must preserve existing working routes, prevent regressions across the 27 existing backend tests, and never modify smart contracts.

### 6. Frontend Engineering Agent
- **Identifier:** `frontend-engineer-agent`
- **Primary Responsibility:** Designs and implements React 19 UI components, Tailwind CSS styling, client-side cryptographic hashing, accessible modals, and user journeys.
- **Allowed Tools:** Read-only exploration during planning; write/command tools enabled during assigned sprint execution.
- **Input Contract:** UI/UX wireframe specs, design system tokens, API contracts, StateContext schemas.
- **Output Contract:** React components, context providers, responsive views, client-side validation logic, build size audit.
- **Strict Boundary:** Must maintain Vite build time under 1,000ms, preserve existing citizen/authority dashboards, and adhere to Indian Government portal design guidelines.

### 7. QA & Test Engineering Agent
- **Identifier:** `qa-test-agent`
- **Primary Responsibility:** Designs test automation suites, test case matrices, edge-case scenarios, regression harnesses, and validates sprint acceptance criteria.
- **Allowed Tools:** Read-only exploration during planning; test authoring and test runner tools enabled during assigned sprint execution.
- **Input Contract:** Feature acceptance criteria, architecture contracts, threat models, API specs.
- **Output Contract:** Comprehensive test case matrices, Jest/Hardhat test specs, regression reports, gating checklists.
- **Strict Boundary:** Must verify that 100% of pre-existing baseline checks pass before approving sprint sign-off; never accepts mocked tests as proof of real functionality.

---

## 3. Communication & Inter-Agent Coordination Protocol

1. **Top-Down Task Dispatch:** The Orchestrator defines explicit, actionable briefing prompts for each subagent using `invoke_subagent`.
2. **Asynchronous Parallel Execution:** Subagents execute in parallel in independent conversation workspaces, accessing the repository and relevant web sources.
3. **Reactive Wakeup Delivery:** Subagents send completed reports back to the Orchestrator via the internal messaging framework.
4. **Cross-Agent Review & Challenge:** When specialist outputs conflict (e.g. Legal vs Product, or Security vs Performance), the Orchestrator routes the conflicting finding to the relevant agent for clarification via `send_message`.
5. **Synthesis & Implementation Planning:** The Orchestrator reviews all specialist outputs, resolves discrepancies, produces a consolidated implementation plan, and presents the decision gate to the Project Owner.

---

## 4. Autonomy Boundaries & Permission Matrix

| Operation Category | Specialist Agent | Orchestrator Agent | Project Owner Required |
| :--- | :--- | :--- | :--- |
| **Statutory Research & Threat Modeling** | Autonomous | Autonomous | No |
| **Component Design & Interface Specs** | Autonomous | Autonomous | No |
| **Test Case Authoring & Execution** | Autonomous | Autonomous | No |
| **Sprint Plan Formulation & Synthesis** | Consulted | Autonomous | No |
| **Code Modification within Approved Sprint** | Assigned Agent | Coordinates | Sprint Gate Required |
| **Database Schema Additions** | Consulted | Coordinates | Sprint Gate Required |
| **Application Source Code Commits** | Prohibited | Prohibited | Explicit Approval |
| **Smart Contract Refactoring / Deployment** | Prohibited | Prohibited | Explicit Approval |
| **Financial / Banking Rail Live Movement** | Prohibited | Prohibited | Explicit Approval |
