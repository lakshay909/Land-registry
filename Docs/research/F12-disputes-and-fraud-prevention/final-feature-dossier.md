# FEATURE RESEARCH DOSSIER: F12
# Disputes, Fraud Prevention & Risk (Vaad UP & Lis Pendens)

**Feature ID:** F12  
**Feature Name:** Dispute Tracking, Fraud Prevention & Judicial Freezing  
**Feature Lead:** Lead-F12  
**Supervising Department:** Security (DH-Security) & Legal (DH-Legal)  
**Readiness Status:** **On-Chain Freezing: Enabled / Revenue Court Status (Vaad): Research Verified**  
**Jurisdiction:** Uttar Pradesh & Central India  

---

## 1. Executive Summary

Land disputes choke Indian courts, accounting for over **66% of all civil litigations** according to Supreme Court and NITI Aayog studies. In Uttar Pradesh, land disputes fall into two parallel judicial hierarchies:
1. **Civil Courts**: Adjudicate questions of absolute title, cancellation of sale deeds, and specific performance.
2. **Revenue Courts**: Adjudicate demarcation, boundary disputes, partition, and mutation under the *UP Revenue Code, 2006*.

Feature F12 provides active fraud prevention and dispute containment. It connects statutory litigation doctrines (*Lis Pendens*) to on-chain dispute freezing via `flagProperty(propertyId, reason)` in [`contracts/LandRegistry.sol`](file:///Users/lakshay/Desktop/Land-registry/contracts/LandRegistry.sol#L371), ensuring that disputed parcels cannot be sold or transferred.

---

## 2. Statutory Legal Framework for Land Disputes

### 2.1 The Doctrine of *Lis Pendens* (Section 52, Transfer of Property Act, 1882)
- **The Core Rule:** During the pendency in any court of any suit or proceeding which is not collusive and in which any right to immovable property is directly and specifically in question, the property **cannot be transferred or otherwise dealt with by any party** so as to affect the rights of any other party thereto under any decree or order which may be made therein.
- **Product Implication:** While a sale during pendency is not automatically void ab initio, the purchaser takes the property **strictly subject to the result of the litigation**. To protect buyers, Bhūmi Ledger must flag any property with active litigation before listing.

### 2.2 Civil Court vs. Revenue Court Jurisdictions in UP
- **Section 206, UP Revenue Code, 2006:** Expressly bars the jurisdiction of Civil Courts over matters that can be adjudicated by Revenue Courts (e.g., mutation, correction of land records, agricultural partition under Section 116).
- **Civil Court Jurisdiction:** Retains exclusive jurisdiction over suits for cancellation of registered sale deeds, declaration of title where non-tenure rights are involved, and temporary injunctions under Order 39, Rules 1 & 2 of the Code of Civil Procedure (CPC, 1908).

---

## 3. Revenue Court Status: Vaad UP (RCCMS)

### 3.1 Portal Architecture (`vaad.up.nic.in`)
The Revenue Court Computerized Management System (RCCMS / Vaad) tracks cases across:
- **Tehsildar & Naib Tehsildar Courts**: Section 34/35 Mutation proceedings.
- **Sub-Divisional Officer (SDO) Courts**: Section 35(2) Appeals, Section 80 Non-Agri conversion, Section 116 Partition.
- **Collector / District Magistrate Courts**: Section 89 Ceiling violations, Section 98 SC transfer sanction.
- **Commissioner & Board of Revenue Courts**: Revisions and second appeals.

### 3.2 Automated & Assisted Case Verification
- Every case in UP is assigned a **16-digit Computerized Case Number** (*Vaad Sankhya*).
- Bhūmi Ledger captures the 16-digit case number from disputing parties or revenue registrars and links directly to the verified order sheet on `vaad.up.nic.in`.

---

## 4. On-Chain Dispute Freezing Mechanism

Implemented in [`contracts/LandRegistry.sol:371-387`](file:///Users/lakshay/Desktop/Land-registry/contracts/LandRegistry.sol#L371-L387):

```solidity
function flagProperty(uint256 _propertyId, string memory _reason) external onlyRole(ADMIN_ROLE) {
    if (properties[_propertyId].id == 0) revert PropertyDoesNotExist();
    if (properties[_propertyId].isFrozen) revert PropertyIsFrozen();
    properties[_propertyId].isFrozen = true;
    emit PropertyFlagged(_propertyId, _reason);
}

function unflagProperty(uint256 _propertyId) external onlyRole(ADMIN_ROLE) {
    if (properties[_propertyId].id == 0) revert PropertyDoesNotExist();
    if (!properties[_propertyId].isFrozen) revert PropertyNotFrozen();
    properties[_propertyId].isFrozen = false;
    emit PropertyUnflagged(_propertyId);
}
```

### Invariants Enforced When `isFrozen == true`:
1. `listPropertyForSale` reverts with `PropertyIsFrozen()` ([line 161](file:///Users/lakshay/Desktop/Land-registry/contracts/LandRegistry.sol#L161)).
2. `initiateTransfer` reverts with `PropertyIsFrozen()` ([line 196](file:///Users/lakshay/Desktop/Land-registry/contracts/LandRegistry.sol#L196)).
3. `executeTransfer` reverts with `PropertyIsFrozen()` ([line 338](file:///Users/lakshay/Desktop/Land-registry/contracts/LandRegistry.sol#L338)).
4. `AuthorityDashboard.jsx` and `PublicSearch.jsx` display prominent red dispute banners detailing judicial case references.

---

## 5. Implementation Acceptance Criteria

1. Any administrative flag committed on-chain completely halts pending transfers and marketplace purchases.
2. Unflagging can only be performed by authorized accounts holding `ADMIN_ROLE` upon recording verified court disposal orders.
3. Parcel records display active Vaad UP / Civil Court suit references to prospective buyers.
