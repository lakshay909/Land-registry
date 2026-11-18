#!/usr/bin/env node
/**
 * scripts/dev-runner.js
 * Comprehensive development stack runner:
 * - Checks & starts local Hardhat blockchain (port 8545)
 * - Auto-deploys LandRegistry smart contract if node is freshly started
 * - Starts Backend API server (port 3001)
 * - Starts Event Indexer
 * - Starts Frontend dev server (Vite on port 5173)
 * - Streams unbuffered, color-coded real-time logs
 * - Handles Ctrl+C (SIGINT/SIGTERM) to cleanly terminate all processes
 */

const { spawn, execSync } = require('child_process');
const readline = require('readline');
const net = require('net');
const path = require('path');
const fs = require('fs');

const ROOT_DIR = path.resolve(__dirname, '..');
const PID_FILE = path.join(ROOT_DIR, '.dev_pids.json');

const colors = {
  reset: '\x1b[0m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  magenta: '\x1b[35m',
  red: '\x1b[31m',
  gray: '\x1b[90m',
  bold: '\x1b[1m'
};

const activeProcesses = [];

function log(prefix, color, message) {
  const tag = `${color}[${prefix}]${colors.reset}`;
  console.log(`${tag} ${message}`);
}

function checkPort(port, host = '127.0.0.1', timeout = 1000) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    let isConnected = false;

    socket.setTimeout(timeout);
    socket.once('connect', () => {
      isConnected = true;
      socket.destroy();
      resolve(true);
    });

    socket.once('timeout', () => {
      socket.destroy();
      resolve(false);
    });

    socket.once('error', () => {
      socket.destroy();
      resolve(false);
    });

    socket.connect(port, host);
  });
}

async function waitForPort(port, maxAttempts = 30, intervalMs = 500) {
  for (let i = 0; i < maxAttempts; i++) {
    const isOpen = await checkPort(port);
    if (isOpen) return true;
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  return false;
}

function startProcess(name, color, command, args, cwd = ROOT_DIR, env = process.env) {
  const child = spawn(command, args, {
    cwd,
    env: { ...env, FORCE_COLOR: '1' },
    stdio: ['inherit', 'pipe', 'pipe']
  });

  activeProcesses.push({ name, process: child });

  const rlOut = readline.createInterface({ input: child.stdout });
  rlOut.on('line', (line) => {
    log(name, color, line);
  });

  const rlErr = readline.createInterface({ input: child.stderr });
  rlErr.on('line', (line) => {
    log(name, color, line);
  });

  child.on('close', (code, signal) => {
    if (code !== null && code !== 0 && !shuttingDown) {
      log(name, colors.red, `Process exited with code ${code}`);
    }
  });

  return child;
}

let shuttingDown = false;
function shutdown() {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`\n${colors.bold}${colors.yellow}Shutting down all development services...${colors.reset}`);

  for (const item of activeProcesses) {
    try {
      if (item.process && item.process.pid) {
        log('dev-runner', colors.gray, `Stopping ${item.name} (PID: ${item.process.pid})...`);
        item.process.kill('SIGTERM');
      }
    } catch (e) {
      // Ignore
    }
  }

  try {
    if (fs.existsSync(PID_FILE)) fs.unlinkSync(PID_FILE);
    if (fs.existsSync(path.join(ROOT_DIR, 'dev_backend.pid'))) fs.unlinkSync(path.join(ROOT_DIR, 'dev_backend.pid'));
    if (fs.existsSync(path.join(ROOT_DIR, 'dev_frontend.pid'))) fs.unlinkSync(path.join(ROOT_DIR, 'dev_frontend.pid'));
  } catch (e) {}

  setTimeout(() => {
    for (const item of activeProcesses) {
      try {
        if (item.process && item.process.pid) {
          item.process.kill('SIGKILL');
        }
      } catch (e) {}
    }
    process.exit(0);
  }, 1500);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

async function main() {
  console.log(`${colors.bold}${colors.green}=== Starting Land Registry Development Environment ===${colors.reset}\n`);

  // 1. Check Hardhat Node
  const hardhatRunning = await checkPort(8545);
  if (!hardhatRunning) {
    log('hardhat', colors.cyan, 'Starting local Hardhat blockchain node on http://127.0.0.1:8545...');
    startProcess('hardhat', colors.cyan, 'npx', ['hardhat', 'node']);

    const ready = await waitForPort(8545, 30, 500);
    if (ready) {
      log('hardhat', colors.cyan, 'Local node is ready. Deploying LandRegistry contract...');
      try {
        execSync('npx hardhat run scripts/deploy.js --network localhost', {
          cwd: ROOT_DIR,
          stdio: 'inherit'
        });
        log('hardhat', colors.cyan, 'Contract deployed successfully.');
      } catch (err) {
        log('hardhat', colors.red, `Deployment failed: ${err.message}`);
      }
    } else {
      log('hardhat', colors.red, 'Timed out waiting for Hardhat node on port 8545.');
    }
  } else {
    log('hardhat', colors.cyan, 'Hardhat node already active on http://127.0.0.1:8545.');
  }

  // 2. Start Backend Server (port 3001)
  log('backend', colors.green, 'Starting backend API server (http://localhost:3001)...');
  const backendProc = startProcess('backend', colors.green, 'node', ['backend/server.js']);
  fs.writeFileSync(path.join(ROOT_DIR, 'dev_backend.pid'), String(backendProc.pid));

  // 3. Start Backend Indexer
  log('indexer', colors.yellow, 'Starting blockchain event indexer...');
  startProcess('indexer', colors.yellow, 'node', ['backend/indexer.js']);

  // 4. Start Frontend Dev Server (port 5173)
  log('frontend', colors.magenta, 'Starting frontend dev server (http://localhost:5173)...');
  const frontendProc = startProcess('frontend', colors.magenta, 'npm', ['run', 'dev'], path.join(ROOT_DIR, 'frontend'));
  fs.writeFileSync(path.join(ROOT_DIR, 'dev_frontend.pid'), String(frontendProc.pid));

  // Save all PIDs
  fs.writeFileSync(
    PID_FILE,
    JSON.stringify(
      activeProcesses.map((p) => ({ name: p.name, pid: p.process.pid })),
      null,
      2
    )
  );

  console.log(`\n${colors.bold}${colors.green}✔ All services started. Press Ctrl+C at any time to stop all services.${colors.reset}\n`);
}

main().catch((err) => {
  console.error('Failed to start dev runner:', err);
  shutdown();
});

