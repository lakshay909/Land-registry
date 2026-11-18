import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { resolveActiveAccount } from '../src/utils/accountResolver.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('MetaMask accountsChanged Event Handling Suite', () => {
  const authContextPath = path.resolve(__dirname, '../src/context/AuthContext.jsx');
  const appPath = path.resolve(__dirname, '../src/App.jsx');

  const authContextCode = fs.readFileSync(authContextPath, 'utf8');
  const appCode = fs.readFileSync(appPath, 'utf8');

  test('AuthContext registers window.ethereum.on with "accountsChanged" and handleAccountChange in useEffect', () => {
    // Verify window.ethereum.on('accountsChanged', handleAccountChange) pattern
    assert.match(
      authContextCode,
      /window\.ethereum\.on\(\s*['"]accountsChanged['"]\s*,\s*handleAccountChange\s*\)/,
      'AuthContext.jsx must register window.ethereum.on("accountsChanged", handleAccountChange)'
    );

    // Verify it is inside a useEffect hook
    assert.match(
      authContextCode,
      /useEffect\s*\(\s*\(\)\s*=>\s*\{[\s\S]*?window\.ethereum\.on\(\s*['"]accountsChanged['"]\s*,\s*handleAccountChange\s*\)/,
      'accountsChanged listener must be registered inside a useEffect hook'
    );
  });

  test('AuthContext cleans up event listener properly on unmount via removeListener', () => {
    // Verify cleanup in return statement
    assert.match(
      authContextCode,
      /window\.ethereum\.removeListener\(\s*['"]accountsChanged['"]\s*,\s*handleAccountChange\s*\)/,
      'AuthContext.jsx must call removeListener for "accountsChanged" with handleAccountChange on unmount'
    );
  });

  test('handleAccountChange updates current wallet address state via setAccount', () => {
    // Verify handleAccountChange function definition
    assert.match(
      authContextCode,
      /const\s+handleAccountChange\s*=\s*(?:useCallback\s*\(\s*)?(?:async\s*)?\(\s*accounts\s*\)\s*=>/,
      'handleAccountChange function must be defined taking accounts parameter'
    );

    // Verify that handleAccountChange calls setAccount with the active account
    assert.match(
      authContextCode,
      /setAccount\s*\(\s*(?:newAddress|accounts\[0\]|newAccount)\s*\)/,
      'handleAccountChange must call setAccount to update the wallet address state'
    );

    // Verify empty accounts array handling (disconnect / reset)
    assert.match(
      authContextCode,
      /disconnect\(\)/,
      'handleAccountChange must disconnect when accounts array is empty'
    );
  });

  test('App component also attaches and cleans up handleAccountChange event listener', () => {
    // App.jsx also implements the listener on mount and cleanup on unmount
    assert.match(
      appCode,
      /window\.ethereum\.on\(\s*['"]accountsChanged['"]\s*,\s*handleAccountChange\s*\)/,
      'App.jsx must register window.ethereum.on("accountsChanged", handleAccountChange)'
    );

    assert.match(
      appCode,
      /window\.ethereum\.removeListener\(\s*['"]accountsChanged['"]\s*,\s*handleAccountChange\s*\)/,
      'App.jsx must clean up removeListener for "accountsChanged"'
    );
  });

  test('resolveActiveAccount prioritizes window.ethereum.selectedAddress over index 0', () => {
    const ACCOUNT_ORIGINAL = '0xE6Cb3f074309Ddf2D939e720d946A99ec61F6ca0';
    const ACCOUNT_TARGET = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266';

    // Mock window.ethereum.selectedAddress with lowercase target
    globalThis.window = {
      ethereum: {
        selectedAddress: ACCOUNT_TARGET.toLowerCase(),
      },
    };

    // Even if accounts array has original account at index 0, target account must be resolved
    const resolved = resolveActiveAccount([ACCOUNT_ORIGINAL, ACCOUNT_TARGET]);
    assert.strictEqual(
      resolved,
      ACCOUNT_TARGET,
      'Must resolve active MetaMask account 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 instead of remaining stuck on index 0'
    );

    // If accounts only has original account because imported account was not yet connected
    const resolvedFromSelected = resolveActiveAccount([ACCOUNT_ORIGINAL]);
    assert.strictEqual(
      resolvedFromSelected,
      ACCOUNT_TARGET,
      'Must prioritize selectedAddress even if accounts array contains only previously authorized accounts'
    );

    // Clean up mock
    delete globalThis.window;
  });

  test('resolveActiveAccount falls back safely when window.ethereum.selectedAddress is absent', () => {
    const ACCOUNT_1 = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266';
    const ACCOUNT_2 = '0x70997970C51812dc3A010C7d01b50e0d17dc79C8';

    // No window.ethereum
    const resolvedFirst = resolveActiveAccount([ACCOUNT_1, ACCOUNT_2]);
    assert.strictEqual(resolvedFirst, ACCOUNT_1);

    // Empty accounts
    const resolvedEmpty = resolveActiveAccount([]);
    assert.strictEqual(resolvedEmpty, null);
  });

  test('switchAccount method triggers wallet_requestPermissions for eth_accounts', () => {
    assert.match(
      authContextCode,
      /wallet_requestPermissions/,
      'AuthContext.jsx must provide switchAccount triggering wallet_requestPermissions'
    );

    assert.match(
      appCode,
      /switchAccount/,
      'App.jsx must expose switchAccount button for switching imported accounts in MetaMask'
    );
  });

  test('Simulated handleAccountChange logic verifies sequential account switching without being stuck', () => {
    let currentAccount = null;
    let disconnected = false;

    // Simulate handleAccountChange logic with active account resolution
    const simulateAccountChange = (accounts) => {
      const active = resolveActiveAccount(accounts);
      if (!active) {
        currentAccount = null;
        disconnected = true;
        return;
      }
      currentAccount = active;
      disconnected = false;
    };

    const ACCOUNT_1 = '0xE6Cb3f074309Ddf2D939e720d946A99ec61F6ca0';
    const ACCOUNT_2 = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266';
    const ACCOUNT_3 = '0x70997970C51812dc3A010C7d01b50e0d17dc79C8';

    // 1. Initial connect to Account 1
    simulateAccountChange([ACCOUNT_1]);
    assert.strictEqual(currentAccount, ACCOUNT_1, 'Must update to Account 1');

    // 2. Switch to Account 2
    simulateAccountChange([ACCOUNT_2]);
    assert.strictEqual(currentAccount, ACCOUNT_2, 'Must switch to Account 2 without remaining stuck on Account 1');

    // 3. Switch to Account 3
    simulateAccountChange([ACCOUNT_3]);
    assert.strictEqual(currentAccount, ACCOUNT_3, 'Must switch to Account 3');

    // 4. Disconnect / Lock wallet (empty accounts array)
    simulateAccountChange([]);
    assert.strictEqual(currentAccount, null, 'Must clear account state on disconnect');
    assert.strictEqual(disconnected, true, 'Must trigger disconnect');

    // 5. Reconnect to Account 2
    simulateAccountChange([ACCOUNT_2]);
    assert.strictEqual(currentAccount, ACCOUNT_2, 'Must reconnect to Account 2');
  });
});
