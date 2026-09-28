# Test Plan

## 1. Objective
Verify functional correctness of the LandRegistry contract and demonstrate resilience against common fraud scenarios.

## 2. Test Levels
- **Unit tests** — individual function behavior (Hardhat + Mocha/Chai)
- **Integration tests** — full flows across multiple functions (registration → verification → transfer → execution)
- **Fraud/security tests** — adversarial scenarios expected to revert

## 3. Test Environment
- Hardhat local network (fast, free, deterministic) for development
- Testnet (Sepolia/Polygon Amoy) for final demo/deployment validation

## 4. Functional Test Cases

| ID | Test Case | Expected Result |
|---|---|---|
| TC-1 | Register a new property | Property created with `isVerifiedByAuthority = false` |
| TC-2 | Authority verifies a registration | `isVerifiedByAuthority = true`, event emitted |
| TC-3 | Owner initiates transfer | `TransferRequest` created, `executed = false` |
| TC-4 | Owner signs transfer | `fromSigned = true` |
| TC-5 | Buyer signs transfer | `toSigned = true` |
| TC-6 | Authority approves transfer | `authorityApproved = true` |
| TC-7 | Execute transfer after all conditions met | `currentOwner` updated, history appended, event emitted |
| TC-8 | View ownership history | Returns correct chronological owner list |

## 5. Fraud/Security Test Cases

| ID | Scenario | Expected Result |
|---|---|---|
| FT-1 | Register same property twice | Second registration reverts / flagged as duplicate |
| FT-2 | Non-owner calls `initiateTransfer` | Reverts with `NotOwner` |
| FT-3 | Forged signature (random wallet signs as claimed owner) | `ECDSA.recover` mismatch, reverts with `InvalidSignature` |
| FT-4 | Replay a previously used valid signature | Reverts with `NonceAlreadyUsed` |
| FT-5 | Execute transfer without authority approval | Reverts with `NotApproved` |
| FT-6 | Execute transfer on a frozen/flagged property | Reverts with `PropertyIsFrozen` |
| FT-7 | Owner attempts self-transfer to manipulate history | Reverts or explicitly blocked (`to != from` check) |

## 6. Pass/Fail Criteria
A test passes if the contract behaves exactly as specified (correct state change for valid cases, correct revert reason for invalid/fraudulent cases). All FT-* cases passing is the primary evidence for the "fraud resilience" objective.

## 7. Tools
- Hardhat test runner, Chai assertions (`expect(...).to.be.revertedWith(...)`)
- `hardhat-gas-reporter` (optional) to also report gas cost per function for the report
- Coverage: `solidity-coverage` plugin, to report % of contract lines/branches tested

## 8. Deliverable
Running `npx hardhat test` should output all TC-* and FT-* results — this raw output becomes the basis of the Test Report (Doc #8), once the contract exists.
