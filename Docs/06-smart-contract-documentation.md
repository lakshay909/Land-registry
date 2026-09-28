# Smart Contract Documentation — LandRegistry.sol

*This is a documentation template matching the architecture doc's design. Once the contract is written, function signatures/NatSpec comments (`/// @notice`, `/// @param`) should be pulled in here directly — NatSpec makes this nearly auto-generated.*

## Contract: `LandRegistry`
Inherits: OpenZeppelin `AccessControl`

### Roles
| Role | Description |
|---|---|
| `DEFAULT_ADMIN_ROLE` | Deployer; can grant/revoke other roles |
| `ADMIN_ROLE` | Government Authority — verifies registrations, approves transfers, flags properties |
| `REGISTRAR_ROLE` | (optional) delegated staff who can process registrations, cannot self-approve |

### State Variables
- `mapping(uint256 => Property) properties`
- `mapping(uint256 => TransferRequest) transfers`
- `uint256 nextPropertyId`
- `uint256 nextTransferId`
- `mapping(address => uint256) nonces` — replay protection for signatures

### Functions

| Function | Access | Description |
|---|---|---|
| `registerProperty(string locationHash, uint256 area, bytes32 documentHash)` | Any user | Creates a new pending property record, marking `documentHash` as used |
| `verifyRegistration(uint256 propertyId)` | `ADMIN_ROLE` | Marks a property as authority-verified (`isVerifiedByAuthority = true`) |
| `initiateTransfer(uint256 propertyId, address to, bytes32 newDocumentHash)` | Current owner | Creates a pending transfer request. Requires property to be verified and `newDocumentHash` to be unused. |
| `signTransfer(uint256 transferId, bytes signature)` | Owner or buyer | Verifies EIP-712 signature via `ECDSA.recover`, marks party as signed |
| `approveTransfer(uint256 transferId)` | `ADMIN_ROLE` | Marks authority approval |
| `executeTransfer(uint256 transferId)` | Anyone (guarded internally) | Requires both signatures + approval; updates owner, logs history, increments nonce, marks `newDocumentHash` as used, requires property still verified |
| `flagProperty(uint256 propertyId, string reason)` | `ADMIN_ROLE` | Freezes a property, blocking transfers |
| `unflagProperty(uint256 propertyId)` | `ADMIN_ROLE` | Unfreezes a property |
| `getOwnershipHistory(uint256 propertyId)` | View, public | Returns array of past owners/timestamps |

### Events
- `PropertyRegistered(uint256 propertyId, address owner)`
- `PropertyVerified(uint256 propertyId)`
- `TransferInitiated(uint256 transferId, uint256 propertyId, address from, address to)`
- `TransferSigned(uint256 transferId, address signer)`
- `TransferApproved(uint256 transferId)`
- `OwnershipTransferred(uint256 indexed propertyId, uint256 transferId, address indexed from, address indexed to)`
- `PropertyFlagged(uint256 indexed propertyId, string reason)`
- `PropertyUnflagged(uint256 propertyId)`

### Modifiers / Guards
- `onlyRole(ADMIN_ROLE)` — OpenZeppelin standard

### Custom Errors (gas-efficient reverts)
- `error AlreadyVerified()`
- `error NotOwner()`
- `error PropertyIsFrozen()`
- `error DuplicateRegistration()`
- `error PropertyDoesNotExist()`
- `error InvalidSignature()`
- `error NonceAlreadyUsed()`
- `error InvalidTransferToSelf()`
- `error TransferDoesNotExist()`
- `error AlreadySigned()`
- `error NotAPartyToTransfer()`
- `error AlreadyApproved()`
- `error AlreadyExecuted()`
- `error NotApproved()`
- `error TransferNotReady()`
- `error PropertyNotFrozen()`
- `error PropertyNotVerified()`

### Security Considerations
- Reentrancy: no external calls with value transfer in core flow, but `executeTransfer` strictly employs CEI pattern (`request.executed = true` before state updates).
- Signature replay: mitigated via per-address nonce included in the EIP-712 struct.
- Front-running: transfer execution requires explicit multi-party consent + authority approval, limiting unilateral manipulation.
- Document integrity: Document hashes are strictly tracked globally across the registry. Every transfer requires a brand new, unused document hash.
- Concurrent Transfers: A single property can have multiple concurrent, unexecuted transfer requests. The first one to successfully execute implicitly invalidates the others.
