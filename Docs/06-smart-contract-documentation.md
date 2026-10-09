# Smart Contract Documentation — LandRegistry.sol

**Contract Name:** `LandRegistry`  
**Solidity Version:** `^0.8.24` (Cancun EVM compatible)  
**License:** `MIT`  
**Base Dependencies:** OpenZeppelin Contracts v5.x (`AccessControl`, `EIP712`, `ECDSA`)  
**Deployment Target:** Ethereum / EVM-compatible chains (Hardhat local, Sepolia, Polygon Amoy)

---

## 1. Overview & Architectural Role

The `LandRegistry` smart contract acts as the primary on-chain trust anchor and authoritative ledger for real property records. It governs property registration, administrative verification, multi-party cryptographic transfer authorization, and administrative freezing/dispute flags.

### Key Architectural Tenets
1. **Separation of Off-Chain Storage and On-Chain Proofs:** Complete deed PDF documents are stored off-chain in content-addressable storage (backend/IPFS); only their cryptographic hash (`bytes32 documentHash`) is committed on-chain.
2. **Dual-Party Cryptographic Consent:** Ownership transfers require explicit, off-chain EIP-712 structured data signatures from both the seller (`from`) and the buyer (`to`) before the transaction can be authorized.
3. **Four-Gate Transfer Execution:** A transfer cannot be executed unless four explicit gates are satisfied:
   - Seller signed (`fromSigned == true`)
   - Buyer signed (`toSigned == true`)
   - Government Authority approved (`authorityApproved == true`)
   - Property is neither frozen nor unverified
4. **Checks-Effects-Interactions (CEI) Pattern:** Transfer execution flips execution state flags prior to state mutations and history updates to prevent reentrancy and double-spend vectors.
5. **Global Document Hash Uniqueness:** A deed hash cannot be registered twice, and subsequent transfers must burn old deeds by requiring a unique, unused deed hash.

---

## 2. Cryptographic Constants & Standards

### 2.1 EIP-712 Domain Separator
The contract implements OpenZeppelin's `EIP712` standard to provide human-readable transaction signing in wallet interfaces (e.g., MetaMask).
- **Domain Name:** `"LandRegistry"`
- **Domain Version:** `"1"`

### 2.2 Roles (AccessControl)
| Constant | Keccak256 Value | Description |
|---|---|---|
| `DEFAULT_ADMIN_ROLE` | `0x00...00` | Contract deployer; super-admin capable of granting/revoking system roles. |
| `ADMIN_ROLE` | `keccak256("ADMIN_ROLE")` | Government Land Authority; permitted to verify registrations, approve transfers, and freeze/unfreeze disputed properties. |
| `REGISTRAR_ROLE` | `keccak256("REGISTRAR_ROLE")` | Reserved for delegated registry staff (e.g., Sub-Registrars) to process registrations without self-approval permissions. |

### 2.3 EIP-712 Struct TypeHash
```solidity
bytes32 public constant TRANSFER_TYPEHASH = 
    keccak256("Transfer(uint256 propertyId,bytes32 documentHash,string action,uint256 nonce)");
```
- **Fields in Typed Data:**
  - `propertyId` (`uint256`): Numerical ID of the property being transferred.
  - `documentHash` (`bytes32`): Cryptographic keccak256 hash of the deed document for this transfer.
  - `action` (`string`): Fixed string `"TRANSFER"` (hashed on-chain as `keccak256(bytes("TRANSFER"))`).
  - `nonce` (`uint256`): Monotonically increasing per-account nonce from `nonces[signer]` to protect against replay attacks.

---

## 3. Data Structures & Storage Layout

### 3.1 Structs

#### `Property`
Represents an individual real-estate parcel on the ledger.
```solidity
struct Property {
    uint256 id;                   // Unique auto-incrementing property ID (1-indexed)
    string locationHash;          // Hash or geo-coordinate reference of parcel boundaries
    uint256 area;                 // Surface area in square meters
    address currentOwner;         // Ethereum address of current legal title holder
    bytes32 documentHash;         // keccak256 hash of current active deed document
    bool isVerifiedByAuthority;   // True once approved by an ADMIN_ROLE account
    bool isFrozen;                // True if property is disputed/flagged by authority
    uint256 registeredAt;         // Block timestamp of initial registration
}
```

