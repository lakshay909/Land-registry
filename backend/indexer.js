const { ethers } = require('ethers');
const path = require('path');
const db = require('./db');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const fs = require('fs');
const artifactLocal = path.join(__dirname, 'LandRegistry.json');
const contractArtifact = fs.existsSync(artifactLocal)
  ? require(artifactLocal)
  : require('../artifacts/contracts/LandRegistry.sol/LandRegistry.json');

const RPC_URL = process.env.RPC_URL || 'http://127.0.0.1:8545';
// NOTE: Must be updated with actual deployed address on testnet/mainnet
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS || '0x5FbDB2315678afecb367f032d93F642f64180aa3';

const provider = new ethers.JsonRpcProvider(RPC_URL);
const contract = new ethers.Contract(CONTRACT_ADDRESS, contractArtifact.abi, provider);

const EVENT_NAMES = [
  "PropertyRegistered", "PropertyVerified", 
  "PropertyListed", "PropertyDelisted",
  "TransferInitiated", "TransferSigned", "TransferApproved", 
  "OwnershipTransferred", 
  "PropertyFlagged", "PropertyUnflagged",
  "EscrowDeposited", "EscrowReleased"
];

// Reusable Prepared Statements
const insertAudit = db.prepare(`
  INSERT OR IGNORE INTO AUDIT_EVENTS 
  (property_id, event_type, tx_hash, block_number, timestamp, log_index, from_address, to_address, reason) 
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const updateSyncState = db.prepare(`UPDATE SYNC_STATE SET last_indexed_block = ? WHERE id = 1`);

const insertProperty = db.prepare(`
  INSERT OR REPLACE INTO PROPERTIES (property_id, location_hash, area, current_owner, document_hash, is_verified, is_frozen, registered_at, price, is_for_sale)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);
const updatePropertyVerified = db.prepare(`UPDATE PROPERTIES SET is_verified = 1 WHERE property_id = ?`);
const updatePropertyOwner = db.prepare(`UPDATE PROPERTIES SET current_owner = ? WHERE property_id = ?`);
const updatePropertyFrozen = db.prepare(`UPDATE PROPERTIES SET is_frozen = ? WHERE property_id = ?`);
const updatePropertyListed = db.prepare(`UPDATE PROPERTIES SET is_for_sale = 1, price = ? WHERE property_id = ?`);
const updatePropertyDelisted = db.prepare(`UPDATE PROPERTIES SET is_for_sale = 0, price = '0' WHERE property_id = ?`);

