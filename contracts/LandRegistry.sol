// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

/**
 * @title LandRegistry
 * @notice A smart contract for tracking land ownership, transfers, and verifications
 */
contract LandRegistry is AccessControl, EIP712 {
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    
    // Reserved for future scope: delegated staff who can process registrations, cannot self-approve
    bytes32 public constant REGISTRAR_ROLE = keccak256("REGISTRAR_ROLE");
    
    bytes32 public constant TRANSFER_TYPEHASH = keccak256("Transfer(uint256 propertyId,bytes32 documentHash,string action,uint256 nonce)");

    struct Property {
        uint256 id;
        string locationHash;
        uint256 area;
        address currentOwner;
        bytes32 documentHash;
        bool isVerifiedByAuthority;
        bool isFrozen;
        uint256 registeredAt;
    }

    struct TransferRequest {
        uint256 propertyId;
        address from;
        address to;
        bytes32 newDocumentHash;
        bool fromSigned;
        bool toSigned;
        bool authorityApproved;
        bool executed;
    }

    mapping(uint256 => Property) public properties;
    uint256 public nextPropertyId = 1;

    mapping(uint256 => TransferRequest) public transfers;
    uint256 public nextTransferId = 1;

    mapping(address => uint256) public nonces;
    mapping(bytes32 => bool) public registeredDocuments;

    // Explicit deliberate choice: on-chain array for ownership history
    mapping(uint256 => address[]) public ownershipHistory;

    event PropertyRegistered(uint256 indexed propertyId, address indexed owner);
    event PropertyVerified(uint256 indexed propertyId);
    event TransferInitiated(uint256 indexed transferId, uint256 indexed propertyId, address from, address to);
    event TransferSigned(uint256 indexed transferId, address indexed signer);
    event TransferApproved(uint256 indexed transferId);
    event OwnershipTransferred(uint256 indexed propertyId, uint256 transferId, address indexed from, address indexed to);
    event PropertyFlagged(uint256 indexed propertyId, string reason);
    event PropertyUnflagged(uint256 indexed propertyId);

    error AlreadyVerified();
    error NotOwner();
    error PropertyIsFrozen();
    error DuplicateRegistration();
    error PropertyDoesNotExist();
    error InvalidSignature();
    error NonceAlreadyUsed();
    error InvalidTransferToSelf();
    error TransferDoesNotExist();
    error AlreadySigned();
    error NotAPartyToTransfer();
    
    // Step 5 specific errors
    error AlreadyApproved();
    error AlreadyExecuted();
    error NotApproved();
    error TransferNotReady();
    
    // Step 6 & Verification specific errors
    error PropertyNotFrozen();
    error PropertyNotVerified();

    constructor() EIP712("LandRegistry", "1") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
    }

    /**
     * @notice Registers a new property in the system
     * @param _locationHash Hash of the physical location boundaries
     * @param _area Area of the property in square meters
     * @param _documentHash Hash of the physical deed document
     */
    function registerProperty(string memory _locationHash, uint256 _area, bytes32 _documentHash) external {
        if (registeredDocuments[_documentHash]) {
            revert DuplicateRegistration();
        }

        uint256 propertyId = nextPropertyId;
        
        properties[propertyId] = Property({
            id: propertyId,
            locationHash: _locationHash,
            area: _area,
            currentOwner: msg.sender,
            documentHash: _documentHash,
            isVerifiedByAuthority: false,
            isFrozen: false,
            registeredAt: block.timestamp
        });

        registeredDocuments[_documentHash] = true;
        ownershipHistory[propertyId].push(msg.sender); // Initialize history
        nextPropertyId++;

        emit PropertyRegistered(propertyId, msg.sender);
    }

    /**
     * @notice Verifies a property registration by the authority
     * @param _propertyId The ID of the property to verify
     */
    function verifyRegistration(uint256 _propertyId) external onlyRole(ADMIN_ROLE) {
        Property storage property = properties[_propertyId];
        if (property.id == 0) revert PropertyDoesNotExist();
        if (property.isVerifiedByAuthority) revert AlreadyVerified();

        property.isVerifiedByAuthority = true;
        emit PropertyVerified(_propertyId);
    }

    /**
     * @notice Initiates a transfer request to a new owner
     * @param _propertyId The ID of the property to transfer
     * @param _to The address of the new owner
     * @param _newDocumentHash Hash of the new deed document
     */
    function initiateTransfer(uint256 _propertyId, address _to, bytes32 _newDocumentHash) external {
        Property storage property = properties[_propertyId];
        if (property.id == 0) revert PropertyDoesNotExist();
        if (!property.isVerifiedByAuthority) revert PropertyNotVerified();
        if (property.currentOwner != msg.sender) revert NotOwner();
        if (property.isFrozen) revert PropertyIsFrozen();
        if (_to == msg.sender) revert InvalidTransferToSelf();
        if (registeredDocuments[_newDocumentHash]) revert DuplicateRegistration();

        uint256 transferId = nextTransferId;
        
        transfers[transferId] = TransferRequest({
            propertyId: _propertyId,
            from: msg.sender,
            to: _to,
            newDocumentHash: _newDocumentHash,
            fromSigned: false,
            toSigned: false,
            authorityApproved: false,
            executed: false
        });

        nextTransferId++;

        emit TransferInitiated(transferId, _propertyId, msg.sender, _to);
    }

    /**
     * @notice Submits an EIP-712 signature for a transfer request
     * @param _transferId The ID of the transfer request
     * @param _signature The generated signature
     */
    function signTransfer(uint256 _transferId, bytes calldata _signature) external {
        TransferRequest storage request = transfers[_transferId];
        if (request.propertyId == 0) revert TransferDoesNotExist();
        
        bytes32 structHash = keccak256(abi.encode(
            TRANSFER_TYPEHASH,
            request.propertyId,
            request.newDocumentHash,
            keccak256(bytes("TRANSFER")),
            nonces[msg.sender]
        ));

        bytes32 hash = _hashTypedDataV4(structHash);
        address signer = ECDSA.recover(hash, _signature);

        if (signer != msg.sender) revert InvalidSignature();

        if (msg.sender == request.from) {
            if (request.fromSigned) revert AlreadySigned();
            request.fromSigned = true;
        } else if (msg.sender == request.to) {
            if (request.toSigned) revert AlreadySigned();
            request.toSigned = true;
        } else {
            revert NotAPartyToTransfer();
        }

        nonces[msg.sender]++;
        emit TransferSigned(_transferId, msg.sender);
    }

    /**
     * @notice Approves a pending transfer (Authority Only)
     * @param _transferId The ID of the transfer request
     */
    function approveTransfer(uint256 _transferId) external onlyRole(ADMIN_ROLE) {
        TransferRequest storage request = transfers[_transferId];
        if (request.propertyId == 0) revert TransferDoesNotExist();
        if (request.executed) revert AlreadyExecuted();
        if (request.authorityApproved) revert AlreadyApproved();

        request.authorityApproved = true;
        emit TransferApproved(_transferId);
    }

    /**
     * @notice Executes a transfer after all approvals and signatures are met
     * @param _transferId The ID of the transfer request
     */
    function executeTransfer(uint256 _transferId) external {
        TransferRequest storage request = transfers[_transferId];
        if (request.propertyId == 0) revert TransferDoesNotExist();
        
        // 1. All four gates checked before state changes
        if (!request.fromSigned || !request.toSigned) revert TransferNotReady();
        if (!request.authorityApproved) revert NotApproved();
        if (request.executed) revert AlreadyExecuted();

        Property storage property = properties[request.propertyId];
        if (property.isFrozen) revert PropertyIsFrozen(); // Catch FT-6 frozen property
        if (!property.isVerifiedByAuthority) revert PropertyNotVerified();

        // 2. CEI pattern: state flipped to true before external interactions
        request.executed = true;

        // 3. State update
        property.currentOwner = request.to;
        property.documentHash = request.newDocumentHash;
        registeredDocuments[request.newDocumentHash] = true;

        // 4. Update on-chain array for ownership history
        ownershipHistory[request.propertyId].push(request.to);

        emit OwnershipTransferred(request.propertyId, _transferId, request.from, request.to);
    }

    /**
     * @notice Freezes a property, blocking transfers
     * @param _propertyId The ID of the property to flag
     * @param _reason The reason for flagging the property
     */
    function flagProperty(uint256 _propertyId, string memory _reason) external onlyRole(ADMIN_ROLE) {
        if (properties[_propertyId].id == 0) revert PropertyDoesNotExist();
        if (properties[_propertyId].isFrozen) revert PropertyIsFrozen();
        properties[_propertyId].isFrozen = true;
        emit PropertyFlagged(_propertyId, _reason);
    }

    /**
     * @notice Unfreezes a property
     * @param _propertyId The ID of the property to unflag
     */
    function unflagProperty(uint256 _propertyId) external onlyRole(ADMIN_ROLE) {
        if (properties[_propertyId].id == 0) revert PropertyDoesNotExist();
        if (!properties[_propertyId].isFrozen) revert PropertyNotFrozen();
        properties[_propertyId].isFrozen = false;
        emit PropertyUnflagged(_propertyId);
    }

    /**
     * @notice Returns the full ownership history of a property
     * @param _propertyId The ID of the property
     * @return An array of addresses representing the historical owners
     */
    function getOwnershipHistory(uint256 _propertyId) external view returns (address[] memory) {
        if (properties[_propertyId].id == 0) revert PropertyDoesNotExist();
        return ownershipHistory[_propertyId];
    }
}