#### `TransferRequest`
Represents an active multi-stage conveyance request.
```solidity
struct TransferRequest {
    uint256 propertyId;           // Target property ID
    address from;                 // Current registered owner (seller)
    address to;                   // Designated recipient (buyer)
    bytes32 newDocumentHash;      // keccak256 hash of the new deed conveyance deed
    bool fromSigned;              // Cryptographic signature status of seller
    bool toSigned;                // Cryptographic signature status of buyer
    bool authorityApproved;       // Verification status of the Government Authority
    bool executed;                // Execution status of the conveyance
}
```

### 3.2 State Variables & Mappings

```solidity
mapping(uint256 => Property) public properties;
uint256 public nextPropertyId = 1;

mapping(uint256 => TransferRequest) public transfers;
uint256 public nextTransferId = 1;

mapping(address => uint256) public nonces;
mapping(bytes32 => bool) public registeredDocuments;
mapping(uint256 => address[]) public ownershipHistory;
```

- `properties`: Direct index mapping of `propertyId => Property`.
- `nextPropertyId`: Tracks the next numerical property ID (begins at 1; ID 0 indicates non-existence).
- `transfers`: Direct index mapping of `transferId => TransferRequest`.
- `nextTransferId`: Tracks the next conveyance ID (begins at 1).
- `nonces`: Maps account address to an incremental nonce counter used in EIP-712 replay protection.
- `registeredDocuments`: Global uniqueness registry for deed hashes (`bytes32 => bool`). Ensures no deed document is duplicated across the registry.
- `ownershipHistory`: Explicit on-chain historical array mapping `propertyId => address[]`, storing the genesis owner and every successive title transferee.

---

## 4. Contract Functions & Specifications

### 4.1 Constructor
```solidity
constructor() EIP712("LandRegistry", "1")
```
- Initializes the EIP-712 domain separator.
- Grants `DEFAULT_ADMIN_ROLE` and `ADMIN_ROLE` to `msg.sender`.

---

### 4.2 Property Registration & Verification

#### `registerProperty`
```solidity
function registerProperty(
    string memory _locationHash,
    uint256 _area,
    bytes32 _documentHash
) external
```
- **Access:** Public (any citizen account).
- **Parameters:**
  - `_locationHash`: Geographical coordinate string or boundary hash (e.g., GeoJSON CID or coordinate centroid).
  - `_area`: Area of property in square meters (`uint256 > 0`).
  - `_documentHash`: keccak256 hash of the deed document PDF.
- **Reverts:**
  - `DuplicateRegistration()`: If `registeredDocuments[_documentHash] == true`.
- **State Modifications:**
  - Allocates `propertyId = nextPropertyId++`.
  - Creates `Property` with `isVerifiedByAuthority = false`, `isFrozen = false`.
  - Marks `registeredDocuments[_documentHash] = true`.
  - Appends `msg.sender` as first entry in `ownershipHistory[propertyId]`.
- **Emits:** `PropertyRegistered(uint256 indexed propertyId, address indexed owner)`

#### `verifyRegistration`
```solidity
function verifyRegistration(uint256 _propertyId) external onlyRole(ADMIN_ROLE)
```
- **Access:** Authority only (`ADMIN_ROLE`).
- **Parameters:**
  - `_propertyId`: ID of the target property.
- **Reverts:**
  - `PropertyDoesNotExist()`: If `properties[_propertyId].id == 0`.
  - `AlreadyVerified()`: If `properties[_propertyId].isVerifiedByAuthority == true`.
- **State Modifications:**
  - Sets `isVerifiedByAuthority = true`.
- **Emits:** `PropertyVerified(uint256 indexed propertyId)`

---

### 4.3 Property Transfer Workflow

#### `initiateTransfer`
```solidity
function initiateTransfer(
    uint256 _propertyId,
    address _to,
    bytes32 _newDocumentHash
) external
```
- **Access:** Current verified owner only.
- **Parameters:**
  - `_propertyId`: Target property ID.
  - `_to`: Intended recipient/buyer Ethereum address.
  - `_newDocumentHash`: keccak256 hash of the updated sale deed.
- **Reverts:**
  - `PropertyDoesNotExist()`: If property does not exist.
  - `PropertyNotVerified()`: If property is not yet verified by authority.
  - `NotOwner()`: If `properties[_propertyId].currentOwner != msg.sender`.
  - `PropertyIsFrozen()`: If property is frozen under dispute.
  - `InvalidTransferToSelf()`: If `_to == msg.sender`.
  - `DuplicateRegistration()`: If `registeredDocuments[_newDocumentHash] == true`.
- **State Modifications:**
  - Allocates `transferId = nextTransferId++`.
  - Stores `TransferRequest` with all flags (`fromSigned`, `toSigned`, `authorityApproved`, `executed`) initialized to `false`.
