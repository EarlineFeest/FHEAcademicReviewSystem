const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");

describe("AcademicReviewSystem", function () {
  // Deployment fixture for clean state
  async function deployFixture() {
    const [deployer, author1, author2, reviewer1, reviewer2, reviewer3, user1] =
      await ethers.getSigners();

    const AcademicReviewSystem = await ethers.getContractFactory("AcademicReviewSystem");
    const contract = await AcademicReviewSystem.deploy();
    const contractAddress = await contract.getAddress();

    return {
      contract,
      contractAddress,
      deployer,
      author1,
      author2,
      reviewer1,
      reviewer2,
      reviewer3,
      user1,
    };
  }

  describe("Deployment", function () {
    it("should deploy successfully with valid address", async function () {
      const { contract } = await loadFixture(deployFixture);
      expect(await contract.getAddress()).to.be.properAddress;
    });

    it("should set deployer as owner", async function () {
      const { contract, deployer } = await loadFixture(deployFixture);
      expect(await contract.owner()).to.equal(deployer.address);
    });

    it("should initialize with zero paper count", async function () {
      const { contract } = await loadFixture(deployFixture);
      expect(await contract.paperCount()).to.equal(0);
    });

    it("should have correct initial state", async function () {
      const { contract } = await loadFixture(deployFixture);
      const paperCount = await contract.paperCount();
      const owner = await contract.owner();

      expect(paperCount).to.equal(0);
      expect(owner).to.be.properAddress;
    });
  });

  describe("Reviewer Registration", function () {
    it("should allow user to register as reviewer", async function () {
      const { contract, reviewer1 } = await loadFixture(deployFixture);

      await expect(contract.connect(reviewer1).registerReviewer("Blockchain Technology")).to.not.be
        .reverted;
    });

    it("should emit ReviewerRegistered event", async function () {
      const { contract, reviewer1 } = await loadFixture(deployFixture);
      const expertise = "Cryptography and Security";

      await expect(contract.connect(reviewer1).registerReviewer(expertise))
        .to.emit(contract, "ReviewerRegistered")
        .withArgs(reviewer1.address, expertise);
    });

    it("should set reviewer status to true", async function () {
      const { contract, reviewer1 } = await loadFixture(deployFixture);

      await contract.connect(reviewer1).registerReviewer("Machine Learning");
      expect(await contract.reviewers(reviewer1.address)).to.be.true;
    });

    it("should store reviewer expertise correctly", async function () {
      const { contract, reviewer1 } = await loadFixture(deployFixture);
      const expertise = "Distributed Systems";

      await contract.connect(reviewer1).registerReviewer(expertise);
      expect(await contract.reviewerExpertise(reviewer1.address)).to.equal(expertise);
    });

    it("should reject registration with empty expertise", async function () {
      const { contract, reviewer1 } = await loadFixture(deployFixture);

      await expect(contract.connect(reviewer1).registerReviewer("")).to.be.revertedWith(
        "Expertise required"
      );
    });

    it("should reject duplicate reviewer registration", async function () {
      const { contract, reviewer1 } = await loadFixture(deployFixture);

      await contract.connect(reviewer1).registerReviewer("AI Research");
      await expect(contract.connect(reviewer1).registerReviewer("ML Research")).to.be.revertedWith(
        "Already registered"
      );
    });

    it("should allow multiple different reviewers to register", async function () {
      const { contract, reviewer1, reviewer2, reviewer3 } = await loadFixture(deployFixture);

      await contract.connect(reviewer1).registerReviewer("Blockchain");
      await contract.connect(reviewer2).registerReviewer("Cryptography");
      await contract.connect(reviewer3).registerReviewer("Networking");

      expect(await contract.reviewers(reviewer1.address)).to.be.true;
      expect(await contract.reviewers(reviewer2.address)).to.be.true;
      expect(await contract.reviewers(reviewer3.address)).to.be.true;
    });

    it("should handle long expertise strings", async function () {
      const { contract, reviewer1 } = await loadFixture(deployFixture);
      const longExpertise =
        "Blockchain Technology, Distributed Systems, Consensus Algorithms, Smart Contract Security, and Cryptographic Protocols";

      await contract.connect(reviewer1).registerReviewer(longExpertise);
      expect(await contract.reviewerExpertise(reviewer1.address)).to.equal(longExpertise);
    });
  });

  describe("Paper Submission", function () {
    it("should allow author to submit paper", async function () {
      const { contract, author1 } = await loadFixture(deployFixture);

      await expect(
        contract
          .connect(author1)
          .submitPaper(
            "Research on Blockchain",
            "This paper explores blockchain technology",
            "QmXxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
          )
      ).to.not.be.reverted;
    });

    it("should emit PaperSubmitted event", async function () {
      const { contract, author1 } = await loadFixture(deployFixture);
      const title = "Privacy-Preserving Systems";
      const abstractText = "An exploration of privacy techniques";
      const ipfsHash = "QmYyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyy";

      await expect(contract.connect(author1).submitPaper(title, abstractText, ipfsHash))
        .to.emit(contract, "PaperSubmitted")
        .withArgs(1, author1.address, title);
    });

    it("should increment paper count", async function () {
      const { contract, author1 } = await loadFixture(deployFixture);

      await contract.connect(author1).submitPaper("Title 1", "Abstract 1", "Hash1");
      expect(await contract.paperCount()).to.equal(1);

      await contract.connect(author1).submitPaper("Title 2", "Abstract 2", "Hash2");
      expect(await contract.paperCount()).to.equal(2);
    });

    it("should return correct paper ID", async function () {
      const { contract, author1 } = await loadFixture(deployFixture);

      const tx = await contract.connect(author1).submitPaper("Title", "Abstract", "Hash");
      const receipt = await tx.wait();

      const event = receipt.logs.find(
        (log) => contract.interface.parseLog(log)?.name === "PaperSubmitted"
      );
      const parsedEvent = contract.interface.parseLog(event);

      expect(parsedEvent.args.paperId).to.equal(1);
    });

    it("should reject submission with empty title", async function () {
      const { contract, author1 } = await loadFixture(deployFixture);

      await expect(
        contract.connect(author1).submitPaper("", "Abstract text", "IpfsHash")
      ).to.be.revertedWith("Title required");
    });

    it("should reject submission with empty abstract", async function () {
      const { contract, author1 } = await loadFixture(deployFixture);

      await expect(
        contract.connect(author1).submitPaper("Title", "", "IpfsHash")
      ).to.be.revertedWith("Abstract required");
    });

    it("should reject submission with empty IPFS hash", async function () {
      const { contract, author1 } = await loadFixture(deployFixture);

      await expect(
        contract.connect(author1).submitPaper("Title", "Abstract", "")
      ).to.be.revertedWith("IPFS hash required");
    });

    it("should allow multiple papers from same author", async function () {
      const { contract, author1 } = await loadFixture(deployFixture);

      await contract.connect(author1).submitPaper("Paper 1", "Abstract 1", "Hash1");
      await contract.connect(author1).submitPaper("Paper 2", "Abstract 2", "Hash2");

      expect(await contract.paperCount()).to.equal(2);
    });

    it("should allow papers from different authors", async function () {
      const { contract, author1, author2 } = await loadFixture(deployFixture);

      await contract.connect(author1).submitPaper("Paper A", "Abstract A", "HashA");
      await contract.connect(author2).submitPaper("Paper B", "Abstract B", "HashB");

      expect(await contract.paperCount()).to.equal(2);
    });

    it("should handle long paper titles", async function () {
      const { contract, author1 } = await loadFixture(deployFixture);
      const longTitle =
        "A Comprehensive Analysis of Byzantine Fault Tolerance in Modern Blockchain Networks with Focus on Scalability and Performance Optimization";

      await expect(contract.connect(author1).submitPaper(longTitle, "Abstract content", "IpfsHash"))
        .to.not.be.reverted;
    });
  });

  describe("Review Submission", function () {
    async function setupPaperAndReviewer() {
      const fixture = await loadFixture(deployFixture);
      const { contract, author1, reviewer1 } = fixture;

      // Register reviewer
      await contract.connect(reviewer1).registerReviewer("Expert");

      // Submit paper
      await contract.connect(author1).submitPaper("Test Paper", "Test Abstract", "TestHash");

      return fixture;
    }

    it("should allow registered reviewer to submit review", async function () {
      const { contract, reviewer1 } = await setupPaperAndReviewer();

      await expect(
        contract
          .connect(reviewer1)
          .submitReview(1, 8, ethers.keccak256(ethers.toUtf8Bytes("proof1")), "Excellent work")
      ).to.not.be.reverted;
    });

    it("should emit ReviewSubmitted event", async function () {
      const { contract, reviewer1 } = await setupPaperAndReviewer();

      await expect(
        contract
          .connect(reviewer1)
          .submitReview(1, 8, ethers.keccak256(ethers.toUtf8Bytes("proof1")), "Good research")
      )
        .to.emit(contract, "ReviewSubmitted")
        .withArgs(1, reviewer1.address);
    });

    it("should reject review for invalid paper ID (zero)", async function () {
      const { contract, reviewer1 } = await setupPaperAndReviewer();

      await expect(
        contract
          .connect(reviewer1)
          .submitReview(0, 8, ethers.keccak256(ethers.toUtf8Bytes("proof")), "Comment")
      ).to.be.revertedWith("Invalid paper ID");
    });

    it("should reject review for non-existent paper", async function () {
      const { contract, reviewer1 } = await setupPaperAndReviewer();

      await expect(
        contract
          .connect(reviewer1)
          .submitReview(999, 8, ethers.keccak256(ethers.toUtf8Bytes("proof")), "Comment")
      ).to.be.revertedWith("Invalid paper ID");
    });

    it("should reject review from non-registered reviewer", async function () {
      const { contract, author1, user1 } = await setupPaperAndReviewer();

      await expect(
        contract
          .connect(user1)
          .submitReview(1, 8, ethers.keccak256(ethers.toUtf8Bytes("proof")), "Comment")
      ).to.be.revertedWith("Not a registered reviewer");
    });

    it("should reject review with score below minimum", async function () {
      const { contract, reviewer1 } = await setupPaperAndReviewer();

      await expect(
        contract
          .connect(reviewer1)
          .submitReview(1, 0, ethers.keccak256(ethers.toUtf8Bytes("proof")), "Comment")
      ).to.be.revertedWith("Invalid score");
    });

    it("should reject review with score above maximum", async function () {
      const { contract, reviewer1 } = await setupPaperAndReviewer();

      await expect(
        contract
          .connect(reviewer1)
          .submitReview(1, 11, ethers.keccak256(ethers.toUtf8Bytes("proof")), "Comment")
      ).to.be.revertedWith("Invalid score");
    });

    it("should accept minimum valid score (1)", async function () {
      const { contract, reviewer1 } = await setupPaperAndReviewer();

      await expect(
        contract
          .connect(reviewer1)
          .submitReview(1, 1, ethers.keccak256(ethers.toUtf8Bytes("proof")), "Needs improvement")
      ).to.not.be.reverted;
    });

    it("should accept maximum valid score (10)", async function () {
      const { contract, reviewer1 } = await setupPaperAndReviewer();

      await expect(
        contract
          .connect(reviewer1)
          .submitReview(1, 10, ethers.keccak256(ethers.toUtf8Bytes("proof")), "Outstanding work")
      ).to.not.be.reverted;
    });

    it("should reject review with empty comments", async function () {
      const { contract, reviewer1 } = await setupPaperAndReviewer();

      await expect(
        contract
          .connect(reviewer1)
          .submitReview(1, 8, ethers.keccak256(ethers.toUtf8Bytes("proof")), "")
      ).to.be.revertedWith("Comments required");
    });

    it("should handle detailed review comments", async function () {
      const { contract, reviewer1 } = await setupPaperAndReviewer();
      const detailedComment =
        "This paper presents an innovative approach to the problem. The methodology is sound, experimental results are convincing, and the conclusions are well-supported. Minor revisions suggested for clarity.";

      await expect(
        contract
          .connect(reviewer1)
          .submitReview(1, 9, ethers.keccak256(ethers.toUtf8Bytes("proof")), detailedComment)
      ).to.not.be.reverted;
    });
  });

  describe("Paper Query Functions", function () {
    async function setupMultiplePapers() {
      const fixture = await loadFixture(deployFixture);
      const { contract, author1, author2 } = fixture;

      // Submit multiple papers
      await contract.connect(author1).submitPaper("Paper 1", "Abstract 1", "Hash1");
      await contract.connect(author2).submitPaper("Paper 2", "Abstract 2", "Hash2");
      await contract.connect(author1).submitPaper("Paper 3", "Abstract 3", "Hash3");

      return fixture;
    }

    it("should return empty array for getPapersByAuthor", async function () {
      const { contract, author1 } = await loadFixture(deployFixture);

      const papers = await contract.getPapersByAuthor(author1.address);
      expect(papers.length).to.equal(0);
    });

    it("should return empty array for getReviewerAssignments", async function () {
      const { contract, reviewer1 } = await loadFixture(deployFixture);

      const assignments = await contract.getReviewerAssignments(reviewer1.address);
      expect(assignments.length).to.equal(0);
    });

    it("should return all papers with getAllPapers", async function () {
      const { contract } = await setupMultiplePapers();

      const papers = await contract.getAllPapers(0, 10);
      expect(papers.length).to.equal(3);
      expect(papers[0]).to.equal(1);
      expect(papers[1]).to.equal(2);
      expect(papers[2]).to.equal(3);
    });

    it("should handle pagination with getAllPapers", async function () {
      const { contract } = await setupMultiplePapers();

      const firstPage = await contract.getAllPapers(0, 2);
      expect(firstPage.length).to.equal(2);

      const secondPage = await contract.getAllPapers(2, 2);
      expect(secondPage.length).to.equal(1);
    });

    it("should reject getAllPapers with offset exceeding count", async function () {
      const { contract } = await setupMultiplePapers();

      await expect(contract.getAllPapers(10, 5)).to.be.revertedWith("Offset exceeds paper count");
    });

    it("should handle getAllPapers with limit exceeding available papers", async function () {
      const { contract } = await setupMultiplePapers();

      const papers = await contract.getAllPapers(0, 100);
      expect(papers.length).to.equal(3);
    });
  });

  describe("Edge Cases and Security", function () {
    it("should handle zero paper count correctly", async function () {
      const { contract } = await loadFixture(deployFixture);

      expect(await contract.paperCount()).to.equal(0);
    });

    it("should not allow requestScoreReveal for invalid paper", async function () {
      const { contract, author1 } = await loadFixture(deployFixture);

      await expect(contract.connect(author1).requestScoreReveal(0)).to.be.reverted;
    });

    it("should handle concurrent paper submissions", async function () {
      const { contract, author1, author2 } = await loadFixture(deployFixture);

      const tx1 = contract.connect(author1).submitPaper("Paper A", "Abstract A", "HashA");
      const tx2 = contract.connect(author2).submitPaper("Paper B", "Abstract B", "HashB");

      await Promise.all([tx1, tx2]);

      expect(await contract.paperCount()).to.equal(2);
    });

    it("should handle concurrent reviewer registrations", async function () {
      const { contract, reviewer1, reviewer2 } = await loadFixture(deployFixture);

      const tx1 = contract.connect(reviewer1).registerReviewer("Expert 1");
      const tx2 = contract.connect(reviewer2).registerReviewer("Expert 2");

      await Promise.all([tx1, tx2]);

      expect(await contract.reviewers(reviewer1.address)).to.be.true;
      expect(await contract.reviewers(reviewer2.address)).to.be.true;
    });
  });

  describe("Gas Optimization", function () {
    it("should be gas efficient for paper submission", async function () {
      const { contract, author1 } = await loadFixture(deployFixture);

      const tx = await contract.connect(author1).submitPaper("Title", "Abstract", "IpfsHash");
      const receipt = await tx.wait();

      expect(receipt.gasUsed).to.be.lt(200000); // Less than 200k gas
    });

    it("should be gas efficient for reviewer registration", async function () {
      const { contract, reviewer1 } = await loadFixture(deployFixture);

      const tx = await contract.connect(reviewer1).registerReviewer("Blockchain Expert");
      const receipt = await tx.wait();

      expect(receipt.gasUsed).to.be.lt(150000); // Less than 150k gas
    });

    it("should be gas efficient for review submission", async function () {
      const { contract, author1, reviewer1 } = await loadFixture(deployFixture);

      await contract.connect(reviewer1).registerReviewer("Expert");
      await contract.connect(author1).submitPaper("Paper", "Abstract", "Hash");

      const tx = await contract
        .connect(reviewer1)
        .submitReview(1, 8, ethers.keccak256(ethers.toUtf8Bytes("proof")), "Good work");
      const receipt = await tx.wait();

      expect(receipt.gasUsed).to.be.lt(200000); // Less than 200k gas
    });
  });
});
