# CI/CD Documentation

Comprehensive continuous integration and deployment documentation for the Academic Review Blockchain System.

## Table of Contents

- [Overview](#overview)
- [Workflows](#workflows)
- [Code Quality](#code-quality)
- [Testing](#testing)
- [Coverage](#coverage)
- [Security](#security)
- [Deployment](#deployment)
- [Badges](#badges)
- [Troubleshooting](#troubleshooting)

## Overview

This project uses **GitHub Actions** for automated testing, code quality checks, and continuous integration. Every push and pull request triggers a comprehensive suite of checks to ensure code quality and reliability.

### CI/CD Features

- ✅ Automated testing on multiple Node.js versions (18.x, 20.x)
- ✅ Code quality checks (Solhint, Prettier)
- ✅ Test coverage reporting with Codecov
- ✅ Security audits
- ✅ Contract size validation
- ✅ Pull request validation
- ✅ Dependency review

## Workflows

### Main Test Workflow

**File**: `.github/workflows/test.yml`

**Triggers**:

- Push to `main` branch
- Push to `develop` branch
- Pull requests to `main` or `develop`

**Jobs**:

#### 1. Lint (Code Quality Checks)

- Runs Solhint on Solidity contracts
- Validates code formatting with Prettier
- Checks for console.log statements in contracts

#### 2. Test on Node.js 18.x

- Installs dependencies
- Compiles contracts
- Runs full test suite

#### 3. Test on Node.js 20.x

- Installs dependencies
- Compiles contracts
- Runs full test suite
- Generates gas usage reports

#### 4. Coverage

- Runs test coverage analysis
- Uploads coverage to Codecov
- Archives coverage reports (30 days retention)

#### 5. Security

- Runs npm audit for vulnerabilities
- Generates security report
- Continues on moderate vulnerabilities

#### 6. Build

- Creates production artifacts
- Archives build outputs (7 days retention)
- Depends on lint and test jobs

#### 7. Test Summary

- Aggregates all job results
- Displays comprehensive status
- Fails if any critical job fails

### Pull Request Workflow

**File**: `.github/workflows/pr-checks.yml`

**Triggers**:

- Pull request opened
- Pull request synchronized
- Pull request reopened

**Jobs**:

#### 1. PR Validation

- Validates PR title format (conventional commits)
- Checks for breaking changes in contracts
- Runs comprehensive checks
- Posts automated comment with results

#### 2. Contract Size Check

- Compiles all contracts
- Validates contract size limits (24KB)
- Reports oversized contracts

#### 3. Dependency Review

- Analyzes dependency changes
- Identifies security vulnerabilities
- Fails on moderate+ severity issues

## Code Quality

### Solhint Configuration

**File**: `.solhint.json`

Enforces Solidity best practices:

```json
{
  "extends": "solhint:recommended",
  "rules": {
    "code-complexity": ["error", 8],
    "compiler-version": ["error", "^0.8.24"],
    "func-visibility": ["error", { "ignoreConstructors": true }],
    "max-line-length": ["error", 120],
    "const-name-snakecase": "error",
    "contract-name-camelcase": "error",
    "event-name-camelcase": "error"
  }
}
```

### Running Linters Locally

```bash
# Run all linters
npm run lint

# Run Solhint only
npm run lint:sol

# Auto-fix linting issues
npm run lint:fix

# Check code formatting
npm run prettier:check

# Auto-format code
npm run prettier:write
```

### Prettier Configuration

**File**: `.prettierrc.json`

Enforces consistent code formatting:

- **General**: 2 spaces, 100 char width
- **Solidity**: 4 spaces, 120 char width
- **JSON**: 2 spaces, 80 char width

## Testing

### Test Execution

Tests run automatically on:

- Every push to main/develop
- Every pull request
- Multiple Node.js versions (18.x, 20.x)

### Local Testing

```bash
# Run all tests
npm test

# Run tests with gas reporting
npm run test:gas

# Run tests with coverage
npm run test:coverage

# Run specific test file
npx hardhat test test/AcademicReviewSystem.test.js
```

### Test Requirements

- ✅ All tests must pass
- ✅ No failing assertions
- ✅ Gas usage within limits
- ✅ Coverage above 90%

## Coverage

### Codecov Integration

Coverage reports are automatically uploaded to Codecov after each test run.

**Setup Codecov**:

1. Visit [codecov.io](https://codecov.io)
2. Sign up with GitHub
3. Add your repository
4. Get your CODECOV_TOKEN
5. Add token to GitHub Secrets:
   - Go to Settings → Secrets → Actions
   - Add `CODECOV_TOKEN`

### Coverage Reports

Coverage artifacts are stored for 30 days:

- HTML report: `coverage/index.html`
- LCOV format: `coverage/lcov.info`
- JSON format: `coverage/coverage.json`

### Viewing Coverage Locally

```bash
# Generate coverage report
npm run test:coverage

# Open HTML report
open coverage/index.html  # macOS
xdg-open coverage/index.html  # Linux
start coverage/index.html  # Windows
```

## Security

### Automated Security Checks

#### 1. NPM Audit

Runs on every workflow execution:

```bash
npm audit --audit-level=moderate
```

#### 2. Dependency Review

Analyzes dependency changes in pull requests:

- Identifies new vulnerabilities
- Checks license compliance
- Flags breaking changes

#### 3. Contract Security

- Validates contract size limits
- Checks for console.log statements
- Reviews breaking changes

### Manual Security Audit

```bash
# Run security audit
npm audit

# Fix vulnerabilities automatically
npm audit fix

# Generate detailed report
npm audit --json > audit-report.json
```

## Deployment

### Environment Setup

Required GitHub Secrets:

- `CODECOV_TOKEN` - For coverage reporting
- `SEPOLIA_RPC_URL` - For testnet deployment
- `PRIVATE_KEY` - For contract deployment
- `ETHERSCAN_API_KEY` - For contract verification

### Deployment Process

1. **Local Testing**

   ```bash
   npm test
   npm run lint
   ```

2. **Push to Branch**

   ```bash
   git add .
   git commit -m "feat: add new feature"
   git push origin feature-branch
   ```

3. **Create Pull Request**
   - Automated checks run
   - Review required
   - All checks must pass

4. **Merge to Main**
   - Production deployment (if configured)
   - Create release tag

## Badges

Add these badges to your README:

### GitHub Actions Status

```markdown
![Tests](https://github.com/USERNAME/REPO/workflows/Test%20and%20Quality%20Checks/badge.svg)
```

### Codecov Coverage

```markdown
[![codecov](https://codecov.io/gh/USERNAME/REPO/branch/main/graph/badge.svg)](https://codecov.io/gh/USERNAME/REPO)
```

### License

```markdown
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
```

### Node.js Version

```markdown
![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)
```

## Troubleshooting

### Common Issues

#### 1. Linting Failures

**Error**: Solhint violations

**Solution**:

```bash
# Auto-fix issues
npm run lint:fix

# Check specific rules
npx solhint contracts/**/*.sol
```

#### 2. Test Failures

**Error**: Tests fail in CI but pass locally

**Solution**:

- Check Node.js version compatibility
- Ensure all dependencies are installed
- Verify environment variables
- Run tests in clean environment

```bash
# Clean and reinstall
npm run clean
rm -rf node_modules
npm install
npm test
```

#### 3. Coverage Upload Failures

**Error**: Codecov upload fails

**Solution**:

- Verify CODECOV_TOKEN is set
- Check repository access
- Ensure coverage files exist

```bash
# Verify coverage files
ls -la coverage/
```

#### 4. Contract Size Exceeded

**Error**: Contract bytecode exceeds 24KB

**Solution**:

- Enable optimizer in hardhat.config.js
- Refactor large contracts
- Extract functionality to libraries
- Use external contracts

#### 5. Prettier Formatting Issues

**Error**: Code formatting violations

**Solution**:

```bash
# Auto-format all files
npm run prettier:write

# Check specific files
npx prettier --write "contracts/**/*.sol"
```

### Workflow Debugging

#### View Logs

1. Go to Actions tab in GitHub
2. Click on failed workflow
3. Review job logs
4. Check error messages

#### Run Locally

```bash
# Simulate CI environment
npm ci  # Clean install
npm run lint
npm run compile
npm test
npm run test:coverage
```

#### Check Dependencies

```bash
# List installed packages
npm list

# Verify versions
npm outdated

# Check for conflicts
npm ls
```

## Best Practices

### Before Committing

```bash
# 1. Run linters
npm run lint

# 2. Format code
npm run format

# 3. Run tests
npm test

# 4. Check coverage
npm run test:coverage

# 5. Commit with conventional format
git commit -m "feat: description"
```

### Commit Message Format

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

**Types**:

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Formatting
- `refactor`: Code restructuring
- `test`: Adding tests
- `chore`: Maintenance

**Examples**:

```
feat: add reviewer reputation system
fix: resolve paper submission validation
docs: update deployment guide
test: add edge case tests for reviews
```

### Pull Request Guidelines

1. **Title**: Use conventional commit format
2. **Description**: Explain changes clearly
3. **Tests**: Ensure all tests pass
4. **Coverage**: Maintain >90% coverage
5. **Linting**: Fix all violations
6. **Review**: Request review from maintainers

## Continuous Improvement

### Monitoring

- Check GitHub Actions regularly
- Review coverage trends on Codecov
- Monitor security advisories
- Update dependencies monthly

### Performance

- Optimize test execution time
- Cache dependencies effectively
- Parallelize independent jobs
- Use matrix builds efficiently

### Security

- Enable Dependabot
- Review security alerts promptly
- Keep dependencies updated
- Run security audits regularly

## Resources

### Documentation

- [GitHub Actions Docs](https://docs.github.com/en/actions)
- [Hardhat Testing](https://hardhat.org/hardhat-runner/docs/guides/test-contracts)
- [Codecov Documentation](https://docs.codecov.com/)
- [Solhint Rules](https://github.com/protofire/solhint/blob/master/docs/rules.md)

### Tools

- [Prettier](https://prettier.io/)
- [Solhint](https://github.com/protofire/solhint)
- [Codecov](https://codecov.io/)
- [GitHub Actions](https://github.com/features/actions)

## Support

For issues related to CI/CD:

1. Check workflow logs in GitHub Actions
2. Review this documentation
3. Search existing GitHub issues
4. Create new issue with details

---

**Last Updated**: 2025

**CI/CD Version**: 1.0.0

**Maintained By**: Development Team
