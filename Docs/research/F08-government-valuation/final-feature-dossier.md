# FEATURE RESEARCH DOSSIER: F08
# Government Valuation & Circle Rates (Uttar Pradesh Analysis)

**Feature ID:** F08  
**Feature Name:** Government Valuation, Circle Rates & Stamp Duty Computation  
**Feature Lead:** Lead-F08  
**Supervising Department:** Research & Government Integration (DH-Govt) & Product (DH-Product)  
**Readiness Status:** **UP Stamp Valuation Rules: Research Verified / Valuation Engine Spec Complete**  
**Jurisdiction:** Uttar Pradesh (District Collectorate Gazette Baseline)  

---

## 1. Executive Summary

In India, real estate transactions are subject to two distinct valuations:
1. **Agreed Market Consideration**: The actual transaction price negotiated between buyer and seller.
2. **Circle Rate (Minimum Valuation)**: The statutory minimum threshold established by the state government below which a property cannot be registered for stamp duty purposes.

Feature F08 establishes the valuation and fee computation engine for Uttar Pradesh under the **Uttar Pradesh Stamp (Valuation of Property) Rules, 1997**. It provides transparent price comparison, ensuring users understand:
- Why their stamp duty is calculated on the higher of the circle rate or actual price.
- That government circle rates represent a tax baseline and **do not constitute a speculative or definitive market appraisal**.

---

## 2. Statutory Legal Framework in Uttar Pradesh

### 2.1 The UP Stamp (Valuation of Property) Rules, 1997
- **Authority:** District Magistrate (Collector) of each district in consultation with Sub-Registrars and local revenue officers.
- **Mandate:** Rules 3 and 4 mandate periodic revision (biennial or annual) of minimum rates per unit area across:
  - **Urban Municipal Areas**: Valued **per square meter**.
  - **Rural Agricultural Areas**: Valued **per hectare** (or local standard bigha = 2,529 sq.m / 20 biswas).

### 2.2 Valuation Adjustments & Road-Width Multipliers
Under Rule 4 of the UP Stamp Valuation Rules, basic rates are subject to statutory surcharges:
1. **Main Road / Highway Proximity:**
   - Agricultural land abutting a **National Highway (NH)** or **State Highway (SH)** commands a **15% to 25% surcharge** above the base agricultural rate.
   - Land abutting a Link Road / PWD pacca road commands a **10% surcharge**.
2. **Urban Road Width Rules:**
   - Plots on roads wider than 9 meters (30 feet) or 12 meters command higher circle rates than interior alleyway plots.
3. **Corner Plots:**
   - Plots abutting two or more public roads typically attract an additional **10% surcharge**.
4. **Commercial & Mixed-Use Multipliers:**
   - Property designated or used for commercial purposes attracts a multiplier of **1.5x to 3x** the basic residential rate.

---

## 3. Stamp Duty & Registration Charges in Uttar Pradesh

| Transferee / Buyer Category | Stamp Duty Rate (on Higher of Consideration or Circle Rate) | Registration Fee | Total Government Dues |
| :--- | :--- | :--- | :--- |
| **Male Purchaser** | **7.0%** | **1.0%** (capped at ₹20,000 in UP) | ~8.0% |
| **Female Purchaser** | **6.0%** (1.0% statutory gender concession up to ₹10 Lakhs) | **1.0%** (capped at ₹20,000) | ~7.0% |
| **Joint Male + Female** | **6.5%** | **1.0%** (capped at ₹20,000) | ~7.5% |

---

## 4. Algorithmic Valuation Model for Bhūmi Ledger

```typescript
interface UPValuationInputs {
  district: string;            // e.g., "Lucknow", "Gautam Buddha Nagar"
  tehsil: string;              // e.g., "Sadar", "Dadri"
  villageLGDCode: string;      // 6-digit LGD Census Code
  classification: "AGRICULTURAL" | "RESIDENTIAL" | "COMMERCIAL";
  areaSqMeters: number;
  roadAccess: "INTERIOR" | "PWD_LINK_ROAD" | "STATE_HIGHWAY" | "NATIONAL_HIGHWAY";
  isCornerPlot: boolean;
  buyerGender: "MALE" | "FEMALE" | "JOINT";
  agreedPriceINR: number;
}

function calculateUPStampDuty(input: UPValuationInputs) {
  // 1. Fetch base rate per sq. meter from District Collectorate list
  let baseRatePerSqM = getDistrictBaseRate(input.district, input.villageLGDCode, input.classification);
  
  // 2. Apply road width multipliers
  let multiplier = 1.0;
  if (input.roadAccess === "NATIONAL_HIGHWAY") multiplier += 0.20;
  else if (input.roadAccess === "STATE_HIGHWAY") multiplier += 0.15;
  else if (input.roadAccess === "PWD_LINK_ROAD") multiplier += 0.10;
  
  if (input.isCornerPlot) multiplier += 0.10;
  
  // 3. Compute Circle Rate Valuation
  const circleRateValue = input.areaSqMeters * (baseRatePerSqM * multiplier);
  
  // 4. Taxable Base = Higher of Agreed Price vs. Circle Rate Value
  const taxableValue = Math.max(input.agreedPriceINR, circleRateValue);
  
  // 5. Calculate Stamp Duty
  let stampDutyPct = 0.07;
  if (input.buyerGender === "FEMALE") stampDutyPct = 0.06;
  else if (input.buyerGender === "JOINT") stampDutyPct = 0.065;
  
  const stampDuty = taxableValue * stampDutyPct;
  const registrationFee = Math.min(taxableValue * 0.01, 20000);
  
  return { circleRateValue, taxableValue, stampDuty, registrationFee, totalGovtCharges: stampDuty + registrationFee };
}
```

---

## 5. Implementation Acceptance Criteria

1. The platform must display both the seller's asking price and the official circle rate estimate side-by-side.
2. A prominent disclaimer must state: *"Circle rates are statutory government baselines for stamp duty calculation under UP Stamp Valuation Rules, 1997, and do not represent market valuation."*
3. Calculation engine accurately accounts for gender concessions (6% vs 7%) and registration fee ceilings (₹20,000 cap).
