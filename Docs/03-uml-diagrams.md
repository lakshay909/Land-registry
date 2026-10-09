# UML System Diagrams

These diagrams specify the system architecture, component interactions, and execution workflows using Mermaid syntax.

---

## 1. Use Case Diagram

```mermaid
graph TD
    Owner(["Property Owner (Citizen)"])
    Buyer(["Buyer (Citizen)"])
    Authority(["Government Land Authority (ADMIN_ROLE)"])
    Auditor(["Public Auditor / Citizen"])

    subgraph "Land Registry Platform"
        UC1["Register Property (Area, Location, Deed Hash)"]
        UC2["Initiate Transfer (Buyer Address, New Deed Hash)"]
        UC3["Sign EIP-712 Transfer Authorization"]
        UC4["Verify Initial Property Registration"]
        UC5["Approve Conveyance Request"]
        UC6["Execute Authorized Transfer"]
        UC7["Flag / Freeze Disputed Property"]
        UC8["Unflag / Unfreeze Resolved Property"]
        UC9["Inspect On-Chain Ownership History"]
        UC10["Verify Document Hash & Download Deed"]
    end

    Owner --> UC1
    Owner --> UC2
    Owner --> UC3
    Buyer --> UC3
    
    Authority --> UC4
    Authority --> UC5
    Authority --> UC6
    Authority --> UC7
    Authority --> UC8
    
    Buyer --> UC6
    Owner --> UC6
    
    Auditor --> UC9
    Auditor --> UC10
```

---

## 2. Sequence Diagram — 4-Gate Ownership Transfer Flow

```mermaid
sequenceDiagram
    autonumber
    actor Seller as Seller (Current Owner)
    actor Buyer as Buyer
    actor Authority as Government Authority
    participant Frontend as Web3 Frontend (React)
    participant Contract as LandRegistry.sol
    participant Indexer as Node Indexer & SQLite
    
    Note over Seller,Buyer: Pre-condition: Property is registered & verified by Authority
    
    Seller->>Frontend: Select property, enter Buyer address & upload new deed
    Frontend->>Frontend: Compute keccak256 hash of new deed PDF
    Frontend->>Contract: initiateTransfer(propertyId, buyerAddress, newDocumentHash)
    Contract->>Contract: Validate ownership, verification status, frozen check
    Contract-->>Frontend: Emit TransferInitiated(transferId, propertyId, seller, buyer)
    Indexer-->>Contract: Intercept TransferInitiated & insert into TRANSFERS table
    
    Note over Seller,Buyer: EIP-712 Multi-Party Cryptographic Signatures
    
    Seller->>Frontend: Request EIP-712 Signature
    Frontend->>Seller: MetaMask prompt (Transfer: propertyId, documentHash, nonce)
    Seller-->>Frontend: Return 65-byte ECDSA signature
    Frontend->>Contract: signTransfer(transferId, sellerSignature)
    Contract->>Contract: ECDSA.recover, increment seller nonce, set fromSigned = true
    Contract-->>Frontend: Emit TransferSigned(transferId, seller)
    
    Buyer->>Frontend: Review conveyance terms & new deed hash
    Frontend->>Buyer: MetaMask prompt (Transfer: propertyId, documentHash, nonce)
    Buyer-->>Frontend: Return 65-byte ECDSA signature
    Frontend->>Contract: signTransfer(transferId, buyerSignature)
    Contract->>Contract: ECDSA.recover, increment buyer nonce, set toSigned = true
    Contract-->>Frontend: Emit TransferSigned(transferId, buyer)
    
    Note over Authority,Contract: Administrative Verification Gate
    
    Authority->>Contract: approveTransfer(transferId) [onlyRole ADMIN_ROLE]
    Contract->>Contract: Validate transfer exists & not yet approved
    Contract-->>Frontend: Emit TransferApproved(transferId)
    
    Note over Seller,Buyer: Final Execution Gate (CEI Pattern)
    
    Buyer->>Contract: executeTransfer(transferId)
    Contract->>Contract: Gate 1: fromSigned == true AND toSigned == true
    Contract->>Contract: Gate 2: authorityApproved == true
    Contract->>Contract: Gate 3: executed == false
    Contract->>Contract: Gate 4: !isFrozen AND isVerifiedByAuthority
    Contract->>Contract: Set executed = true
    Contract->>Contract: Mutate currentOwner = buyer, documentHash = newDocHash
    Contract->>Contract: ownershipHistory[propertyId].push(buyer)
    Contract-->>Frontend: Emit OwnershipTransferred(propertyId, transferId, seller, buyer)
    Indexer-->>Contract: Intercept event & update PROPERTIES, TRANSFERS, AUDIT_EVENTS
```

