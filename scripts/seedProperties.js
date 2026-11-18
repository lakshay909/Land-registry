const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

// Cadastral property metadata conforming to official Uttar Pradesh / DILRMP revenue standards
const SEED_PROPERTIES_DATA = [
  {
    index: 0,
    area: 1500, // sqft
    classification: "Urban Residential",
    locationDesc: "Gata 452/1, Khasra 88, Gomti Nagar Phase 2, Lucknow, Uttar Pradesh",
    coordinates: "26.8500° N, 80.9980° E",
    upicCode: "0912010045200001",
    ipfsHash: "ipfs://bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi/parcel-1-urban-res.json",
    priceEth: "1.5",
    isMarketplaceListing: true
  },
  {
    index: 1,
    area: 2400,
    classification: "Rural Agricultural",
    locationDesc: "Gata 108/2, Village Bakshi Ka Talab, Sitapur Road, Lucknow, Uttar Pradesh",
    coordinates: "27.0125° N, 80.9167° E",
    upicCode: "0912020010800002",
    ipfsHash: "ipfs://bafybeicgdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi/parcel-2-rural-agri.json",
    priceEth: "0",
    isMarketplaceListing: false
  },
  {
    index: 2,
    area: 3200,
    classification: "Commercial Zone",
    locationDesc: "Plot 14-B, Vibhuti Khand Commercial Hub, Gomti Nagar, Lucknow, Uttar Pradesh",
    coordinates: "26.8680° N, 81.0020° E",
    upicCode: "0912010001400003",
    ipfsHash: "ipfs://bafybeidgdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi/parcel-3-comm-zone.json",
    priceEth: "4.2",
    isMarketplaceListing: true
  },
  {
    index: 3,
    area: 1800,
    classification: "Suburban Mixed",
    locationDesc: "Khasra 219, Sultanpur Road Corridor, Arjunganj, Lucknow, Uttar Pradesh",
    coordinates: "26.8040° N, 81.0110° E",
    upicCode: "0912030021900004",
    ipfsHash: "ipfs://bafybeiegdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi/parcel-4-suburban-mix.json",
    priceEth: "0",
    isMarketplaceListing: false
  },
  {
    index: 4,
    area: 5000,
    classification: "Industrial Development",
    locationDesc: "Sector 5, UPSIDC Industrial Area, Nadarganj, Amausi, Lucknow, Uttar Pradesh",
    coordinates: "26.7720° N, 80.8710° E",
    upicCode: "0912040000500005",
    ipfsHash: "ipfs://bafybeifgdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi/parcel-5-industrial.json",
    priceEth: "7.5",
    isMarketplaceListing: true
  },
  {
    index: 5,
    area: 1200,
    classification: "Urban High-Density",
    locationDesc: "Gata 312, Alambagh Central, Kanpur Road, Lucknow, Uttar Pradesh",
    coordinates: "26.8180° N, 80.9020° E",
    upicCode: "0912010031200006",
    ipfsHash: "ipfs://bafybeiggdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi/parcel-6-urban-dense.json",
    priceEth: "0",
    isMarketplaceListing: false
  },
  {
    index: 6,
    area: 4200,
    classification: "Semi-Urban Orchard",
    locationDesc: "Gata 95/4, Malihabad Mango Belt, Mohan Road, Lucknow, Uttar Pradesh",
    coordinates: "26.9200° N, 80.7100° E",
    upicCode: "0912050009500007",
    ipfsHash: "ipfs://bafybeihgdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi/parcel-7-semi-orchard.json",
    priceEth: "2.8",
    isMarketplaceListing: true
  },
  {
    index: 7,
    area: 2100,
    classification: "Institutional Educational",
    locationDesc: "Plot 7-C, Knowledge Park Corridor, Raebareli Road, Lucknow, Uttar Pradesh",
    coordinates: "26.7550° N, 80.9400° E",
    upicCode: "0912060000700008",
    ipfsHash: "ipfs://bafybeiigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi/parcel-8-inst-edu.json",
    priceEth: "0",
    isMarketplaceListing: false
  },
  {
    index: 8,
    area: 1650,
    classification: "Urban Residential",
    locationDesc: "Gata 621/3, Indira Nagar Sector 14, Ring Road, Lucknow, Uttar Pradesh",
    coordinates: "26.8830° N, 80.9950° E",
    upicCode: "0912010062100009",
    ipfsHash: "ipfs://bafybeijgdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi/parcel-9-urban-res.json",
    priceEth: "2.1",
    isMarketplaceListing: true
  },
  {
    index: 9,
    area: 8500,
    classification: "Rural Agricultural Farmland",
    locationDesc: "Gata 77/1, Village Mohanlalganj, Raebareli Highway, Lucknow, Uttar Pradesh",
    coordinates: "26.6800° N, 80.9700° E",
    upicCode: "0912070007700010",
    ipfsHash: "ipfs://bafybeikgdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi/parcel-10-rural-farm.json",
    priceEth: "0",
    isMarketplaceListing: false
  }
];

