# ANTIGRAVITY COMMAND ORCHESTRATION PLAYBOOK
# Bhūmi Ledger — India Land Transaction & Registry Platform

**Document Version:** 1.0.0  
**Phase:** Autonomous Governance Protocol & Capability Playbook  
**Authors:** Chief AI Engineering Orchestrator  
**Runtime Environment:** Google Antigravity CLI (`agy` v1.4.12) / Darwin arm64 (macOS) / Cancun EVM  
**Status:** Active Canonical Operating Protocol  

---

## 1. Executive Summary & Purpose

This playbook establishes the **Autonomous Antigravity Command Orchestration Protocol** for Bhūmi Ledger. It provides an authoritative catalog of every discovered Antigravity CLI command, subagent type, tool, hook, plugin, and skill, delineating how the Chief AI Engineering Orchestrator coordinates the specialized department heads autonomously without requiring continuous manual supervision from the Project Owner.

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                               OPERATIONAL PRINCIPLE                                    │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ The Project Owner retains final decision authority over project scope, legal risk,     │
│ financial models, and implementation gates.                                            │
│                                                                                        │
│ The Chief AI Engineering Orchestrator is responsible for discovering, coordinating,    │
│ and executing all eligible research, analysis, threat modelling, planning, and design  │
│ workflows autonomously, selecting the optimal combination of Antigravity capabilities. │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Discovered Antigravity Capability Inventory