- **Emits:** `TransferInitiated(uint256 indexed transferId, uint256 indexed propertyId, address from, address to)`

#### `signTransfer`
```solidity
function signTransfer(uint256 _transferId, bytes calldata _signature) external
```
- **Access:** Only `from` or `to` party of the transfer.
- **Parameters:**
  - `_transferId`: Active transfer request ID.
  - `_signature`: 65-byte ECDSA signature generated over the EIP-712 structured data.
- **Cryptographic Verification:**
  - Reconstructs `structHash = keccak256(abi.encode(TRANSFER_TYPEHASH, request.propertyId, request.newDocumentHash, keccak256("TRANSFER"), nonces[msg.sender]))`.
  - Derives digest via `_hashTypedDataV4(structHash)`.
  - Recovers signer address via `ECDSA.recover(digest, _signature)`.
- **Reverts:**
  - `TransferDoesNotExist()`: If `transfers[_transferId].propertyId == 0`.
  - `InvalidSignature()`: If `recoveredSigner != msg.sender`.
  - `AlreadySigned()`: If caller has already signed.
  - `NotAPartyToTransfer()`: If caller is neither `request.from` nor `request.to`.
- **State Modifications:**
  - Sets `fromSigned = true` or `toSigned = true`.
  - Increments `nonces[msg.sender]++` (invalidating this nonce for future replays).
- **Emits:** `TransferSigned(uint256 indexed transferId, address indexed signer)`

#### `approveTransfer`
```solidity
function approveTransfer(uint256 _transferId) external onlyRole(ADMIN_ROLE)
```
- **Access:** Authority only (`ADMIN_ROLE`).
- **Parameters:**
  - `_transferId`: Active transfer request ID.
- **Reverts:**
  - `TransferDoesNotExist()`: If transfer ID does not exist.
  - `AlreadyExecuted()`: If transfer is already executed.
  - `AlreadyApproved()`: If transfer was already approved.
- **State Modifications:**
  - Sets `request.authorityApproved = true`.
- **Emits:** `TransferApproved(uint256 indexed transferId)`

#### `executeTransfer`
```solidity
function executeTransfer(uint256 _transferId) external
```
- **Access:** Any caller (guarded by internal state gates).
- **Four Execution Gates Checked:**
  1. `request.fromSigned && request.toSigned` -> Reverts with `TransferNotReady()` if missing.
  2. `request.authorityApproved` -> Reverts with `NotApproved()` if missing.
  3. `!request.executed` -> Reverts with `AlreadyExecuted()` if true.
  4. Property status: `!property.isFrozen` -> Reverts with `PropertyIsFrozen()`; `property.isVerifiedByAuthority` -> Reverts with `PropertyNotVerified()`.
- **State Modifications (Checks-Effects-Interactions):**
  - Sets `request.executed = true`.
  - Updates `property.currentOwner = request.to`.
  - Updates `property.documentHash = request.newDocumentHash`.
  - Marks `registeredDocuments[request.newDocumentHash] = true`.
  - Appends `request.to` to `ownershipHistory[propertyId]`.
- **Emits:** `OwnershipTransferred(uint256 indexed propertyId, uint256 transferId, address indexed from, address indexed to)`

---

### 4.4 Dispute & Flagging Controls

#### `flagProperty`
```solidity
function flagProperty(uint256 _propertyId, string memory _reason) external onlyRole(ADMIN_ROLE)
```
- **Access:** Authority only (`ADMIN_ROLE`).
- **Parameters:**
  - `_propertyId`: ID of the target property.
  - `_reason`: Human-readable justification (emitted in event for immutable indexing).
- **Reverts:**
  - `PropertyDoesNotExist()`: If property does not exist.
  - `PropertyIsFrozen()`: If property is already frozen.
- **State Modifications:** Sets `property.isFrozen = true`.
- **Emits:** `PropertyFlagged(uint256 indexed propertyId, string reason)`

#### `unflagProperty`
```solidity
function unflagProperty(uint256 _propertyId) external onlyRole(ADMIN_ROLE)
```
- **Access:** Authority only (`ADMIN_ROLE`).
- **Parameters:**
  - `_propertyId`: ID of the target property.
- **Reverts:**
  - `PropertyDoesNotExist()`: If property does not exist.
  - `PropertyNotFrozen()`: If property is currently not frozen.
- **State Modifications:** Sets `property.isFrozen = false`.
- **Emits:** `PropertyUnflagged(uint256 indexed propertyId)`

---

### 4.5 Public Audit & Inspection Views