async function main() {
  console.log("================================================================================");
  console.log("🏛️   Bhūmi Ledger — Automated Property Seeding & Authority Verification Suite");
  console.log("================================================================================");

  // 1. Connect to Network & Retrieve Signers
  const signers = await hre.ethers.getSigners();
  console.log(`📡 Network: ${hre.network.name}`);
  console.log(`👥 Retrieved ${signers.length} Hardhat signers (Accounts #0 through #19).`);

  if (signers.length < 20) {
    throw new Error(`Insufficient signers: expected at least 20, but found ${signers.length}.`);
  }

  // 2. Resolve Contract Address
  let contractAddress = process.env.CONTRACT_ADDRESS;
  const deploymentInfoPath = path.join(__dirname, "deployment-info.json");
  if (!contractAddress && fs.existsSync(deploymentInfoPath)) {
    const deploymentInfo = JSON.parse(fs.readFileSync(deploymentInfoPath, "utf8"));
    contractAddress = deploymentInfo.address;
  }
  if (!contractAddress) {
    contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  }

  console.log(`📜 Target LandRegistry Smart Contract: ${contractAddress}`);
  const landRegistry = await hre.ethers.getContractAt("LandRegistry", contractAddress);

  // Verify contract is deployed
  const code = await hre.ethers.provider.getCode(contractAddress);
  if (!code || code === "0x") {
    throw new Error(`No bytecode found at ${contractAddress}. Please deploy the contract first via: npx hardhat run scripts/deploy.js --network localhost`);
  }

  // 3. Setup Authority Account (Account #19)
  const deployer = signers[0]; // Holds DEFAULT_ADMIN_ROLE
  const authority = signers[19]; // Designated Authority Account #19
  const adminRole = await landRegistry.ADMIN_ROLE();
  const isAuthorityAdmin = await landRegistry.hasRole(adminRole, authority.address);

  console.log(`\n🔑 Authority Configuration:`);
  console.log(`   - Deployer Account #0:   ${deployer.address}`);
  console.log(`   - Authority Account #19:  ${authority.address}`);

  if (!isAuthorityAdmin) {
    console.log(`   ⏳ Granting ADMIN_ROLE to Account #19...`);
    const grantTx = await landRegistry.connect(deployer).grantRole(adminRole, authority.address);
    await grantTx.wait();
    console.log(`   ✅ ADMIN_ROLE successfully granted to Account #19 (${authority.address}).`);
  } else {
    console.log(`   ✅ Account #19 already holds ADMIN_ROLE.`);
  }

  // 4. Batch Property Creation for Accounts #0 through #9
  console.log("\n================================================================================");
  console.log("📦 Phase 1: Batch Property Registration (Accounts #0 through #9)");
  console.log("================================================================================");

  const seededProperties = [];

  for (let i = 0; i < 10; i++) {
    const item = SEED_PROPERTIES_DATA[i];
    const owner = signers[i];
    const documentHash = hre.ethers.keccak256(
      hre.ethers.toUtf8Bytes(`BHUMI_DEED_REGISTERED_DOC_UPIC_${item.upicCode}_V1`)
    );
    const locationString = `${item.locationDesc} | Area: ${item.area} sqft | Classification: ${item.classification} | UPIC: ${item.upicCode} | IPFS: ${item.ipfsHash}`;

    // Check if this document hash is already registered
    const alreadyRegistered = await landRegistry.registeredDocuments(documentHash);
    let propertyId;

    if (alreadyRegistered) {
      console.log(`   [Account #${i}] ℹ️  Property with UPIC ${item.upicCode} is already registered on-chain.`);
      // Find property ID by scanning nextPropertyId
      const maxId = Number(await landRegistry.nextPropertyId());
      for (let pid = 1; pid < maxId; pid++) {
        const prop = await landRegistry.properties(pid);
        if (prop.documentHash === documentHash) {
          propertyId = pid;
          break;
        }
      }
    } else {
      console.log(`   [Account #${i}: ${owner.address.slice(0, 10)}...] Registering ${item.classification} (${item.area} sqft)...`);
      const regTx = await landRegistry.connect(owner).registerProperty(
        locationString,
        item.area,
        documentHash
      );
      const receipt = await regTx.wait();

      // Extract propertyId from PropertyRegistered event
      const regEvent = receipt.logs
        .map(log => {
          try { return landRegistry.interface.parseLog(log); } catch { return null; }
        })
        .find(e => e && e.name === "PropertyRegistered");

      propertyId = regEvent ? Number(regEvent.args.propertyId) : (Number(await landRegistry.nextPropertyId()) - 1);
      console.log(`   ✅ Created Property #${propertyId} | Tx: ${receipt.hash.slice(0, 14)}...`);
    }

    seededProperties.push({
      ...item,
      propertyId,
      ownerAddress: owner.address,
      ownerSigner: owner,
      documentHash
    });
  }

  // 5. Authority Approval for All 10 Properties
  console.log("\n================================================================================");
  console.log("⚖️  Phase 2: Authority Adjudication & Verification (Account #19)");
  console.log("================================================================================");

  for (const item of seededProperties) {
    if (!item.propertyId) continue;
    const prop = await landRegistry.properties(item.propertyId);

    if (prop.isVerifiedByAuthority) {
      console.log(`   [Property #${item.propertyId}] ℹ️  Already verified by Authority.`);
    } else {
      console.log(`   [Property #${item.propertyId}] Verifying title as Authority (${authority.address.slice(0, 10)}...)...`);
      const verifyTx = await landRegistry.connect(authority).verifyRegistration(item.propertyId);
      const receipt = await verifyTx.wait();
      console.log(`   ✅ Certified Property #${item.propertyId} | Tx: ${receipt.hash.slice(0, 14)}...`);
    }
  }

  // 6. Marketplace Listings (Seed for-sale properties)
  console.log("\n================================================================================");
  console.log("🏷️  Phase 3: Marketplace Listings (Curated For-Sale Parcels)");
  console.log("================================================================================");

  for (const item of seededProperties) {
    if (!item.propertyId || !item.isMarketplaceListing) continue;

    const prop = await landRegistry.properties(item.propertyId);
    const priceWei = hre.ethers.parseEther(item.priceEth);

    if (prop.isForSale) {
      console.log(`   [Property #${item.propertyId}] ℹ️  Already listed on Marketplace for ${hre.ethers.formatEther(prop.price)} ETH.`);
    } else {
      console.log(`   [Property #${item.propertyId}] Listing on Marketplace for ${item.priceEth} ETH by Owner (${item.ownerAddress.slice(0, 10)}...)...`);
      const listTx = await landRegistry.connect(item.ownerSigner).listPropertyForSale(item.propertyId, priceWei);
      const receipt = await listTx.wait();
      console.log(`   ✅ Listed Property #${item.propertyId} on Marketplace | Tx: ${receipt.hash.slice(0, 14)}...`);
    }
  }

  // 7. Summary Table
  console.log("\n================================================================================");
  console.log("📊 Seeding Complete — Summary Table");
  console.log("================================================================================");
  console.table(seededProperties.map(p => ({
    "ID": p.propertyId,
    "Classification": p.classification,
    "Area (sqft)": p.area,
    "Owner": `${p.ownerAddress.slice(0, 6)}...${p.ownerAddress.slice(38)}`,
    "For Sale": p.isMarketplaceListing ? `Yes (${p.priceEth} ETH)` : "No (Private)",
    "Status": "Verified & Active"
  })));

  console.log("================================================================================");
  console.log("✨ All 10 properties seeded, verified by Authority, and indexed successfully!");
  console.log("================================================================================");
}

main().catch((error) => {
  console.error("❌ Seeding failed:", error);
  process.exitCode = 1;
});
