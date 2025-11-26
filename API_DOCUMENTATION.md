# 📖 Enhanced Academic Review System API Documentation

## Table of Contents
1. [Contract Overview](#contract-overview)
2. [State Variables](#state-variables)
3. [Data Structures](#data-structures)
4. [Events](#events)
5. [Modifiers](#modifiers)
6. [Admin Functions](#admin-functions)
7. [Reviewer Functions](#reviewer-functions)
8. [Paper Functions](#paper-functions)
9. [Review Functions](#review-functions)
10. [Decryption Functions](#decryption-functions)
11. [Refund Functions](#refund-functions)
12. [Query Functions](#query-functions)
13. [Utility Functions](#utility-functions)

---

## Contract Overview

**Contract Name**: `EnhancedAcademicReviewSystem`
**License**: MIT
**Solidity Version**: ^0.8.24
**Inherits**: SepoliaConfig (ZAMA FHE)

### Purpose
Privacy-preserving peer review platform with Gateway callback decryption, refund mechanisms, and timeout protection.

---

## State Variables

### Public Variables

```solidity
address public owner
```
- **Type**: `address`
- **Description**: Contract owner (deployer)
- **Access**: Public read

```solidity
uint256 public paperCount
```
- **Type**: `uint256`
- **Description**: Total number of papers submitted
- **Access**: Public read

```solidity
uint256 public totalReviewers
```
- **Type**: `uint256`
- **Description**: Total number of registered reviewers
- **Access**: Public read

### Configuration Parameters

```solidity
uint256 public submissionFee = 0.01 ether
```
- **Type**: `uint256`
- **Description**: Fee required to submit a paper
- **Default**: 0.01 ETH
- **Mutable**: Yes (owner only)

```solidity
uint256 public reviewReward = 0.005 ether
```
- **Type**: `uint256`
- **Description**: Reward paid to each reviewer
- **Default**: 0.005 ETH
- **Mutable**: Yes (owner only)

### Constants

```solidity
uint256 public constant MIN_REVIEW_DEADLINE = 7 days
```
- **Description**: Minimum review period duration

```solidity
uint256 public constant MAX_REVIEW_DEADLINE = 90 days
```
- **Description**: Maximum review period duration

```solidity
uint256 public constant TIMEOUT_PERIOD = 30 days
```
- **Description**: Timeout for refund eligibility after deadline

```solidity
uint256 public constant MAX_SCORE = 100
```
- **Description**: Maximum review score value

---

## Data Structures

### Paper Struct

```solidity
struct Paper {
    address author;                 // Paper author address
    string title;                   // Paper title
    string abstractText;            // Paper abstract
    string ipfsHash;                // IPFS hash for full paper
    uint256 submissionTime;         // Timestamp of submission
    uint256 reviewDeadline;         // Review period end time
    bool isActive;                  // Active for reviews
    bool isResolved;                // Scores revealed
    euint64 totalScore;             // Encrypted aggregated score
    euint32 reviewCount;            // Encrypted review count
    uint64 revealedScore;           // Decrypted total score
    uint32 revealedReviewCount;     // Decrypted review count
    uint256 decryptionRequestId;    // Gateway request ID
    uint256 prizePool;              // ETH pool for rewards
    bool refundEnabled;             // Enable refunds
}
```

### Reviewer Struct

```solidity
struct Reviewer {
    bool isRegistered;              // Registration status
    string expertise;               // Area of expertise
    uint256 reputation;             // Reputation score
    uint256 reviewsCompleted;       // Total reviews submitted
    uint256 lastActivityTime;       // Last activity timestamp
}
```

### Review Struct

```solidity
struct Review {
    address reviewer;               // Reviewer address
    uint256 paperId;                // Paper being reviewed
    uint256 submissionTime;         // Review submission time
    bool isClaimed;                 // Reward claimed status
    uint8 voteType;                 // Internal tracking
    bytes32 encryptedScoreHash;     // Encrypted score commitment
}
```

---

## Events

### PaperSubmitted

```solidity
event PaperSubmitted(
    uint256 indexed paperId,
    address indexed author,
    string title,
    uint256 reviewDeadline,
    uint256 prizePool
)
```
**Emitted**: When a new paper is submitted

### ReviewerRegistered

```solidity
event ReviewerRegistered(
    address indexed reviewer,
    string expertise,
    uint256 timestamp
)
```
**Emitted**: When a new reviewer registers

### ReviewSubmitted

```solidity
event ReviewSubmitted(
    uint256 indexed paperId,
    address indexed reviewer,
    uint256 timestamp
)
```
**Emitted**: When a review is submitted

### DecryptionRequested

```solidity
event DecryptionRequested(
    uint256 indexed paperId,
    uint256 requestId,
    uint256 timestamp
)
```
**Emitted**: When score decryption is requested

### PaperResolved

```solidity
event PaperResolved(
    uint256 indexed paperId,
    uint64 finalScore,
    uint32 reviewCount,
    uint256 timestamp
)
```
**Emitted**: When Gateway callback completes decryption

### ReviewRewardClaimed

```solidity
event ReviewRewardClaimed(
    uint256 indexed paperId,
    address indexed reviewer,
    uint256 amount
)
```
**Emitted**: When a reviewer claims their reward

### RefundIssued

```solidity
event RefundIssued(
    uint256 indexed paperId,
    address indexed recipient,
    uint256 amount,
    string reason
)
```
**Emitted**: When a refund is processed

### TimeoutTriggered

```solidity
event TimeoutTriggered(
    uint256 indexed paperId,
    uint256 timestamp
)
```
**Emitted**: When a timeout occurs

### SubmissionFeeUpdated

```solidity
event SubmissionFeeUpdated(uint256 oldFee, uint256 newFee)
```
**Emitted**: When submission fee is updated

### ReviewRewardUpdated

```solidity
event ReviewRewardUpdated(uint256 oldReward, uint256 newReward)
```
**Emitted**: When review reward is updated

---

## Modifiers

### onlyOwner

```solidity
modifier onlyOwner()
```
- **Purpose**: Restrict function to contract owner
- **Reverts**: "Not authorized: owner only"

### paperExists

```solidity
modifier paperExists(uint256 paperId)
```
- **Purpose**: Validate paper ID exists
- **Parameters**: `paperId` - Paper identifier
- **Reverts**: "Paper does not exist" / "Paper not initialized"

### onlyAuthor

```solidity
modifier onlyAuthor(uint256 paperId)
```
- **Purpose**: Restrict function to paper author
- **Parameters**: `paperId` - Paper identifier
- **Reverts**: "Not paper author"

### onlyRegisteredReviewer

```solidity
modifier onlyRegisteredReviewer()
```
- **Purpose**: Restrict function to registered reviewers
- **Reverts**: "Not a registered reviewer"

---

## Admin Functions

### updateSubmissionFee

```solidity
function updateSubmissionFee(uint256 newFee) external onlyOwner
```

**Description**: Update the submission fee for papers

**Parameters**:
- `newFee` (uint256): New fee amount in wei

**Requirements**:
- Caller must be owner
- `newFee` must be > 0

**Events**: `SubmissionFeeUpdated(oldFee, newFee)`

**Gas Cost**: ~45,000

**Example**:
```javascript
await contract.updateSubmissionFee(ethers.parseEther("0.02"));
```

---

### updateReviewReward

```solidity
function updateReviewReward(uint256 newReward) external onlyOwner
```

**Description**: Update the reward amount for reviewers

**Parameters**:
- `newReward` (uint256): New reward amount in wei

**Requirements**:
- Caller must be owner
- `newReward` must be > 0

**Events**: `ReviewRewardUpdated(oldReward, newReward)`

**Gas Cost**: ~45,000

**Example**:
```javascript
await contract.updateReviewReward(ethers.parseEther("0.01"));
```

---

## Reviewer Functions

### registerReviewer

```solidity
function registerReviewer(string memory expertise) external
```

**Description**: Register as a reviewer with expertise area

**Parameters**:
- `expertise` (string): Area of expertise (1-200 characters)

**Requirements**:
- Expertise string not empty
- Expertise length ≤ 200 characters
- Caller not already registered

**Events**: `ReviewerRegistered(reviewer, expertise, timestamp)`

**Gas Cost**: ~120,000

**Example**:
```javascript
await contract.registerReviewer("Blockchain Security and Cryptography");
```

---

### getReviewerInfo

```solidity
function getReviewerInfo(address reviewer) external view
    returns (
        bool isRegistered,
        string memory expertise,
        uint256 reputation,
        uint256 reviewsCompleted,
        uint256 lastActivityTime
    )
```

**Description**: Get reviewer information

**Parameters**:
- `reviewer` (address): Reviewer address

**Returns**:
- `isRegistered` (bool): Registration status
- `expertise` (string): Expertise area
- `reputation` (uint256): Reputation score
- `reviewsCompleted` (uint256): Total reviews submitted
- `lastActivityTime` (uint256): Last activity timestamp

**Gas Cost**: ~15,000

**Example**:
```javascript
const info = await contract.getReviewerInfo(reviewerAddress);
console.log("Reputation:", info.reputation);
```

---

## Paper Functions

### submitPaper

```solidity
function submitPaper(
    string memory title,
    string memory abstractText,
    string memory ipfsHash,
    uint256 reviewDeadline
) external payable returns (uint256 paperId)
```

**Description**: Submit a paper for review

**Parameters**:
- `title` (string): Paper title (1-500 characters)
- `abstractText` (string): Paper abstract (1-5000 characters)
- `ipfsHash` (string): IPFS hash for full paper (≤100 characters)
- `reviewDeadline` (uint256): Review period in seconds (7-90 days)

**Requirements**:
- `msg.value` ≥ submissionFee
- Title, abstract, IPFS hash not empty
- Valid length constraints
- Review deadline within bounds

**Returns**:
- `paperId` (uint256): Unique paper identifier

**Events**: `PaperSubmitted(paperId, author, title, deadline, prizePool)`

**Gas Cost**: ~280,000 + 20,000 HCU

**Example**:
```javascript
const tx = await contract.submitPaper(
    "Novel Consensus Mechanisms",
    "This paper proposes a new consensus mechanism...",
    "QmXxxxxIPFSHashxxxxx",
    30 * 24 * 60 * 60,  // 30 days
    { value: ethers.parseEther("0.01") }
);
```

---

### getPaper

```solidity
function getPaper(uint256 paperId) external view
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
```

**Description**: Get paper details

**Parameters**:
- `paperId` (uint256): Paper identifier

**Returns**:
- Complete paper information (scores only if resolved)

**Gas Cost**: ~25,000

**Example**:
```javascript
const paper = await contract.getPaper(paperId);
console.log("Title:", paper.title);
console.log("Score:", paper.revealedScore);
```

---

### getPapersByAuthor

```solidity
function getPapersByAuthor(
    address author,
    uint256 offset,
    uint256 limit
) external view returns (uint256[] memory)
```

**Description**: Get papers by author with pagination

**Parameters**:
- `author` (address): Author address
- `offset` (uint256): Starting index
- `limit` (uint256): Maximum results (1-100)

**Returns**:
- Array of paper IDs

**Gas Cost**: ~35,000 + (5,000 × results)

**Example**:
```javascript
const authorPapers = await contract.getPapersByAuthor(
    authorAddress,
    0,    // offset
    10    // limit
);
```

---

### getAllPapers

```solidity
function getAllPapers(
    uint256 offset,
    uint256 limit
) external view returns (uint256[] memory)
```

**Description**: Get all papers with pagination

**Parameters**:
- `offset` (uint256): Starting index
- `limit` (uint256): Maximum results (1-100)

**Returns**:
- Array of paper IDs

**Requirements**:
- Offset < paperCount
- Limit ≤ 100

**Gas Cost**: ~30,000 + (3,000 × results)

**Example**:
```javascript
const allPapers = await contract.getAllPapers(0, 20);
```

---

## Review Functions

### submitReview

```solidity
function submitReview(
    uint256 paperId,
    externalEuint64 encryptedScore,
    bytes calldata inputProof,
    bytes32 comments
) external paperExists(paperId) onlyRegisteredReviewer
```

**Description**: Submit encrypted review score

**Parameters**:
- `paperId` (uint256): Paper to review
- `encryptedScore` (externalEuint64): FHE-encrypted score (0-100)
- `inputProof` (bytes): ZK proof for encrypted input
- `comments` (bytes32): Review comments hash

**Requirements**:
- Paper is active
- Before review deadline
- Not paper author
- Haven't reviewed before
- Valid comments hash

**Events**: `ReviewSubmitted(paperId, reviewer, timestamp)`

**Gas Cost**: ~450,000 + 125,000 HCU

**FHE Operations**:
- `FHE.fromExternal()`: Import encrypted score
- `FHE.add()`: Aggregate scores homomorphically
- `FHE.select()`: Conditional addition
- `FHE.allowThis()`: Grant contract access

**Example**:
```javascript
// Client-side encryption
const fheClient = await createFheClient();
const encryptedScore = await fheClient.encrypt(85);

await contract.submitReview(
    paperId,
    encryptedScore.data,
    encryptedScore.proof,
    ethers.keccak256(ethers.toUtf8Bytes("Excellent work!"))
);
```

---

### getPaperReviewers

```solidity
function getPaperReviewers(uint256 paperId) external view
    paperExists(paperId)
    returns (address[] memory)
```

**Description**: Get all reviewers for a paper

**Parameters**:
- `paperId` (uint256): Paper identifier

**Returns**:
- Array of reviewer addresses

**Gas Cost**: ~20,000 + (5,000 × reviewers)

**Example**:
```javascript
const reviewers = await contract.getPaperReviewers(paperId);
```

---

## Decryption Functions

### requestScoreReveal

```solidity
function requestScoreReveal(uint256 paperId) external
    paperExists(paperId)
    onlyAuthor(paperId)
```

**Description**: Request decryption of aggregated scores via Gateway

**Parameters**:
- `paperId` (uint256): Paper to reveal scores for

**Requirements**:
- Caller is paper author
- Past review deadline
- Not already resolved
- No pending decryption request

**Events**: `DecryptionRequested(paperId, requestId, timestamp)`

**Gas Cost**: ~180,000 + 40,000 HCU

**Workflow**:
1. Prepare encrypted ciphertexts
2. Request Gateway decryption
3. Store request ID
4. Emit event

**Example**:
```javascript
await contract.requestScoreReveal(paperId);
```

---

### resolveScoreCallback

```solidity
function resolveScoreCallback(
    uint256 requestId,
    bytes memory cleartexts,
    bytes memory decryptionProof
) external
```

**Description**: Gateway callback for score decryption

**Parameters**:
- `requestId` (uint256): Decryption request identifier
- `cleartexts` (bytes): ABI-encoded decrypted values
- `decryptionProof` (bytes): Cryptographic proof

**Process**:
1. Verify Gateway signatures
2. Decode cleartexts
3. Update paper state
4. Mark as resolved

**Events**: `PaperResolved(paperId, finalScore, reviewCount, timestamp)`

**Gas Cost**: ~150,000

**Security**:
- Cryptographic signature verification via `FHE.checkSignatures()`
- Only Gateway can call successfully

**Example** (Gateway only):
```javascript
// Called by Gateway oracle, not directly by users
```

---

### isDecryptionComplete

```solidity
function isDecryptionComplete(uint256 paperId) external view
    paperExists(paperId)
    returns (bool)
```

**Description**: Check if decryption callback was completed

**Parameters**:
- `paperId` (uint256): Paper identifier

**Returns**:
- `true` if callback completed, `false` otherwise

**Gas Cost**: ~8,000

**Example**:
```javascript
const isComplete = await contract.isDecryptionComplete(paperId);
```

---

## Refund Functions

### claimRefund

```solidity
function claimRefund(uint256 paperId) external paperExists(paperId)
```

**Description**: Claim refund if decryption fails or timeout occurs

**Parameters**:
- `paperId` (uint256): Paper to request refund for

**Refund Conditions**:
- **Timeout**: 30 days past review deadline
- **Decryption failure**: Request made but not resolved

**Eligible Recipients**:
- **Authors**: Full submission fee + remaining prize pool
- **Reviewers**: Review reward for work done

**Events**: `RefundIssued(paperId, recipient, amount, reason)`

**Gas Cost**: ~70,000

**Example**:
```javascript
await contract.claimRefund(paperId);
```

---

## Reward Functions

### claimReviewReward

```solidity
function claimReviewReward(uint256 paperId) external
    paperExists(paperId)
```

**Description**: Claim review reward after paper is resolved

**Parameters**:
- `paperId` (uint256): Paper reviewed

**Requirements**:
- Paper is resolved
- Submitted a review
- Haven't claimed yet
- Sufficient prize pool

**Benefits**:
- Receive review reward
- Reputation +10

**Events**: `ReviewRewardClaimed(paperId, reviewer, amount)`

**Gas Cost**: ~90,000

**Example**:
```javascript
await contract.claimReviewReward(paperId);
```

---

## Query Functions

### getObfuscatedAverageScore

```solidity
function getObfuscatedAverageScore(uint256 paperId) external view
    paperExists(paperId)
    returns (uint256 averageScore)
```

**Description**: Calculate obfuscated average score (privacy protection)

**Parameters**:
- `paperId` (uint256): Paper identifier

**Returns**:
- `averageScore` (uint256): Fuzzy-rounded average (nearest 5)

**Requirements**:
- Paper is resolved

**Privacy Technique**:
- Rounds to nearest 5 to prevent exact score leakage

**Gas Cost**: ~12,000

**Example**:
```javascript
const avgScore = await contract.getObfuscatedAverageScore(paperId);
console.log("Average Score:", avgScore); // e.g., 85 (rounded from 87)
```

---

## Utility Functions

### uintToString

```solidity
function uintToString(uint256 value) internal pure
    returns (string memory)
```

**Description**: Convert uint to string representation

**Parameters**:
- `value` (uint256): Uint value

**Returns**:
- String representation

**Gas Cost**: ~15,000

---

### stringToUint

```solidity
function stringToUint(string memory s) internal pure
    returns (uint256)
```

**Description**: Convert string to uint

**Parameters**:
- `s` (string): String value

**Returns**:
- Uint representation

**Gas Cost**: ~10,000

---

## Integration Examples

### Complete Workflow Example

```javascript
// 1. Register as reviewer
await contract.registerReviewer("Cryptography Expert");

// 2. Submit paper
const tx = await contract.submitPaper(
    "Novel FHE Applications",
    "This paper explores new applications...",
    "QmXxxxxIPFSHashxxxxx",
    14 * 24 * 60 * 60,  // 14 days
    { value: ethers.parseEther("0.01") }
);
const receipt = await tx.wait();
const paperId = receipt.logs[0].args.paperId;

// 3. Submit encrypted review
const fheClient = await createFheClient();
const encryptedScore = await fheClient.encrypt(90);

await contract.submitReview(
    paperId,
    encryptedScore.data,
    encryptedScore.proof,
    ethers.keccak256(ethers.toUtf8Bytes("Great work!"))
);

// 4. Wait for deadline, then request reveal
await contract.requestScoreReveal(paperId);

// 5. Wait for Gateway callback, then claim reward
await contract.claimReviewReward(paperId);
```

---

## Error Reference

| Error Message | Cause | Solution |
|--------------|-------|----------|
| "Not authorized: owner only" | Non-owner calling admin function | Use owner account |
| "Paper does not exist" | Invalid paper ID | Check paper ID validity |
| "Not a registered reviewer" | Unregistered user trying to review | Register first |
| "Already reviewed this paper" | Duplicate review attempt | Cannot review twice |
| "Insufficient submission fee" | Payment too low | Send correct fee amount |
| "Review deadline passed" | Trying to review expired paper | Check deadline |
| "Refund not available" | Conditions not met | Wait for timeout or check status |
| "Reward already claimed" | Duplicate claim | Can only claim once |

---

## Gas Optimization Tips

1. **Batch Operations**: Submit multiple reviews in sequence to amortize overhead
2. **Pagination**: Use small limit values for query functions
3. **Event Monitoring**: Use events instead of repeated queries
4. **Off-chain Computation**: Pre-compute complex values off-chain

---

## Security Best Practices

1. **Input Validation**: Always validate inputs on client-side first
2. **ZK Proofs**: Ensure proper proof generation for encrypted inputs
3. **Deadline Monitoring**: Check deadlines before submitting reviews
4. **Error Handling**: Implement comprehensive try-catch blocks
5. **Gas Estimation**: Always estimate gas before transactions

---

## Support

For questions or issues:
- GitHub Issues: [repository-url]/issues
- Documentation: [repository-url]/docs
- Contract Address: [Deployed contract address on Sepolia]
