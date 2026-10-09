const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const [deployer, authority] = await hre.ethers.getSigners();
  console.log("==================================================");
  console.log("Deploying LandRegistry Smart Contract");
  console.log("Deployer Address:", deployer.address);
  console.log("Authority (Admin) Address:", authority ? authority.address : deployer.address);
  console.log("Network:", hre.network.name);
  console.log("==================================================");

  const LandRegistry = await hre.ethers.getContractFactory("LandRegistry");
  const landRegistry = await LandRegistry.deploy();
  await landRegistry.waitForDeployment();

  const contractAddress = await landRegistry.getAddress();
  console.log(`✅ LandRegistry deployed successfully at: ${contractAddress}`);

  // Assign ADMIN_ROLE to the authority account if present
  if (authority && authority.address !== deployer.address) {
    const ADMIN_ROLE = await landRegistry.ADMIN_ROLE();
    const tx = await landRegistry.grantRole(ADMIN_ROLE, authority.address);
    await tx.wait();
    console.log(`✅ Granted ADMIN_ROLE to authority account: ${authority.address}`);
  }

  // Update backend and frontend configurations if on localhost
  const deploymentInfo = {
    address: contractAddress,
    network: hre.network.name,
    chainId: (await hre.ethers.provider.getNetwork()).chainId.toString(),
    deployedAt: new Date().toISOString()
  };

  const deploymentPath = path.join(__dirname, "deployment-info.json");
  fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
  console.log(`📝 Deployment info saved to: ${deploymentPath}`);
  console.log("==================================================");
}

main().catch((error) => {
  console.error("❌ Deployment failed:", error);
  process.exitCode = 1;
});
