const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

/**
 * Simulation script for Academic Review System
 * Simulates a complete peer review workflow with multiple users
 */
async function main() {
  console.log("=====================================");
  console.log("Academic Review System Simulation");
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

  console.log("📄 Contract Address: " + contractAddress + "\n");

  // Get signers (simulating multiple users)
  const signers = await hre.ethers.getSigners();
  const deployer = signers[0];
  const authors = signers.slice(1, 4); // 3 authors
  const reviewers = signers.slice(4, 9); // 5 reviewers

  console.log("👥 Simulation Participants:");
  console.log(`   Deployer:   ${deployer.address}`);
  console.log(`   Authors:    ${authors.length} accounts`);
  console.log(`   Reviewers:  ${reviewers.length} accounts\n`);

  // Get contract instance
  const AcademicReviewSystem = await hre.ethers.getContractFactory("AcademicReviewSystem");
  const contract = AcademicReviewSystem.attach(contractAddress);

  // Simulation data
  const reviewerData = [
    { expertise: "Blockchain Technology and Consensus Mechanisms" },
    { expertise: "Cryptography and Privacy-Preserving Systems" },
    { expertise: "Distributed Systems and Network Security" },
    { expertise: "Machine Learning and Data Privacy" },
    { expertise: "Smart Contract Security and Formal Verification" },
  ];

  const paperData = [
    {
      title: "Scalable Byzantine Fault Tolerance for Blockchain Networks",
      abstract:
        "This paper presents a novel consensus algorithm that achieves high throughput while maintaining Byzantine fault tolerance properties. We demonstrate significant improvements over existing protocols.",
      ipfsHash: "QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG",
    },
    {
      title: "Zero-Knowledge Proofs for Privacy-Preserving Smart Contracts",
      abstract:
        "We introduce an efficient zero-knowledge proof system specifically designed for smart contract applications, enabling private transactions while maintaining verifiability.",
      ipfsHash: "QmRQguVr7YZ1hXqPFmWZb8zQZqKzjmCKzKwkqPn8tYUYWR",
    },
    {
      title: "Decentralized Identity Management Using Blockchain",
      abstract:
        "A comprehensive framework for self-sovereign identity management leveraging blockchain technology and verifiable credentials for enhanced privacy and control.",
      ipfsHash: "QmPZ9gcCEpqKTo6aq61g2nXGUhM4iCL3ewB6LDXZCtCBV",
    },
  ];

  const reviewComments = [
    "Excellent theoretical foundation with practical implementations. Highly recommended for publication.",
    "Innovative approach to a challenging problem. Some minor improvements needed in experimental methodology.",
    "Outstanding contribution to the field. The results are convincing and well-presented.",
    "Good work overall, but lacks comparison with recent state-of-the-art solutions.",
    "Promising research direction. Would benefit from additional real-world case studies.",
    "Solid technical work with clear explanations. Minor revisions suggested.",
  ];

  // Phase 1: Register Reviewers
  console.log("=====================================");
  console.log("Phase 1: Reviewer Registration");
  console.log("=====================================\n");

  for (let i = 0; i < reviewers.length; i++) {
    try {
      const tx = await contract.connect(reviewers[i]).registerReviewer(reviewerData[i].expertise);
      await tx.wait();

      console.log(`✅ Reviewer ${i + 1} registered`);
      console.log(`   Address: ${reviewers[i].address}`);
      console.log(`   Expertise: ${reviewerData[i].expertise}\n`);
    } catch (error) {
      console.log(`⚠️  Reviewer ${i + 1} registration failed: ${error.message}\n`);
    }
  }

  // Phase 2: Submit Papers
  console.log("=====================================");
  console.log("Phase 2: Paper Submission");
  console.log("=====================================\n");

  const submittedPaperIds = [];

  for (let i = 0; i < authors.length && i < paperData.length; i++) {
    try {
      const tx = await contract
        .connect(authors[i])
        .submitPaper(paperData[i].title, paperData[i].abstract, paperData[i].ipfsHash);

      const receipt = await tx.wait();
      const paperId = await contract.paperCount();
      submittedPaperIds.push(paperId);

      console.log(`✅ Paper ${i + 1} submitted by Author ${i + 1}`);
      console.log(`   Paper ID: ${paperId}`);
      console.log(`   Title: ${paperData[i].title}`);
      console.log(`   TX Hash: ${receipt.hash}\n`);
    } catch (error) {
      console.log(`⚠️  Paper ${i + 1} submission failed: ${error.message}\n`);
    }
  }

  // Phase 3: Submit Reviews
  console.log("=====================================");
  console.log("Phase 3: Review Submission");
  console.log("=====================================\n");

  const reviewStats = {
    totalReviews: 0,
    successfulReviews: 0,
    failedReviews: 0,
  };

  // Each paper gets reviews from 3 reviewers
  for (let paperIndex = 0; paperIndex < submittedPaperIds.length; paperIndex++) {
    const paperId = submittedPaperIds[paperIndex];

    console.log(`📝 Reviews for Paper ${paperId}:\n`);

    // Select 3 random reviewers for this paper
    const reviewersForPaper = reviewers.slice(0, 3);

    for (let reviewerIndex = 0; reviewerIndex < reviewersForPaper.length; reviewerIndex++) {
      try {
        const score = Math.floor(Math.random() * 4) + 7; // Score between 7-10
        const commentIndex = Math.floor(Math.random() * reviewComments.length);
        const inputProof = hre.ethers.keccak256(
          hre.ethers.toUtf8Bytes(`proof_${paperId}_${reviewerIndex}`)
        );

        const tx = await contract
          .connect(reviewersForPaper[reviewerIndex])
          .submitReview(paperId, score, inputProof, reviewComments[commentIndex]);

        await tx.wait();

        reviewStats.totalReviews++;
        reviewStats.successfulReviews++;

        console.log(`   ✅ Review ${reviewerIndex + 1} - Score: ${score}/10`);
        console.log(`      Reviewer: ${reviewersForPaper[reviewerIndex].address}`);
      } catch (error) {
        reviewStats.totalReviews++;
        reviewStats.failedReviews++;
        console.log(`   ⚠️  Review ${reviewerIndex + 1} failed: ${error.message}`);
      }
    }

    console.log();
  }

  // Phase 4: Query and Display Results
  console.log("=====================================");
  console.log("Phase 4: System State Overview");
  console.log("=====================================\n");

  const finalPaperCount = await contract.paperCount();
  console.log(`📊 System Statistics:`);
  console.log(`   Total Papers Submitted: ${finalPaperCount}`);
  console.log(`   Total Reviewers Registered: ${reviewers.length}`);
  console.log(`   Total Reviews Submitted: ${reviewStats.successfulReviews}`);
  console.log(
    `   Average Reviews per Paper: ${(reviewStats.successfulReviews / Number(finalPaperCount)).toFixed(2)}\n`
  );

  // Query all papers
  try {
    const allPapers = await contract.getAllPapers(0, 10);
    console.log(`📄 All Paper IDs: [${allPapers.join(", ")}]\n`);
  } catch (error) {
    console.log(`⚠️  Failed to query papers: ${error.message}\n`);
  }

  // Verification checks
  console.log("=====================================");
  console.log("Phase 5: Verification Checks");
  console.log("=====================================\n");

  // Verify reviewer status
  for (let i = 0; i < Math.min(3, reviewers.length); i++) {
    const isReviewer = await contract.reviewers(reviewers[i].address);
    const expertise = await contract.reviewerExpertise(reviewers[i].address);

    console.log(`✅ Reviewer ${i + 1}:`);
    console.log(`   Registered: ${isReviewer}`);
    console.log(`   Expertise: ${expertise}\n`);
  }

  // Summary Report
  console.log("=====================================");
  console.log("📋 Simulation Summary Report");
  console.log("=====================================\n");

  console.log("Workflow Completed:");
  console.log(`  ✅ Reviewer Registration: ${reviewers.length} reviewers`);
  console.log(`  ✅ Paper Submission: ${submittedPaperIds.length} papers`);
  console.log(`  ✅ Review Submission: ${reviewStats.successfulReviews} reviews`);
  console.log(`  ✅ System Queries: Successful\n`);

  console.log("Contract State:");
  console.log(`  📄 Total Papers: ${finalPaperCount}`);
  console.log(`  👥 Total Reviewers: ${reviewers.length}`);
  console.log(`  📝 Reviews Submitted: ${reviewStats.successfulReviews}`);
  console.log(`  ❌ Failed Reviews: ${reviewStats.failedReviews}\n`);

  if (network === "sepolia") {
    console.log("🔗 View on Etherscan:");
    console.log(`   https://sepolia.etherscan.io/address/${contractAddress}\n`);
  }

  console.log("=====================================");
  console.log("✅ Simulation Completed Successfully");
  console.log("=====================================\n");
}

// Execute simulation
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Simulation Failed:\n");
    console.error(error);
    process.exit(1);
  });
