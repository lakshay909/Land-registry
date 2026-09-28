const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("LandRegistry - Transfers", function () {
  let LandRegistry, landRegistry;
  let owner, addr1, addr2, addr3, authority;
  let propertyId = 1;
  const newDocumentHash = ethers.id("new-doc-hash");

  beforeEach(async function () {
    [owner, authority, addr1, addr2, addr3] = await ethers.getSigners();
    LandRegistry = await ethers.getContractFactory("LandRegistry");
    landRegistry = await LandRegistry.deploy();

    const ADMIN_ROLE = await landRegistry.ADMIN_ROLE();
    await landRegistry.grantRole(ADMIN_ROLE, authority.address);

    // Register and verify a property for addr1
    await landRegistry.connect(addr1).registerProperty("hash123", 1000, ethers.id("doc1"));
    await landRegistry.connect(authority).verifyRegistration(1);
  });

  describe("TC-3: Owner initiates transfer", function () {
    it("Should create TransferRequest with executed = false", async function () {
      await expect(landRegistry.connect(addr1).initiateTransfer(propertyId, addr2.address, newDocumentHash))
        .to.emit(landRegistry, "TransferInitiated")
        .withArgs(1, propertyId, addr1.address, addr2.address);

      const request = await landRegistry.transfers(1);
      expect(request.propertyId).to.equal(propertyId);
      expect(request.from).to.equal(addr1.address);
      expect(request.to).to.equal(addr2.address);
      expect(request.newDocumentHash).to.equal(newDocumentHash);
      expect(request.executed).to.be.false;
      expect(request.fromSigned).to.be.false;
      expect(request.toSigned).to.be.false;
    });
  });

  describe("TC-4 & TC-5: Sign transfer", function () {
    let domain, types;

    beforeEach(async function () {
      await landRegistry.connect(addr1).initiateTransfer(propertyId, addr2.address, newDocumentHash);
      const network = await ethers.provider.getNetwork();
      const contractAddress = await landRegistry.getAddress();

      domain = {
        name: "LandRegistry",
        version: "1",
        chainId: network.chainId,
        verifyingContract: contractAddress
      };

      types = {
        Transfer: [
          { name: "propertyId", type: "uint256" },
          { name: "documentHash", type: "bytes32" },
          { name: "action", type: "string" },
          { name: "nonce", type: "uint256" }
        ]
      };
    });

    it("TC-4: Owner signs transfer", async function () {
      const nonce = await landRegistry.nonces(addr1.address);
      const message = {
        propertyId: propertyId,
        documentHash: newDocumentHash,
        action: "TRANSFER",
        nonce: nonce
      };

      const signature = await addr1.signTypedData(domain, types, message);

      await expect(landRegistry.connect(addr1).signTransfer(1, signature))
        .to.emit(landRegistry, "TransferSigned")
        .withArgs(1, addr1.address);

      const request = await landRegistry.transfers(1);
      expect(request.fromSigned).to.be.true;
    });

    it("TC-5: Buyer signs transfer", async function () {
      const nonce = await landRegistry.nonces(addr2.address);
      const message = {
        propertyId: propertyId,
        documentHash: newDocumentHash,
        action: "TRANSFER",
        nonce: nonce
      };

      const signature = await addr2.signTypedData(domain, types, message);

      await expect(landRegistry.connect(addr2).signTransfer(1, signature))
        .to.emit(landRegistry, "TransferSigned")
        .withArgs(1, addr2.address);

      const request = await landRegistry.transfers(1);
      expect(request.toSigned).to.be.true;
    });

    it("FT-3: Forged signature", async function () {
      const nonce = await landRegistry.nonces(addr1.address);
      const message = {
        propertyId: propertyId,
        documentHash: newDocumentHash,
        action: "TRANSFER",
        nonce: nonce
      };

      const signature = await addr2.signTypedData(domain, types, message);

      await expect(landRegistry.connect(addr1).signTransfer(1, signature))
        .to.be.revertedWithCustomError(landRegistry, "InvalidSignature");
    });

    it("FT-4: Replay attack", async function () {
      const nonce = await landRegistry.nonces(addr1.address);
      const message = {
        propertyId: propertyId,
        documentHash: newDocumentHash,
        action: "TRANSFER",
        nonce: nonce
      };

      const signature = await addr1.signTypedData(domain, types, message);
      await landRegistry.connect(addr1).signTransfer(1, signature);

      // Reusing the same signature should fail
      await expect(landRegistry.connect(addr1).signTransfer(1, signature))
        .to.be.revertedWithCustomError(landRegistry, "InvalidSignature");
    });
  });

  describe("FT-2: Non-owner calls initiateTransfer", function () {
    it("Should revert with NotOwner", async function () {
      await expect(landRegistry.connect(addr2).initiateTransfer(1, addr2.address, newDocumentHash))
        .to.be.revertedWithCustomError(landRegistry, "NotOwner");
    });
  });

  describe("Step 5: Execute Transfer (TC-6, TC-7, FT-5, FT-6)", function () {
    let domain, types;

    beforeEach(async function () {
      await landRegistry.connect(addr1).initiateTransfer(propertyId, addr2.address, newDocumentHash);
      const network = await ethers.provider.getNetwork();
      domain = { name: "LandRegistry", version: "1", chainId: network.chainId, verifyingContract: await landRegistry.getAddress() };
      types = { Transfer: [{ name: "propertyId", type: "uint256" }, { name: "documentHash", type: "bytes32" }, { name: "action", type: "string" }, { name: "nonce", type: "uint256" }] };
    });

    it("TC-6: Authority approves transfer", async function () {
      await expect(landRegistry.connect(authority).approveTransfer(1))
        .to.emit(landRegistry, "TransferApproved")
        .withArgs(1);
      const request = await landRegistry.transfers(1);
      expect(request.authorityApproved).to.be.true;
    });

    it("TC-7: Execute transfer after approvals", async function () {
      // Sign by both
      const nonceFrom = await landRegistry.nonces(addr1.address);
      await landRegistry.connect(addr1).signTransfer(1, await addr1.signTypedData(domain, types, { propertyId, documentHash: newDocumentHash, action: "TRANSFER", nonce: nonceFrom }));
      const nonceTo = await landRegistry.nonces(addr2.address);
      await landRegistry.connect(addr2).signTransfer(1, await addr2.signTypedData(domain, types, { propertyId, documentHash: newDocumentHash, action: "TRANSFER", nonce: nonceTo }));

      // Approve
      await landRegistry.connect(authority).approveTransfer(1);

      // Execute
      await expect(landRegistry.connect(addr1).executeTransfer(1))
        .to.emit(landRegistry, "OwnershipTransferred")
        .withArgs(1, 1, addr1.address, addr2.address);

      const request = await landRegistry.transfers(1);
      expect(request.executed).to.be.true;

      const prop = await landRegistry.properties(1);
      expect(prop.currentOwner).to.equal(addr2.address);
      expect(prop.documentHash).to.equal(newDocumentHash);

      const owner0 = await landRegistry.ownershipHistory(1, 0);
      const owner1 = await landRegistry.ownershipHistory(1, 1);
      expect(owner0).to.equal(addr1.address);
      expect(owner1).to.equal(addr2.address);
    });

    it("FT-5: Execute transfer without approval", async function () {
      const nonceFrom = await landRegistry.nonces(addr1.address);
      await landRegistry.connect(addr1).signTransfer(1, await addr1.signTypedData(domain, types, { propertyId, documentHash: newDocumentHash, action: "TRANSFER", nonce: nonceFrom }));
      const nonceTo = await landRegistry.nonces(addr2.address);
      await landRegistry.connect(addr2).signTransfer(1, await addr2.signTypedData(domain, types, { propertyId, documentHash: newDocumentHash, action: "TRANSFER", nonce: nonceTo }));

      await expect(landRegistry.connect(addr1).executeTransfer(1))
        .to.be.revertedWithCustomError(landRegistry, "NotApproved");
    });

    it("FT-6: Execute transfer on frozen property", async function () {
      const nonceFrom = await landRegistry.nonces(addr1.address);
      await landRegistry.connect(addr1).signTransfer(1, await addr1.signTypedData(domain, types, { propertyId, documentHash: newDocumentHash, action: "TRANSFER", nonce: nonceFrom }));
      const nonceTo = await landRegistry.nonces(addr2.address);
      await landRegistry.connect(addr2).signTransfer(1, await addr2.signTypedData(domain, types, { propertyId, documentHash: newDocumentHash, action: "TRANSFER", nonce: nonceTo }));
      
      await landRegistry.connect(authority).approveTransfer(1);
      
      // Freeze property via flagProperty
      await landRegistry.connect(authority).flagProperty(1, "Disputed");

      await expect(landRegistry.connect(addr1).executeTransfer(1))
        .to.be.revertedWithCustomError(landRegistry, "PropertyIsFrozen");
    });

    it("Step 6: Unflagging should restore normal transfer capability", async function () {
      const nonceFrom = await landRegistry.nonces(addr1.address);
      await landRegistry.connect(addr1).signTransfer(1, await addr1.signTypedData(domain, types, { propertyId, documentHash: newDocumentHash, action: "TRANSFER", nonce: nonceFrom }));
      const nonceTo = await landRegistry.nonces(addr2.address);
      await landRegistry.connect(addr2).signTransfer(1, await addr2.signTypedData(domain, types, { propertyId, documentHash: newDocumentHash, action: "TRANSFER", nonce: nonceTo }));
      
      await landRegistry.connect(authority).approveTransfer(1);
      
      // Freeze property
      await landRegistry.connect(authority).flagProperty(1, "Investigating");

      // Attempt to execute should fail
      await expect(landRegistry.connect(addr1).executeTransfer(1))
        .to.be.revertedWithCustomError(landRegistry, "PropertyIsFrozen");

      // Unfreeze
      await landRegistry.connect(authority).unflagProperty(1);

      // Attempt to execute should succeed
      await expect(landRegistry.connect(addr2).executeTransfer(1))
        .to.emit(landRegistry, "OwnershipTransferred")
        .withArgs(1, 1, addr1.address, addr2.address);
    });
  });

  describe("Missing Coverage (Real Fraud/Error Scenarios)", function () {
    let domain, types;

    beforeEach(async function () {
      const network = await ethers.provider.getNetwork();
      domain = { name: "LandRegistry", version: "1", chainId: network.chainId, verifyingContract: await landRegistry.getAddress() };
      types = { Transfer: [{ name: "propertyId", type: "uint256" }, { name: "documentHash", type: "bytes32" }, { name: "action", type: "string" }, { name: "nonce", type: "uint256" }] };
    });

    it("FT-7: Self-dealing (initiateTransfer to self)", async function () {
      await expect(landRegistry.connect(addr1).initiateTransfer(1, addr1.address, newDocumentHash))
        .to.be.revertedWithCustomError(landRegistry, "InvalidTransferToSelf");
    });

    it("FT-8: Third-party signature (NotAPartyToTransfer - Line 165)", async function () {
      await landRegistry.connect(addr1).initiateTransfer(1, addr2.address, newDocumentHash);
      const nonce = await landRegistry.nonces(addr3.address);
      const sig = await addr3.signTypedData(domain, types, { propertyId: 1, documentHash: newDocumentHash, action: "TRANSFER", nonce });
      
      // addr3 legitimately signs the request, but isn't the buyer or seller
      await expect(landRegistry.connect(addr3).signTransfer(1, sig))
        .to.be.revertedWithCustomError(landRegistry, "NotAPartyToTransfer");
    });

    it("FT-9: Double signing (AlreadySigned)", async function () {
      await landRegistry.connect(addr1).initiateTransfer(1, addr2.address, newDocumentHash);
      
      const nonce1 = await landRegistry.nonces(addr1.address);
      const sig1 = await addr1.signTypedData(domain, types, { propertyId: 1, documentHash: newDocumentHash, action: "TRANSFER", nonce: nonce1 });
      await landRegistry.connect(addr1).signTransfer(1, sig1);
      
      const nonce2 = await landRegistry.nonces(addr1.address);
      const sig2 = await addr1.signTypedData(domain, types, { propertyId: 1, documentHash: newDocumentHash, action: "TRANSFER", nonce: nonce2 });
      
      await expect(landRegistry.connect(addr1).signTransfer(1, sig2))
        .to.be.revertedWithCustomError(landRegistry, "AlreadySigned");
    });

    it("FT-10: Premature execution (TransferNotReady)", async function () {
      await landRegistry.connect(addr1).initiateTransfer(1, addr2.address, newDocumentHash);
      
      const nonce = await landRegistry.nonces(addr1.address);
      const sig = await addr1.signTypedData(domain, types, { propertyId: 1, documentHash: newDocumentHash, action: "TRANSFER", nonce });
      await landRegistry.connect(addr1).signTransfer(1, sig);
      
      // Attempting to execute with only 1 signature and no authority approval
      await expect(landRegistry.connect(addr1).executeTransfer(1))
        .to.be.revertedWithCustomError(landRegistry, "TransferNotReady");
    });

    it("FT-11: Double execution (AlreadyExecuted)", async function () {
      await landRegistry.connect(addr1).initiateTransfer(1, addr2.address, newDocumentHash);
      
      const nonce1 = await landRegistry.nonces(addr1.address);
      const sig1 = await addr1.signTypedData(domain, types, { propertyId: 1, documentHash: newDocumentHash, action: "TRANSFER", nonce: nonce1 });
      await landRegistry.connect(addr1).signTransfer(1, sig1);
      
      const nonce2 = await landRegistry.nonces(addr2.address);
      const sig2 = await addr2.signTypedData(domain, types, { propertyId: 1, documentHash: newDocumentHash, action: "TRANSFER", nonce: nonce2 });
      await landRegistry.connect(addr2).signTransfer(1, sig2);
      
      await landRegistry.connect(authority).approveTransfer(1);
      await landRegistry.connect(addr1).executeTransfer(1); // First success
      
      // Second attempt to execute the exact same transfer
      await expect(landRegistry.connect(addr1).executeTransfer(1))
        .to.be.revertedWithCustomError(landRegistry, "AlreadyExecuted");
    });

    it("FT-12: Initiate transfer on frozen property", async function () {
      await landRegistry.connect(authority).flagProperty(1, "Investigating");
      
      await expect(landRegistry.connect(addr1).initiateTransfer(1, addr2.address, newDocumentHash))
        .to.be.revertedWithCustomError(landRegistry, "PropertyIsFrozen");
        
      await landRegistry.connect(authority).unflagProperty(1); // Cleanup
    });
  });

  describe("Missing Coverage (Invalid IDs & Remaining Branches)", function () {
    let domain, types;

    beforeEach(async function () {
      const network = await ethers.provider.getNetwork();
      domain = { name: "LandRegistry", version: "1", chainId: network.chainId, verifyingContract: await landRegistry.getAddress() };
      types = { Transfer: [{ name: "propertyId", type: "uint256" }, { name: "documentHash", type: "bytes32" }, { name: "action", type: "string" }, { name: "nonce", type: "uint256" }] };
    });

    it("initiateTransfer: PropertyDoesNotExist", async function () {
      await expect(landRegistry.connect(addr1).initiateTransfer(999, addr2.address, newDocumentHash))
        .to.be.revertedWithCustomError(landRegistry, "PropertyDoesNotExist");
    });

    it("signTransfer: TransferDoesNotExist", async function () {
      await expect(landRegistry.connect(addr1).signTransfer(999, "0x00"))
        .to.be.revertedWithCustomError(landRegistry, "TransferDoesNotExist");
    });

    it("approveTransfer: TransferDoesNotExist", async function () {
      await expect(landRegistry.connect(authority).approveTransfer(999))
        .to.be.revertedWithCustomError(landRegistry, "TransferDoesNotExist");
    });

    it("executeTransfer: TransferDoesNotExist", async function () {
      await expect(landRegistry.connect(addr1).executeTransfer(999))
        .to.be.revertedWithCustomError(landRegistry, "TransferDoesNotExist");
    });

    it("signTransfer: Buyer double signing (AlreadySigned)", async function () {
      await landRegistry.connect(addr1).initiateTransfer(1, addr2.address, newDocumentHash);
      const nonce1 = await landRegistry.nonces(addr2.address);
      const sig1 = await addr2.signTypedData(domain, types, { propertyId: 1, documentHash: newDocumentHash, action: "TRANSFER", nonce: nonce1 });
      await landRegistry.connect(addr2).signTransfer(1, sig1);
      
      const nonce2 = await landRegistry.nonces(addr2.address);
      const sig2 = await addr2.signTypedData(domain, types, { propertyId: 1, documentHash: newDocumentHash, action: "TRANSFER", nonce: nonce2 });
      await expect(landRegistry.connect(addr2).signTransfer(1, sig2))
        .to.be.revertedWithCustomError(landRegistry, "AlreadySigned");
    });

    it("approveTransfer: Double approval (AlreadyApproved)", async function () {
      await landRegistry.connect(addr1).initiateTransfer(1, addr2.address, newDocumentHash);
      await landRegistry.connect(authority).approveTransfer(1);
      await expect(landRegistry.connect(authority).approveTransfer(1))
        .to.be.revertedWithCustomError(landRegistry, "AlreadyApproved");
    });

    it("executeTransfer: Missing fromSigned (TransferNotReady)", async function () {
      await landRegistry.connect(addr1).initiateTransfer(1, addr2.address, newDocumentHash);
      const nonce = await landRegistry.nonces(addr2.address);
      const sig = await addr2.signTypedData(domain, types, { propertyId: 1, documentHash: newDocumentHash, action: "TRANSFER", nonce });
      await landRegistry.connect(addr2).signTransfer(1, sig); // Buyer signs, but owner doesn't
      await landRegistry.connect(authority).approveTransfer(1);
      
      await expect(landRegistry.connect(addr1).executeTransfer(1))
        .to.be.revertedWithCustomError(landRegistry, "TransferNotReady");
    });
    
    it("approveTransfer: Approve executed transfer (AlreadyExecuted)", async function () {
      await landRegistry.connect(addr1).initiateTransfer(1, addr2.address, newDocumentHash);
      const nonce1 = await landRegistry.nonces(addr1.address);
      await landRegistry.connect(addr1).signTransfer(1, await addr1.signTypedData(domain, types, { propertyId: 1, documentHash: newDocumentHash, action: "TRANSFER", nonce: nonce1 }));
      const nonce2 = await landRegistry.nonces(addr2.address);
      await landRegistry.connect(addr2).signTransfer(1, await addr2.signTypedData(domain, types, { propertyId: 1, documentHash: newDocumentHash, action: "TRANSFER", nonce: nonce2 }));
      await landRegistry.connect(authority).approveTransfer(1);
      await landRegistry.connect(addr1).executeTransfer(1);
      await expect(landRegistry.connect(authority).approveTransfer(1))
        .to.be.revertedWithCustomError(landRegistry, "AlreadyExecuted");
    });
      
    it("FT-13: Initiate transfer on unverified property", async function () {
      await landRegistry.connect(addr1).registerProperty("hash_unverified", 1000, ethers.id("doc_unverified"));
      // We skip verifyRegistration
      await expect(landRegistry.connect(addr1).initiateTransfer(2, addr2.address, newDocumentHash))
        .to.be.revertedWithCustomError(landRegistry, "PropertyNotVerified");
    });

    it("FT-14: Initiate transfer with already registered document hash", async function () {
      // Trying to transfer using "doc1" which is the hash of property 1
      await expect(landRegistry.connect(addr1).initiateTransfer(1, addr2.address, ethers.id("doc1")))
        .to.be.revertedWithCustomError(landRegistry, "DuplicateRegistration");
    });

    it("FT-15: Initiate transfer reusing the property's own current document hash", async function () {
      // Trying to transfer property 1 using its own current hash ("doc1")
      // This proves the constraint that EVERY transfer requires a brand new deed document.
      await expect(landRegistry.connect(addr1).initiateTransfer(1, addr2.address, ethers.id("doc1")))
        .to.be.revertedWithCustomError(landRegistry, "DuplicateRegistration");
    });
  });
});