An empirical audit of the local development environment and runtime configuration established the following baseline:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                            EMPIRICAL CAPABILITY INVENTORY                              │
├───────────────────────┬────────────────────────────────────────────────────────────────┤
│ **Antigravity CLI**   │ Version: `1.4.12` | Binary: `/Users/lakshay/.local/bin/agy`    │
├───────────────────────┼────────────────────────────────────────────────────────────────┤
│ **Active Foundation   │ Primary: `Gemini 3.8 Flash (High)`                             │
│   Models**            │ Available: `claude-sonnet-4-6`, `claude-opus-4-6-thinking`,    │
│                       │ `gpt-oss-120b-medium`, `gemini-3.8-flash-medium/low`          │
├───────────────────────┼────────────────────────────────────────────────────────────────┤
│ **Active MCP Servers**│ • `StitchMCP` (stdio via `mcp-remote`) — Screen/UI generation  │
│                       │ • `notion-mcp-server` (stdio via `@notionhq/notion-mcp-server`) │
│                       │ • `gws-gmail` (http via `gmailmcp.googleapis.com`)             │
│                       │ • `mobbin` (http via `api.mobbin.com/mcp`)                     │
├───────────────────────┼────────────────────────────────────────────────────────────────┤
│ **Active Builtin &    │ • `agy-customizations`: Antigravity configuration guide        │
│   User Skills**       │ • `antigravity-guide`: Comprehensive AGY sitemap & CLI manual  │
│                       │ • `repository-audit`: Read-only multi-tier codebase auditor    │
│                       │ • `technical-planning`: Evidence-based technical plan builder  │
│                       │ • `impeccable`: Design system, UI/UX polish & frontend auditor │
├───────────────────────┼────────────────────────────────────────────────────────────────┤
│ **Builtin Subagents** │ • `self`: Cloned agent inheriting full tools, prompts, models  │
│                       │ • `research`: Read-only sandbox for web and code exploration   │
│                       │ • `image-generator`: Image generation and editing engine       │
│                       │ • Dynamic subagents: Supported via `define_subagent` tool     │
├───────────────────────┼────────────────────────────────────────────────────────────────┤
│ **Lifecycle Hooks**   │ Managed via `hooks.json` (`SessionStart`, `PreToolUse`,        │
│                       │ `PostToolUse`, `PreInvocation`, `PostInvocation`, `Stop`)      │
├───────────────────────┼────────────────────────────────────────────────────────────────┤
│ **Autonomy Controls** │ • `--dangerously-skip-permissions` (Auto-approves tool prompts)│
│                       │ • `--mode accept-edits | auto | plan` (Execution mode)         │
│                       │ • `--effort low | medium | high | xhigh | max` (Reasoning depth│
└───────────────────────┴────────────────────────────────────────────────────────────────┘
```

---

## 3. Master Command Catalog & Capability Taxonomy

The table below catalogs every command from the Project Owner's discovery checklist, classifying whether it can be invoked **autonomously by the agent** or requires **direct user invocation in the interactive TUI / CLI**:

```
┌────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                       ANTIGRAVITY COMMAND & CAPABILITY CATALOG                                         │
├─────────────────────┬────────────────────┬──────────────┬──────────────────┬───────────────────┬───────────────────────┤
│ Command / Skill     │ Supported Syntax   │ Invocation   │ Owning Role      │ Primary Purpose   │ Agent Equivalent      │
├─────────────────────┼────────────────────┼──────────────┼──────────────────┼───────────────────┼───────────────────────┤
│ `/goal`             │ `/goal <prompt>`   │ User in TUI  │ Orchestrator     │ Autonomous loop   │ Agent executes loops  │
│                     │                    │              │                  │ engineering       │ until goals complete  │
├─────────────────────┼────────────────────┼──────────────┼──────────────────┼───────────────────┼───────────────────────┤
│ `/repository-audit` │ `/repository-audit`│ Autonomous & │ DH-Arch &        │ Read-only code    │ `read_file` +         │
│                     │ (Skill Activated)  │ User in TUI  │ DH-QA            │ and stack audit   │ repository-audit skill│
├─────────────────────┼────────────────────┼──────────────┼──────────────────┼───────────────────┼───────────────────────┤
│ `/technical-planning`|`/technical-planning`|Autonomous & │ DH-Arch &        │ Turns audit data  │ technical-planning    │
│                     │ (Skill Activated)  │ User in TUI  │ DH-Eng           │ into actionable   │ skill in context      │
├─────────────────────┼────────────────────┼──────────────┼──────────────────┼───────────────────┼───────────────────────┤
│ `/plan`             │ `/plan` or         │ User in TUI  │ Orchestrator &   │ Enforces plan-    │ `write_file` artifact │
│                     │ `--mode plan`      │              │ DH-Product       │ before-edit mode  │ with RequestFeedback  │
├─────────────────────┼────────────────────┼──────────────┼──────────────────┼───────────────────┼───────────────────────┤
│ `/grill-me`         │ `/grill-me`        │ User in TUI  │ DH-Product       │ Socratic interview│ `ask_question` tool   │
│                     │                    │              │                  │ on design choices │ in agent context      │
├─────────────────────┼────────────────────┼──────────────┼──────────────────┼───────────────────┼───────────────────────┤
│ `/teamwork`         │ `/teamwork`        │ User in TUI  │ Orchestrator     │ Multi-agent team  │ `invoke_subagent` &   │
│                     │                    │              │                  │ coordination      │ `define_subagent`     │
├─────────────────────┼────────────────────┼──────────────┼──────────────────┼───────────────────┼───────────────────────┤
│ `/agents`           │ `agy agents` or    │ Autonomous   │ Orchestrator     │ List / inspect    │ `agy agents` CLI or   │
│                     │ `/agents` in TUI   │ via CLI/tool │                  │ available agents  │ `manage_subagents`    │
├─────────────────────┼────────────────────┼──────────────┼──────────────────┼───────────────────┼───────────────────────┤
│ `/browser`          │ `/browser <url>`   │ User in TUI  │ DH-Govt &        │ Web browsing,     │ `search_web` tool or  │
│                     │                    │              │ DH-Research      │ scraping, research│ research subagent     │
├─────────────────────┼────────────────────┼──────────────┼──────────────────┼───────────────────┼───────────────────────┤
│ `/boost`            │ `/boost`           │ User in TUI  │ DH-Arch &        │ Deep reasoning,   │ `--effort max` flag   │
│                     │                    │              │ DH-Security      │ multi-perspective │ or high reasoning     │
├─────────────────────┼────────────────────┼──────────────┼──────────────────┼───────────────────┼───────────────────────┤
│ `/skills`           │ Directory / Skill  │ Autonomous & │ Orchestrator     │ Modular knowledge │ Read `SKILL.md` or    │
│                     │ activation         │ User in TUI  │                  │ progressive load  │ define custom skill   │
├─────────────────────┼────────────────────┼──────────────┼──────────────────┼───────────────────┼───────────────────────┤
│ `/impeccable`       │ `/impeccable`      │ Autonomous & │ DH-Frontend &    │ Frontend UI/UX,   │ impeccable skill in   │
│                     │ (Skill Activated)  │ User in TUI  │ Design Lead      │ typography, tokens│ `~/.gemini/skills/`   │
├─────────────────────┼────────────────────┼──────────────┼──────────────────┼───────────────────┼───────────────────────┤
│ `/plugin`           │ `agy plugin <cmd>` │ Autonomous   │ Orchestrator     │ Manage plugins &  │ `run_command` with    │
│                     │                    │ via CLI      │                  │ bundle extensions │ `agy plugin list`     │
├─────────────────────┼────────────────────┼──────────────┼──────────────────┼───────────────────┼───────────────────────┤
│ `/hooks`            │ `hooks.json`       │ Autonomous   │ DH-Security &    │ External lifecycle│ Edit/deploy           │
│                     │ configuration      │ via file     │ DH-Eng           │ event triggers    │ `hooks.json`          │
├─────────────────────┼────────────────────┼──────────────┼──────────────────┼───────────────────┼───────────────────────┤
│ `/schedule`         │ `schedule` tool or │ Autonomous   │ Orchestrator     │ Timer / Cron job  │ `schedule` tool       │
│                     │ `/schedule` in TUI │ via tool     │                  │ for notifications │ with duration/cron    │
├─────────────────────┼────────────────────┼──────────────┼──────────────────┼───────────────────┼───────────────────────┤
│ `/effort`           │ `agy --effort` or  │ User in TUI /│ Orchestrator     │ Set reasoning     │ CLI flag or system    │
│                     │ `/effort <level>`  │ CLI Flag     │                  │ token intensity   │ parameter config      │
├─────────────────────┼────────────────────┼──────────────┼──────────────────┼───────────────────┼───────────────────────┤
│ `/compact`          │ `/compact` in TUI  │ User in TUI  │ Orchestrator     │ Summarize context │ Recommend command or  │
│                     │                    │              │                  │ to free tokens    │ trigger turn summary  │
├─────────────────────┼────────────────────┼──────────────┼──────────────────┼───────────────────┼───────────────────────┤
│ `/statusline`       │ `settings.json` or │ Autonomous   │ DH-Eng           │ Live status bar   │ Edit `statusLine` in  │
│                     │ `/statusline`      │ via config   │                  │ in CLI terminal   │ `settings.json`       │
├─────────────────────┼────────────────────┼──────────────┼──────────────────┼───────────────────┼───────────────────────┤
│ `/usage`            │ `/usage` in TUI    │ User in TUI  │ Orchestrator     │ View token and API│ Inspect transcript    │
│                     │                    │              │                  │ usage metrics     │ metadata metrics      │
├─────────────────────┼────────────────────┼──────────────┼──────────────────┼───────────────────┼───────────────────────┤
│ `/keybindings`      │ `/keybindings`     │ User in TUI  │ Orchestrator     │ Shortcut reference│ Recommend to user for │
│                     │                    │              │                  │ in interactive TUI│ terminal navigation   │
├─────────────────────┼────────────────────┼──────────────┼──────────────────┼───────────────────┼───────────────────────┤
│ `/agy-customizations`|Skill Activated    │ Autonomous   │ Orchestrator     │ Customization     │ Read builtin skill    │
│                     │                    │ via file     │                  │ system guide      │ `agy-customizations`  │
└─────────────────────┴────────────────────┴──────────────┴──────────────────┴───────────────────┴───────────────────────┘
```

---

## 4. Strategic Command Mapping across the Eight Workflows

### Workflow A: Repository Understanding & Governance
- **Primary Capabilities:** `/repository-audit`, `/agy-customizations`, `/skills`, `/agents`.
- **Orchestration Ownership:** Chief Orchestrator & Department Head of Quality Assurance (DH-QA).
- **Execution Protocol:**
  1. Audit repository structure, Git status, passing tests, and dependencies using the `repository-audit` skill before designing or modifying components.
  2. Maintain zero-mutation rule over working files during audit phases.
  3. Load project guidelines from `project-governance/` and update master registers (`DECISION_REGISTER.md`, `ASSUMPTIONS.md`, `RISK_REGISTER.md`, `PROJECT_STATUS.md`).

### Workflow B: Planning & Requirement Discovery
- **Primary Capabilities:** `/grill-me`, `/plan`, `/technical-planning`, `/goal`.
- **Orchestration Ownership:** Department Head of Product (DH-Product) & DH-Arch.
- **Execution Protocol:**
  1. Challenge statutory and technical assumptions using evidence-based research rather than repeatedly grilling the Project Owner on factual questions.
  2. Formulate canonical Product Requirements Documents (PRDs) containing all 19 mandatory sections using the `technical-planning` methodology.
  3. Use `/goal` or loop-engineering patterns to sustain multi-step tasks across turns until completion.

### Workflow C: Multi-Agent Orchestration
- **Primary Capabilities:** `/teamwork`, `/agents`, `/skills`, `invoke_subagent`, `define_subagent`.
- **Orchestration Ownership:** Chief AI Engineering Orchestrator.
- **Execution Protocol:**
  1. Deconstruct complex milestones into modular workstreams assigned to specific department heads.
  2. Delegate tasks to specialized subagents (`research` for deep statutory/portal searches; `self` for isolated sub-tasks; custom subagents for specific domains).
  3. Ensure no two subagents write to the same files concurrently, eliminating race conditions.

### Workflow D: Research & External Verification
- **Primary Capabilities:** `/browser`, `search_web`, `research` subagent, `/plugin`.
- **Orchestration Ownership:** Department Head of Legal & Regulatory Compliance (DH-Legal) & DH-Govt.
- **Execution Protocol:**
  1. Inspect official primary sources for Indian statutes (India Code, UP Board of Revenue Bhulekh, IGRSUP, Income Tax portal, RBI circulars).
  2. Label every finding with its exact statutory provision, notification date, and verification status.
  3. Maintain strict separation between primary legislation, administrative rules, and unverified hypotheses.

### Workflow E: Engineering, Quality & Architecture
- **Primary Capabilities:** `/technical-planning`, `/plan`, `/boost`, `/impeccable`, `/skills`.
- **Orchestration Ownership:** Department Head of Architecture (DH-Arch), DH-Security & DH-Frontend.
- **Execution Protocol:**
  1. Formulate formal Architecture Decision Records (ADRs) and refactoring specifications before modifying code.
  2. Enforce the **Three-Test Rule** before introducing smart contracts into any module.
  3. Apply the `impeccable` skill for frontend interface design, ensuring high-trust institutional styling, design tokens, and accessibility standards.

### Workflow F: Workflow Automation & Continuity
- **Primary Capabilities:** `/hooks`, `/schedule`, `/statusline`, `/goal`.
- **Orchestration Ownership:** Department Head of Engineering (DH-Eng) & DH-Security.
- **Execution Protocol:**
  1. Configure `hooks.json` for post-tool verification (e.g., auto-running linting or test assertions after changes).
  2. Utilize the `schedule` tool to trigger background timers for long-running jobs or verification loops.
  3. Ensure zero hooks or background cron jobs perform destructive Git operations or external financial actions.

### Workflow G: Context & Resource Management
- **Primary Capabilities:** `/compact`, `/effort`, `/usage`.
- **Orchestration Ownership:** Chief AI Engineering Orchestrator.
- **Execution Protocol:**
  1. Monitor token consumption and context window boundaries.
  2. When conversation transcripts expand significantly, synthesize milestones into persistent governance documents before recommending `/compact` to preserve critical decisions.
  3. Allocate appropriate reasoning effort (`--effort high` or `max`) for complex statutory analysis and threat modelling.

### Workflow H: User Interaction & Configuration
- **Primary Capabilities:** `/keybindings`, `/agy-customizations`, `settings.json`.
- **Orchestration Ownership:** Chief AI Engineering Orchestrator.
- **Execution Protocol:**
  1. Recommend keyboard shortcuts and TUI commands to the Project Owner where helpful.
  2. Configure workspace trust and permission settings in `settings.json` without weakening safety controls.

---

## 5. Autonomous Execution Protocol & Delegation Architecture

```mermaid
graph TD
    PO[Project Owner - Human Authority] -->|Defines Strategic Goals & Approvals| ORCH[Chief AI Engineering Orchestrator]
    
    subgraph Multi-Agent Executive Hierarchy
        ORCH --> D_LEGAL[DH-Legal & Compliance]
        ORCH --> D_ARCH[DH-Architecture & System Design]
        ORCH --> D_SEC[DH-Security & Privacy]
        ORCH --> D_PROD[DH-Product & Domain]
        ORCH --> D_ENG[DH-Engineering & Full-Stack]
        ORCH --> D_QA[DH-Quality Assurance]
    end

    subgraph Autonomous Subagents & Tools
        D_LEGAL --> S_RES[Research Subagent / search_web]
        D_ARCH --> S_PLAN[technical-planning / ADR Specs]
        D_SEC --> S_THREAT[STRIDE Model & Salt Vault]
        D_PROD --> S_PRD[Canonical PRD Suite]
        D_ENG --> S_CODE[Controlled Implementation (Gated)]
        D_QA --> S_TEST[57 Hardhat + 27 Jest Test Suite]
    end
```

### 5.1 Autonomous Orchestration Loop
The Chief Orchestrator executes according to the following continuous cycle:
1. **Identify Next Eligible Task:** Consult `project-governance/MASTER_ROADMAP.md` and active phase exit criteria.
2. **Assign Department Head:** Select the owning department and relevant Antigravity skill/tool.
3. **Execute Evidence-Based Work:** Perform research, write specs, or run tests without manual intervention.
4. **Conduct Multi-Lens Peer Review:** Validate outputs across Architecture, Legal, Security, and QA perspectives.
5. **Update Governance Registers:** Record decisions, assumptions, and risks in `project-governance/`.
6. **Determine Gate Boundary:** If the completed task leads to a non-consequential next step, continue autonomously; if a material approval gate is reached (e.g. initiating live code refactoring or external commitments), halt and present the formal gate package to the Project Owner.

---

## 6. Continuous Improvement & Lifecycle Feedback Loops

At the completion of each project phase:
1. **Command Review:** Evaluate which Antigravity commands and skills accelerated execution and which created friction.
2. **Playbook Refinement:** Update this playbook with newly discovered options, CLI flags, or MCP tool capabilities.
3. **Security Audit:** Re-verify that no autonomous action bypassed sandbox boundaries or altered protected files.

---

## 7. Verified Multi-Agent Subagent Operating Infrastructure

An empirical audit and live operational activation established the multi-agent operating infrastructure in Antigravity CLI v1.4.12:

### 7.1 Specialist Subagent Definitions
Six dedicated specialist agents have been formally declared via `define_subagent` and verified through parallel task execution:

| Subagent Type Name | Specialist Role | Tooling Policy | Primary Responsibility |
| :--- | :--- | :--- | :--- |
| `product-legal-agent` | Product & Legal Research | Read-Only (`search_web`, `read_file`) | UP Revenue Code, DPDP Act, deed validity, stamp valuation |
| `system-architect-agent` | System Architect | Read-Only (`search_web`, `read_file`) | Decoupled pipeline design, SQLite schemas, API contracts |
| `security-privacy-agent` | Security & Privacy | Read-Only (`search_web`, `read_file`) | STRIDE threat model, CSPRNG salting, fail-closed ClamAV |
| `backend-engineer-agent` | Backend Engineering | Write/Command enabled during execution | Express routes, service layers, better-sqlite3 migrations |
| `frontend-engineer-agent` | Frontend Engineering | Write/Command enabled during execution | React 19 UI, Web Crypto SHA-256 pre-hashing, accessibility |
| `qa-test-agent` | QA & Test Engineering | Write/Command enabled during execution | Test case matrices, Jest/Hardhat test specs, regression gates |

### 7.2 Native Multi-Agent Tooling Primitives
1. `define_subagent`: Used by the Orchestrator to instantiate domain specialists with tailored system prompts, restricted permissions, and isolated workspaces.
2. `invoke_subagent`: Used to launch parallel subagent tasks. Subagents run asynchronously in background workspaces without blocking the parent agent.
3. `manage_subagents`: Used to list active conversation IDs, monitor execution state (`running`, `idle`, `waiting_for_input`), and kill stale workers.
4. `send_message`: Enables direct peer-to-peer and parent-to-child message transmission for inter-agent challenge and guidance.
5. Reactive Wakeup: Antigravity automatically resumes the parent Orchestrator when subagent reports arrive, eliminating busy-polling.

---
*End of Antigravity Command Playbook.*