---

## 3. Class Diagram (Smart Contract & Storage Model)

```mermaid
classDiagram
    class AccessControl {
        +hasRole(bytes32 role, address account) bool
        +_grantRole(bytes32 role, address account)
    }

    class EIP712 {
        +_hashTypedDataV4(bytes32 structHash) bytes32
    }

    class LandRegistry {
        +bytes32 ADMIN_ROLE
        +bytes32 REGISTRAR_ROLE
        +bytes32 TRANSFER_TYPEHASH
        +uint256 nextPropertyId
        +uint256 nextTransferId
        +mapping(uint256 => Property) properties
        +mapping(uint256 => TransferRequest) transfers
        +mapping(address => uint256) nonces
        +mapping(bytes32 => bool) registeredDocuments
        +mapping(uint256 => address[]) ownershipHistory
        +registerProperty(string _locationHash, uint256 _area, bytes32 _documentHash)
        +verifyRegistration(uint256 _propertyId)
        +initiateTransfer(uint256 _propertyId, address _to, bytes32 _newDocumentHash)
        +signTransfer(uint256 _transferId, bytes _signature)
        +approveTransfer(uint256 _transferId)
        +executeTransfer(uint256 _transferId)
        +flagProperty(uint256 _propertyId, string _reason)
        +unflagProperty(uint256 _propertyId)
        +getOwnershipHistory(uint256 _propertyId) address[]
    }

    class Property {
        +uint256 id
        +string locationHash
        +uint256 area
        +address currentOwner
        +bytes32 documentHash
        +bool isVerifiedByAuthority
        +bool isFrozen
        +uint256 registeredAt
    }

    class TransferRequest {
        +uint256 propertyId
        +address from
        +address to
        +bytes32 newDocumentHash
        +bool fromSigned
        +bool toSigned
        +bool authorityApproved
        +bool executed
    }

    LandRegistry --|> AccessControl
    LandRegistry --|> EIP712
    LandRegistry *-- Property
    LandRegistry *-- TransferRequest
```

---

## 4. Activity Diagram — `executeTransfer` Multi-Gate Validation

```mermaid
flowchart TD
    Start([Caller triggers executeTransfer transferId]) --> CheckExists{Transfer exists?}
    CheckExists -- No --> Rev1[Revert: TransferDoesNotExist]
    CheckExists -- Yes --> CheckSigs{fromSigned AND toSigned?}
    CheckSigs -- No --> Rev2[Revert: TransferNotReady]
    CheckSigs -- Yes --> CheckApprove{authorityApproved == true?}
    CheckApprove -- No --> Rev3[Revert: NotApproved]
    CheckApprove -- Yes --> CheckExec{executed == true?}
    CheckExec -- Yes --> Rev4[Revert: AlreadyExecuted]
    CheckExec -- No --> CheckFrozen{property.isFrozen == true?}
    CheckFrozen -- Yes --> Rev5[Revert: PropertyIsFrozen]
    CheckFrozen -- No --> CheckVerified{isVerifiedByAuthority == true?}
    CheckVerified -- No --> Rev6[Revert: PropertyNotVerified]
    CheckVerified -- Yes --> CEI[CEI Step 1: Set request.executed = true]
    CEI --> UpdateOwner[Step 2: Update property.currentOwner = request.to]
    UpdateOwner --> UpdateDoc[Step 3: Update property.documentHash & burn new hash]
    UpdateDoc --> AppendHist[Step 4: Append request.to to ownershipHistory array]
    AppendHist --> EmitEvt[Step 5: Emit OwnershipTransferred event]
    EmitEvt --> Done([Conveyance Successfully Executed])
```
