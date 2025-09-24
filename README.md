# CampusCredit ERC-20 Token Project

## Overview

This project implements a production-style ERC-20 token called CampusCredit (CAMP) using Hardhat v3 and Viem. The token includes advanced features such as burning, pausing, supply cap, and role-based access control.

## Network Configuration

### Deployed Network Details
- **RPC URL**: `http://127.0.0.1:8545` (Local Hardhat Network)
- **Chain ID**: `31337`
- **Token Address**: `0x5fbdb2315678afecb367f032d93f642f64180aa3`

### Note on Deployment
This project was originally intended for deployment on DIDLab Team 08:
- **Intended RPC URL**: `https://hh-08.didlab.org`
- **Intended Chain ID**: `31344`

Due to connectivity issues/errors with the DIDLab network on my laptop, I was forced to complete all development and testing via on a local Hardhat network. The same connectivity issues were occuring with meta mask on my machine as well.

## Environment Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd didlab-activity3
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` and ensure all required variables are set.

4. **Compile contracts**
   ```bash
   npm run compile
   ```

## Running the Scripts

### 1. Start Local Hardhat Node
Open a separate terminal and run:
```bash
npx hardhat node
```
Keep this running while executing other scripts.

### 2. Deploy the Contract
```bash
npm run deploy
```

**Output includes:**
- Deployment transaction hash: `0xbc65b9127ba7f631d8b70be5809f2d2113dca288bd52c6079519bb00f47a0a5a`
- Contract address: `0x5fbdb2315678afecb367f032d93f642f64180aa3`
- Block number: `1`
- Gas used: `1,996,392`
- Deployment cost: `5,739,627,000,000,000 wei`

After deployment, update your `.env` file with the TOKEN_ADDRESS.

### 3. Test Transfers and Approvals
```bash
npm run xfer
```

This script demonstrates:
- Token transfers (100 CAMP)
- Approval mechanism (50 CAMP allowance)
- Balance tracking
- Gas usage: Total 76,868 gas

### 4. Compare Batch Airdrop vs Individual Transfers
```bash
npm run airdrop
```

**Results:**
- Batch airdrop (3 recipients): 96,162 gas
- Individual transfers (3 recipients): 104,795 gas
- **Gas savings: 8.24%**
- **Fee savings: 2.96%**

### 5. Query Events and Logs
```bash
npm run logs
```

This script displays:
- All contract events (Transfer, Approval, RoleGranted)
- Current contract state
- Token supply utilization (50.00%)

## Token Specifications

- **Name**: CampusCredit
- **Symbol**: CAMP
- **Decimals**: 18
- **Total Cap**: 2,000,000 CAMP
- **Initial Supply**: 1,000,000 CAMP
- **Current Supply**: 1,000,030 CAMP (after test transactions)

## Smart Contract Features

1. **ERC-20 Standard** compliance
2. **Burnable** - Token holders can destroy their tokens
3. **Pausable** - Emergency pause mechanism
4. **Capped** - Maximum supply enforcement
5. **Role-Based Access Control**:
   - DEFAULT_ADMIN_ROLE
   - MINTER_ROLE
   - PAUSER_ROLE
6. **Batch Airdrop** - Gas-efficient multi-recipient distribution

## Project Structure

```
didlab-assignment3/
├── contracts/
│   └── CampusCredit.sol
├── scripts/
│   ├── deploy.ts
│   ├── transfer-approve.ts
│   ├── airdrop.ts
│   └── logs-query.ts
├── artifacts/
├── hardhat.config.ts
├── package.json
├── tsconfig.json
├── .env
├── .env.example
└── README.md
```

## Technical Stack

- **Hardhat**: v3.0.6
- **Viem**: v2.37.6
- **OpenZeppelin Contracts**: v5.4.0
- **Solidity**: v0.8.24
- **TypeScript**: v5.8.0
- **Node.js**: v22.x

## Gas Optimization

The contract implements several gas optimization techniques:
- Custom errors instead of require strings
- Unchecked arithmetic in loops
- Batch operations to reduce transaction overhead
- Pre-validation to prevent wasted gas

## Security Features

- Role-based access control for administrative functions
- Supply cap enforcement prevents unlimited minting
- Pause mechanism for emergency situations
- Custom errors provide clear failure reasons

## Troubleshooting

If you encounter issues:

1. **Compilation errors**: Ensure OpenZeppelin v5 is installed
2. **Connection errors**: Verify Hardhat node is running
3. **Transaction failures**: Check account balances and gas settings
4. **Missing artifacts**: Run `npm run compile` first

## License

MIT
