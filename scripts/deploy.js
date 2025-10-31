const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

/**
 * Main deployment script for Academic Review System
 * Deploys all contracts to the specified network
 */
async function main() {
  console.log("=====================================");
  console.log("Academic Review System Deployment");
  console.log("=====================================\n");

  // Get network information
  const network = hre.network.name;
  console.log(`🌐 Network: ${network}`);
  console.log(`⛓️  Chain ID: ${(await hre.ethers.provider.getNetwork()).chainId}\n`);

  // Get deployer account
  const [deployer] = await hre.ethers.getSigners();
  console.log(`📍 Deployer Address: ${deployer.address}`);

  // Check deployer balance
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log(`💰 Deployer Balance: ${hre.ethers.formatEther(balance)} ETH\n`);

  if (balance === 0n) {
    throw new Error("❌ Deployer account has no balance. Please fund the account.");
  }

  const deploymentInfo = {
    network: network,
    chainId: Number((await hre.ethers.provider.getNetwork()).chainId),
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    contracts: {},
  };

  // Deploy AcademicReviewSystem contract
  console.log("=====================================");
  console.log("📄 Deploying AcademicReviewSystem Contract");
  console.log("=====================================\n");

  const AcademicReviewSystem = await hre.ethers.getContractFactory("AcademicReviewSystem");
  console.log("⏳ Deployment in progress...");

  const academicReview = await AcademicReviewSystem.deploy();
  await academicReview.waitForDeployment();

  const academicReviewAddress = await academicReview.getAddress();
  console.log(`✅ AcademicReviewSystem deployed to: ${academicReviewAddress}\n`);

  deploymentInfo.contracts.AcademicReviewSystem = {
    address: academicReviewAddress,
    constructorArgs: [],
  };

  // Verify deployment by reading contract state
  console.log("=====================================");
  console.log("🔍 Verifying Deployment");
  console.log("=====================================\n");

  try {
    const owner = await academicReview.owner();
    const paperCount = await academicReview.paperCount();

    console.log(`✅ Contract Owner: ${owner}`);
    console.log(`✅ Initial Paper Count: ${paperCount}`);
    console.log(`✅ Owner matches deployer: ${owner === deployer.address}\n`);

    deploymentInfo.verification = {
      owner: owner,
      paperCount: Number(paperCount),
      ownerMatchesDeployer: owner === deployer.address,
    };
  } catch (error) {
    console.log(`⚠️  Verification failed: ${error.message}\n`);
  }

  // Save deployment information
  console.log("=====================================");
  console.log("💾 Saving Deployment Information");
  console.log("=====================================\n");

  const deploymentsDir = path.join(__dirname, "..", "deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  const deploymentFile = path.join(deploymentsDir, `${network}-${Date.now()}.json`);
  fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
  console.log(`✅ Deployment info saved to: ${deploymentFile}\n`);

  // Save latest deployment
  const latestFile = path.join(deploymentsDir, `${network}-latest.json`);
  fs.writeFileSync(latestFile, JSON.stringify(deploymentInfo, null, 2));
  console.log(`✅ Latest deployment saved to: ${latestFile}\n`);

  // Display summary
  console.log("=====================================");
  console.log("📋 Deployment Summary");
  console.log("=====================================\n");

  console.log(`Network:                 ${network}`);
  console.log(`Chain ID:                ${deploymentInfo.chainId}`);
  console.log(`Deployer:                ${deployer.address}`);
  console.log(`Timestamp:               ${deploymentInfo.timestamp}`);
  console.log(`\nContract Addresses:`);
  console.log(`AcademicReviewSystem:    ${academicReviewAddress}`);

  // Etherscan verification commands
  if (network === "sepolia") {
    console.log("\n=====================================");
    console.log("🔗 Etherscan Verification");
    console.log("=====================================\n");

    console.log("To verify the contract on Etherscan, run:\n");
    console.log(`npx hardhat verify --network sepolia ${academicReviewAddress}\n`);

    console.log("Etherscan Links:");
    console.log(`https://sepolia.etherscan.io/address/${academicReviewAddress}\n`);
  }

  // Next steps
  console.log("=====================================");
  console.log("📝 Next Steps");
  console.log("=====================================\n");

  console.log("1. Verify contract on Etherscan:");
  console.log(`   npm run verify:sepolia\n`);

  console.log("2. Test contract interaction:");
  console.log(`   npm run interact:${network}\n`);

  console.log("3. Run simulation:");
  console.log(`   npm run simulate:${network}\n`);

  console.log("4. Update frontend configuration:");
  console.log(`   Update contract address in frontend config\n`);

  console.log("=====================================");
  console.log("✅ Deployment Completed Successfully!");
  console.log("=====================================\n");

  return deploymentInfo;
}

// Execute deployment
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Deployment Failed:\n");
    console.error(error);
    process.exit(1);
  });
