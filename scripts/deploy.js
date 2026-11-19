const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const signers = await hre.ethers.getSigners();
  const deployer = signers[0];

  console.log("==================================================");
  console.log("Deploying LandRegistry Smart Contract");
  console.log("Deployer / Registrar Authority:", deployer.address);
  console.log("Network:", hre.network.name);

  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Deployer Balance:", hre.ethers.formatEther(balance), "ETH");
  const isLocal = hre.network.name === "hardhat" || hre.network.name === "localhost";
  if (!isLocal && balance < hre.ethers.parseEther("0.01")) {
    throw new Error(`Insufficient Sepolia ETH balance: ${hre.ethers.formatEther(balance)} ETH. Minimum 0.01 ETH required.`);
  }
  console.log("==================================================");

  const LandRegistry = await hre.ethers.getContractFactory("LandRegistry");
  const landRegistry = await LandRegistry.deploy();
  await landRegistry.waitForDeployment();

  const contractAddress = await landRegistry.getAddress();
  console.log(`✅ LandRegistry deployed successfully at: ${contractAddress}`);

  // Wait for block confirmations on public testnets
  const confirmations = isLocal ? 1 : 2;
  console.log(`Waiting for ${confirmations} confirmation(s)...`);

  let deploymentBlock = 0;
  const deployTx = landRegistry.deploymentTransaction();
  if (deployTx) {
    const receipt = await deployTx.wait(confirmations);
    deploymentBlock = receipt ? receipt.blockNumber : await hre.ethers.provider.getBlockNumber();
  } else {
    deploymentBlock = await hre.ethers.provider.getBlockNumber();
  }
  console.log(`📦 Deployed in block: ${deploymentBlock}`);

  // Retrieve contract roles
  const ADMIN_ROLE = await landRegistry.ADMIN_ROLE();
  const REGISTRAR_ROLE = await landRegistry.REGISTRAR_ROLE();

  // Explicitly ensure deployer holds ADMIN_ROLE
  const hasAdmin = await landRegistry.hasRole(ADMIN_ROLE, deployer.address);
  if (!hasAdmin) {
    const txAdmin = await landRegistry.grantRole(ADMIN_ROLE, deployer.address);
    await txAdmin.wait();
  }
  console.log(`✅ Explicitly confirmed ADMIN_ROLE for Registrar: ${deployer.address}`);

  // Explicitly grant REGISTRAR_ROLE to deployer for role completeness
  const hasRegistrar = await landRegistry.hasRole(REGISTRAR_ROLE, deployer.address);
  if (!hasRegistrar) {
    const txReg = await landRegistry.grantRole(REGISTRAR_ROLE, deployer.address);
    await txReg.wait();
  }
  console.log(`✅ Granted REGISTRAR_ROLE to Registrar: ${deployer.address}`);

  const currentNetwork = await hre.ethers.provider.getNetwork();
  const chainIdStr = currentNetwork.chainId.toString();

  // 1. Export Deployment Info
  const deploymentInfo = {
    address: contractAddress,
    network: hre.network.name,
    chainId: chainIdStr,
    deploymentBlock: deploymentBlock,
    transactionHash: deployTx ? deployTx.hash : null,
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
    let content = "";
    if (fs.existsSync(filePath)) {
      content = fs.readFileSync(filePath, "utf8");
    }
    const regex = new RegExp(`^${key}=.*$`, "m");
    if (regex.test(content)) {
      content = content.replace(regex, `${key}=${value}`);
    } else {
      content = content.trimEnd() ? `${content.trimEnd()}\n${key}=${value}\n` : `${key}=${value}\n`;
    }
    fs.writeFileSync(filePath, content);
    console.log(`🔄 Updated ${key}=${value} in ${filePath}`);
  }

  // 4. Update Frontend, Backend, and Root environment configurations
  const frontendEnv = path.join(__dirname, "../frontend/.env");
  const backendEnv = path.join(__dirname, "../backend/.env");
  const rootEnv = path.join(__dirname, "../.env");

  updateEnvFile(frontendEnv, "VITE_CONTRACT_ADDRESS", contractAddress);
  updateEnvFile(frontendEnv, "VITE_SUPPORTED_CHAIN_ID", chainIdStr);

  updateEnvFile(backendEnv, "CONTRACT_ADDRESS", contractAddress);
  updateEnvFile(backendEnv, "CONTRACT_DEPLOYMENT_BLOCK", deploymentBlock.toString());
  updateEnvFile(backendEnv, "AUTHORITY_ADDRESS", deployer.address);

  if (hre.network.name === "sepolia" && process.env.SEPOLIA_RPC_URL) {
    updateEnvFile(backendEnv, "RPC_URL", process.env.SEPOLIA_RPC_URL);
  }

  updateEnvFile(rootEnv, "CONTRACT_ADDRESS", contractAddress);
  updateEnvFile(rootEnv, "CONTRACT_DEPLOYMENT_BLOCK", deploymentBlock.toString());

  console.log("==================================================");
  console.log("Deployment and Configuration Synchronization Complete!");
  console.log("==================================================");
}

main().catch((error) => {
  console.error("❌ Deployment failed:", error);
  process.exitCode = 1;
});
