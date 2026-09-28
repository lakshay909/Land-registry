const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("LandRegistry - Ownership History (Step 7)", function () {
  let LandRegistry, landRegistry;
  let owner, addr1, addr2, addr3, authority;
  let domain, types;

  beforeEach(async function () {
    [owner, authority, addr1, addr2, addr3] = await ethers.getSigners();
    LandRegistry = await ethers.getContractFactory("LandRegistry");
    landRegistry = await LandRegistry.deploy();

    const ADMIN_ROLE = await landRegistry.ADMIN_ROLE();
    await landRegistry.grantRole(ADMIN_ROLE, authority.address);

    const network = await ethers.provider.getNetwork();
    domain = { name: "LandRegistry", version: "1", chainId: network.chainId, verifyingContract: await landRegistry.getAddress() };
    types = { Transfer: [{ name: "propertyId", type: "uint256" }, { name: "documentHash", type: "bytes32" }, { name: "action", type: "string" }, { name: "nonce", type: "uint256" }] };
  });

  it("TC-8: getOwnershipHistory tracks multi-hop transfers accurately", async function () {
    // 1. Register Property to addr1
    await landRegistry.connect(addr1).registerProperty("hash123", 1000, ethers.id("doc1"));
    await landRegistry.connect(authority).verifyRegistration(1);

    // Initial check (assert registration pushed correctly)
    let history = await landRegistry.getOwnershipHistory(1);
    expect(history.length).to.equal(1);
    expect(history[0]).to.equal(addr1.address);

    // 2. Transfer A -> B (addr1 -> addr2)
    const newDoc1 = ethers.id("doc_B");
    await landRegistry.connect(addr1).initiateTransfer(1, addr2.address, newDoc1);
    
    const nonce1From = await landRegistry.nonces(addr1.address);
    await landRegistry.connect(addr1).signTransfer(1, await addr1.signTypedData(domain, types, { propertyId: 1, documentHash: newDoc1, action: "TRANSFER", nonce: nonce1From }));
    const nonce1To = await landRegistry.nonces(addr2.address);
    await landRegistry.connect(addr2).signTransfer(1, await addr2.signTypedData(domain, types, { propertyId: 1, documentHash: newDoc1, action: "TRANSFER", nonce: nonce1To }));
    
    await landRegistry.connect(authority).approveTransfer(1);
    await landRegistry.connect(addr1).executeTransfer(1);

    // Check after first transfer
    history = await landRegistry.getOwnershipHistory(1);
    expect(history.length).to.equal(2);
    expect(history[0]).to.equal(addr1.address);
    expect(history[1]).to.equal(addr2.address);

    // 3. Transfer B -> C (addr2 -> addr3)
    const newDoc2 = ethers.id("doc_C");
    await landRegistry.connect(addr2).initiateTransfer(1, addr3.address, newDoc2);
    
    const nonce2From = await landRegistry.nonces(addr2.address);
    await landRegistry.connect(addr2).signTransfer(2, await addr2.signTypedData(domain, types, { propertyId: 1, documentHash: newDoc2, action: "TRANSFER", nonce: nonce2From }));
    const nonce2To = await landRegistry.nonces(addr3.address);
    await landRegistry.connect(addr3).signTransfer(2, await addr3.signTypedData(domain, types, { propertyId: 1, documentHash: newDoc2, action: "TRANSFER", nonce: nonce2To }));
    
    await landRegistry.connect(authority).approveTransfer(2);
    await landRegistry.connect(addr2).executeTransfer(2);

    // Final check for full chain A -> B -> C
    history = await landRegistry.getOwnershipHistory(1);
    expect(history.length).to.equal(3);
    expect(history[0]).to.equal(addr1.address); // A
    expect(history[1]).to.equal(addr2.address); // B
    expect(history[2]).to.equal(addr3.address); // C
  });

  it("Should revert if property does not exist", async function () {
    await expect(landRegistry.getOwnershipHistory(999))
      .to.be.revertedWithCustomError(landRegistry, "PropertyDoesNotExist");
  });
});
