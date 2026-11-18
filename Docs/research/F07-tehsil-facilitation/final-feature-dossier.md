# FEATURE RESEARCH DOSSIER: F07
# Tehsil Facilitation, Document Writers & Service Providers

**Feature ID:** F07  
**Feature Name:** Tehsil Facilitation & Verified Service Provider Directory  
**Feature Lead:** Lead-F07  
**Supervising Department:** Business & Domain (DH-Domain) & Legal (DH-Legal)  
**Readiness Status:** **Regulatory Reality Audited / Directory Model Defined**  
**Jurisdiction:** Uttar Pradesh (Tehsil & SRO Ground Baseline)  

---

## 1. Executive Summary

A pervasive barrier for citizens in land transactions is navigating the complex paperwork and physical procedures at the local Tehsil and Sub-Registrar Office (SRO). Citizens often depend on informal intermediaries, typists, and document writers (*Wasiqa Navis*).

Feature F07 investigates the formalization of local Tehsil facilitation:
1. **Statutory Status of Document Writers**: Licensed under the *Uttar Pradesh Document Writers Licensing Rules, 1977*. They are authorized to draft deeds, petitions, and revenue applications for prescribed statutory fees.
2. **The Non-Negotiable Boundary**: Neither private facilitators, nor platform worker badges, nor smart contract tokens can grant statutory administrative authority. Statutory authority resides exclusively with gazetted revenue officers (Tehsildars, Naib Tehsildars, SDMs).
3. **Product Vision**: A transparent, rated directory of licensed document writers, certified land surveyors (Ameens), and revenue advocates with transparent service fee tracking.

---

## 2. Uttar Pradesh Tehsil Stakeholder Map

```
┌────────────────────────────────────────┬────────────────────────────────────────┐
│ Statutory Government Officers          │ Licensed & Permitted Private Actors    │
├────────────────────────────────────────┼────────────────────────────────────────┤
│ • Sub-Divisional Magistrate (SDM)      │ • Licensed Document Writers            │
│ • Tehsildar & Naib Tehsildar           │   (Wasiqa Navis / Dastaveznavees)      │
│ • Revenue Inspector (Kanoongo)         │ • Private Cadastral Surveyors (Ameens) │
│ • Area Accountant (Lekhpal / Patwari)  │ • Practicing Revenue Advocates         │
│ • Sub-Registrar (SRO / Registration)   │ • Common Service Centre (CSC) VLEs     │
└────────────────────────────────────────┴────────────────────────────────────────┘
```

---

## 3. Statutory Rules for Document Writers in Uttar Pradesh

### 3.1 UP Document Writers Licensing Rules, 1977
- **Licensing Authority:** District Registrar (Collector) or Sub-Registrar.
- **Eligibility:** Matriculation, knowledge of Hindi/Urdu revenue terminology, and clean criminal record.
- **Statutory Duties:**
  - Must draft deeds in the prescribed legal formats (sale deed, gift deed, mortgage, lease).
  - Must record their full name, license number, and signature on every drafted deed.
  - Must enter every drafted instrument into a statutory register.
  - Prohibited from charging fees exceeding the prescribed statutory maximum.

### 3.2 Private Cadastral Surveyors (Ameens)
- Private or retired survey Ameens are frequently hired by buyers and sellers to demarcate field boundaries using metric chains (*Gunter chain* / *Jareeb* or Total Station DGPS instruments) before executing sale deeds, preventing post-purchase boundary litigations.

---

## 4. Platform Service Directory Architecture

```
[Citizen Needs Assistance: CitizenDashboard]
                     │
                     ▼
[Verified Provider Directory: F07]
   ├── Filter by District / Tehsil (e.g., Lucknow Sadar)
   ├── Select Category:
   │   ├── Licensed Document Writer (Deed drafting & e-Challan)
   │   ├── Cadastral Survey Ameen (Physical boundary demarcation)
   │   └── Revenue Advocate (Title search & court dispute check)
                     │
                     ▼
[Service Tracking & Milestone Ledger]
   - Encrypted in-app messaging & document checklist
   - Fixed, transparent service fees deposited in milestone escrow
   - Client feedback rating & license verification badge
```

---

## 5. Non-Negotiable Legal Safeguards

1. **No Delegation of Statutory Authority**: The platform copy must never claim that a verified document writer or platform representative has the authority to "approve" mutations, verify RoRs, or certify deeds.
2. **Anti-Touting Compliance**: Facilitation must strictly adhere to the Advocate Act, 1961 (prohibiting unauthorized legal practice) and Registration Department anti-touting circulars.

---

## 6. Implementation Acceptance Criteria

1. Every listed facilitator must display their verified state license number and issuing Tehsil/SRO.
2. Transparent fixed pricing schedules with clear distinctions between official government statutory fees and private professional drafting fees.
3. Explicit disclaimer: *"Facilitators assist with drafting and documentation; only the Sub-Registrar and Tehsildar possess statutory authority to register deeds and order mutations."*
