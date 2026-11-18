const hre = require("hardhat");
const { ethers } = hre;

/**
 * End-to-End Simulation Script for Blockchain Land Registry
 * 
 * Simulates the complete updated Web3 lifecycle:
 * 1. Property Registration (Seller)
 * 2. Authority Verification (Govt/Admin)
 * 3. Marketplace Listing for Sale (Seller)
 * 4. Marketplace Purchase with Escrow Lock (Buyer)
 * 5. Off-chain EIP-712 Dual Signatures (Seller & Buyer)
 * 6. Authority Approval & Automatic Escrow Release to Seller
 * 7. Title Transfer Execution & On-chain Ownership Update
 */

async function main() {
    console.log("================================================================================");
    console.log("       LAND REGISTRY END-TO-END (E2E) LIFECYCLE SIMULATION");
    console.log("================================================================================\n");

    const [deployer, seller, buyer, authority] = await ethers.getSigners();
    console.log("Actors:");
    console.log(`  - Deployer:  ${deployer.address}`);
    console.log(`  - Seller:    ${seller.address}`);
    console.log(`  - Buyer:     ${buyer.address}`);
    console.log(`  - Authority: ${authority.address}\n`);

    // 0. Deploy Contract
    console.log("Step 0: Deploying LandRegistry contract...");
    const LandRegistry = await ethers.getContractFactory("LandRegistry");
    const registry = await LandRegistry.deploy();
    await registry.waitForDeployment();
    const contractAddress = await registry.getAddress();
    console.log(`  ✓ LandRegistry deployed at: ${contractAddress}`);

    const ADMIN_ROLE = await registry.ADMIN_ROLE();
    await (await registry.grantRole(ADMIN_ROLE, authority.address)).wait();
    console.log(`  ✓ ADMIN_ROLE granted to Authority (${authority.address})\n`);

    // 1. Property Registration
    console.log("Step 1: Seller registers a new land parcel...");
    const locationUri = "ipfs://QmDehradunParcel101GISCoordinates";
    const areaSqMeters = 2400;
    const initialDeedHash = ethers.keccak256(ethers.toUtf8Bytes("Initial_Sale_Deed_Parcel_101_2024"));
    
    const regTx = await registry.connect(seller).registerProperty(locationUri, areaSqMeters, initialDeedHash);
    const regReceipt = await regTx.wait();
    const propertyId = 1n;
    
    let prop = await registry.properties(propertyId);
    console.log(`  ✓ Property #${propertyId} registered in tx ${regTx.hash}`);
    console.log(`    - Owner: ${prop.currentOwner}`);
    console.log(`    - Area: ${prop.area} sq.m`);
    console.log(`    - Verified: ${prop.isVerifiedByAuthority}`);
    console.log(`    - Gas used: ${regReceipt.gasUsed.toString()}\n`);

    if (prop.currentOwner !== seller.address) throw new Error("Property registration failed: Owner mismatch");

    // 2. Authority Verification
    console.log("Step 2: Authority inspects physical deed and verifies property...");
    const verifyTx = await registry.connect(authority).verifyRegistration(propertyId);
    await verifyTx.wait();
    prop = await registry.properties(propertyId);
    console.log(`  ✓ Property #${propertyId} verified by Authority`);
    console.log(`    - isVerifiedByAuthority: ${prop.isVerifiedByAuthority}\n`);

    if (!prop.isVerifiedByAuthority) throw new Error("Verification failed: Property still unverified");

    // 3. Marketplace Listing
    const listingPriceEth = "2.5";
    const listingPriceWei = ethers.parseEther(listingPriceEth);
    console.log(`Step 3: Seller lists property on marketplace for ${listingPriceEth} ETH...`);
    const listTx = await registry.connect(seller).listPropertyForSale(propertyId, listingPriceWei);
    await listTx.wait();
    prop = await registry.properties(propertyId);
    console.log(`  ✓ Property #${propertyId} listed on Marketplace`);
    console.log(`    - isForSale: ${prop.isForSale}`);
    console.log(`    - Price: ${ethers.formatEther(prop.price)} ETH\n`);

    if (!prop.isForSale || prop.price !== listingPriceWei) throw new Error("Marketplace listing failed");

    // 4. Buyer Escrow Lock (Marketplace Purchase)
    console.log(`Step 4: Buyer deposits ${listingPriceEth} ETH into Smart Contract Escrow...`);
    const newDeedHash = ethers.keccak256(ethers.toUtf8Bytes("New_Conveyance_Deed_Seller_To_Buyer_2026"));
    const buyerBalanceBefore = await ethers.provider.getBalance(buyer.address);

    const buyTx = await registry.connect(buyer).initiateTransfer(
        propertyId,
        buyer.address,
        newDeedHash,
        { value: listingPriceWei }
    );
    const buyReceipt = await buyTx.wait();
    const transferId = 1n;

    const contractBalanceAfterDeposit = await ethers.provider.getBalance(contractAddress);
    const transferReq = await registry.transfers(transferId);

    console.log(`  ✓ Escrow locked in LandRegistry contract: ${ethers.formatEther(contractBalanceAfterDeposit)} ETH`);
    console.log(`    - Transfer ID: #${transferId}`);
    console.log(`    - Escrow Amount recorded: ${ethers.formatEther(transferReq.escrowAmount)} ETH`);
    console.log(`    - From: ${transferReq.from} (Seller)`);
    console.log(`    - To:   ${transferReq.to} (Buyer)\n`);

    if (contractBalanceAfterDeposit !== listingPriceWei) throw new Error("Contract balance does not match escrow amount");
    if (transferReq.escrowAmount !== listingPriceWei) throw new Error("Transfer escrow amount mismatch");

    // 5. Dual Signatures (EIP-712 Typed Data)
    console.log("Step 5: Parties sign digital conveyance deed using EIP-712 Typed Data...");
    const network = await ethers.provider.getNetwork();
    const domain = {
        name: "LandRegistry",
        version: "1",
        chainId: network.chainId,
        verifyingContract: contractAddress
    };

    const types = {
        Transfer: [
            { name: "propertyId", type: "uint256" },
            { name: "documentHash", type: "bytes32" },
            { name: "action", type: "string" },
            { name: "nonce", type: "uint256" }
        ]
    };

    // Seller signs
    const sellerNonce = await registry.nonces(seller.address);
    const sellerSig = await seller.signTypedData(domain, types, {
        propertyId: propertyId,
        documentHash: newDeedHash,
        action: "TRANSFER",
        nonce: sellerNonce
    });
    await (await registry.connect(seller).signTransfer(transferId, sellerSig)).wait();
    console.log("  ✓ Seller signed conveyance deed (fromSigned = true)");

    // Buyer signs
    const buyerNonce = await registry.nonces(buyer.address);
    const buyerSig = await buyer.signTypedData(domain, types, {
        propertyId: propertyId,
        documentHash: newDeedHash,
        action: "TRANSFER",
        nonce: buyerNonce
    });
    await (await registry.connect(buyer).signTransfer(transferId, buyerSig)).wait();
    console.log("  ✓ Buyer signed conveyance deed (toSigned = true)\n");

    const signedTransfer = await registry.transfers(transferId);
    if (!signedTransfer.fromSigned || !signedTransfer.toSigned) {
        throw new Error("Dual signing incomplete");
    }

    // 6. Authority Approves Transfer & Automatic Escrow Release
    console.log("Step 6: Authority reviews dual signatures & approves transfer...");
    const sellerBalanceBeforeApproval = await ethers.provider.getBalance(seller.address);
    console.log(`  - Seller ETH balance before approval: ${ethers.formatEther(sellerBalanceBeforeApproval)} ETH`);

    const approveTx = await registry.connect(authority).approveTransfer(transferId);
    await approveTx.wait();

    const sellerBalanceAfterApproval = await ethers.provider.getBalance(seller.address);
    const contractBalanceAfterApproval = await ethers.provider.getBalance(contractAddress);
    const sellerProfit = sellerBalanceAfterApproval - sellerBalanceBeforeApproval;

    console.log(`  ✓ Transfer #${transferId} approved by Authority`);
    console.log(`  ✓ Escrow funds automatically disbursed to Seller: +${ethers.formatEther(sellerProfit)} ETH`);
    console.log(`  - Seller ETH balance after approval:  ${ethers.formatEther(sellerBalanceAfterApproval)} ETH`);
    console.log(`  - Contract ETH balance after release: ${ethers.formatEther(contractBalanceAfterApproval)} ETH\n`);

    if (sellerProfit !== listingPriceWei) {
        throw new Error(`Seller did not receive full escrow funds! Expected ${listingPriceEth} ETH, got ${ethers.formatEther(sellerProfit)} ETH`);
    }
    if (contractBalanceAfterApproval !== 0n) {
        throw new Error("Contract balance should be 0 ETH after escrow release");
    }

    // 7. Title Transfer Execution
    console.log("Step 7: Finalizing title transfer & updating land registry ledger...");
    const execTx = await registry.connect(buyer).executeTransfer(transferId);
    await execTx.wait();

    const finalProp = await registry.properties(propertyId);
    const finalTransfer = await registry.transfers(transferId);
    const history = await registry.getOwnershipHistory(propertyId);

    console.log(`  ✓ Transfer executed successfully!`);
    console.log(`    - New Owner:         ${finalProp.currentOwner}`);
    console.log(`    - Deed DocumentHash: ${finalProp.documentHash}`);
    console.log(`    - isForSale Reset:   ${finalProp.isForSale}`);
    console.log(`    - Price Reset:       ${finalProp.price.toString()} wei`);
    console.log(`    - Transfer Executed: ${finalTransfer.executed}`);
    console.log(`    - Ownership Chain:   [ ${history.join(" -> ")} ]\n`);

    if (finalProp.currentOwner !== buyer.address) throw new Error("Title transfer failed: Buyer is not owner");
    if (finalProp.isForSale !== false) throw new Error("Title transfer failed: Property still marked for sale");
    if (finalProp.price !== 0n) throw new Error("Title transfer failed: Price not reset");
    if (history.length !== 2 || history[1] !== buyer.address) throw new Error("Ownership history chain mismatch");

    console.log("================================================================================");
    console.log("🎉 SIMULATION RESULT: ALL 7 STEPS COMPLETED & VERIFIED SUCCESSFULLY!");
    console.log("   - Property Registration:    PASSED");
    console.log("   - Authority Verification:   PASSED");
    console.log("   - Marketplace Listing:      PASSED");
    console.log("   - Buyer Escrow Lock:        PASSED (2.5 ETH Locked)");
    console.log("   - Dual EIP-712 Signatures:  PASSED");
    console.log("   - Escrow Auto-Disbursement: PASSED (2.5 ETH Disbursed to Seller)");
    console.log("   - Final Ownership Transfer: PASSED (Ownership transferred to Buyer)");
    console.log("================================================================================\n");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("Simulation failed:", error);
        process.exit(1);
    });
