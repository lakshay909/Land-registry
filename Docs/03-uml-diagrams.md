# UML Diagrams

These are written in Mermaid syntax. They render automatically on GitHub, GitLab, Obsidian, and most Markdown viewers/VS Code extensions. Your doc partner can also paste each block into the Mermaid Live Editor (mermaid.live) to export as PNG/SVG for the final report.

## 1. Use Case Diagram

```mermaid
graph TD
    Owner((Property Owner))
    Buyer((Buyer))
    Authority((Government Authority))
    Auditor((Public Auditor))

    Owner --> UC1[Register Property]
    Owner --> UC2[Initiate Transfer]
    Owner --> UC3[Sign Transfer]
    Buyer --> UC3
    Authority --> UC4[Verify Registration]
    Authority --> UC5[Approve Transfer]
    Authority --> UC6[Flag/Freeze Property]
    Authority --> UC7[View Audit Dashboard]
    Auditor --> UC8[View Ownership History]
```

## 2. Sequence Diagram — Ownership Transfer Flow

```mermaid
sequenceDiagram
    participant O as Owner
    participant B as Buyer
    participant C as Smart Contract
    participant A as Authority

    O->>C: initiateTransfer(propertyId, buyer, newDocHash)
    C-->>O: TransferInitiated event
    O->>C: signTransfer(transferId, signature_O)
    C->>C: verify signature via ECDSA.recover
    B->>C: signTransfer(transferId, signature_B)
    C->>C: verify signature via ECDSA.recover
    A->>C: approveTransfer(transferId)
    C->>C: check both signed + approved
    C->>C: executeTransfer() -> update owner, log history
    C-->>O: OwnershipTransferred event
    C-->>B: OwnershipTransferred event
    C-->>A: OwnershipTransferred event
```

## 3. Class Diagram (maps to Solidity contract structure)

```mermaid
classDiagram
    class LandRegistry {
        +registerProperty(location, area, docHash)
        +verifyRegistration(propertyId)
        +initiateTransfer(propertyId, to, newDocHash)
        +signTransfer(transferId, signature)
        +approveTransfer(transferId)
        +executeTransfer(transferId)
        +flagProperty(propertyId, reason)
        +getOwnershipHistory(propertyId)
    }
    class Property {
        uint256 id
        string locationHash
        uint256 area
        address currentOwner
        bytes32 documentHash
        bool isVerifiedByAuthority
        bool isFrozen
        uint256 registeredAt
    }
    class TransferRequest {
        uint256 propertyId
        address from
        address to
        bytes32 newDocumentHash
        bool fromSigned
        bool toSigned
        bool authorityApproved
        bool executed
    }
    class AccessControl {
        ADMIN_ROLE
        REGISTRAR_ROLE
    }
    LandRegistry --> Property
    LandRegistry --> TransferRequest
    LandRegistry --|> AccessControl
```

## 4. Activity Diagram — Fraud Check Logic (during transfer execution)

```mermaid
flowchart TD
    Start([Transfer Execution Requested]) --> Q1{Property frozen?}
    Q1 -- Yes --> Reject1[Revert: Property is disputed]
    Q1 -- No --> Q2{Caller is registered owner?}
    Q2 -- No --> Reject2[Revert: Unauthorized]
    Q2 -- Yes --> Q3{Both signatures recovered match from/to?}
    Q3 -- No --> Reject3[Revert: Invalid signature]
    Q3 -- Yes --> Q4{Nonce already used?}
    Q4 -- Yes --> Reject4[Revert: Replay detected]
    Q4 -- No --> Q5{Authority approved?}
    Q5 -- No --> Reject5[Revert: Not approved]
    Q5 -- Yes --> Execute[Execute transfer, update owner, log event]
    Execute --> End([Done])
```
