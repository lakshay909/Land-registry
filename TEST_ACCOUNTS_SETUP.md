# Test Accounts & MetaMask Setup Guide

This guide explains how developers and evaluators can import default local Hardhat node accounts (pre-funded with **10,000 fake test ETH**) into MetaMask to test the Land Registry, Marketplace, and Smart Escrow workflows.

---

## 1. Local Network Configuration in MetaMask

Add the local Hardhat blockchain network to your MetaMask extension:

| Setting | Value |
|---|---|
| **Network Name** | `Hardhat Localhost` |
| **New RPC URL** | `http://127.0.0.1:8545` |
| **Chain ID** | `31337` |
| **Currency Symbol** | `ETH` |
| **Block Explorer URL** | *(Leave blank)* |

> **💡 Quick Switch:** If you open the Land Registry frontend, clicking the **"⚠️ Switch to Chain 31337"** button in the navbar will automatically prompt MetaMask to add and switch to this local network.

---

## 2. Default Hardhat Test Accounts (10,000 ETH Each)

The standard Hardhat development mnemonic (`test test test test test test test test test test test junk`) generates deterministic accounts pre-funded with 10,000 ETH:

### Account #0: Government Authority (Admin)
- **Role:** Possesses `DEFAULT_ADMIN_ROLE` and `ADMIN_ROLE` on-chain. Can verify property registrations, approve transfers (releasing escrow), and freeze/unfreeze disputed titles.
- **Address:** `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266`
- **Private Key:** `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80`

### Account #1: Citizen / Seller
- **Role:** Regular citizen account. Can register properties, list verified parcels on the marketplace, sign sale deeds, and receive escrow funds.
- **Address:** `0x70997970C51812dc3A010C7d01b50e0d17dc79C8`
- **Private Key:** `0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d`

### Account #2: Citizen / Buyer
- **Role:** Regular citizen account with 10,000 test ETH. Can browse the marketplace, lock funds in escrow, sign purchase deeds, and become the new title holder.
- **Address:** `0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC`
- **Private Key:** `0x5de4111afa1a4b93308f8344209bdd9c922534496db5779dc21a110ba859240e`

### Account #3: Third Party / Adverse Party
- **Role:** Useful for testing fraud scenarios (unauthorized transfers, forged signatures).
- **Address:** `0x90F79bf6EB2c4f870365E785982E1f101E93b906`
- **Private Key:** `0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6`

---

## 3. How to Import Accounts into MetaMask

1. Open your **MetaMask** browser extension.
2. Click the **Account Selector** dropdown at the top of the wallet window.
3. Click **Add Account or Hardware Wallet** $\rightarrow$ **Import Account**.
4. Select **Private Key** as the import type.
5. Paste the private key for **Account #0** (Authority) and name it `"Authority - Hardhat #0"`.
6. Repeat for **Account #1** (`"Seller - Hardhat #1"`) and **Account #2** (`"Buyer - Hardhat #2"`).
7. Confirm that your balance shows **10,000 ETH** on `Hardhat Localhost`.

---

## 4. End-to-End Walkthrough: Testing the Marketplace & Escrow Flow

Follow these steps to experience the complete decentralized lifecycle:

### Step 1: Start the Local Environment
In three separate terminal tabs:
```bash
# Tab 1: Start Hardhat Node
npx hardhat node

# Tab 2: Deploy Contract and Start Backend Indexer
node backend/server.js
node backend/indexer.js

# Tab 3: Start Frontend Dev Server
cd frontend && npm run dev
```

### Step 2: Register a Property (Seller)
1. Switch MetaMask to **Account #1 (Seller)**.
2. Connect wallet at `http://localhost:5173`.
3. Open **My Dashboard** $\rightarrow$ **Register Property** tab.
4. Enter location coordinates (e.g., `28.6139N,77.2090E`), area (e.g., `1200`), and upload any sample PDF deed.
5. Submit transaction in MetaMask. Status will show as **Pending Verification**.

### Step 3: Verify the Registration (Authority)
1. Switch MetaMask to **Account #0 (Authority)**.
2. The navbar will dynamically update to show the **Government Authority** badge and **Pending Approvals** dashboard.
3. In **Pending Registrations**, click **Verify Property** and confirm in MetaMask.

### Step 4: List Property for Sale (Seller)
1. Switch MetaMask back to **Account #1 (Seller)**.
2. Under **My Properties**, the property is now **Verified**.
3. Click **List for Sale**, enter an asking price (e.g., `2.5` ETH), and confirm in MetaMask.
4. The property status updates to **Listed: 2.5 ETH**.

### Step 5: Buy with Escrow (Buyer)
1. Switch MetaMask to **Account #2 (Buyer)**.
2. Click **Marketplace** in the navigation bar.
3. Locate Property #1 listed for 2.5 ETH.
4. Click **Buy Property with Escrow**.
5. Upload a conveyance deed PDF and click **Deposit 2.5 ETH to Escrow**.
6. MetaMask will prompt you to send 2.5 ETH directly to the contract. Confirm the transaction.
7. The 2.5 ETH is now locked in the smart contract escrow!

### Step 6: Dual Cryptographic Signatures (EIP-712)
1. In **My Transfers**, Buyer sees the pending conveyance. Click **Sign Typed Data** $\rightarrow$ confirm the human-readable EIP-712 signature in MetaMask.
2. Switch MetaMask to **Account #1 (Seller)**.
3. Open **My Transfers** $\rightarrow$ Click **Sign Typed Data** $\rightarrow$ confirm the EIP-712 signature in MetaMask.
4. Both parties have now cryptographically authorized the transfer!

### Step 7: Authority Approval & Funds Release (Authority)
1. Switch MetaMask to **Account #0 (Authority)**.
2. Open **Pending Approvals** $\rightarrow$ **Pending Transfers & Escrow**.
3. Note that transfer shows: `🔒 2.5 ETH Locked` and `✓ Both Signed`.
4. Click **Approve & Release 2.5 ETH**.
5. The smart contract immediately transfers the 2.5 ETH from escrow directly to Account #1 (Seller)!
6. Click **Finalize On-Chain Title** (or execute transfer).
7. Ownership is transferred to Account #2 (Buyer), and the property is unlisted from the marketplace!
