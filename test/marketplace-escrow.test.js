const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("LandRegistry - Marketplace & Smart Escrow", function () {
  let LandRegistry, landRegistry;
  let deployer, authority, seller, buyer, randomUser;
  const locationHash = "geo:28.6139,77.2090";
  const area = 1500;
  const initialDocHash = ethers.id("initial-deed-pdf");
  const conveyanceDocHash = ethers.id("conveyance-deed-pdf");
  const listingPrice = ethers.parseEther("2.0");

  let domain, types;

  beforeEach(async function () {
    [deployer, authority, seller, buyer, randomUser] = await ethers.getSigners();

    LandRegistry = await ethers.getContractFactory("LandRegistry");
    landRegistry = await LandRegistry.deploy();

    const ADMIN_ROLE = await landRegistry.ADMIN_ROLE();
    await landRegistry.grantRole(ADMIN_ROLE, authority.address);

    // Register property #1 by seller
    await landRegistry.connect(seller).registerProperty(locationHash, area, initialDocHash);

    const network = await ethers.provider.getNetwork();
    domain = {
      name: "LandRegistry",
      version: "1",
      chainId: network.chainId,
      verifyingContract: await landRegistry.getAddress()
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

  describe("Marketplace Listing", function () {
    it("Should allow owner to list a verified property for sale", async function () {
      // Authority verifies property first
      await landRegistry.connect(authority).verifyRegistration(1);

      await expect(landRegistry.connect(seller).listPropertyForSale(1, listingPrice))
        .to.emit(landRegistry, "PropertyListed")
        .withArgs(1, listingPrice, seller.address);

      const prop = await landRegistry.properties(1);
      expect(prop.isForSale).to.be.true;
      expect(prop.price).to.equal(listingPrice);
    });

    it("Should revert if property is unverified", async function () {
      await expect(landRegistry.connect(seller).listPropertyForSale(1, listingPrice))
        .to.be.revertedWithCustomError(landRegistry, "PropertyNotVerified");
    });

    it("Should revert if non-owner tries to list property", async function () {
      await landRegistry.connect(authority).verifyRegistration(1);

      await expect(landRegistry.connect(randomUser).listPropertyForSale(1, listingPrice))
        .to.be.revertedWithCustomError(landRegistry, "NotOwner");
    });

    it("Should revert if listing price is 0", async function () {
      await landRegistry.connect(authority).verifyRegistration(1);

      await expect(landRegistry.connect(seller).listPropertyForSale(1, 0))
        .to.be.revertedWithCustomError(landRegistry, "InvalidPrice");
    });

    it("Should revert if property is frozen", async function () {
      await landRegistry.connect(authority).verifyRegistration(1);
      await landRegistry.connect(authority).flagProperty(1, "Under investigation");

      await expect(landRegistry.connect(seller).listPropertyForSale(1, listingPrice))
        .to.be.revertedWithCustomError(landRegistry, "PropertyIsFrozen");
    });

    it("Should revert if listing non-existent property", async function () {
      await expect(landRegistry.connect(seller).listPropertyForSale(999, listingPrice))
        .to.be.revertedWithCustomError(landRegistry, "PropertyDoesNotExist");
    });

    it("Should allow owner to delist property", async function () {
      await landRegistry.connect(authority).verifyRegistration(1);
      await landRegistry.connect(seller).listPropertyForSale(1, listingPrice);

      await expect(landRegistry.connect(seller).delistProperty(1))
        .to.emit(landRegistry, "PropertyDelisted")
        .withArgs(1);

      const prop = await landRegistry.properties(1);
      expect(prop.isForSale).to.be.false;
      expect(prop.price).to.equal(0);
    });

    it("Should revert delisting if not for sale", async function () {
      await landRegistry.connect(authority).verifyRegistration(1);

      await expect(landRegistry.connect(seller).delistProperty(1))
        .to.be.revertedWithCustomError(landRegistry, "PropertyNotForSale");
    });

    it("Should revert delisting if caller is not owner", async function () {
      await landRegistry.connect(authority).verifyRegistration(1);
      await landRegistry.connect(seller).listPropertyForSale(1, listingPrice);

      await expect(landRegistry.connect(buyer).delistProperty(1))
        .to.be.revertedWithCustomError(landRegistry, "NotOwner");
    });
  });

  describe("Buyer Escrow Deposit & Transfer Initiation", function () {
    beforeEach(async function () {
      await landRegistry.connect(authority).verifyRegistration(1);
      await landRegistry.connect(seller).listPropertyForSale(1, listingPrice);
    });

    it("Should allow buyer to initiate transfer by depositing price in Escrow", async function () {
      const contractAddress = await landRegistry.getAddress();
      const initialContractBalance = await ethers.provider.getBalance(contractAddress);

      await expect(
        landRegistry.connect(buyer).initiateTransfer(1, buyer.address, conveyanceDocHash, {
          value: listingPrice
        })
      )
        .to.emit(landRegistry, "EscrowDeposited")
        .withArgs(1, buyer.address, listingPrice)
        .and.to.emit(landRegistry, "TransferInitiated")
        .withArgs(1, 1, seller.address, buyer.address);

      const finalContractBalance = await ethers.provider.getBalance(contractAddress);
      expect(finalContractBalance - initialContractBalance).to.equal(listingPrice);

      const transfer = await landRegistry.transfers(1);
      expect(transfer.propertyId).to.equal(1);
      expect(transfer.from).to.equal(seller.address);
      expect(transfer.to).to.equal(buyer.address);
      expect(transfer.escrowAmount).to.equal(listingPrice);
      expect(transfer.executed).to.be.false;
    });

    it("Should revert if buyer sends insufficient ETH", async function () {
      const lowerPrice = ethers.parseEther("1.5");
      await expect(
        landRegistry.connect(buyer).initiateTransfer(1, buyer.address, conveyanceDocHash, {
          value: lowerPrice
        })
      ).to.be.revertedWithCustomError(landRegistry, "InsufficientPayment");
    });

    it("Should revert if non-owner tries to initiate transfer on unlisted property", async function () {
      await landRegistry.connect(seller).delistProperty(1);

      await expect(
        landRegistry.connect(buyer).initiateTransfer(1, buyer.address, conveyanceDocHash, {
          value: listingPrice
        })
      ).to.be.revertedWithCustomError(landRegistry, "NotOwner");
    });
  });

  describe("Complete Escrow Conveyance Cycle: Deposit -> Dual Signatures -> Approve & Release -> Execution", function () {
    beforeEach(async function () {
      await landRegistry.connect(authority).verifyRegistration(1);
      await landRegistry.connect(seller).listPropertyForSale(1, listingPrice);
      // Buyer deposits 2.0 ETH
      await landRegistry.connect(buyer).initiateTransfer(1, buyer.address, conveyanceDocHash, {
        value: listingPrice
      });
    });

    it("Should execute end-to-end conveyance: funds released to seller and title transferred", async function () {
      // 1. Seller signs EIP-712
      const sellerNonce = await landRegistry.nonces(seller.address);
      const sellerSignature = await seller.signTypedData(domain, types, {
        propertyId: 1,
        documentHash: conveyanceDocHash,
        action: "TRANSFER",
        nonce: sellerNonce
      });
      await landRegistry.connect(seller).signTransfer(1, sellerSignature);

      // 2. Buyer signs EIP-712
      const buyerNonce = await landRegistry.nonces(buyer.address);
      const buyerSignature = await buyer.signTypedData(domain, types, {
        propertyId: 1,
        documentHash: conveyanceDocHash,
        action: "TRANSFER",
        nonce: buyerNonce
      });
      await landRegistry.connect(buyer).signTransfer(1, buyerSignature);

      // Verify signatures state
      const transferPreApprove = await landRegistry.transfers(1);
      expect(transferPreApprove.fromSigned).to.be.true;
      expect(transferPreApprove.toSigned).to.be.true;

      // 3. Authority approves transfer -> Escrow released directly to seller
      const sellerBalanceBefore = await ethers.provider.getBalance(seller.address);

      await expect(landRegistry.connect(authority).approveTransfer(1))
        .to.emit(landRegistry, "EscrowReleased")
        .withArgs(1, seller.address, listingPrice)
        .and.to.emit(landRegistry, "TransferApproved")
        .withArgs(1);

      const sellerBalanceAfter = await ethers.provider.getBalance(seller.address);
      expect(sellerBalanceAfter - sellerBalanceBefore).to.equal(listingPrice);

      const transferPostApprove = await landRegistry.transfers(1);
      expect(transferPostApprove.authorityApproved).to.be.true;
      expect(transferPostApprove.escrowAmount).to.equal(0);

      // 4. Execution updates title ownership and unlists property
      await expect(landRegistry.connect(buyer).executeTransfer(1))
        .to.emit(landRegistry, "OwnershipTransferred")
        .withArgs(1, 1, seller.address, buyer.address);

      const prop = await landRegistry.properties(1);
      expect(prop.currentOwner).to.equal(buyer.address);
      expect(prop.documentHash).to.equal(conveyanceDocHash);
      expect(prop.isForSale).to.be.false;
      expect(prop.price).to.equal(0);

      const history = await landRegistry.getOwnershipHistory(1);
      expect(history.length).to.equal(2);
      expect(history[0]).to.equal(seller.address);
      expect(history[1]).to.equal(buyer.address);
    });

    it("Should refund escrow to buyer if authority rejects transfer", async function () {
      const buyerBalanceBefore = await ethers.provider.getBalance(buyer.address);

      await expect(landRegistry.connect(authority).rejectTransfer(1, "Forged survey document"))
        .to.emit(landRegistry, "EscrowRefunded")
        .withArgs(1, buyer.address, listingPrice)
        .and.to.emit(landRegistry, "TransferRejected")
        .withArgs(1, "Forged survey document");

      const buyerBalanceAfter = await ethers.provider.getBalance(buyer.address);
      expect(buyerBalanceAfter - buyerBalanceBefore).to.equal(listingPrice);

      // Rejection marks executed so it cannot be re-executed or approved
      const transfer = await landRegistry.transfers(1);
      expect(transfer.executed).to.be.true;
      expect(transfer.escrowAmount).to.equal(0);

      await expect(landRegistry.connect(authority).approveTransfer(1))
        .to.be.revertedWithCustomError(landRegistry, "AlreadyExecuted");
    });
  });
});
