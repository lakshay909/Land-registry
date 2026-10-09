import React, { createContext, useContext, useState, useEffect } from 'react';
import { BrowserProvider, Contract } from 'ethers';
import { CONTRACT_ADDRESS, SUPPORTED_CHAIN_ID } from '../config';
import LandRegistryArtifact from '../LandRegistry.json';

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [account, setAccount] = useState(null);
    const [role, setRole] = useState(null); // 'AUTHORITY' or 'CITIZEN'
    const [provider, setProvider] = useState(null);
    const [signer, setSigner] = useState(null);
    const [contract, setContract] = useState(null);
    const [isConnecting, setIsConnecting] = useState(false);
    const [networkError, setNetworkError] = useState(false);

    useEffect(() => {
        const handleChainChanged = () => window.location.reload();
        
        // Handle account changes
        if (window.ethereum) {
            window.ethereum.on('accountsChanged', handleAccountsChanged);
            window.ethereum.on('chainChanged', handleChainChanged);
        }
        return () => {
            if (window.ethereum) {
                window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
                window.ethereum.removeListener('chainChanged', handleChainChanged);
            }
        };
    }, [account]);

    const handleAccountsChanged = async (accounts) => {
        if (accounts.length === 0) {
            disconnect();
        } else if (accounts[0] !== account) {
            // Re-connect to get fresh signer and role
            connectWallet();
        }
    };

    const switchToSupportedNetwork = async () => {
        if (!window.ethereum) return false;
        const hexChainId = '0x' + SUPPORTED_CHAIN_ID.toString(16);
        try {
            await window.ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: hexChainId }],
            });
            return true;
        } catch (switchError) {
            // Error code 4902 indicates that the chain has not been added to MetaMask
            if (switchError.code === 4902 || switchError?.data?.originalError?.code === 4902) {
                try {
                    await window.ethereum.request({
                        method: 'wallet_addEthereumChain',
                        params: [
                            {
                                chainId: hexChainId,
                                chainName: 'Hardhat Localhost',
                                rpcUrls: ['http://127.0.0.1:8545'],
                                nativeCurrency: {
                                    name: 'ETH',
                                    symbol: 'ETH',
                                    decimals: 18,
                                },
                            },
                        ],
                    });
                    return true;
                } catch (addError) {
                    console.error("Failed to add network to MetaMask:", addError);
                    return false;
                }
            } else {
                console.error("Failed to switch network:", switchError);
                return false;
            }
        }
    };

    const connectWallet = async () => {
        if (!window.ethereum) {
            alert('Please install MetaMask!');
            return;
        }

        setIsConnecting(true);
        setNetworkError(false);
        try {
            let web3Provider = new BrowserProvider(window.ethereum);
            let network = await web3Provider.getNetwork();
            
            if (Number(network.chainId) !== SUPPORTED_CHAIN_ID) {
                const switched = await switchToSupportedNetwork();
                if (!switched) {
                    setNetworkError(true);
                    alert(`Wrong network detected. Please switch to chainId: ${SUPPORTED_CHAIN_ID} (Hardhat Localhost: http://127.0.0.1:8545) in MetaMask.`);
                    return;
                }
                web3Provider = new BrowserProvider(window.ethereum);
                network = await web3Provider.getNetwork();
                if (Number(network.chainId) !== SUPPORTED_CHAIN_ID) {
                    setNetworkError(true);
                    return;
                }
            }

            await web3Provider.send("eth_requestAccounts", []);
            
            const web3Signer = await web3Provider.getSigner();
            const address = await web3Signer.getAddress();
            
            const registryContract = new Contract(
                CONTRACT_ADDRESS,
                LandRegistryArtifact.abi,
                web3Signer
            );

            // Role detection
            const ADMIN_ROLE = await registryContract.ADMIN_ROLE();
            const isAdmin = await registryContract.hasRole(ADMIN_ROLE, address);

            setProvider(web3Provider);
            setSigner(web3Signer);
            setContract(registryContract);
            setAccount(address);
            setRole(isAdmin ? 'AUTHORITY' : 'CITIZEN');

        } catch (error) {
            console.error("Failed to connect wallet:", error);
            alert("Failed to connect wallet. See console for details.");
        } finally {
            setIsConnecting(false);
        }
    };

    const disconnect = () => {
        setAccount(null);
        setRole(null);
        setProvider(null);
        setSigner(null);
        setContract(null);
    };

    return (
        <AuthContext.Provider value={{
            account, role, provider, signer, contract,
            isConnecting, networkError, connectWallet, disconnect,
            switchToSupportedNetwork
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}
