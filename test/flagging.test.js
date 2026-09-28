const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("LandRegistry - Flagging (Step 6)", function () {
  let LandRegistry, landRegistry;
  let owner, addr1, addr2, authority;

  beforeEach(async function () {
    [owner, authority, addr1, addr2] = await ethers.getSigners();
    LandRegistry = await ethers.getContractFactory("LandRegistry");
    landRegistry = await LandRegistry.deploy();

    const ADMIN_ROLE = await landRegistry.ADMIN_ROLE();
    await landRegistry.grantRole(ADMIN_ROLE, authority.address);

    await landRegistry.connect(addr1).registerProperty("hash123", 1000, ethers.id("doc1"));
    await landRegistry.connect(authority).verifyRegistration(1);
  });

  describe("flagProperty / unflagProperty", function () {
    it("Should allow authority to flag property and emit event", async function () {
      await expect(landRegistry.connect(authority).flagProperty(1, "Disputed title"))
        .to.emit(landRegistry, "PropertyFlagged")
        .withArgs(1, "Disputed title");

      const prop = await landRegistry.properties(1);
      expect(prop.isFrozen).to.be.true;
    });

    it("Should revert if flagged by non-authority", async function () {
      const ADMIN_ROLE = await landRegistry.ADMIN_ROLE();
      await expect(landRegistry.connect(addr1).flagProperty(1, "Trying to freeze"))
        .to.be.revertedWithCustomError(landRegistry, "AccessControlUnauthorizedAccount")
        .withArgs(addr1.address, ADMIN_ROLE);
    });

    it("Should revert if already frozen", async function () {
      await landRegistry.connect(authority).flagProperty(1, "Reason 1");
      await expect(landRegistry.connect(authority).flagProperty(1, "Reason 2"))
        .to.be.revertedWithCustomError(landRegistry, "PropertyIsFrozen");
    });

    it("Should allow authority to unflag property and emit event", async function () {
      await landRegistry.connect(authority).flagProperty(1, "Disputed title");
      
      await expect(landRegistry.connect(authority).unflagProperty(1))
        .to.emit(landRegistry, "PropertyUnflagged")
        .withArgs(1);

      const prop = await landRegistry.properties(1);
      expect(prop.isFrozen).to.be.false;
    });

    it("Should revert unflagging if property is not frozen", async function () {
      await expect(landRegistry.connect(authority).unflagProperty(1))
        .to.be.revertedWithCustomError(landRegistry, "PropertyNotFrozen");
    });

    it("Should revert if property does not exist for flag", async function () {
      await expect(landRegistry.connect(authority).flagProperty(999, "Reason"))
        .to.be.revertedWithCustomError(landRegistry, "PropertyDoesNotExist");
    });

    it("Should revert if property does not exist for unflag", async function () {
      await expect(landRegistry.connect(authority).unflagProperty(999))
        .to.be.revertedWithCustomError(landRegistry, "PropertyDoesNotExist");
    });
  });
});
