const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const signers = await hre.ethers.getSigners();
  const deployer = signers[0]; // Account #0: Registrar Authority (0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266)

  console.log("==================================================");
  console.log("Deploying LandRegistry Smart Contract");
  console.log("Deployer / Registrar Authority (Account #0):", deployer.address);
  console.log("Network:", hre.network.name);
  console.log("==================================================");

  const LandRegistry = await hre.ethers.getContractFactory("LandRegistry");
  const landRegistry = await LandRegistry.deploy();
  await landRegistry.waitForDeployment();

  const contractAddress = await landRegistry.getAddress();
  console.log(`✅ LandRegistry deployed successfully at: ${contractAddress}`);

  // Retrieve contract roles
  const ADMIN_ROLE = await landRegistry.ADMIN_ROLE();
  const REGISTRAR_ROLE = await landRegistry.REGISTRAR_ROLE();

  // Explicitly ensure Account #0 (deployer) holds ADMIN_ROLE
  const hasAdmin = await landRegistry.hasRole(ADMIN_ROLE, deployer.address);
  if (!hasAdmin) {
    const txAdmin = await landRegistry.grantRole(ADMIN_ROLE, deployer.address);
    await txAdmin.wait();
  }
  console.log(`✅ Explicitly confirmed ADMIN_ROLE for Registrar (Account #0): ${deployer.address}`);

  // Explicitly grant REGISTRAR_ROLE to Account #0 for role completeness
  const hasRegistrar = await landRegistry.hasRole(REGISTRAR_ROLE, deployer.address);
  if (!hasRegistrar) {
    const txReg = await landRegistry.grantRole(REGISTRAR_ROLE, deployer.address);
    await txReg.wait();
  }
  console.log(`✅ Granted REGISTRAR_ROLE to Registrar (Account #0): ${deployer.address}`);

  // 1. Export Deployment Info
  const deploymentInfo = {
    address: contractAddress,
    network: hre.network.name,
    chainId: (await hre.ethers.provider.getNetwork()).chainId.toString(),
    registrarAuthority: deployer.address,
    roles: {
      ADMIN_ROLE: ADMIN_ROLE,
      REGISTRAR_ROLE: REGISTRAR_ROLE
    },
    deployedAt: new Date().toISOString()
  };

  const deploymentPath = path.join(__dirname, "deployment-info.json");
  fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
  console.log(`📝 Deployment info saved to: ${deploymentPath}`);

  // 2. Export Artifact / ABI to Frontend
  const artifactPath = path.join(__dirname, "../artifacts/contracts/LandRegistry.sol/LandRegistry.json");
  const frontendArtifactPath = path.join(__dirname, "../frontend/src/LandRegistry.json");
  if (fs.existsSync(artifactPath)) {
    const artifactData = fs.readFileSync(artifactPath, "utf8");
    fs.writeFileSync(frontendArtifactPath, artifactData);
    console.log(`📋 LandRegistry ABI & artifact synced to frontend: ${frontendArtifactPath}`);
  }

  // 3. Helper to synchronize key/value pairs in .env files
  function updateEnvFile(filePath, key, value) {
    if (!fs.existsSync(filePath)) return;
    let content = fs.readFileSync(filePath, "utf8");
    const regex = new RegExp(`^${key}=.*$`, "m");
    if (regex.test(content)) {
      content = content.replace(regex, `${key}=${value}`);
    } else {
      content += `\n${key}=${value}`;
    }
    fs.writeFileSync(filePath, content);
    console.log(`🔄 Updated ${key} in ${filePath}`);
  }

  // 4. Update Frontend and Backend environment configurations
  const frontendEnv = path.join(__dirname, "../frontend/.env");
  const backendEnv = path.join(__dirname, "../backend/.env");
  updateEnvFile(frontendEnv, "VITE_CONTRACT_ADDRESS", contractAddress);
  updateEnvFile(backendEnv, "CONTRACT_ADDRESS", contractAddress);

  console.log("==================================================");
  console.log("Deployment and Configuration Synchronization Complete!");
  console.log("==================================================");
}

main().catch((error) => {
  console.error("❌ Deployment failed:", error);
  process.exitCode = 1;
});
