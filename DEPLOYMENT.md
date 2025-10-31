# Deployment Guide

Complete deployment documentation for the Academic Review Blockchain System.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Environment Setup](#environment-setup)
- [Installation](#installation)
- [Compilation](#compilation)
- [Testing](#testing)
- [Deployment](#deployment)
- [Contract Verification](#contract-verification)
- [Interaction Scripts](#interaction-scripts)
- [Network Information](#network-information)
- [Troubleshooting](#troubleshooting)

## Prerequisites

Before deploying the Academic Review System, ensure you have the following:

### Required Software

- **Node.js**: v18.x or higher
- **npm**: v9.x or higher
- **Git**: Latest version

### Required Accounts

- **Ethereum Wallet**: MetaMask or similar
- **Sepolia Testnet ETH**: For gas fees (get from [Sepolia Faucet](https://sepoliafaucet.com/))
- **Etherscan API Key**: For contract verification ([Get API Key](https://etherscan.io/myapikey))
- **Alchemy/Infura Account**: For RPC endpoint ([Alchemy](https://www.alchemy.com/) or [Infura](https://infura.io/))

## Environment Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd academic-review-blockchain
```

### 2. Configure Environment Variables

Create a `.env` file in the project root:

```bash
cp .env.example .env
```

Edit the `.env` file with your credentials:

```env
# Network Configuration
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_ALCHEMY_API_KEY

# Private Key (NEVER share or commit this)
PRIVATE_KEY=your_wallet_private_key_here

# Etherscan API Key for contract verification
ETHERSCAN_API_KEY=your_etherscan_api_key_here

# Optional: CoinMarketCap API for gas reporting
COINMARKETCAP_API_KEY=your_coinmarketcap_api_key_here

# Gas Reporter (set to true to enable)
REPORT_GAS=false
```

### 3. Security Best Practices

⚠️ **IMPORTANT SECURITY NOTES:**

- Never commit your `.env` file to version control
- Never share your private key with anyone
- Use a dedicated wallet for development/testing
- Keep your API keys secure
- Ensure `.env` is listed in `.gitignore`

## Installation

Install all project dependencies:

```bash
npm install
```

This will install:

- Hardhat and toolbox
- OpenZeppelin contracts
- Ethers.js v6
- Testing frameworks (Chai, Mocha)
- Contract verification tools
- Gas reporting utilities

## Compilation

Compile the smart contracts:

```bash
npm run compile
```

This command:

- Compiles all Solidity contracts in `/contracts`
- Generates contract artifacts in `/artifacts`
- Creates TypeChain type definitions
- Optimizes bytecode for deployment

### Compilation Output

```
Compiled 1 Solidity file successfully
```

## Testing

### Run All Tests

```bash
npm test
```

### Run Tests with Gas Reporting

```bash
npm run test:gas
```

### Run Tests with Coverage

```bash
npm run test:coverage
```

## Deployment

### Local Deployment (Development)

#### 1. Start Local Hardhat Node

In one terminal:

```bash
npm run node
```

This starts a local Ethereum network at `http://127.0.0.1:8545`

#### 2. Deploy to Local Network

In another terminal:

```bash
npm run deploy:local
```

### Sepolia Testnet Deployment

#### 1. Ensure Prerequisites

- [ ] Sepolia RPC URL configured in `.env`
- [ ] Private key configured in `.env`
- [ ] Wallet has sufficient Sepolia ETH (minimum 0.1 ETH recommended)

#### 2. Deploy to Sepolia

```bash
npm run deploy:sepolia
```

#### 3. Deployment Output

```
=====================================
Academic Review System Deployment
=====================================

🌐 Network: sepolia
⛓️  Chain ID: 11155111

📍 Deployer Address: 0x...
💰 Deployer Balance: 0.5 ETH

=====================================
📄 Deploying AcademicReviewSystem Contract
=====================================

⏳ Deployment in progress...
✅ AcademicReviewSystem deployed to: 0x...

=====================================
✅ Deployment Completed Successfully!
=====================================
```

#### 4. Save Deployment Information

Deployment information is automatically saved to:

- `deployments/sepolia-latest.json` - Latest deployment
- `deployments/sepolia-<timestamp>.json` - Timestamped deployment

## Contract Verification

Verify your deployed contracts on Etherscan:

```bash
npm run verify:sepolia
```

### Manual Verification

If automatic verification fails, use manual verification:

```bash
npx hardhat verify --network sepolia <CONTRACT_ADDRESS>
```

### Verification Success

```
✅ Contract verified successfully!

View on Etherscan:
https://sepolia.etherscan.io/address/0x.../code
```

## Interaction Scripts

### Interactive Testing

Test contract functionality with the interaction script:

```bash
# Local network
npm run interact:local

# Sepolia testnet
npm run interact:sepolia
```

This script demonstrates:

- Reviewer registration
- Paper submission
- Review submission
- Querying papers

### Full System Simulation

Run a complete peer review workflow simulation:

```bash
# Local network
npm run simulate:local

# Sepolia testnet
npm run simulate:sepolia
```

The simulation includes:

- Multiple reviewer registrations (5 reviewers)
- Multiple paper submissions (3 papers)
- Multiple review submissions (9 reviews total)
- System state verification

## Network Information

### Sepolia Testnet

- **Network Name**: Sepolia
- **Chain ID**: 11155111
- **RPC URL**: https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY
- **Block Explorer**: https://sepolia.etherscan.io
- **Faucets**:
  - https://sepoliafaucet.com/
  - https://faucet.sepolia.dev/

### Network Configuration

The project is configured for the following networks:

1. **Hardhat** - Local development (chainId: 31337)
2. **Localhost** - Local node (chainId: 31337)
3. **Sepolia** - Public testnet (chainId: 11155111)

## Deployed Contracts

### Sepolia Testnet

**Contract Address**: `0x90DD935d005781Fd7B20DE72dD04b9c1EB54E117`

**Etherscan Link**: [View on Etherscan](https://sepolia.etherscan.io/address/0x90DD935d005781Fd7B20DE72dD04b9c1EB54E117)

### Contract ABI

The contract ABI is available in:

```
artifacts/contracts/AcademicReviewSystem.sol/AcademicReviewSystem.json
```

## Troubleshooting

### Common Issues

#### 1. Insufficient Funds

**Error**: `sender doesn't have enough funds to send tx`

**Solution**: Ensure your wallet has enough Sepolia ETH. Get testnet ETH from faucets.

#### 2. Nonce Too High

**Error**: `nonce has already been used`

**Solution**: Reset your account in MetaMask or wait for the transaction to be mined.

#### 3. Gas Price Too Low

**Error**: `replacement transaction underpriced`

**Solution**: Increase gas price in `hardhat.config.js` or wait for network congestion to clear.

#### 4. RPC Connection Failed

**Error**: `could not detect network`

**Solution**:

- Check your RPC URL in `.env`
- Verify your Alchemy/Infura API key is valid
- Check network connectivity

#### 5. Verification Failed

**Error**: `Etherscan API error`

**Solution**:

- Verify your Etherscan API key
- Wait a few minutes after deployment
- Try manual verification

#### 6. Contract Already Deployed

**Error**: `contract already exists`

**Solution**: This is normal - the address is deterministic. Use a different deployer account or modify the contract.

### Getting Help

If you encounter issues not covered here:

1. Check the [Hardhat documentation](https://hardhat.org/docs)
2. Review [OpenZeppelin guides](https://docs.openzeppelin.com/)
3. Search [Etherscan](https://etherscan.io) for similar transactions
4. Check network status at [Etherscan](https://sepolia.etherscan.io/)

## Additional Resources

### Documentation

- [Hardhat Documentation](https://hardhat.org/docs)
- [Ethers.js Documentation](https://docs.ethers.org/v6/)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts/)
- [Solidity Documentation](https://docs.soliditylang.org/)

### Tools

- [Remix IDE](https://remix.ethereum.org/) - Web-based Solidity IDE
- [Tenderly](https://tenderly.co/) - Smart contract monitoring
- [Etherscan](https://etherscan.io/) - Blockchain explorer
- [MetaMask](https://metamask.io/) - Web3 wallet

### Networks

- [Sepolia Faucet](https://sepoliafaucet.com/)
- [Alchemy](https://www.alchemy.com/) - RPC provider
- [Infura](https://infura.io/) - RPC provider

## Security Considerations

### Before Mainnet Deployment

- [ ] Complete security audit
- [ ] Extensive testing on testnet
- [ ] Gas optimization review
- [ ] Access control verification
- [ ] Emergency pause mechanism
- [ ] Upgrade strategy (if using proxies)
- [ ] Bug bounty program consideration

### Best Practices

1. **Never** deploy to mainnet without thorough testing
2. **Always** use a hardware wallet for mainnet deployments
3. **Test** all functionality on testnet first
4. **Audit** contracts before production use
5. **Monitor** deployed contracts for unusual activity
6. **Document** all deployment parameters and configurations

## Deployment Checklist

- [ ] Environment variables configured
- [ ] Dependencies installed
- [ ] Contracts compiled successfully
- [ ] Tests passing
- [ ] Sufficient testnet ETH in wallet
- [ ] RPC endpoint tested
- [ ] Contract deployed to testnet
- [ ] Deployment information saved
- [ ] Contract verified on Etherscan
- [ ] Interaction scripts tested
- [ ] Simulation completed successfully
- [ ] Frontend configuration updated
- [ ] Documentation reviewed

## Support

For technical support or questions:

- Review this documentation
- Check the troubleshooting section
- Consult Hardhat and Ethereum documentation
- Review deployment logs for error details

---

**Last Updated**: 2025

**Framework**: Hardhat v2.19.0

**Solidity Version**: 0.8.24
