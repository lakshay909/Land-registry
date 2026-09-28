const hre = require("hardhat");

async function main() {
  const LandRegistry = await hre.ethers.getContractFactory("LandRegistry");
  const registry = await LandRegistry.deploy();
  await registry.waitForDeployment();

  const tx = await registry.registerProperty("test_loc", 1000, hre.ethers.id("doc1"));
  await tx.wait();

  // Test queryFilter
  const logs = await registry.queryFilter("PropertyRegistered");
  const qEvent = logs[logs.length - 1];
  console.log("=== queryFilter EVENT PROPERTIES ===");
  console.log("Has qEvent.logIndex?", qEvent.logIndex !== undefined);
  console.log("Has qEvent.index?", qEvent.index !== undefined);
  console.log("Has qEvent.log?.index?", qEvent.log && qEvent.log.index !== undefined);
  console.log("Top level keys of queryFilter event object:");
  console.log(Object.keys(qEvent));

  // Test real-time listener
  return new Promise((resolve) => {
      registry.once("PropertyRegistered", (...args) => {
        const rtEvent = args[args.length - 1];
        console.log("\n=== real-time (.on/.once) EVENT PROPERTIES ===");
        console.log("Has rtEvent.logIndex?", rtEvent.logIndex !== undefined);
        console.log("Has rtEvent.index?", rtEvent.index !== undefined);
        console.log("Has rtEvent.log?.index?", rtEvent.log && rtEvent.log.index !== undefined);
        console.log("Top level keys of real-time event object:");
        console.log(Object.keys(rtEvent));
        resolve();
      });
      // trigger it again
      registry.registerProperty("test_loc2", 2000, hre.ethers.id("doc2"));
  });
}

main().catch(console.error);
