import { getAddress } from 'ethers';

/**
 * Resolves the active Ethereum address from MetaMask's state or event payload.
 *
 * MetaMask's EIP-1193 accountsChanged event passes an array of permitted accounts.
 * When switching between imported accounts, if multiple accounts are authorized,
 * MetaMask extension's active selected address (window.ethereum.selectedAddress)
 * must take precedence over the arbitrary ordering (e.g. index 0) of the accounts array.
 *
 * @param {string[]} [accounts=[]] - Array of account addresses from MetaMask
 * @returns {string|null} Checksummed active address, or null if no account available
 */
export function resolveActiveAccount(accounts = []) {
  if (typeof window !== 'undefined' && window.ethereum?.selectedAddress) {
    const selected = window.ethereum.selectedAddress.toLowerCase();
    if (Array.isArray(accounts)) {
      const matched = accounts.find(a => typeof a === 'string' && a.toLowerCase() === selected);
      if (matched) {
        try {
          return getAddress(matched);
        } catch {
          return matched;
        }
      }
    }
    try {
      return getAddress(window.ethereum.selectedAddress);
    } catch {
      return window.ethereum.selectedAddress;
    }
  }

  if (Array.isArray(accounts) && accounts.length > 0 && accounts[0]) {
    try {
      return getAddress(accounts[0]);
    } catch {
      return accounts[0];
    }
  }

  return null;
}
