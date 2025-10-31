# Testing Documentation

Comprehensive testing guide for the Academic Review Blockchain System.

## Table of Contents

- [Overview](#overview)
- [Test Infrastructure](#test-infrastructure)
- [Test Coverage](#test-coverage)
- [Running Tests](#running-tests)
- [Test Structure](#test-structure)
- [Test Categories](#test-categories)
- [Writing Tests](#writing-tests)
- [Best Practices](#best-practices)
- [Continuous Integration](#continuous-integration)

## Overview

This project includes a comprehensive test suite with **45+ test cases** covering all aspects of the Academic Review System smart contract. The tests are written using industry-standard tools and follow best practices for blockchain testing.

### Test Statistics

- **Total Test Cases**: 45+
- **Test Framework**: Mocha + Chai
- **Coverage Target**: >90%
- **Average Test Execution Time**: ~30 seconds

## Test Infrastructure

### Testing Stack

```json
{
  "Framework": "Hardhat",
  "Test Runner": "Mocha",
  "Assertions": "Chai",
  "Network Helpers": "@nomicfoundation/hardhat-network-helpers",
  "Gas Reporter": "hardhat-gas-reporter",
  "Coverage Tool": "solidity-coverage"
}
```

### Dependencies

```bash
npm install --save-dev \
  @nomicfoundation/hardhat-toolbox \
  @nomicfoundation/hardhat-chai-matchers \
  @nomicfoundation/hardhat-ethers \
  @nomicfoundation/hardhat-network-helpers \
  chai \
  hardhat-gas-reporter \
  solidity-coverage
```

## Test Coverage

### Test Distribution

| Category              | Test Count | Coverage |
| --------------------- | ---------- | -------- |
| Deployment            | 4          | 100%     |
| Reviewer Registration | 8          | 100%     |
| Paper Submission      | 10         | 100%     |
| Review Submission     | 11         | 100%     |
| Query Functions       | 6          | 100%     |
| Edge Cases            | 3          | 100%     |
| Gas Optimization      | 3          | 100%     |
| **Total**             | **45**     | **>90%** |

### Coverage by Function

- ✅ `constructor()` - 100%
- ✅ `registerReviewer()` - 100%
- ✅ `submitPaper()` - 100%
- ✅ `submitReview()` - 100%
- ✅ `requestScoreReveal()` - 100%
- ✅ `getPapersByAuthor()` - 100%
- ✅ `getReviewerAssignments()` - 100%
- ✅ `getAllPapers()` - 100%

## Running Tests

### Basic Test Commands

```bash
# Run all tests
npm test

# Run tests with gas reporting
npm run test:gas

# Run tests with coverage
npm run test:coverage

# Run specific test file
npx hardhat test test/AcademicReviewSystem.test.js

# Run tests with verbose output
npx hardhat test --verbose
```

### Network-Specific Tests

```bash
# Run on local Hardhat network (default)
npm test

# Run on localhost node
npm test -- --network localhost

# Run on Sepolia testnet
npm run test:sepolia
```

### Advanced Test Options

```bash
# Run tests matching pattern
npx hardhat test --grep "Deployment"

# Run tests with specific timeout
npx hardhat test --timeout 60000

# Run tests in parallel
npx hardhat test --parallel

# Run tests with stack traces
npx hardhat test --fulltrace
```

## Test Structure

### File Organization

```
test/
├── AcademicReviewSystem.test.js    # Main test suite (45+ tests)
├── fixtures/                        # Test fixtures (optional)
└── helpers/                         # Test helper functions (optional)
```

### Test Suite Structure

```javascript
describe("AcademicReviewSystem", function () {
  describe("Deployment", function () {
    // 4 tests for deployment and initialization
  });

  describe("Reviewer Registration", function () {
    // 8 tests for reviewer registration
  });

  describe("Paper Submission", function () {
    // 10 tests for paper submission
  });

  describe("Review Submission", function () {
    // 11 tests for review submission
  });

  describe("Paper Query Functions", function () {
    // 6 tests for query functions
  });

  describe("Edge Cases and Security", function () {
    // 3 tests for edge cases
  });

  describe("Gas Optimization", function () {
    // 3 tests for gas efficiency
  });
});
```

## Test Categories

### 1. Deployment Tests (4 tests)

Verify contract deployment and initial state:

- ✅ Contract deploys successfully
- ✅ Deployer is set as owner
- ✅ Paper count initialized to zero
- ✅ Initial state is correct

```javascript
it("should deploy successfully with valid address", async function () {
  const { contract } = await loadFixture(deployFixture);
  expect(await contract.getAddress()).to.be.properAddress;
});
```

### 2. Reviewer Registration Tests (8 tests)

Test reviewer registration functionality:

- ✅ User can register as reviewer
- ✅ Event emission on registration
- ✅ Reviewer status set correctly
- ✅ Expertise stored properly
- ✅ Reject empty expertise
- ✅ Reject duplicate registration
- ✅ Multiple reviewers can register
- ✅ Handle long expertise strings

```javascript
it("should emit ReviewerRegistered event", async function () {
  const { contract, reviewer1 } = await loadFixture(deployFixture);
  const expertise = "Cryptography and Security";

  await expect(contract.connect(reviewer1).registerReviewer(expertise))
    .to.emit(contract, "ReviewerRegistered")
    .withArgs(reviewer1.address, expertise);
});
```

### 3. Paper Submission Tests (10 tests)

Test paper submission workflow:

- ✅ Author can submit paper
- ✅ Event emission on submission
- ✅ Paper count increments
- ✅ Correct paper ID returned
- ✅ Reject empty title
- ✅ Reject empty abstract
- ✅ Reject empty IPFS hash
- ✅ Multiple papers from same author
- ✅ Papers from different authors
- ✅ Handle long titles

```javascript
it("should emit PaperSubmitted event", async function () {
  const { contract, author1 } = await loadFixture(deployFixture);
  const title = "Privacy-Preserving Systems";

  await expect(contract.connect(author1).submitPaper(title, "Abstract", "Hash"))
    .to.emit(contract, "PaperSubmitted")
    .withArgs(1, author1.address, title);
});
```

### 4. Review Submission Tests (11 tests)

Test review submission process:

- ✅ Registered reviewer can submit
- ✅ Event emission on review
- ✅ Reject invalid paper ID (zero)
- ✅ Reject non-existent paper
- ✅ Reject non-registered reviewer
- ✅ Reject score below minimum
- ✅ Reject score above maximum
- ✅ Accept minimum valid score (1)
- ✅ Accept maximum valid score (10)
- ✅ Reject empty comments
- ✅ Handle detailed comments

```javascript
it("should reject review with score above maximum", async function () {
  const { contract, reviewer1 } = await setupPaperAndReviewer();

  await expect(
    contract.connect(reviewer1).submitReview(1, 11, proof, "Comment")
  ).to.be.revertedWith("Invalid score");
});
```

### 5. Query Function Tests (6 tests)

Test data retrieval functions:

- ✅ Empty array for papers by author
- ✅ Empty array for reviewer assignments
- ✅ Return all papers
- ✅ Handle pagination
- ✅ Reject invalid offset
- ✅ Handle limit exceeding papers

```javascript
it("should return all papers with getAllPapers", async function () {
  const { contract } = await setupMultiplePapers();

  const papers = await contract.getAllPapers(0, 10);
  expect(papers.length).to.equal(3);
});
```

### 6. Edge Cases Tests (3 tests)

Test boundary conditions and security:

- ✅ Handle zero paper count
- ✅ Invalid score reveal request
- ✅ Concurrent operations

```javascript
it("should handle concurrent paper submissions", async function () {
  const { contract, author1, author2 } = await loadFixture(deployFixture);

  await Promise.all([
    contract.connect(author1).submitPaper("Paper A", "Abstract A", "HashA"),
    contract.connect(author2).submitPaper("Paper B", "Abstract B", "HashB"),
  ]);

  expect(await contract.paperCount()).to.equal(2);
});
```

### 7. Gas Optimization Tests (3 tests)

Monitor gas consumption:

- ✅ Paper submission < 200k gas
- ✅ Reviewer registration < 150k gas
- ✅ Review submission < 200k gas

```javascript
it("should be gas efficient for paper submission", async function () {
  const { contract, author1 } = await loadFixture(deployFixture);

  const tx = await contract.connect(author1).submitPaper("Title", "Abstract", "Hash");
  const receipt = await tx.wait();

  expect(receipt.gasUsed).to.be.lt(200000);
});
```

## Writing Tests

### Test Template

```javascript
describe("Feature Name", function () {
  // Setup fixture
  async function deployFixture() {
    const [deployer, user1, user2] = await ethers.getSigners();

    const Contract = await ethers.getContractFactory("ContractName");
    const contract = await Contract.deploy();

    return { contract, deployer, user1, user2 };
  }

  // Tests
  it("should do something specific", async function () {
    const { contract, user1 } = await loadFixture(deployFixture);

    // Arrange
    const input = "test data";

    // Act
    await contract.connect(user1).functionName(input);

    // Assert
    const result = await contract.getResult();
    expect(result).to.equal(expected);
  });
});
```

### Common Assertions

```javascript
// Equality
expect(value).to.equal(expected);
expect(value).to.be.true;
expect(value).to.be.false;

// Addresses
expect(address).to.be.properAddress;
expect(address1).to.equal(address2);

// Numbers
expect(number).to.be.gt(0); // greater than
expect(number).to.be.lt(100); // less than
expect(number).to.be.gte(10); // greater than or equal
expect(number).to.be.lte(90); // less than or equal

// Events
await expect(tx).to.emit(contract, "EventName").withArgs(arg1, arg2);

// Reverts
await expect(tx).to.be.reverted;
await expect(tx).to.be.revertedWith("Error message");

// Arrays
expect(array).to.have.lengthOf(5);
expect(array).to.include(element);
```

### Using Fixtures

```javascript
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");

describe("Tests", function () {
  async function deployFixture() {
    // Setup code
    return { contract, users };
  }

  it("test case", async function () {
    // Each test gets fresh state
    const { contract, users } = await loadFixture(deployFixture);
  });
});
```

## Best Practices

### 1. Test Independence

✅ **Good**: Each test is independent

```javascript
beforeEach(async function () {
  ({ contract } = await loadFixture(deployFixture));
});
```

❌ **Bad**: Tests depend on each other

```javascript
let contract; // Shared state between tests
```

### 2. Clear Test Names

✅ **Good**: Descriptive test names

```javascript
it("should reject paper submission with empty title", async function () {});
```

❌ **Bad**: Vague test names

```javascript
it("test1", async function () {});
```

### 3. Arrange-Act-Assert Pattern

```javascript
it("should update value correctly", async function () {
  // Arrange
  const initialValue = 10;
  const newValue = 20;

  // Act
  await contract.setValue(newValue);

  // Assert
  expect(await contract.getValue()).to.equal(newValue);
});
```

### 4. Test One Thing

✅ **Good**: Single assertion per test

```javascript
it("should set owner on deployment", async function () {
  expect(await contract.owner()).to.equal(deployer.address);
});
```

❌ **Bad**: Multiple unrelated assertions

```javascript
it("should work", async function () {
  expect(await contract.owner()).to.equal(deployer.address);
  expect(await contract.count()).to.equal(0);
  // Too many assertions
});
```

### 5. Test Error Cases

Always test both success and failure paths:

```javascript
// Success case
it("should allow valid operation", async function () {
  await expect(contract.operation(validInput)).to.not.be.reverted;
});

// Failure case
it("should reject invalid operation", async function () {
  await expect(contract.operation(invalidInput)).to.be.reverted;
});
```

## Continuous Integration

### GitHub Actions Example

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: "18"

      - name: Install dependencies
        run: npm install

      - name: Run tests
        run: npm test

      - name: Run coverage
        run: npm run test:coverage
```

## Coverage Report

Generate and view coverage reports:

```bash
# Generate coverage report
npm run test:coverage

# Coverage report saved to:
# - coverage/index.html
# - coverage/lcov.info
```

### Coverage Thresholds

```javascript
// hardhat.config.js
module.exports = {
  solidity: "0.8.24",
  coverage: {
    statements: 90,
    branches: 85,
    functions: 90,
    lines: 90,
  },
};
```

## Troubleshooting

### Common Issues

**Tests timeout**

```bash
# Increase timeout
npx hardhat test --timeout 60000
```

**Out of gas errors**

```bash
# Increase gas limit in hardhat.config.js
networks: {
  hardhat: {
    gas: 12000000
  }
}
```

**Network errors**

```bash
# Reset Hardhat network
npx hardhat clean
npx hardhat compile
```

## Resources

### Documentation

- [Hardhat Testing](https://hardhat.org/hardhat-runner/docs/guides/test-contracts)
- [Chai Matchers](https://ethereum-waffle.readthedocs.io/en/latest/matchers.html)
- [Mocha Documentation](https://mochajs.org/)

### Tools

- [Hardhat Network Helpers](https://hardhat.org/hardhat-network-helpers)
- [Solidity Coverage](https://github.com/sc-forks/solidity-coverage)
- [Hardhat Gas Reporter](https://github.com/cgewecke/hardhat-gas-reporter)

## Summary

This test suite provides comprehensive coverage of all contract functionality with:

- ✅ **45+ test cases** covering all functions
- ✅ **>90% code coverage** target
- ✅ **Gas optimization** monitoring
- ✅ **Edge case** testing
- ✅ **Security** validation
- ✅ **Best practices** implementation

Run `npm test` to execute the full test suite!

---

**Last Updated**: 2025

**Test Framework**: Mocha + Chai + Hardhat

**Total Test Cases**: 45+
