# FEATURE RESEARCH DOSSIER: F05
# Marketplace & Direct Buyer-Seller Discovery (Regulatory Analysis)

**Feature ID:** F05  
**Feature Name:** Direct Marketplace, Disintermediation & RERA Compliance  
**Feature Lead:** Lead-F05  
**Supervising Department:** Product (DH-Product) & Legal (DH-Legal)  
**Readiness Status:** **Base Listing Code: Enabled / RERA & Intermediary Compliance: Research Verified**  
**Jurisdiction:** Central India & Uttar Pradesh  

---

## 1. Executive Summary

Traditional Indian real estate relies heavily on informal, commission-driven property brokers who often lack transparency, create artificial price markups, and withhold encumbrance information.

Feature F05 governs direct peer-to-peer parcel listing on Bhūmi Ledger. It audits the legal requirements for operating a digital property marketplace in India, specifically:
1. **RERA Agent Registration (Section 9, RERA Act 2016)**: When an online platform is classified as a "real estate agent" requiring mandatory registration.
2. **Individual Resale vs. New Project Listings**: Boundaries between secondary land sales and primary promoter project marketing.
3. **Information Technology Intermediary Protections (Section 79, IT Act 2000)**: Due diligence requirements to maintain safe-harbor protections against user-generated fraudulent listings.

---

## 2. Regulatory Compliance: Real Estate (Regulation and Development) Act, 2016 (RERA)

### 2.1 Section 9 Mandate: Real Estate Agent Registration
- **Statutory Provision:** Under Section 9(1) of the RERA Act, 2016, no real estate agent shall facilitate the sale or purchase of or act on behalf of any person to facilitate the sale or purchase of any plot, apartment, or building in a real estate project registered under Section 3 **without obtaining registration** from the State Real Estate Regulatory Authority (e.g., **UP RERA**).
- **Scope of "Real Estate Agent" (Section 2(zm)):** Expressly includes digital platforms, websites, and portals that introduce prospective buyers and sellers or negotiate on their behalf for valuable consideration.
- **Application to Bhūmi Ledger:**
  - **Individual Resale / Agricultural Parcels**: Direct peer-to-peer sales between individuals of standalone rural agricultural land or ancestral plots generally fall outside Section 3 RERA project registration.
  - **Plotted Developments / Urban Colonies**: If the platform lists plots in plotted layouts exceeding 500 square meters or more than 8 plots, the layout must be registered with UP RERA, and the platform must obtain **UP RERA Agent Registration** before publishing listings.

### 2.2 Section 10 Obligations: Code of Conduct
- A platform listing RERA-registered land cannot facilitate the sale of unregistered plots.
- The platform must maintain books of accounts and records for transactions.
- The platform must not engage in unfair trade practices, misleading advertisements, or false representations regarding government approvals.

---

## 3. IT Act Intermediary Safe Harbor (Section 79 & IT Rules, 2021)

To avoid vicarious civil or criminal liability for fraudulent listings uploaded by malicious sellers:
1. **Due Diligence Obligations**: Bhūmi Ledger must publish clear Terms of Service and Privacy Policies warning users against uploading forged deeds, encroached forest land, or benami properties.
2. **Mandatory Grievance Officer**: Must designate a Grievance Officer with an escalation turnaround of within 24 hours acknowledgment and 15 days resolution.
3. **Notice & Takedown Procedure**: Upon receipt of a formal court order or authorized government notification (e.g., from a Tehsildar or Police Authority), the platform must disable or freeze access to the disputed listing within 36 hours.

---

## 4. Platform Architecture & Listing Gates

```
[Seller Creates Listing: CitizenDashboard]
                  │
                  ▼
[Gate 1: Title Verification Check]
   - Is property registered on LandRegistry.sol?
   - Is isVerifiedByAuthority == true?
   - Is isFrozen == false?
                  │
                  ▼
[Gate 2: Statutory Tenure & Ceiling Check]
   - Is tenure "Bhumidhar with Transferable Rights"?
   - Area does not violate Section 89 ceiling (5.0586 ha)
                  │
                  ▼
[Gate 3: Listing Commitment]
   - Seller executes `listPropertyForSale(propertyId, priceWei)`
   - PropertyListed event emitted & indexed in PROPERTIES table
                  │
                  ▼
[Live on Marketplace: Marketplace.jsx]
```

---

## 5. Implementation Acceptance Criteria

1. Only verified, non-frozen properties can be listed on the marketplace.
2. Unregistered commercial plotted developments are blocked from listing without a verified UP RERA registration number.
3. Every listing provides a "Report Disputed Title" button triggering legal takedown reviews.
