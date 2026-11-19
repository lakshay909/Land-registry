export const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS || "";
export const SUPPORTED_CHAIN_ID = parseInt(import.meta.env.VITE_SUPPORTED_CHAIN_ID || "11155111", 10);
export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

export const NETWORK_CONFIGS = {
  11155111: {
    chainId: '0xaa36a7',
    chainName: 'Ethereum Sepolia',
    rpcUrls: ['https://rpc.sepolia.org'],
    nativeCurrency: {
      name: 'Sepolia ETH',
      symbol: 'ETH',
      decimals: 18,
    },
    blockExplorerUrls: ['https://sepolia.etherscan.io'],
  },
  31337: {
    chainId: '0x7a69',
    chainName: 'Hardhat Localhost',
    rpcUrls: ['http://127.0.0.1:8545'],
    nativeCurrency: {
      name: 'ETH',
      symbol: 'ETH',
      decimals: 18,
    },
  },
};
