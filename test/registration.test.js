const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("LandRegistry - Registration", function () {
  let LandRegistry, landRegistry;
  let owner, addr1, addr2, authority;

  beforeEach(async function () {
    [owner, authority, addr1, addr2] = await ethers.getSigners();
    LandRegistry = await ethers.getContractFactory("LandRegistry");
    landRegistry = await LandRegistry.deploy();

    // Grant ADMIN_ROLE to authority
    const ADMIN_ROLE = await landRegistry.ADMIN_ROLE();
    await landRegistry.grantRole(ADMIN_ROLE, authority.address);
  });

  describe("TC-1: Register a new property", function () {
    it("Should create property with isVerifiedByAuthority = false", async function () {
      const locationHash = "hash123";
      const area = 1500;
      const documentHash = ethers.id("doc1"); // keccak256 hash

      await expect(landRegistry.connect(addr1).registerProperty(locationHash, area, documentHash))
        .to.emit(landRegistry, "PropertyRegistered")
        .withArgs(1, addr1.address);

      const property = await landRegistry.properties(1);
      expect(property.id).to.equal(1);
      expect(property.locationHash).to.equal(locationHash);
      expect(property.area).to.equal(area);
      expect(property.currentOwner).to.equal(addr1.address);
      expect(property.documentHash).to.equal(documentHash);
      expect(property.isVerifiedByAuthority).to.be.false;
      expect(property.isFrozen).to.be.false;
    });
  });

  describe("TC-2: Authority verifies a registration", function () {
    it("Should set isVerifiedByAuthority = true and emit event", async function () {
      const documentHash = ethers.id("doc2");
      await landRegistry.connect(addr1).registerProperty("hash456", 2000, documentHash);

      await expect(landRegistry.connect(authority).verifyRegistration(1))
        .to.emit(landRegistry, "PropertyVerified")
        .withArgs(1);

      const property = await landRegistry.properties(1);
      expect(property.isVerifiedByAuthority).to.be.true;
    });

    it("Should revert if verified by non-authority", async function () {
      const documentHash = ethers.id("doc3");
      await landRegistry.connect(addr1).registerProperty("hash789", 1000, documentHash);

      const ADMIN_ROLE = await landRegistry.ADMIN_ROLE();
      await expect(landRegistry.connect(addr2).verifyRegistration(1))
        .to.be.revertedWithCustomError(landRegistry, "AccessControlUnauthorizedAccount")
        .withArgs(addr2.address, ADMIN_ROLE);
    });

    it("Should revert if already verified", async function () {
      const documentHash = ethers.id("doc4");
      await landRegistry.connect(addr1).registerProperty("hash012", 1000, documentHash);

      await landRegistry.connect(authority).verifyRegistration(1);

      await expect(landRegistry.connect(authority).verifyRegistration(1))
        .to.be.revertedWithCustomError(landRegistry, "AlreadyVerified");
    });

    it("Should revert if property does not exist", async function () {
      await expect(landRegistry.connect(authority).verifyRegistration(999))
        .to.be.revertedWithCustomError(landRegistry, "PropertyDoesNotExist");
    });
  });

  describe("FT-1: Register same property twice", function () {
    it("Should revert second registration with DuplicateRegistration", async function () {
      const documentHash = ethers.id("doc-duplicate");
      await landRegistry.connect(addr1).registerProperty("loc", 100, documentHash);

      // Attempting to register the same document hash again should fail
      await expect(landRegistry.connect(addr2).registerProperty("loc2", 200, documentHash))
        .to.be.revertedWithCustomError(landRegistry, "DuplicateRegistration");
    });
  });
});
