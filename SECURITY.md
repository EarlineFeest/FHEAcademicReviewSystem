# Security & Performance Documentation

Comprehensive security auditing and performance optimization guide for the Academic Review Blockchain System.

## Table of Contents

- [Overview](#overview)
- [Security Audit Tools](#security-audit-tools)
- [Performance Optimization](#performance-optimization)
- [Toolchain Integration](#toolchain-integration)
- [Security Best Practices](#security-best-practices)
- [Gas Optimization](#gas-optimization)
- [DoS Protection](#dos-protection)
- [Pre-commit Hooks](#pre-commit-hooks)
- [Automated Security](#automated-security)
- [Monitoring](#monitoring)

## Overview

This project implements a comprehensive security and performance optimization strategy with complete toolchain integration:

```
Hardhat + solhint + gas-reporter + optimizer
     ↓
Frontend + eslint + prettier + type-checking
     ↓
CI/CD + security-check + performance-test
```

### Security Layers

1. **Static Analysis** - Solhint, ESLint
2. **Code Quality** - Prettier, lint-staged
3. **Pre-commit Hooks** - Husky automation
4. **CI/CD Security** - GitHub Actions workflows
5. **Gas Monitoring** - Hardhat gas reporter
6. **Performance Testing** - Automated benchmarks

## Security Audit Tools

### Solhint - Solidity Linter

**Configuration**: `.solhint.json`

Enforces security best practices:
- Code complexity limits
- Compiler version requirements
- Function visibility checks
- Naming conventions
- Gas optimization rules

**Run Solhint**:
```bash
npm run lint:sol
```

**Auto-fix issues**:
```bash
npm run lint:sol:fix
```

### ESLint - JavaScript Linter

**Configuration**: `.eslintrc.json`

Enforces code quality:
- No unused variables
- Prefer const over let
- Consistent formatting
- Arrow function preferences
- Security patterns

**Run ESLint**:
```bash
npx eslint scripts/ test/
```

### Security Checklist

- [ ] No `tx.origin` usage (phishing vulnerability)
- [ ] No unprotected `delegatecall` (arbitrary code execution)
- [ ] No `selfdestruct` without access control
- [ ] Timestamp dependency review
- [ ] Reentrancy protection
- [ ] Integer overflow/underflow checks
- [ ] Access control on critical functions
- [ ] Event logging for state changes

## Performance Optimization

### Compiler Optimization

**Configuration**: `hardhat.config.js`

```javascript
solidity: {
  version: "0.8.24",
  settings: {
    optimizer: {
      enabled: true,
      runs: 200,  // Balance between deployment and execution costs
      details: {
        yul: true,
        yulDetails: {
          stackAllocation: true,
          optimizerSteps: "dhfoDgvulfnTUtnIf"
        }
      }
    },
    viaIR: true,  // Better optimization via intermediate representation
    metadata: {
      bytecodeHash: "none"  // Smaller contracts
    }
  }
}
```

### Optimization Tradeoffs

| Runs | Deployment Gas | Execution Gas | Use Case |
|------|---------------|---------------|----------|
| 1 | Lowest | Highest | One-time deployment |
| 200 | Balanced | Balanced | **Recommended** |
| 1000 | Higher | Lower | Frequently called contracts |
| 10000 | Highest | Lowest | High-frequency contracts |

### Gas Reporter

**Enable gas reporting**:
```bash
REPORT_GAS=true npm test
```

**Output includes**:
- Method gas costs
- Average gas per transaction
- Time spent in execution
- USD cost estimates

### Contract Size Optimization

Maximum contract size: **24KB (24,576 bytes)**

**Check contract sizes**:
```bash
npm run compile
```

**Optimization strategies**:
1. Enable optimizer with high runs
2. Use libraries for common code
3. Split large contracts
4. Remove unnecessary code
5. Use shorter error messages
6. Enable `viaIR` compilation

## Toolchain Integration

### Complete Development Stack

#### 1. Hardhat Layer
```
Hardhat
  ├── Solidity Compiler (0.8.24)
  ├── Optimizer (runs: 200, viaIR: true)
  ├── Gas Reporter (detailed metrics)
  ├── Coverage Tools (solidity-coverage)
  └── Network Helpers (testing utilities)
```

#### 2. Code Quality Layer
```
Code Quality
  ├── Solhint (Solidity linting)
  ├── ESLint (JavaScript linting)
  ├── Prettier (code formatting)
  ├── lint-staged (pre-commit staging)
  └── Husky (git hooks)
```

#### 3. CI/CD Layer
```
GitHub Actions
  ├── test.yml (main test pipeline)
  ├── pr-checks.yml (pull request validation)
  ├── security-audit.yml (security checks)
  └── Automated workflows on push/PR
```

### Integration Flow

```
Developer writes code
     ↓
Pre-commit hook runs (Husky)
     ↓
Lint-staged formats code (Prettier)
     ↓
Solhint checks Solidity (security)
     ↓
ESLint checks JavaScript (quality)
     ↓
Contracts compile (optimization)
     ↓
Tests run (functionality + performance)
     ↓
Push to GitHub
     ↓
CI/CD pipeline runs
     ↓
Security audit executes
     ↓
Gas reporting generated
     ↓
Coverage uploaded to Codecov
     ↓
Deployment artifacts created
```

## Security Best Practices

### 1. Access Control

```solidity
// Good: Use OpenZeppelin AccessControl
import "@openzeppelin/contracts/access/AccessControl.sol";

contract SecureContract is AccessControl {
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    function pause() external onlyRole(PAUSER_ROLE) {
        // Pause logic
    }
}
```

### 2. Reentrancy Protection

```solidity
// Good: Use ReentrancyGuard
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract SecureContract is ReentrancyGuard {
    function withdraw() external nonReentrant {
        // Withdrawal logic
    }
}
```

### 3. Checks-Effects-Interactions Pattern

```solidity
// Good: Follow CEI pattern
function withdraw(uint256 amount) external {
    // Checks
    require(balances[msg.sender] >= amount, "Insufficient balance");

    // Effects
    balances[msg.sender] -= amount;

    // Interactions
    (bool success, ) = msg.sender.call{value: amount}("");
    require(success, "Transfer failed");
}
```

### 4. Input Validation

```solidity
// Good: Validate all inputs
function submitPaper(string memory title) external {
    require(bytes(title).length > 0, "Title required");
    require(bytes(title).length <= 500, "Title too long");
    // Process paper
}
```

### 5. Event Logging

```solidity
// Good: Emit events for state changes
event PaperSubmitted(uint256 indexed paperId, address indexed author);

function submitPaper() external {
    paperCount++;
    emit PaperSubmitted(paperCount, msg.sender);
}
```

## Gas Optimization

### Optimization Techniques

#### 1. Storage Optimization

```solidity
// Bad: Multiple storage reads
function badExample() external {
    uint256 count = paperCount;  // SLOAD
    count = paperCount + 1;       // SLOAD again
    paperCount = count;           // SSTORE
}

// Good: Cache storage variables
function goodExample() external {
    uint256 count = paperCount;   // SLOAD once
    count++;
    paperCount = count;           // SSTORE once
}
```

#### 2. Use Calldata for Read-Only Parameters

```solidity
// Bad: Memory costs more gas
function registerReviewer(string memory expertise) external {
    // ...
}

// Good: Calldata for read-only params
function registerReviewer(string calldata expertise) external {
    // ...
}
```

#### 3. Pack Storage Variables

```solidity
// Bad: Each variable uses full slot
uint256 count;      // 32 bytes
bool active;        // 32 bytes
address owner;      // 32 bytes

// Good: Pack variables in slots
address owner;      // 20 bytes
bool active;        // 1 byte  } Same slot
uint8 count;        // 1 byte  }
```

#### 4. Use Custom Errors (Solidity 0.8.4+)

```solidity
// Bad: String error messages cost more gas
require(amount > 0, "Amount must be positive");

// Good: Custom errors save gas
error InvalidAmount();
if (amount == 0) revert InvalidAmount();
```

### Gas Benchmarks

Run performance tests:
```bash
npm run test test/performance.test.js
```

Expected gas costs:
- Reviewer registration: < 150,000 gas
- Paper submission: < 200,000 gas
- Review submission: < 200,000 gas
- Query operations: < 50,000 gas

## DoS Protection

### Protection Strategies

#### 1. Gas Limit Protection

```solidity
// Avoid unbounded loops
function getAllPapers(uint256 offset, uint256 limit)
    external
    view
    returns (uint256[] memory)
{
    require(limit <= 100, "Limit too high");  // Prevent DoS
    // Implementation
}
```

#### 2. Pull Over Push Pattern

```solidity
// Bad: Push pattern (DoS vulnerable)
function distribute() external {
    for (uint i = 0; i < recipients.length; i++) {
        recipients[i].transfer(amount);  // Can fail
    }
}

// Good: Pull pattern (DoS resistant)
mapping(address => uint256) public pendingWithdrawals;

function withdraw() external {
    uint256 amount = pendingWithdrawals[msg.sender];
    pendingWithdrawals[msg.sender] = 0;
    payable(msg.sender).transfer(amount);
}
```

#### 3. Rate Limiting

```solidity
mapping(address => uint256) public lastAction;
uint256 public constant RATE_LIMIT = 1 minutes;

function rateLimit() internal {
    require(
        block.timestamp >= lastAction[msg.sender] + RATE_LIMIT,
        "Rate limit exceeded"
    );
    lastAction[msg.sender] = block.timestamp;
}
```

## Pre-commit Hooks

### Husky Configuration

**Setup**: `.husky/pre-commit`

Automated checks before every commit:

1. **Lint-staged** - Format staged files
2. **Console.log check** - Prevent debug code
3. **Solhint** - Security linting
4. **Compilation** - Ensure contracts compile

**Manual trigger**:
```bash
.husky/pre-commit
```

### Lint-staged Configuration

**File**: `.lintstagedrc.json`

```json
{
  "*.{js,jsx}": ["eslint --fix", "prettier --write"],
  "*.{json,md,yml,yaml}": ["prettier --write"],
  "*.sol": ["solhint --fix", "prettier --write"]
}
```

### Bypass Hooks (Emergency Only)

```bash
git commit --no-verify -m "Emergency fix"
```

**⚠️ Warning**: Only use in emergencies!

## Automated Security

### Security Audit Workflow

**File**: `.github/workflows/security-audit.yml`

Automated security checks:

#### 1. NPM Audit
- Scans dependencies for vulnerabilities
- Generates security reports
- Alerts on moderate+ severity

#### 2. Solidity Security
- Checks for common vulnerabilities
- Analyzes patterns (tx.origin, delegatecall, etc.)
- Validates reentrancy protection

#### 3. Contract Size
- Verifies 24KB limit compliance
- Warns when approaching limit
- Fails if limit exceeded

#### 4. Gas Optimization
- Runs gas reporter
- Benchmarks performance
- Compares against thresholds

#### 5. Dependency Review
- Analyzes new dependencies in PRs
- Checks licenses
- Identifies security risks

### Schedule

- **Push**: Runs on every push to main/develop
- **Pull Request**: Runs on all PRs
- **Weekly**: Monday 00:00 UTC (cron job)

## Monitoring

### Metrics to Track

#### Security Metrics
- [ ] Vulnerability count (target: 0 high/critical)
- [ ] Code coverage (target: >90%)
- [ ] Linting violations (target: 0 errors)
- [ ] Failed security checks (target: 0)

#### Performance Metrics
- [ ] Average gas per transaction
- [ ] Contract size (target: <20KB)
- [ ] Test execution time
- [ ] Deployment costs

### Dashboards

#### Codecov Dashboard
- Coverage trends
- File-by-file analysis
- PR impact assessment

#### GitHub Actions Dashboard
- Workflow success rates
- Average execution times
- Failed job analysis

### Alerts

Configure alerts for:
- Security vulnerabilities discovered
- Tests failing
- Coverage drops below threshold
- Contract size exceeds limits

## Security Audit Checklist

### Pre-Deployment

- [ ] All tests passing
- [ ] Coverage >90%
- [ ] No high/critical vulnerabilities
- [ ] Contract sizes within limits
- [ ] Gas costs optimized
- [ ] Access control verified
- [ ] Event logging complete
- [ ] Error handling robust
- [ ] Documentation up to date
- [ ] Code reviewed by team

### Deployment

- [ ] Deploy to testnet first
- [ ] Verify contracts on Etherscan
- [ ] Test all functionality
- [ ] Monitor for issues
- [ ] Document deployment

### Post-Deployment

- [ ] Enable monitoring
- [ ] Set up alerts
- [ ] Document contract addresses
- [ ] Create incident response plan
- [ ] Schedule security reviews

## Emergency Response

### Security Incident Procedure

1. **Detect** - Monitoring alerts trigger
2. **Assess** - Evaluate severity and impact
3. **Contain** - Pause contracts if necessary
4. **Remediate** - Fix vulnerability
5. **Verify** - Test fix thoroughly
6. **Deploy** - Update contracts
7. **Post-mortem** - Document and learn

### Pauser Role

Emergency pause capability:

```solidity
function pause() external onlyRole(PAUSER_ROLE) {
    _pause();
}

function unpause() external onlyRole(PAUSER_ROLE) {
    _unpause();
}
```

Configure in `.env`:
```
PAUSER_ADDRESS=0x1234...
```

## Resources

### Security Tools
- [Solhint](https://github.com/protofire/solhint)
- [Slither](https://github.com/crytic/slither)
- [MythX](https://mythx.io/)
- [OpenZeppelin Defender](https://defender.openzeppelin.com/)

### Learning Resources
- [Smart Contract Security](https://consensys.github.io/smart-contract-best-practices/)
- [Solidity Security Considerations](https://docs.soliditylang.org/en/latest/security-considerations.html)
- [Gas Optimization Guide](https://eip2535diamonds.substack.com/p/gas-optimizations-for-solidity-smart)
- [OpenZeppelin Security Audits](https://blog.openzeppelin.com/security-audits/)

### Support

For security concerns:
- Review this documentation
- Check GitHub Security tab
- Run security audit workflow
- Contact security team

---

**Last Updated**: 2025

**Security Level**: Production-Ready

**Audit Status**: Continuous Monitoring Enabled
