const { ethers } = require('ethers');
const db = require('./db');
require('dotenv').config();
const contractArtifact = require('../artifacts/contracts/LandRegistry.sol/LandRegistry.json');

const RPC_URL = process.env.RPC_URL || 'http://127.0.0.1:8545';
// NOTE: Must be updated with actual deployed address on testnet/mainnet
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS || '0x5FbDB2315678afecb367f032d93F642f64180aa3';

const provider = new ethers.JsonRpcProvider(RPC_URL);
const contract = new ethers.Contract(CONTRACT_ADDRESS, contractArtifact.abi, provider);

const EVENT_NAMES = [
  "PropertyRegistered", "PropertyVerified", 
  "TransferInitiated", "TransferSigned", "TransferApproved", 
  "OwnershipTransferred", 
  "PropertyFlagged", "PropertyUnflagged"
];

// Reusable Prepared Statements
const insertAudit = db.prepare(`
  INSERT OR IGNORE INTO AUDIT_EVENTS 
  (property_id, event_type, tx_hash, block_number, timestamp, log_index, from_address, to_address) 
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`);

const updateSyncState = db.prepare(`UPDATE SYNC_STATE SET last_indexed_block = ? WHERE id = 1`);

const insertProperty = db.prepare(`
  INSERT OR REPLACE INTO PROPERTIES (property_id, location_hash, area, current_owner, document_hash, is_verified, is_frozen, registered_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`);
const updatePropertyVerified = db.prepare(`UPDATE PROPERTIES SET is_verified = 1 WHERE property_id = ?`);
const updatePropertyOwner = db.prepare(`UPDATE PROPERTIES SET current_owner = ? WHERE property_id = ?`);
const updatePropertyFrozen = db.prepare(`UPDATE PROPERTIES SET is_frozen = ? WHERE property_id = ?`);

const insertTransfer = db.prepare(`
  INSERT OR REPLACE INTO TRANSFERS (transfer_id, property_id, from_address, to_address, new_document_hash, from_signed, to_signed, authority_approved, executed, created_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);
const updateTransferSigned = db.prepare(`UPDATE TRANSFERS SET from_signed = ?, to_signed = ? WHERE transfer_id = ?`);
const updateTransferApproved = db.prepare(`UPDATE TRANSFERS SET authority_approved = 1 WHERE transfer_id = ?`);
const updateTransferExecutedById = db.prepare(`UPDATE TRANSFERS SET executed = 1 WHERE transfer_id = ?`);

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
  const timestamp = block.timestamp;
  
  let propertyId = null;
  let writeOperations = () => {}; // Sync closure for DB writes
  
  try {
      if (eventName === 'PropertyRegistered') {
          propertyId = Number(args.propertyId);
          const prop = await contract.properties(propertyId);
          writeOperations = () => {
              insertProperty.run(
                  propertyId, prop.locationHash, Number(prop.area), prop.currentOwner,
                  prop.documentHash, prop.isVerifiedByAuthority ? 1 : 0, prop.isFrozen ? 1 : 0, Number(prop.registeredAt)
              );
          };
      } else if (eventName === 'PropertyVerified') {
          propertyId = Number(args.propertyId);
          writeOperations = () => {
              updatePropertyVerified.run(propertyId);
          };
      } else if (eventName === 'TransferInitiated') {
          const transferId = Number(args.transferId);
          propertyId = Number(args.propertyId);
          const transfer = await contract.transfers(transferId);
          writeOperations = () => {
              insertTransfer.run(
                  transferId, propertyId, transfer.from, transfer.to, transfer.newDocumentHash,
                  transfer.fromSigned ? 1 : 0, transfer.toSigned ? 1 : 0, transfer.authorityApproved ? 1 : 0, transfer.executed ? 1 : 0, timestamp
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
              updateTransferExecutedById.run(transferId);
          };
      } else if (eventName === 'PropertyFlagged') {
          propertyId = Number(args.propertyId);
          writeOperations = () => {
              updatePropertyFrozen.run(1, propertyId);
          };
      } else if (eventName === 'PropertyUnflagged') {
          propertyId = Number(args.propertyId);
          writeOperations = () => {
              updatePropertyFrozen.run(0, propertyId);
          };
      }

      let fromAddress = null;
      let toAddress = null;
      
      if (eventName === 'OwnershipTransferred' || eventName === 'TransferInitiated') {
          fromAddress = args.from;
          toAddress = args.to;
      } else if (eventName === 'PropertyRegistered') {
          toAddress = args.owner; // The person who registered it is effectively the first owner
      }

      // 2. Synchronous Phase (Atomic DB writes)
      const commitEvent = db.transaction(() => {
          writeOperations();
          if (propertyId !== null) {
              // INSERT OR IGNORE safely handles duplicates due to UNIQUE(tx_hash, log_index)
              insertAudit.run(propertyId, eventName, txHash, blockNumber, timestamp, logIndex, fromAddress, toAddress);
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
  
  const state = db.prepare('SELECT last_indexed_block FROM SYNC_STATE WHERE id = 1').get();
  const lastIndexedBlock = state.last_indexed_block;
  
  // 1. Snapshot block
  const snapshotBlock = await provider.getBlockNumber();
  console.log(`Syncing from block ${lastIndexedBlock + 1} to snapshot block ${snapshotBlock}...`);
  
  // 2. Catch-up Sync
  if (snapshotBlock > lastIndexedBlock) {
      let allHistoricalLogs = [];
      for (const eventName of EVENT_NAMES) {
          const logs = await contract.queryFilter(eventName, lastIndexedBlock + 1, snapshotBlock);
          allHistoricalLogs = allHistoricalLogs.concat(logs);
      }
      // Sort chronologically by block, then log index
      allHistoricalLogs.sort((a, b) => {
          if (a.blockNumber !== b.blockNumber) return a.blockNumber - b.blockNumber;
          return a.index - b.index;
      });
      
      for (const log of allHistoricalLogs) {
          await processEvent(log);
      }
  }

  // 3. Real-time Subscription
  console.log("Attaching real-time listeners...");
  
  let isProcessing = false;
  const eventQueue = [];
  
  const processNext = async () => {
      if (isProcessing || eventQueue.length === 0) return;
      isProcessing = true;
      try {
          const eventPayload = eventQueue.shift();
          await processEvent(eventPayload);
      } finally {
          isProcessing = false;
          processNext();
      }
  };

  for (const eventName of EVENT_NAMES) {
      contract.on(eventName, (...args) => {
          const eventPayload = args[args.length - 1];
          eventQueue.push(eventPayload);
          processNext();
      });
  }

  // 4. Final Gap Closure
  const newSnapshotBlock = await provider.getBlockNumber();
  if (newSnapshotBlock > snapshotBlock) {
      console.log(`Closing gap between ${snapshotBlock + 1} and ${newSnapshotBlock}...`);
      let gapLogs = [];
      for (const eventName of EVENT_NAMES) {
          const logs = await contract.queryFilter(eventName, snapshotBlock + 1, newSnapshotBlock);
          gapLogs = gapLogs.concat(logs);
      }
      gapLogs.sort((a, b) => {
          if (a.blockNumber !== b.blockNumber) return a.blockNumber - b.blockNumber;
          return a.index - b.index;
      });
      for (const log of gapLogs) {
          await processEvent(log);
      }
  }
  
  console.log("Indexer is fully synced and listening for new events.");
}

runIndexer().catch(console.error);
