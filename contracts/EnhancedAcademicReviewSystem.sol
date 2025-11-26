// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { FHE, externalEuint64, euint64, euint32, ebool } from "@fhevm/solidity/lib/FHE.sol";
import { SepoliaConfig } from "@fhevm/solidity/config/ZamaConfig.sol";

/**
 * @title Enhanced Academic Review System with FHE Privacy
 * @notice Privacy-preserving peer review platform with Gateway decryption callbacks
 * @dev Implements advanced FHE operations with refund mechanisms and timeout protection
 */
contract EnhancedAcademicReviewSystem is SepoliaConfig {

    // ============ Structures ============

    struct Paper {
        address author;
        string title;
        string abstractText;
        string ipfsHash;
        uint256 submissionTime;
        uint256 reviewDeadline;
        bool isActive;
        bool isResolved;
        euint64 totalScore;           // Encrypted aggregated score
        euint32 reviewCount;          // Encrypted review count
        uint64 revealedScore;         // Revealed after decryption
        uint32 revealedReviewCount;   // Revealed review count
        uint256 decryptionRequestId;
        uint256 prizePool;            // Incentive pool for reviewers
        bool refundEnabled;           // Enable refunds if decryption fails
    }

    struct Reviewer {
        bool isRegistered;
        string expertise;
        uint256 reputation;
        uint256 reviewsCompleted;
        uint256 lastActivityTime;
    }

    struct Review {
        address reviewer;
        uint256 paperId;
        uint256 submissionTime;
        bool isClaimed;
        uint8 voteType;              // For internal tracking
        bytes32 encryptedScoreHash;  // Commitment to encrypted score
    }

    // ============ State Variables ============

    address public owner;
    uint256 public paperCount;
    uint256 public totalReviewers;

    // Configuration parameters
    uint256 public submissionFee = 0.01 ether;     // Fee to submit paper
    uint256 public reviewReward = 0.005 ether;     // Reward per review
    uint256 public constant MIN_REVIEW_DEADLINE = 7 days;
    uint256 public constant MAX_REVIEW_DEADLINE = 90 days;
    uint256 public constant TIMEOUT_PERIOD = 30 days; // Timeout for refunds
    uint256 public constant MAX_SCORE = 100;

    // Mappings
    mapping(uint256 => Paper) public papers;
    mapping(address => Reviewer) public reviewers;
    mapping(uint256 => mapping(address => bool)) public hasReviewed;
    mapping(uint256 => mapping(address => Review)) public reviews;
    mapping(uint256 => address[]) public paperReviewers;
    mapping(uint256 => string) internal paperIdByRequestId;
    mapping(uint256 => bool) public callbackCompleted;

    // ============ Events ============

    event PaperSubmitted(
        uint256 indexed paperId,
        address indexed author,
        string title,
        uint256 reviewDeadline,
        uint256 prizePool
    );

    event ReviewerRegistered(
        address indexed reviewer,
        string expertise,
        uint256 timestamp
    );

    event ReviewSubmitted(
        uint256 indexed paperId,
        address indexed reviewer,
        uint256 timestamp
    );

    event DecryptionRequested(
        uint256 indexed paperId,
        uint256 requestId,
        uint256 timestamp
    );

    event PaperResolved(
        uint256 indexed paperId,
        uint64 finalScore,
        uint32 reviewCount,
        uint256 timestamp
    );

    event ReviewRewardClaimed(
        uint256 indexed paperId,
        address indexed reviewer,
        uint256 amount
    );

    event RefundIssued(
        uint256 indexed paperId,
        address indexed recipient,
        uint256 amount,
        string reason
    );

    event TimeoutTriggered(
        uint256 indexed paperId,
        uint256 timestamp
    );

    event SubmissionFeeUpdated(uint256 oldFee, uint256 newFee);
    event ReviewRewardUpdated(uint256 oldReward, uint256 newReward);

    // ============ Modifiers ============

    modifier onlyOwner() {
        require(msg.sender == owner, "Not authorized: owner only");
        _;
    }

    modifier paperExists(uint256 paperId) {
        require(paperId > 0 && paperId <= paperCount, "Paper does not exist");
        require(papers[paperId].author != address(0), "Paper not initialized");
        _;
    }

    modifier onlyAuthor(uint256 paperId) {
        require(papers[paperId].author == msg.sender, "Not paper author");
        _;
    }

    modifier onlyRegisteredReviewer() {
        require(reviewers[msg.sender].isRegistered, "Not a registered reviewer");
        _;
    }

    // ============ Constructor ============

    constructor() {
        owner = msg.sender;
        paperCount = 0;
        totalReviewers = 0;
    }

    // ============ Admin Functions ============

    /**
     * @notice Update submission fee
     * @param newFee New fee amount in wei
     */
    function updateSubmissionFee(uint256 newFee) external onlyOwner {
        require(newFee > 0, "Fee must be positive");
        uint256 oldFee = submissionFee;
        submissionFee = newFee;
        emit SubmissionFeeUpdated(oldFee, newFee);
    }

    /**
     * @notice Update review reward amount
     * @param newReward New reward amount in wei
     */
    function updateReviewReward(uint256 newReward) external onlyOwner {
        require(newReward > 0, "Reward must be positive");
        uint256 oldReward = reviewReward;
        reviewReward = newReward;
        emit ReviewRewardUpdated(oldReward, newReward);
    }

    // ============ Reviewer Management ============

    /**
     * @notice Register as a reviewer with expertise
     * @param expertise Area of expertise
     */
    function registerReviewer(string memory expertise) external {
        require(bytes(expertise).length > 0, "Expertise required");
        require(bytes(expertise).length <= 200, "Expertise too long");
        require(!reviewers[msg.sender].isRegistered, "Already registered");

        reviewers[msg.sender] = Reviewer({
            isRegistered: true,
            expertise: expertise,
            reputation: 100, // Starting reputation
            reviewsCompleted: 0,
            lastActivityTime: block.timestamp
        });

        totalReviewers++;
        emit ReviewerRegistered(msg.sender, expertise, block.timestamp);
    }

    /**
     * @notice Get reviewer information
     * @param reviewer Address of reviewer
     */
    function getReviewerInfo(address reviewer) external view returns (
        bool isRegistered,
        string memory expertise,
        uint256 reputation,
        uint256 reviewsCompleted,
        uint256 lastActivityTime
    ) {
        Reviewer memory r = reviewers[reviewer];
        return (
            r.isRegistered,
            r.expertise,
            r.reputation,
            r.reviewsCompleted,
            r.lastActivityTime
        );
    }

    // ============ Paper Submission ============

    /**
     * @notice Submit a paper for review
     * @param title Paper title
     * @param abstractText Paper abstract
     * @param ipfsHash IPFS hash of full paper
     * @param reviewDeadline Deadline for reviews (in seconds from now)
     * @return paperId Unique paper identifier
     */
    function submitPaper(
        string memory title,
        string memory abstractText,
        string memory ipfsHash,
        uint256 reviewDeadline
    ) external payable returns (uint256 paperId) {
        // Input validation
        require(bytes(title).length > 0, "Title required");
        require(bytes(title).length <= 500, "Title too long");
        require(bytes(abstractText).length > 0, "Abstract required");
        require(bytes(abstractText).length <= 5000, "Abstract too long");
        require(bytes(ipfsHash).length > 0, "IPFS hash required");
        require(bytes(ipfsHash).length <= 100, "IPFS hash invalid");
        require(msg.value >= submissionFee, "Insufficient submission fee");
        require(
            reviewDeadline >= MIN_REVIEW_DEADLINE &&
            reviewDeadline <= MAX_REVIEW_DEADLINE,
            "Invalid review deadline"
        );

        paperCount++;
        paperId = paperCount;

        uint256 deadline = block.timestamp + reviewDeadline;

        papers[paperId] = Paper({
            author: msg.sender,
            title: title,
            abstractText: abstractText,
            ipfsHash: ipfsHash,
            submissionTime: block.timestamp,
            reviewDeadline: deadline,
            isActive: true,
            isResolved: false,
            totalScore: FHE.asEuint64(0),
            reviewCount: FHE.asEuint32(0),
            revealedScore: 0,
            revealedReviewCount: 0,
            decryptionRequestId: 0,
            prizePool: msg.value,
            refundEnabled: true
        });

        emit PaperSubmitted(paperId, msg.sender, title, deadline, msg.value);
        return paperId;
    }

    // ============ Review Submission with FHE ============

    /**
     * @notice Submit encrypted review score
     * @param paperId Paper to review
     * @param encryptedScore Encrypted score (0-100)
     * @param inputProof ZK proof for encrypted input
     * @param comments Review comments hash
     */
    function submitReview(
        uint256 paperId,
        externalEuint64 encryptedScore,
        bytes calldata inputProof,
        bytes32 comments
    ) external paperExists(paperId) onlyRegisteredReviewer {
        Paper storage paper = papers[paperId];

        // Validation
        require(paper.isActive, "Paper not active");
        require(block.timestamp < paper.reviewDeadline, "Review deadline passed");
        require(paper.author != msg.sender, "Cannot review own paper");
        require(!hasReviewed[paperId][msg.sender], "Already reviewed this paper");
        require(comments != bytes32(0), "Comments hash required");

        // Import encrypted score from user
        euint64 score = FHE.fromExternal(encryptedScore, inputProof);

        // Validate encrypted score is within bounds (0-100)
        // Using FHE operations to ensure privacy
        euint64 maxScore = FHE.asEuint64(MAX_SCORE);
        ebool isValidScore = FHE.le(score, maxScore);

        // Use FHE.select to conditionally add score
        euint64 validScore = FHE.select(isValidScore, score, FHE.asEuint64(0));

        // Aggregate encrypted scores using homomorphic addition
        paper.totalScore = FHE.add(paper.totalScore, validScore);

        // Increment review count
        paper.reviewCount = FHE.add(paper.reviewCount, FHE.asEuint32(1));

        // Allow contract to access encrypted values for future operations
        FHE.allowThis(paper.totalScore);
        FHE.allowThis(paper.reviewCount);

        // Record review
        hasReviewed[paperId][msg.sender] = true;
        reviews[paperId][msg.sender] = Review({
            reviewer: msg.sender,
            paperId: paperId,
            submissionTime: block.timestamp,
            isClaimed: false,
            voteType: 1, // Reviewed
            encryptedScoreHash: comments
        });

        paperReviewers[paperId].push(msg.sender);

        // Update reviewer stats
        reviewers[msg.sender].reviewsCompleted++;
        reviewers[msg.sender].lastActivityTime = block.timestamp;

        emit ReviewSubmitted(paperId, msg.sender, block.timestamp);
    }

    // ============ Gateway Decryption Callback Pattern ============

    /**
     * @notice Request decryption of aggregated scores via Gateway
     * @param paperId Paper to reveal scores for
     * @dev Only author can request after deadline
     */
    function requestScoreReveal(uint256 paperId)
        external
        paperExists(paperId)
        onlyAuthor(paperId)
    {
        Paper storage paper = papers[paperId];

        require(block.timestamp >= paper.reviewDeadline, "Review deadline not reached");
        require(!paper.isResolved, "Already resolved");
        require(paper.decryptionRequestId == 0, "Decryption already requested");

        // Prepare ciphertexts for decryption
        bytes32[] memory cts = new bytes32[](2);
        cts[0] = FHE.toBytes32(paper.totalScore);
        cts[1] = FHE.toBytes32(paper.reviewCount);

        // Request decryption from Gateway oracle
        uint256 requestId = FHE.requestDecryption(
            cts,
            this.resolveScoreCallback.selector
        );

        paper.decryptionRequestId = requestId;
        paperIdByRequestId[requestId] = uintToString(paperId);

        emit DecryptionRequested(paperId, requestId, block.timestamp);
    }

    /**
     * @notice Gateway callback for score decryption
     * @param requestId Decryption request identifier
     * @param cleartexts Decrypted values
     * @param decryptionProof Cryptographic proof
     * @dev Called by Gateway oracle after decryption
     */
    function resolveScoreCallback(
        uint256 requestId,
        bytes memory cleartexts,
        bytes memory decryptionProof
    ) external {
        // Verify cryptographic signatures from Gateway
        FHE.checkSignatures(requestId, cleartexts, decryptionProof);

        // Decode decrypted values
        (uint64 revealedScore, uint32 revealedCount) = abi.decode(
            cleartexts,
            (uint64, uint32)
        );

        // Retrieve paper
        string memory paperIdStr = paperIdByRequestId[requestId];
        uint256 paperId = stringToUint(paperIdStr);
        Paper storage paper = papers[paperId];

        // Update paper with revealed values
        paper.revealedScore = revealedScore;
        paper.revealedReviewCount = revealedCount;
        paper.isResolved = true;
        paper.isActive = false;
        callbackCompleted[requestId] = true;

        emit PaperResolved(paperId, revealedScore, revealedCount, block.timestamp);
    }

    // ============ Refund Mechanism ============

    /**
     * @notice Claim refund if decryption fails or timeout occurs
     * @param paperId Paper to request refund for
     */
    function claimRefund(uint256 paperId) external paperExists(paperId) {
        Paper storage paper = papers[paperId];

        // Check conditions for refund
        bool timeoutExpired = block.timestamp >= paper.reviewDeadline + TIMEOUT_PERIOD;
        bool decryptionFailed = paper.decryptionRequestId != 0 &&
                                !paper.isResolved &&
                                !callbackCompleted[paper.decryptionRequestId];

        require(
            paper.refundEnabled && (timeoutExpired || decryptionFailed),
            "Refund not available"
        );

        uint256 refundAmount = 0;
        address recipient = address(0);
        string memory reason;

        // Author refund
        if (msg.sender == paper.author && paper.prizePool > 0) {
            refundAmount = paper.prizePool;
            paper.prizePool = 0;
            recipient = msg.sender;
            reason = timeoutExpired ? "Timeout" : "Decryption failed";

        }
        // Reviewer refund (if applicable)
        else if (hasReviewed[paperId][msg.sender] && !reviews[paperId][msg.sender].isClaimed) {
            refundAmount = reviewReward;
            reviews[paperId][msg.sender].isClaimed = true;
            recipient = msg.sender;
            reason = "Review compensation";
        }

        require(refundAmount > 0, "No refund available");
        require(recipient != address(0), "Invalid recipient");

        // Execute refund
        (bool sent, ) = payable(recipient).call{value: refundAmount}("");
        require(sent, "Refund transfer failed");

        emit RefundIssued(paperId, recipient, refundAmount, reason);

        if (timeoutExpired && !paper.isResolved) {
            paper.isActive = false;
            emit TimeoutTriggered(paperId, block.timestamp);
        }
    }

    // ============ Reward Distribution ============

    /**
     * @notice Claim review reward after paper is resolved
     * @param paperId Paper reviewed
     */
    function claimReviewReward(uint256 paperId)
        external
        paperExists(paperId)
    {
        Paper storage paper = papers[paperId];
        Review storage review = reviews[paperId][msg.sender];

        require(paper.isResolved, "Paper not resolved yet");
        require(hasReviewed[paperId][msg.sender], "No review submitted");
        require(!review.isClaimed, "Reward already claimed");
        require(paper.prizePool >= reviewReward, "Insufficient prize pool");

        review.isClaimed = true;
        paper.prizePool -= reviewReward;

        // Increase reviewer reputation
        reviewers[msg.sender].reputation += 10;

        // Transfer reward
        (bool sent, ) = payable(msg.sender).call{value: reviewReward}("");
        require(sent, "Reward transfer failed");

        emit ReviewRewardClaimed(paperId, msg.sender, reviewReward);
    }

    // ============ Query Functions ============

    /**
     * @notice Get paper details
     * @param paperId Paper identifier
     */
    function getPaper(uint256 paperId)
        external
        view
        paperExists(paperId)
        returns (
            address author,
            string memory title,
            string memory abstractText,
            string memory ipfsHash,
            uint256 submissionTime,
            uint256 reviewDeadline,
            bool isActive,
            bool isResolved,
            uint64 revealedScore,
            uint32 revealedReviewCount,
            uint256 prizePool
        )
    {
        Paper storage paper = papers[paperId];
        return (
            paper.author,
            paper.title,
            paper.abstractText,
            paper.ipfsHash,
            paper.submissionTime,
            paper.reviewDeadline,
            paper.isActive,
            paper.isResolved,
            paper.isResolved ? paper.revealedScore : 0,
            paper.isResolved ? paper.revealedReviewCount : 0,
            paper.prizePool
        );
    }

    /**
     * @notice Get papers by author with pagination
     * @param author Author address
     * @param offset Starting index
     * @param limit Maximum number of results
     */
    function getPapersByAuthor(address author, uint256 offset, uint256 limit)
        external
        view
        returns (uint256[] memory)
    {
        require(limit > 0 && limit <= 100, "Invalid limit");

        uint256[] memory authorPapers = new uint256[](limit);
        uint256 count = 0;
        uint256 skipped = 0;

        for (uint256 i = 1; i <= paperCount && count < limit; i++) {
            if (papers[i].author == author) {
                if (skipped >= offset) {
                    authorPapers[count] = i;
                    count++;
                }
                skipped++;
            }
        }

        // Resize array to actual count
        uint256[] memory result = new uint256[](count);
        for (uint256 i = 0; i < count; i++) {
            result[i] = authorPapers[i];
        }

        return result;
    }

    /**
     * @notice Get all papers with pagination
     * @param offset Starting index
     * @param limit Maximum number of results
     */
    function getAllPapers(uint256 offset, uint256 limit)
        external
        view
        returns (uint256[] memory)
    {
        require(limit > 0 && limit <= 100, "Invalid limit");
        require(offset < paperCount, "Offset exceeds paper count");

        uint256 end = offset + limit;
        if (end > paperCount) {
            end = paperCount;
        }

        uint256 length = end - offset;
        uint256[] memory paperIds = new uint256[](length);

        for (uint256 i = 0; i < length; i++) {
            paperIds[i] = offset + i + 1;
        }

        return paperIds;
    }

    /**
     * @notice Get reviewers for a paper
     * @param paperId Paper identifier
     */
    function getPaperReviewers(uint256 paperId)
        external
        view
        paperExists(paperId)
        returns (address[] memory)
    {
        return paperReviewers[paperId];
    }

    /**
     * @notice Check if decryption callback was completed
     * @param paperId Paper identifier
     */
    function isDecryptionComplete(uint256 paperId)
        external
        view
        paperExists(paperId)
        returns (bool)
    {
        Paper storage paper = papers[paperId];
        if (paper.decryptionRequestId == 0) return false;
        return callbackCompleted[paper.decryptionRequestId];
    }

    // ============ Privacy Protection Utilities ============

    /**
     * @notice Calculate average score with privacy protection
     * @param paperId Paper identifier
     * @return averageScore Obfuscated average score (only after resolution)
     * @dev Uses fuzzy rounding to prevent exact score leakage
     */
    function getObfuscatedAverageScore(uint256 paperId)
        external
        view
        paperExists(paperId)
        returns (uint256 averageScore)
    {
        Paper storage paper = papers[paperId];
        require(paper.isResolved, "Not resolved yet");

        if (paper.revealedReviewCount == 0) return 0;

        // Calculate average
        uint256 rawAverage = uint256(paper.revealedScore) / uint256(paper.revealedReviewCount);

        // Apply fuzzy rounding (round to nearest 5)
        averageScore = (rawAverage / 5) * 5;

        return averageScore;
    }

    // ============ Utility Functions ============

    /**
     * @notice Convert uint to string
     * @param value Uint value
     * @return String representation
     */
    function uintToString(uint256 value) internal pure returns (string memory) {
        if (value == 0) {
            return "0";
        }
        uint256 temp = value;
        uint256 digits;
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }
        return string(buffer);
    }

    /**
     * @notice Convert string to uint
     * @param s String value
     * @return Uint representation
     */
    function stringToUint(string memory s) internal pure returns (uint256) {
        bytes memory b = bytes(s);
        uint256 result = 0;
        for (uint256 i = 0; i < b.length; i++) {
            uint8 c = uint8(b[i]);
            if (c >= 48 && c <= 57) {
                result = result * 10 + (c - 48);
            }
        }
        return result;
    }

    // ============ Receive Function ============

    receive() external payable {}
}
