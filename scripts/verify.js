const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

/**
 * Contract verification script for Etherscan
 * Reads deployment info and verifies contracts on block explorer
 */
async function main() {
  console.log("=====================================");
  console.log("Contract Verification on Etherscan");
  console.log("=====================================\n");

  const network = hre.network.name;
  console.log(`🌐 Network: ${network}\n`);

  if (network === "hardhat" || network === "localhost") {
    console.log("⚠️  Cannot verify contracts on local network");
    console.log("Please use a public testnet or mainnet\n");
    return;
  }

  // Load latest deployment info
  const deploymentsDir = path.join(__dirname, "..", "deployments");
  const latestFile = path.join(deploymentsDir, `${network}-latest.json`);

  if (!fs.existsSync(latestFile)) {
    throw new Error(`❌ No deployment found for network: ${network}`);
  }

  const deploymentInfo = JSON.parse(fs.readFileSync(latestFile, "utf8"));
  console.log("📄 Loaded deployment information:");
  console.log(`   Deployed at: ${deploymentInfo.timestamp}`);
  console.log(`   Deployer: ${deploymentInfo.deployer}\n`);

  // Verify AcademicReviewSystem contract
  if (deploymentInfo.contracts.AcademicReviewSystem) {
    const contract = deploymentInfo.contracts.AcademicReviewSystem;

    console.log("=====================================");
    console.log("🔍 Verifying AcademicReviewSystem");
    console.log("=====================================\n");

    console.log(`Contract Address: ${contract.address}`);
    console.log(`Constructor Args: ${JSON.stringify(contract.constructorArgs)}\n`);

    try {
      console.log("⏳ Submitting verification to Etherscan...\n");

      await hre.run("verify:verify", {
        address: contract.address,
        constructorArguments: contract.constructorArgs,
      });

      console.log("✅ AcademicReviewSystem verified successfully!\n");
    } catch (error) {
      if (error.message.includes("Already Verified")) {
        console.log("✅ Contract already verified on Etherscan\n");
      } else {
        console.error(`❌ Verification failed: ${error.message}\n`);
      }
    }
  }

  // Display Etherscan links
  console.log("=====================================");
  console.log("🔗 Etherscan Links");
  console.log("=====================================\n");

  const explorerUrl =
    network === "sepolia"
      ? "https://sepolia.etherscan.io"
      : network === "mainnet"
        ? "https://etherscan.io"
        : `https://${network}.etherscan.io`;

  if (deploymentInfo.contracts.AcademicReviewSystem) {
    console.log("AcademicReviewSystem:");
    console.log(
      `${explorerUrl}/address/${deploymentInfo.contracts.AcademicReviewSystem.address}#code\n`
    );
  }

  console.log("=====================================");
  console.log("✅ Verification Process Completed");
  console.log("=====================================\n");
}

// Execute verification
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Verification Failed:\n");
    console.error(error);
    process.exit(1);
  });