#### `getOwnershipHistory`
```solidity
function getOwnershipHistory(uint256 _propertyId) external view returns (address[] memory)
```
- **Access:** Public view.
- **Parameters:**
  - `_propertyId`: Target property ID.
- **Returns:** Chronological array of all owner addresses from genesis registration to current owner.
- **Reverts:** `PropertyDoesNotExist()` if ID is 0 or uninstantiated.

---

## 5. Event Indexing Reference

| Event Signature | Indexed Parameters | Unindexed Parameters | Emitted When |
|---|---|---|---|
| `PropertyRegistered(uint256,address)` | `uint256 indexed propertyId`, `address indexed owner` | None | Initial property registration |
| `PropertyVerified(uint256)` | `uint256 indexed propertyId` | None | Authority verifies initial deed |
| `TransferInitiated(uint256,uint256,address,address)` | `uint256 indexed transferId`, `uint256 indexed propertyId` | `address from`, `address to` | Owner creates transfer request |
| `TransferSigned(uint256,address)` | `uint256 indexed transferId`, `address indexed signer` | None | Buyer or seller submits EIP-712 sig |
| `TransferApproved(uint256)` | `uint256 indexed transferId` | None | Authority approves transfer |
| `OwnershipTransferred(uint256,uint256,address,address)` | `uint256 indexed propertyId`, `address indexed from`, `address indexed to` | `uint256 transferId` | Transfer execution completes |
| `PropertyFlagged(uint256,string)` | `uint256 indexed propertyId` | `string reason` | Property frozen due to dispute |
| `PropertyUnflagged(uint256)` | `uint256 indexed propertyId` | None | Property dispute resolved/unfrozen |

---

## 6. Custom Errors Reference

Custom errors eliminate string literals from contract bytecode, reducing deployment gas and operational execution gas:

| Error Selector | Custom Error | Trigger Condition |
|---|---|---|
| `0x4095438d` | `AlreadyVerified()` | Attempting to verify a property that is already marked verified. |
| `0x30c13ade` | `NotOwner()` | Caller is not the registered owner in `initiateTransfer`. |
| `0x7cf195b0` | `PropertyIsFrozen()` | Attempting to initiate or execute transfer on a flagged/frozen property. |
| `0x6e9f5ff9` | `DuplicateRegistration()` | Deed hash has already been registered or burned. |
| `0x8bfb5f85` | `PropertyDoesNotExist()` | Target `propertyId` has not been registered. |
| `0x8baa579f` | `InvalidSignature()` | Recovered signer does not match caller or signature is corrupted. |
| `0x2c5211e6` | `NonceAlreadyUsed()` | Signature nonce replay guard triggered. |
| `0x973a067e` | `InvalidTransferToSelf()` | Owner attempting to transfer property to their own address. |
| `0x3f1f72a6` | `TransferDoesNotExist()` | Target `transferId` does not exist. |
| `0xdfda0a08` | `AlreadySigned()` | Party has already signed the given transfer request. |
| `0x8be5cb15` | `NotAPartyToTransfer()` | Caller attempting to sign is neither the `from` nor `to` party. |
| `0x19a0a09e` | `AlreadyApproved()` | Authority attempting to approve an already approved transfer. |
| `0x39a1d4b6` | `AlreadyExecuted()` | Attempting to approve or re-execute an already executed transfer. |
| `0xa4881765` | `NotApproved()` | Attempting to execute transfer without prior authority approval. |
| `0xb87dca13` | `TransferNotReady()` | Attempting execution before both seller and buyer have signed. |
| `0xeef0824b` | `PropertyNotFrozen()` | Attempting to unflag a property that is not currently frozen. |
| `0x3fe19688` | `PropertyNotVerified()` | Attempting to transfer an unverified property. |

---

## 7. Security & Threat Modeling

1. **Reentrancy Protection:** `executeTransfer` implements the Checks-Effects-Interactions (CEI) pattern. `request.executed = true` is committed before mutating property ownership and history.
2. **Signature Replay Defense:** Monotonically incrementing nonces (`nonces[msg.sender]++`) combined with contract domain separator prevent cross-contract and intra-contract replay attacks.
3. **Double Selling Mitigation:** Multiple transfer requests can be initiated for a property; however, executing any single transfer immediately updates `property.currentOwner`, rendering competing requests unexecutable because subsequent checks require the sender to be the current owner.
4. **Adversarial Non-Repudiation:** Dual EIP-712 typed signing ensures that neither buyer nor seller can claim transaction spoofing by miners, nodes, or authorities.
