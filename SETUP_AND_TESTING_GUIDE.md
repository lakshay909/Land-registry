# Developer Setup & Testing Guide
## Tamper-Proof Land Registry and Property Ownership Tracking DApp

Welcome to the **Land Registry** project. This guide provides comprehensive, step-by-step instructions for setting up, compiling, running, and testing the entire decentralized application from scratch on a new development device.

---

## 📋 Table of Contents
1. [Prerequisites](#1-prerequisites)
2. [Project Architecture Overview](#2-project-architecture-overview)
3. [Dependencies Installation](#3-dependencies-installation)
4. [Environment Configuration (.env)](#4-environment-configuration-env)
5. [Smart Contracts: Compilation & Testing](#5-smart-contracts-compilation--testing)
6. [MetaMask Wallet Configuration](#6-metamask-wallet-configuration)
7. [Running the Full Development Stack](#7-running-the-full-development-stack)
8. [End-to-End Testing Flow (Step-by-Step User Journey)](#8-end-to-end-testing-flow-step-by-step-user-journey)
9. [Troubleshooting & Common Issues](#9-troubleshooting--common-issues)

---

## 1. Prerequisites

Before beginning, ensure your machine has the following tools installed:

- **Node.js**: `v18.0.0` or higher (`v20+` or `v22+` recommended). Verify with `node -v`.
- **npm**: `v9.0.0` or higher. Verify with `npm -v`.
- **Git**: Installed and configured.
- **MetaMask Browser Extension**: Installed in Chrome, Brave, Firefox, or Edge.

---

## 2. Project Architecture Overview

The repository is structured into three integrated tiers:

```
Land-registry/
├── contracts/               # Solidity Smart Contracts (Solidity 0.8.24, Cancun EVM)
├── test/                    # Mocha/Chai Unit & Security Fraud Tests (43 test cases)
├── scripts/                 # Deployment scripts & automated verification
├── backend/                 # Node.js/Express 5 REST API & SQLite Event Indexer
│   ├── routes/              # Modular API routes (properties, transfers, documents, audit)
│   ├── indexer.js           # Real-time and historical blockchain event synchronizer
│   ├── db.js                # SQLite database (better-sqlite3) schema definition
│   └── uploads/             # Local off-chain deed PDF storage
└── frontend/                # React 19 + Tailwind CSS v4 + Vite Web Application
    └── src/
        ├── context/         # AuthContext (MetaMask wallet connection & role detection)
        ├── pages/           # PublicSearch, CitizenDashboard, AuthorityDashboard
        └── components/      # EIP-712 Signing and Transfer Modals
```

- **Blockchain**: The single source of truth for property registration, verifications, transfers, and ownership history.
- **Backend**: Caches on-chain events into a local SQLite database for instant search, filtering, and off-chain PDF storage.
- **Frontend**: Connects directly to the blockchain via MetaMask for writes/signatures and to the backend API for rapid data querying.

---

## 3. Dependencies Installation

The application requires installing dependencies across the root project (Hardhat), the backend, and the frontend.

Run the following commands from the project root:

```bash
# 1. Install root workspace dependencies (Hardhat, OpenZeppelin v5, Tooling)
npm install

# 2. Install backend dependencies (Express 5, better-sqlite3, Ethers v6, Multer, Cors)
cd backend
npm install
cd ..

# 3. Install frontend dependencies (React 19, Tailwind CSS v4, Ethers v6, Vite)
cd frontend
npm install
cd ..
```

> **Quick One-Liner (Alternative)**:
> ```bash
> npm install && (cd backend && npm install) && (cd frontend && npm install)
> ```

---

## 4. Environment Configuration (.env)

The project includes pre-configured `.env.example` templates for all layers. Create the actual `.env` files using:

### Step 4.1: Root Environment File
Copy the root `.env.example` to `.env`:
```bash
cp .env.example .env
```
Default root `.env` values:
```env
SEPOLIA_RPC_URL="https://sepolia.infura.io/v3/YOUR_INFURA_KEY"
AMOY_RPC_URL="https://rpc-amoy.polygon.technology"
PRIVATE_KEY="0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
ETHERSCAN_API_KEY="YOUR_ETHERSCAN_API_KEY"
```

### Step 4.2: Backend Environment File
Copy `backend/.env.example` to `backend/.env`:
```bash
cp backend/.env.example backend/.env
```
Default `backend/.env` contents:
```env
PORT=3000
RPC_URL=http://127.0.0.1:8545
CONTRACT_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
DB_PATH=database.sqlite
CONTRACT_DEPLOYMENT_BLOCK=0
```

### Step 4.3: Frontend Environment File
Copy `frontend/.env.example` to `frontend/.env`:
```bash
cp frontend/.env.example frontend/.env
```
Default `frontend/.env` contents:
```env
VITE_CONTRACT_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
VITE_SUPPORTED_CHAIN_ID=31337
VITE_API_URL=http://localhost:3000
```

---

## 5. Smart Contracts: Compilation & Testing

### Compile Solidity Contracts
Compile the contracts using Hardhat:
```bash
npm run compile
```
*Expected Output*: `Compiled 18 Solidity files successfully (evm target: cancun).`

### Run Automated Unit & Security Tests
Execute the comprehensive test suite:
```bash
npm test
```
*Expected Output*:
```
  LandRegistry - Flagging (Step 6)
    ✔ Should allow authority to flag property and emit event
    ✔ Should revert if flagged by non-authority
    ...
  LandRegistry - Ownership History (Step 7)
    ✔ TC-8: getOwnershipHistory tracks multi-hop transfers accurately
  LandRegistry - Registration
    ✔ TC-1: Register a new property
    ✔ TC-2: Authority verifies a registration
    ✔ FT-1: Register same property twice (DuplicateRegistration)
  LandRegistry - Transfers
    ✔ TC-3: Owner initiates transfer
    ✔ TC-4: Owner signs transfer
    ✔ TC-5: Buyer signs transfer
    ✔ FT-3: Forged signature (InvalidSignature)
    ✔ FT-4: Replay attack (NonceAlreadyUsed)
    ✔ FT-5: Execute transfer without approval (NotApproved)
    ✔ FT-6: Execute transfer on frozen property (PropertyIsFrozen)
    ✔ FT-7: Self-dealing transfer (InvalidTransferToSelf)
    ...
  43 passing (2s)
```

### Generate Code Coverage Report (Optional)
```bash
npm run coverage
```
The smart contract maintains **100% line coverage** and **96.77% branch coverage**.

---

## 6. MetaMask Wallet Configuration

To test the application in your browser, configure MetaMask to connect to your local Hardhat EVM node.

### 6.1 Add the Hardhat Localhost Network in MetaMask
1. Open MetaMask, click the **Network selector** in the top-left, and select **Add Network** -> **Add a network manually**.
2. Fill in the network details:
   - **Network Name**: `Hardhat Localhost`
   - **New RPC URL**: `http://127.0.0.1:8545`
   - **Chain ID**: `31337`
   - **Currency Symbol**: `ETH`
3. Click **Save** and switch to `Hardhat Localhost`.

### 6.2 Import Test Accounts
Hardhat spins up deterministic accounts with 10,000 test ETH each. Import the following accounts into MetaMask using their Private Keys:

| Role in App | Account Label | Address | Private Key |
|---|---|---|---|
| **Deployer / Admin** | Hardhat Account #0 | `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266` | `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80` |
| **Government Authority** | Hardhat Account #1 | `0x70997970C51812dc3A010C7d01b50e0d17dc79C8` | `0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d` |
| **Citizen 1 (Seller)** | Hardhat Account #2 | `0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC` | `0x5de4111afa1a4b94908f83103eb272296ac67373d99998845e285094f7190e38` |
| **Citizen 2 (Buyer)** | Hardhat Account #3 | `0x90F79bf6EB2c4f870365E785982E1f101E93b906` | `0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6` |

> **How to Import in MetaMask**:
> 1. Click your MetaMask account avatar -> **Add account or hardware wallet** -> **Import account**.
> 2. Paste the private key and click **Import**.
> 3. Rename the account (e.g., "Land Authority", "Citizen 1", "Citizen 2") for easy switching.

---

## 7. Running the Full Development Stack

To run the complete system, open **4 separate terminal windows** (or split panes):

### Terminal 1: Start Local Hardhat Node
```bash
# In project root:
npm run node:local
```
*Leave this running. It hosts the local blockchain RPC on `http://127.0.0.1:8545`.*

### Terminal 2: Deploy Contract to Local Node
```bash
# In project root:
npm run deploy:local
```
*Expected Output*:
```
==================================================
Deploying LandRegistry Smart Contract
Deployer Address: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
Authority (Admin) Address: 0x70997970C51812dc3A010C7d01b50e0d17dc79C8
Network: localhost
==================================================
✅ LandRegistry deployed successfully at: 0x5FbDB2315678afecb367f032d93F642f64180aa3
✅ Granted ADMIN_ROLE to authority account: 0x70997970C51812dc3A010C7d01b50e0d17dc79C8
```

### Terminal 3: Start Backend API Server & Event Indexer
In the `backend` directory:
```bash
cd backend
# Option A: Run server and indexer concurrently
node server.js & node indexer.js
```
*(Or run `node server.js` in Terminal 3 and `node indexer.js` in a sub-tab).*
- Express API runs on: `http://localhost:3000`
- Indexer connects to: `http://127.0.0.1:8545` and tracks smart contract events in real-time.

### Terminal 4: Start Frontend UI
In the `frontend` directory:
```bash
cd frontend
npm run dev
```
Open your browser at: **`http://localhost:5173`**

---

## 8. End-to-End Testing Flow (Step-by-Step User Journey)

Follow this full walkthrough to test every feature of the decentralized application.

### Phase 1: Public Registry View (Initial State)
1. Open `http://localhost:5173`.
2. The homepage shows the **Public Registry Search**.
3. Searching for Property ID `1` shows "Property not found" since no properties have been registered yet.

---

### Phase 2: Citizen Registers a New Property
1. In MetaMask, switch to **Citizen 1** (`0x3C44...`).
2. Click **Connect Wallet** in the top navigation bar.
3. The navbar will display badge: `CITIZEN` with address `0x3C44...`.
4. Click **My Dashboard** (`/dashboard`).
5. In the **Register New Property** section:
   - **Location Hash / Description**: e.g., `Sector 14, Plot 102, Gurgaon`
   - **Area (sq. meters)**: e.g., `1200`
   - **Deed Document (PDF)**: Select any sample PDF file on your computer.
6. Click **Register Property**:
   - The browser calculates the document's `keccak256` hash in client memory.
   - The file is uploaded to the backend off-chain storage (`POST /api/documents`).
   - MetaMask prompts to confirm the `registerProperty` on-chain transaction.
7. Confirm the transaction in MetaMask.
8. Once confirmed, the property appears under **My Properties** with status: `Pending Authority Verification` (Yellow badge).

---

### Phase 3: Government Authority Verifies the Property
1. In MetaMask, switch to **Government Authority** (`0x7099...`).
2. The frontend automatically updates the navbar badge to: `AUTHORITY`.
3. The navigation link changes to **Authority Panel** (`/authority`). Click it.
4. Under the **Pending Registrations** tab, you will see Property `#1` submitted by `0x3C44...`.
5. Click **Verify Registration**:
   - MetaMask prompts to sign `verifyRegistration(1)`.
6. Confirm the transaction.
7. Once mined:
   - Contract emits `PropertyVerified`.
   - Backend indexer updates SQLite `is_verified = 1`.
   - The property moves out of Pending Registrations.

---

### Phase 4: Citizen Initiates Ownership Transfer
1. Switch MetaMask back to **Citizen 1** (`0x3C44...`).
2. Navigate to **My Dashboard** -> **My Properties**.
3. Property `#1` now displays a green `Verified` badge.
4. Click the **Transfer Property** button:
   - A modal opens.
   - **Buyer Address**: Enter Citizen 2's address: `0x90F79bf6EB2c4f870365E785982E1f101E93b906`.
   - **New Deed Document**: Upload an updated PDF deed document representing the transfer agreement.
5. Click **Initiate Transfer**:
   - Backend uploads and indexes the new document hash.
   - MetaMask prompts to sign `initiateTransfer(1, 0x90F7..., newDocHash)`.
6. Confirm the transaction.
7. Under **My Transfers**, Transfer `#1` appears with status `Pending Signatures`.

---

### Phase 5: Cryptographic Multi-Party EIP-712 Signing
The transfer requires cryptographic signatures from **both** seller and buyer before the authority can approve it.

#### Seller (Citizen 1) Signs:
1. Under **My Transfers** in Citizen 1's dashboard, find Transfer `#1`.
2. Click **Sign Transfer**.
3. A modal opens with structured data details. Click **Sign with MetaMask**.
4. MetaMask will present a **Sign typed structured data (EIP-712)** request:
   - Shows: `propertyId`, `documentHash`, `action: TRANSFER`, `nonce`.
   - **Notice**: This is a gasless off-chain signature (no gas fee charged!).
5. Click **Sign**. The contract records `fromSigned = true`.

#### Buyer (Citizen 2) Signs:
1. In MetaMask, switch to **Citizen 2 (Buyer)** (`0x90F7...`).
2. Go to **My Dashboard** -> **My Transfers**.
3. Transfer `#1` appears in Citizen 2's transfer list.
4. Click **Sign Transfer** -> **Sign with MetaMask**.
5. Confirm the EIP-712 structured signature in MetaMask.
6. Now both `fromSigned` and `toSigned` are marked `true`.

---

### Phase 6: Authority Approves & Executes Transfer
1. In MetaMask, switch to **Government Authority** (`0x7099...`).
2. Go to **Authority Panel** -> **Pending Transfers** tab.
3. Transfer `#1` shows:
   - Seller Signed: `Yes` (Green check)
   - Buyer Signed: `Yes` (Green check)
4. Click **Approve Transfer**:
   - MetaMask confirms `approveTransfer(1)`.
5. Once approved, the **Execute Transfer** button unlocks.
6. Click **Execute Transfer**:
   - Smart contract updates `currentOwner` to Citizen 2 (`0x90F7...`).
   - Contract burns the deed hash to prevent reuse.
   - Appends Citizen 2 to the on-chain ownership history array.
   - Emits `OwnershipTransferred(propertyId=1, from=0x3C44..., to=0x90F7...)`.

---

### Phase 7: Public Audit & Verification
1. Click **LandRegistry** in the top navigation bar to return to the public search page (`/`).
2. Enter Property ID: `1` and click **Search**.
3. **Verify Updated State**:
   - **Current Owner**: Displays Citizen 2 (`0x90F79bf6EB2c4f870365E785982E1f101E93b906`).
   - **Status**: `Verified` (Green badge).
   - **Ownership Audit Timeline**: Shows the complete chronological provenance trail:
     1. `PropertyRegistered` by `0x3C44...`
     2. `PropertyVerified` by Authority
     3. `TransferInitiated`
     4. `TransferSigned` (Seller)
     5. `TransferSigned` (Buyer)
     6. `TransferApproved` by Authority
     7. `OwnershipTransferred` to `0x90F7...`

---

### Phase 8: Disputed Property Freeze Simulation (Optional)
To test fraud protection and dispute management:
1. As **Authority** (`0x7099...`), go to **Authority Panel** -> **Dispute / Flag Management** tab.
2. Enter Property ID `1` and reason: `Court injunction filed - pending ownership litigation`.
3. Click **Freeze Property**.
4. Property `#1` is now frozen (`isFrozen = true`).
5. If any user attempts to initiate a transfer on this property, the smart contract immediately reverts with `PropertyIsFrozen()`.
6. Once the dispute is resolved, the authority can click **Unfreeze Property** to restore full functionality.

---

## 9. Troubleshooting & Common Issues

### Issue 1: "Nonce too high" or "Transaction underpriced" in MetaMask
- **Cause**: Happens when you restart `npx hardhat node` while MetaMask remembers older transaction nonces.
- **Fix**: In MetaMask, go to **Settings** -> **Advanced** -> Click **Clear activity and nonce data** (or **Reset account**).

### Issue 2: "ECONNREFUSED 127.0.0.1:8545" in Backend Indexer
- **Cause**: The local Hardhat node is not running.
- **Fix**: Ensure Terminal 1 is actively running `npm run node:local` before starting `node indexer.js` or `node server.js`.

### Issue 3: "Wrong network detected" Banner on Frontend
- **Cause**: MetaMask is connected to Ethereum Mainnet or Sepolia instead of Localhost.
- **Fix**: Switch MetaMask network to `Hardhat Localhost` (Chain ID `31337`).

### Issue 4: Resetting the Local Database
- If you restart the Hardhat node from scratch and re-deploy, reset the backend SQLite cache to match:
  ```bash
  rm backend/database.sqlite
  # Re-run indexer to resync from block 0
  cd backend && node indexer.js
  ```

---

*This guide reflects the current codebase as of September 2026. For questions or architecture details, refer to [Docs/land-registry-architecture.md](Docs/land-registry-architecture.md).*
