const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

/**
 * Interactive script to interact with deployed contracts
 * Demonstrates basic contract functionality
 */
async function main() {
  console.log("=====================================");
  console.log("Academic Review System Interaction");
  console.log("=====================================\n");

  const network = hre.network.name;
  console.log(`🌐 Network: ${network}\n`);

  // Load deployment information
  const deploymentsDir = path.join(__dirname, "..", "deployments");
  const latestFile = path.join(deploymentsDir, `${network}-latest.json`);

  if (!fs.existsSync(latestFile)) {
    throw new Error(`❌ No deployment found for network: ${network}`);
  }

  const deploymentInfo = JSON.parse(fs.readFileSync(latestFile, "utf8"));
  const contractAddress = deploymentInfo.contracts.AcademicReviewSystem.address;

  console.log("📄 Contract Information:");
  console.log(`   Address: ${contractAddress}`);
  console.log(`   Network: ${network}\n`);

  // Get signers
  const [deployer, author, reviewer1, reviewer2] = await hre.ethers.getSigners();

  console.log("👥 Account Information:");
  console.log(`   Deployer:  ${deployer.address}`);
  console.log(`   Author:    ${author.address}`);
  console.log(`   Reviewer1: ${reviewer1.address}`);
  console.log(`   Reviewer2: ${reviewer2.address}\n`);

  // Get contract instance
  const AcademicReviewSystem = await hre.ethers.getContractFactory("AcademicReviewSystem");
  const contract = AcademicReviewSystem.attach(contractAddress);

  // Read initial state
  console.log("=====================================");
  console.log("📊 Initial Contract State");
  console.log("=====================================\n");

  const owner = await contract.owner();
  const paperCount = await contract.paperCount();

  console.log(`Owner:       ${owner}`);
  console.log(`Paper Count: ${paperCount}\n`);

  // Register reviewers
  console.log("=====================================");
  console.log("👨‍🔬 Registering Reviewers");
  console.log("=====================================\n");

  try {
    const tx1 = await contract.connect(reviewer1).registerReviewer("Blockchain and Cryptography");
    await tx1.wait();
    console.log(`✅ Reviewer 1 registered: ${reviewer1.address}`);

    const tx2 = await contract.connect(reviewer2).registerReviewer("Distributed Systems");
    await tx2.wait();
    console.log(`✅ Reviewer 2 registered: ${reviewer2.address}\n`);

    // Verify reviewer registration
    const isReviewer1 = await contract.reviewers(reviewer1.address);
    const expertise1 = await contract.reviewerExpertise(reviewer1.address);
    console.log(`Reviewer 1 Status: ${isReviewer1}`);
    console.log(`Reviewer 1 Expertise: ${expertise1}\n`);
  } catch (error) {
    console.log(`⚠️  Reviewer registration: ${error.message}\n`);
  }

  // Submit a paper
  console.log("=====================================");
  console.log("📝 Submitting Research Paper");
  console.log("=====================================\n");

  try {
    const submitTx = await contract
      .connect(author)
      .submitPaper(
        "Privacy-Preserving Blockchain Consensus",
        "A novel approach to achieving consensus while maintaining transaction privacy using zero-knowledge proofs",
        "QmXxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
      );

    const receipt = await submitTx.wait();
    console.log(`✅ Paper submitted successfully`);
    console.log(`   Transaction Hash: ${receipt.hash}\n`);

    const newPaperCount = await contract.paperCount();
    console.log(`Updated Paper Count: ${newPaperCount}\n`);
  } catch (error) {
    console.log(`⚠️  Paper submission: ${error.message}\n`);
  }

  // Submit reviews
  console.log("=====================================");
  console.log("📋 Submitting Reviews");
  console.log("=====================================\n");

  try {
    const paperId = await contract.paperCount();

    // Review from Reviewer 1
    const reviewTx1 = await contract
      .connect(reviewer1)
      .submitReview(
        paperId,
        8,
        hre.ethers.keccak256(hre.ethers.toUtf8Bytes("proof1")),
        "Excellent work on privacy preservation. The zero-knowledge proof implementation is innovative."
      );
    await reviewTx1.wait();
    console.log(`✅ Review submitted by Reviewer 1 (Score: 8/10)`);

    // Review from Reviewer 2
    const reviewTx2 = await contract
      .connect(reviewer2)
      .submitReview(
        paperId,
        9,
        hre.ethers.keccak256(hre.ethers.toUtf8Bytes("proof2")),
        "Outstanding contribution to the field. Well-structured and thoroughly researched."
      );
    await reviewTx2.wait();
    console.log(`✅ Review submitted by Reviewer 2 (Score: 9/10)\n`);
  } catch (error) {
    console.log(`⚠️  Review submission: ${error.message}\n`);
  }

  // Query papers
  console.log("=====================================");
  console.log("🔍 Querying Papers");
  console.log("=====================================\n");

  try {
    const papers = await contract.getAllPapers(0, 10);
    console.log(`Total papers retrieved: ${papers.length}`);
    console.log(`Paper IDs: ${papers.join(", ")}\n`);
  } catch (error) {
    console.log(`⚠️  Query failed: ${error.message}\n`);
  }

  // Display final state
  console.log("=====================================");
  console.log("📊 Final Contract State");
  console.log("=====================================\n");

  const finalPaperCount = await contract.paperCount();
  console.log(`Total Papers: ${finalPaperCount}`);
  console.log(`Total Reviewers: 2\n`);

  console.log("=====================================");
  console.log("✅ Interaction Completed Successfully");
  console.log("=====================================\n");
}

// Execute interaction
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Interaction Failed:\n");
    console.error(error);
    process.exit(1);
  });
