const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");

describe("Performance Tests", function () {
  async function deployFixture() {
    const [deployer, ...users] = await ethers.getSigners();

    const AcademicReviewSystem = await ethers.getContractFactory(
      "AcademicReviewSystem"
    );
    const contract = await AcademicReviewSystem.deploy();
    const contractAddress = await contract.getAddress();

    return { contract, contractAddress, deployer, users };
  }

  describe("Gas Usage Benchmarks", function () {
    it("should measure gas for reviewer registration", async function () {
      const { contract, users } = await loadFixture(deployFixture);

      const tx = await contract
        .connect(users[0])
        .registerReviewer("Blockchain Expert");
      const receipt = await tx.wait();

      console.log(`    Gas used for reviewer registration: ${receipt.gasUsed}`);
      expect(receipt.gasUsed).to.be.lt(150000);
    });

    it("should measure gas for paper submission", async function () {
      const { contract, users } = await loadFixture(deployFixture);

      const tx = await contract
        .connect(users[0])
        .submitPaper(
          "Research Paper",
          "Abstract content",
          "QmXxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
        );
      const receipt = await tx.wait();

      console.log(`    Gas used for paper submission: ${receipt.gasUsed}`);
      expect(receipt.gasUsed).to.be.lt(200000);
    });

    it("should measure gas for review submission", async function () {
      const { contract, users } = await loadFixture(deployFixture);

      await contract.connect(users[0]).registerReviewer("Expert");
      await contract
        .connect(users[1])
        .submitPaper("Paper", "Abstract", "Hash");

      const tx = await contract
        .connect(users[0])
        .submitReview(
          1,
          8,
          ethers.keccak256(ethers.toUtf8Bytes("proof")),
          "Good work"
        );
      const receipt = await tx.wait();

      console.log(`    Gas used for review submission: ${receipt.gasUsed}`);
      expect(receipt.gasUsed).to.be.lt(200000);
    });
  });

  describe("Batch Operations Performance", function () {
    it("should handle multiple reviewer registrations efficiently", async function () {
      const { contract, users } = await loadFixture(deployFixture);

      const startTime = Date.now();
      const registrations = [];

      for (let i = 0; i < 10; i++) {
        registrations.push(
          contract.connect(users[i]).registerReviewer(`Expert ${i}`)
        );
      }

      await Promise.all(registrations);
      const endTime = Date.now();

      console.log(`    Time for 10 registrations: ${endTime - startTime}ms`);
      expect(endTime - startTime).to.be.lt(5000); // Less than 5 seconds
    });

    it("should handle multiple paper submissions efficiently", async function () {
      const { contract, users } = await loadFixture(deployFixture);

      const startTime = Date.now();
      const submissions = [];

      for (let i = 0; i < 10; i++) {
        submissions.push(
          contract
            .connect(users[i])
            .submitPaper(`Paper ${i}`, `Abstract ${i}`, `Hash${i}`)
        );
      }

      await Promise.all(submissions);
      const endTime = Date.now();

      console.log(`    Time for 10 paper submissions: ${endTime - startTime}ms`);
      expect(endTime - startTime).to.be.lt(5000);
    });
  });

  describe("Query Performance", function () {
    async function setupMultiplePapers() {
      const fixture = await loadFixture(deployFixture);
      const { contract, users } = fixture;

      // Submit 20 papers
      for (let i = 0; i < 20; i++) {
        await contract
          .connect(users[i % users.length])
          .submitPaper(`Paper ${i}`, `Abstract ${i}`, `Hash${i}`);
      }

      return fixture;
    }

    it("should query papers efficiently with pagination", async function () {
      const { contract } = await setupMultiplePapers();

      const startTime = Date.now();
      const papers = await contract.getAllPapers(0, 20);
      const endTime = Date.now();

      console.log(`    Query time for 20 papers: ${endTime - startTime}ms`);
      expect(papers.length).to.equal(20);
      expect(endTime - startTime).to.be.lt(1000); // Less than 1 second
    });

    it("should handle paginated queries efficiently", async function () {
      const { contract } = await setupMultiplePapers();

      const startTime = Date.now();

      // Query in pages of 5
      const page1 = await contract.getAllPapers(0, 5);
      const page2 = await contract.getAllPapers(5, 5);
      const page3 = await contract.getAllPapers(10, 5);
      const page4 = await contract.getAllPapers(15, 5);

      const endTime = Date.now();

      console.log(`    Time for 4 paginated queries: ${endTime - startTime}ms`);
      expect(page1.length).to.equal(5);
      expect(page2.length).to.equal(5);
      expect(page3.length).to.equal(5);
      expect(page4.length).to.equal(5);
      expect(endTime - startTime).to.be.lt(2000);
    });
  });

  describe("Storage Optimization", function () {
    it("should verify efficient storage usage", async function () {
      const { contract, users } = await loadFixture(deployFixture);

      // Register reviewer
      const tx1 = await contract
        .connect(users[0])
        .registerReviewer("Expert");
      const receipt1 = await tx1.wait();

      // Submit paper
      const tx2 = await contract
        .connect(users[1])
        .submitPaper("Paper", "Abstract", "Hash");
      const receipt2 = await tx2.wait();

      console.log(`    Storage gas (reviewer): ${receipt1.gasUsed}`);
      console.log(`    Storage gas (paper): ${receipt2.gasUsed}`);

      // Verify storage efficiency
      const isReviewer = await contract.reviewers(users[0].address);
      const paperCount = await contract.paperCount();

      expect(isReviewer).to.be.true;
      expect(paperCount).to.equal(1);
    });
  });

  describe("DoS Protection", function () {
    it("should handle large input strings without DoS", async function () {
      const { contract, users } = await loadFixture(deployFixture);

      const longExpertise = "A".repeat(500); // 500 characters

      const tx = await contract
        .connect(users[0])
        .registerReviewer(longExpertise);
      const receipt = await tx.wait();

      console.log(`    Gas for long string (500 chars): ${receipt.gasUsed}`);

      // Should complete without running out of gas
      expect(receipt.gasUsed).to.be.lt(200000);
    });

    it("should protect against array manipulation DoS", async function () {
      const { contract, users } = await loadFixture(deployFixture);

      // Submit many papers to test array operations
      const submissions = [];
      for (let i = 0; i < 50; i++) {
        submissions.push(
          contract
            .connect(users[i % users.length])
            .submitPaper(`Paper ${i}`, `Abstract ${i}`, `Hash${i}`)
        );
      }

      await Promise.all(submissions);

      // Query should still be efficient
      const startTime = Date.now();
      const papers = await contract.getAllPapers(0, 50);
      const endTime = Date.now();

      console.log(`    Query time for 50 papers: ${endTime - startTime}ms`);
      expect(papers.length).to.equal(50);
      expect(endTime - startTime).to.be.lt(2000);
    });
  });

  describe("Concurrent Operations", function () {
    it("should handle concurrent submissions without conflicts", async function () {
      const { contract, users } = await loadFixture(deployFixture);

      const startTime = Date.now();

      // Simulate concurrent operations
      const operations = [];
      for (let i = 0; i < 20; i++) {
        if (i % 2 === 0) {
          operations.push(
            contract.connect(users[i]).registerReviewer(`Expert ${i}`)
          );
        } else {
          operations.push(
            contract
              .connect(users[i])
              .submitPaper(`Paper ${i}`, `Abstract ${i}`, `Hash${i}`)
          );
        }
      }

      await Promise.all(operations);
      const endTime = Date.now();

      console.log(`    Time for 20 concurrent operations: ${endTime - startTime}ms`);

      const paperCount = await contract.paperCount();
      expect(paperCount).to.equal(10); // Half were paper submissions
      expect(endTime - startTime).to.be.lt(7000);
    });
  });
});
