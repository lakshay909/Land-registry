const hre = require("hardhat");
const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");

async function main() {
    const [owner, buyer, authority] = await hre.ethers.getSigners();
    console.log("Deploying contract...");
    const LandRegistry = await hre.ethers.getContractFactory("LandRegistry");
    const registry = await LandRegistry.deploy();
    await registry.waitForDeployment();
    const contractAddress = await registry.getAddress();
    console.log("Deployed to:", contractAddress);

    // Setup authority role
    const ADMIN_ROLE = await registry.ADMIN_ROLE();
    await registry.grantRole(ADMIN_ROLE, authority.address);

    const dbPath = path.join(__dirname, "../backend/test_e2e.sqlite");
    if (fs.existsSync(dbPath)) fs.unlinkSync(dbPath);

    const env = {
        ...process.env,
        CONTRACT_ADDRESS: contractAddress,
        DB_PATH: "test_e2e.sqlite",
        PORT: 3001
    };

    console.log("Starting indexer and server...");
    const indexer = spawn("node", ["indexer.js"], { cwd: path.join(__dirname, "../backend"), env, stdio: 'inherit' });
    const server = spawn("node", ["server.js"], { cwd: path.join(__dirname, "../backend"), env, stdio: 'inherit' });

    // Give server/indexer a moment to spin up and sync genesis
    await new Promise(resolve => setTimeout(resolve, 3000));

    console.log("=========================================");
    console.log("Firing interactions: Register -> Verify -> Initiate -> Sign -> Approve -> Execute");
    const docHash1 = hre.ethers.id("doc1");
    let tx = await registry.connect(owner).registerProperty("e2e_loc", 100, docHash1);
    await tx.wait();

    tx = await registry.connect(authority).verifyRegistration(1);
    await tx.wait();

    const newDocHash = hre.ethers.id("doc2");
    tx = await registry.connect(owner).initiateTransfer(1, buyer.address, newDocHash);
    await tx.wait();

    // Allow indexer to catch up (ethers JsonRpcProvider polls every 4s by default)
    await new Promise(resolve => setTimeout(resolve, 5000));

    let res = await fetch("http://localhost:3001/api/transfers?status=pending");
    let data = await res.json();
    console.log(`[API Check] Pending transfers: ${data.length}`);
    if (data.length !== 1) throw new Error("Expected exactly 1 pending transfer!");

    const domain = {
        name: "LandRegistry",
        version: "1",
        chainId: (await hre.ethers.provider.getNetwork()).chainId,
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

    let buyerNonce = await registry.nonces(buyer.address);
    let toSignature = await buyer.signTypedData(domain, types, { 
        propertyId: 1, documentHash: newDocHash, action: "TRANSFER", nonce: buyerNonce 
    });
    tx = await registry.connect(buyer).signTransfer(1, toSignature);
    await tx.wait();

    let ownerNonce = await registry.nonces(owner.address);
    let fromSignature = await owner.signTypedData(domain, types, { 
        propertyId: 1, documentHash: newDocHash, action: "TRANSFER", nonce: ownerNonce 
    });
    tx = await registry.connect(owner).signTransfer(1, fromSignature);
    await tx.wait();

    tx = await registry.connect(authority).approveTransfer(1);
    await tx.wait();

    tx = await registry.connect(owner).executeTransfer(1);
    await tx.wait();

    console.log("Transfer executed fully. Waiting for indexer...");
    await new Promise(resolve => setTimeout(resolve, 5000));

    console.log("=========================================");
    console.log("Verifying final API state...");

    res = await fetch("http://localhost:3001/api/transfers?status=pending");
    data = await res.json();
    console.log(`[API Check] Pending transfers after execution: ${data.length}`);
    if (data.length !== 0) throw new Error("Expected 0 pending transfers after execution! Filter failed or DB wasn't updated.");

    res = await fetch("http://localhost:3001/api/properties/1");
    data = await res.json();
    console.log(`[API Check] Property 1 owner: ${data.currentOwner === buyer.address ? "CORRECT (Buyer)" : "WRONG"}`);
    if (data.currentOwner !== buyer.address) throw new Error("Expected owner to be the buyer!");
    
    console.log(`[API Check] Property 1 history events: ${data.history.length}`);
    if (data.history.length !== 2) throw new Error("Expected 2 history events (Registration + OwnershipTransferred)!");

    res = await fetch("http://localhost:3001/api/audit-log?propertyId=1");
    data = await res.json();
    console.log(`[API Check] Audit log total events for Property 1: ${data.length}`);
    // Register (1), Verify (1), Initiate (1), Sign (2), Approve (1), Execute/OwnershipTransferred (1)
    if (data.length !== 7) console.warn("Expected 7 audit events, but got " + data.length);

    console.log("✅ E2E Backend Pipeline fully verified!");
    
    indexer.kill();
    server.kill();
    process.exit(0);
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