const insertTransfer = db.prepare(`
  INSERT OR REPLACE INTO TRANSFERS (transfer_id, property_id, from_address, to_address, new_document_hash, from_signed, to_signed, authority_approved, executed, created_at, escrow_amount)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);
const updateTransferSigned = db.prepare(`UPDATE TRANSFERS SET from_signed = ?, to_signed = ? WHERE transfer_id = ?`);
const updateTransferApproved = db.prepare(`UPDATE TRANSFERS SET authority_approved = 1 WHERE transfer_id = ?`);
const updateTransferExecutedById = db.prepare(`UPDATE TRANSFERS SET executed = 1 WHERE transfer_id = ?`);
const updateTransferEscrow = db.prepare(`UPDATE TRANSFERS SET escrow_amount = ? WHERE transfer_id = ?`);

async function processEvent(eventPayload) {
  // Normalize ethers v6 differing structures
  const isRealTime = !!eventPayload.log;
  const logIndex = isRealTime ? eventPayload.log.index : eventPayload.index;
  const blockNumber = isRealTime ? eventPayload.log.blockNumber : eventPayload.blockNumber;
  const txHash = isRealTime ? eventPayload.log.transactionHash : eventPayload.transactionHash;
  const eventName = eventPayload.fragment.name;
  const args = eventPayload.args;
  
  // 1. Asynchronous Phase (Network calls)
  const block = await provider.getBlock(blockNumber);
  const timestamp = block ? block.timestamp : Math.floor(Date.now() / 1000);
  
  let propertyId = null;
  let reason = null;
  let writeOperations = () => {}; // Sync closure for DB writes
  
  try {
      if (eventName === 'PropertyRegistered') {
          propertyId = Number(args.propertyId);
          const prop = await contract.properties(propertyId);
          writeOperations = () => {
              insertProperty.run(
                  propertyId, prop.locationHash, Number(prop.area), prop.currentOwner,
                  prop.documentHash, prop.isVerifiedByAuthority ? 1 : 0, prop.isFrozen ? 1 : 0, 
                  Number(prop.registeredAt), prop.price ? prop.price.toString() : '0', prop.isForSale ? 1 : 0
              );
          };
      } else if (eventName === 'PropertyVerified') {
          propertyId = Number(args.propertyId);
          writeOperations = () => {
              updatePropertyVerified.run(propertyId);
          };
      } else if (eventName === 'PropertyListed') {
          propertyId = Number(args.propertyId);
          const price = args.price.toString();
          writeOperations = () => {
              updatePropertyListed.run(price, propertyId);
          };
      } else if (eventName === 'PropertyDelisted') {
          propertyId = Number(args.propertyId);
          writeOperations = () => {
              updatePropertyDelisted.run(propertyId);
          };
      } else if (eventName === 'TransferInitiated') {
          const transferId = Number(args.transferId);
          propertyId = Number(args.propertyId);
          const transfer = await contract.transfers(transferId);
          const escrow = transfer.escrowAmount ? transfer.escrowAmount.toString() : '0';
          writeOperations = () => {
              insertTransfer.run(
                  transferId, propertyId, transfer.from, transfer.to, transfer.newDocumentHash,
                  transfer.fromSigned ? 1 : 0, transfer.toSigned ? 1 : 0, transfer.authorityApproved ? 1 : 0, transfer.executed ? 1 : 0, timestamp, escrow
              );
          };
      } else if (eventName === 'TransferSigned') {
          const transferId = Number(args.transferId);
          const transfer = await contract.transfers(transferId);
          propertyId = Number(transfer.propertyId);
          writeOperations = () => {
              updateTransferSigned.run(transfer.fromSigned ? 1 : 0, transfer.toSigned ? 1 : 0, transferId);
          };
      } else if (eventName === 'TransferApproved') {
          const transferId = Number(args.transferId);
          const transfer = await contract.transfers(transferId);
          propertyId = Number(transfer.propertyId);
          writeOperations = () => {
              updateTransferApproved.run(transferId);
          };
      } else if (eventName === 'OwnershipTransferred') {
          propertyId = Number(args.propertyId);
          const transferId = Number(args.transferId);
          writeOperations = () => {
              updatePropertyOwner.run(args.to, propertyId);
              updatePropertyDelisted.run(propertyId);
              updateTransferExecutedById.run(transferId);
          };
      } else if (eventName === 'PropertyFlagged') {
          propertyId = Number(args.propertyId);
          reason = args.reason || args[1] || null;
          writeOperations = () => {
              updatePropertyFrozen.run(1, propertyId);
          };
      } else if (eventName === 'PropertyUnflagged') {
          propertyId = Number(args.propertyId);
          writeOperations = () => {
              updatePropertyFrozen.run(0, propertyId);
          };
      } else if (eventName === 'EscrowDeposited') {
          const transferId = Number(args.transferId);
          const amount = args.amount.toString();
          writeOperations = () => {
              updateTransferEscrow.run(amount, transferId);
          };
      } else if (eventName === 'EscrowReleased') {
          // Escrow released to seller
          const transferId = Number(args.transferId);
          writeOperations = () => {
              updateTransferEscrow.run('0', transferId);
          };
      }

      let fromAddress = null;
      let toAddress = null;
      
      if (eventName === 'OwnershipTransferred' || eventName === 'TransferInitiated') {
          fromAddress = args.from;
          toAddress = args.to;
      } else if (eventName === 'TransferSigned') {
          fromAddress = args.signer;
      } else if (eventName === 'PropertyRegistered') {
          toAddress = args.owner;
      } else if (eventName === 'PropertyListed') {
          fromAddress = args.owner;
      }

      // 2. Synchronous Phase (Atomic DB writes)
      const commitEvent = db.transaction(() => {
          writeOperations();
          if (propertyId !== null) {
              insertAudit.run(propertyId, eventName, txHash, blockNumber, timestamp, logIndex, fromAddress, toAddress, reason);
          }
          updateSyncState.run(blockNumber);
      });
      
      commitEvent();
      console.log(`[Block ${blockNumber}] Processed ${eventName} for Property ${propertyId}`);
  } catch (err) {
      console.error(`Error processing ${eventName} at block ${blockNumber}:`, err);
  }
}

async function runIndexer() {
  console.log("Starting Indexer...");
  
  let isSyncing = false;

  async function syncNewBlocks() {
    if (isSyncing) return;
    isSyncing = true;
    try {
      const state = db.prepare('SELECT last_indexed_block FROM SYNC_STATE WHERE id = 1').get();
      const lastIndexedBlock = state ? state.last_indexed_block : 0;
      const currentBlock = await provider.getBlockNumber();

      if (currentBlock > lastIndexedBlock) {
        console.log(`Syncing from block ${lastIndexedBlock + 1} to current block ${currentBlock}...`);
        let allLogs = [];
        try {
          allLogs = await contract.queryFilter("*", lastIndexedBlock + 1, currentBlock);
        } catch (filterErr) {
          for (const eventName of EVENT_NAMES) {
            const logs = await contract.queryFilter(eventName, lastIndexedBlock + 1, currentBlock);
            allLogs = allLogs.concat(logs);
          }
        }

        allLogs.sort((a, b) => {
          if (a.blockNumber !== b.blockNumber) return a.blockNumber - b.blockNumber;
          return a.index - b.index;
        });

        for (const log of allLogs) {
          await processEvent(log);
        }

        updateSyncState.run(currentBlock);
      }
    } catch (err) {
      console.error("Error during indexer block sync:", err);
    } finally {
      isSyncing = false;
    }
  }

  // 1. Initial catch-up sync
  await syncNewBlocks();

  // 2. Real-time Subscription via block notifications and 1.5s fallback interval
  // Eliminates ethers FilterIdEventSubscriber "TypeError: results is not iterable" with local nodes
  console.log("Attaching real-time block listeners...");
  provider.on('block', () => {
    syncNewBlocks().catch(console.error);
  });

  setInterval(() => {
    syncNewBlocks().catch(console.error);
  }, 1500);

  console.log("Indexer is fully synced and listening for new events.");
}

if (require.main === module) {
  runIndexer().catch(console.error);
}

module.exports = { runIndexer, processEvent };
