import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { BrowserProvider, Contract } from 'ethers';
import { CONTRACT_ADDRESS, SUPPORTED_CHAIN_ID, NETWORK_CONFIGS } from '../config';
import LandRegistryArtifact from '../LandRegistry.json';
import { resolveActiveAccount } from '../utils/accountResolver';

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [account, setAccount] = useState(null);
    const [role, setRole] = useState(null); // 'AUTHORITY' or 'CITIZEN'
    const [provider, setProvider] = useState(null);
    const [signer, setSigner] = useState(null);
    const [contract, setContract] = useState(null);
    const [isConnecting, setIsConnecting] = useState(false);
    const [networkError, setNetworkError] = useState(false);

    const disconnect = useCallback(() => {
        setAccount(null);
        setRole(null);
        setProvider(null);
        setSigner(null);
        setContract(null);
    }, []);

    const switchToSupportedNetwork = useCallback(async () => {
        if (!window.ethereum) return false;
        const hexChainId = '0x' + SUPPORTED_CHAIN_ID.toString(16);
        try {
            await window.ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: hexChainId }],
            });
            return true;
        } catch (switchError) {
            if (switchError.code === 4902 || switchError?.data?.originalError?.code === 4902) {
                const netConfig = NETWORK_CONFIGS[SUPPORTED_CHAIN_ID] || {
                    chainId: hexChainId,
                    chainName: `Chain ${SUPPORTED_CHAIN_ID}`,
                    rpcUrls: [],
                    nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
                };
                try {
                    await window.ethereum.request({
                        method: 'wallet_addEthereumChain',
                        params: [netConfig],
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
    }, []);

    const connectWallet = useCallback(async () => {
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
                    alert(`Wrong network detected. Please switch to network chainId: ${SUPPORTED_CHAIN_ID} in MetaMask.`);
                    return;
                }
                web3Provider = new BrowserProvider(window.ethereum);
                network = await web3Provider.getNetwork();
                if (Number(network.chainId) !== SUPPORTED_CHAIN_ID) {
                    setNetworkError(true);
                    return;
                }
            }

            const reqAccounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            const newAddress = resolveActiveAccount(reqAccounts);
            if (!newAddress) {
                disconnect();
                return;
            }
            
            const web3Signer = await web3Provider.getSigner(newAddress);
            const address = await web3Signer.getAddress();
            
            const registryContract = new Contract(
                CONTRACT_ADDRESS,
                LandRegistryArtifact.abi,
                web3Signer
            );

            // Role detection via on-chain contract roles
            let isAdmin = false;
            try {
                const ADMIN_ROLE = await registryContract.ADMIN_ROLE();
                const hasAdmin = await registryContract.hasRole(ADMIN_ROLE, address);
                let hasRegistrar = false;
                try {
                    const REGISTRAR_ROLE = await registryContract.REGISTRAR_ROLE();
                    hasRegistrar = await registryContract.hasRole(REGISTRAR_ROLE, address);
                } catch (_) {}
                isAdmin = hasAdmin || hasRegistrar;
            } catch (roleErr) {
                console.warn("Role check failed:", roleErr);
            }

            setProvider(web3Provider);
            setSigner(web3Signer);
            setContract(registryContract);
            setAccount(address);
            setRole(isAdmin ? 'AUTHORITY' : 'CITIZEN');

        } catch (error) {
            console.error("Failed to connect wallet:", error);
            const msg = error?.message || "";
            if (msg.includes("could not decode result data") || msg.includes("BAD_DATA") || error?.code === "BAD_DATA") {
                alert(`Connected to chain ${SUPPORTED_CHAIN_ID}, but LandRegistry contract is not deployed at ${CONTRACT_ADDRESS}. Please run: npm run deploy:local`);
            } else if (msg.includes("fetch") || msg.includes("NetworkError") || msg.includes("connection") || msg.includes("network")) {
                alert(`Cannot connect to blockchain network (chainId: ${SUPPORTED_CHAIN_ID}). Please verify your network connection.`);
            } else {
                alert(`Failed to connect wallet: ${error?.reason || error?.message || "See console for details."}`);
            }
        } finally {
            setIsConnecting(false);
        }
    }, [switchToSupportedNetwork, disconnect]);

    const handleAccountChange = useCallback(async (accounts) => {
        const newAddress = resolveActiveAccount(accounts);
        if (!newAddress) {
            disconnect();
            return;
        }

        setAccount(newAddress);

        if (window.ethereum) {
            try {
                const web3Provider = new BrowserProvider(window.ethereum);
                const web3Signer = await web3Provider.getSigner(newAddress);
                const registryContract = new Contract(
                    CONTRACT_ADDRESS,
                    LandRegistryArtifact.abi,
                    web3Signer
                );

                // Role detection for the newly switched account
                let isAdmin = false;
                try {
                    const ADMIN_ROLE = await registryContract.ADMIN_ROLE();
                    const hasAdmin = await registryContract.hasRole(ADMIN_ROLE, newAddress);
                    let hasRegistrar = false;
                    try {
                        const REGISTRAR_ROLE = await registryContract.REGISTRAR_ROLE();
                        hasRegistrar = await registryContract.hasRole(REGISTRAR_ROLE, newAddress);
                    } catch (_) {}
                    isAdmin = hasAdmin || hasRegistrar;
                } catch (roleErr) {
                    console.warn("Role check failed on account switch:", roleErr);
                }

                setProvider(web3Provider);
                setSigner(web3Signer);
                setContract(registryContract);
                setAccount(newAddress);
                setRole(isAdmin ? 'AUTHORITY' : 'CITIZEN');
            } catch (error) {
                console.error("Failed to update role/contract on account change:", error);
                setAccount(newAddress);
                setRole('CITIZEN');
            }
        }
    }, [disconnect]);

    const switchAccount = useCallback(async () => {
        if (!window.ethereum) {
            alert('Please install MetaMask!');
            return;
        }
        try {
            await window.ethereum.request({
                method: 'wallet_requestPermissions',
                params: [{ eth_accounts: {} }],
            });
            const accounts = await window.ethereum.request({ method: 'eth_accounts' });
            if (accounts && accounts.length > 0) {
                await handleAccountChange(accounts);
            }
        } catch (error) {
            console.warn("User cancelled or failed wallet_requestPermissions:", error);
        }
    }, [handleAccountChange]);

    // Auto-detect existing authorized account on mount
    useEffect(() => {
        let isMounted = true;
        const checkInitialConnection = async () => {
            if (typeof window !== 'undefined' && window.ethereum) {
                try {
                    const accounts = await window.ethereum.request({ method: 'eth_accounts' });
                    if (isMounted && accounts && accounts.length > 0) {
                        await handleAccountChange(accounts);
                    }
                } catch (err) {
                    console.debug("Silent account check on mount failed:", err);
                }
            }
        };
        checkInitialConnection();
        return () => {
            isMounted = false;
        };
    }, [handleAccountChange]);

    useEffect(() => {
        const handleChainChanged = () => window.location.reload();
        
        if (window.ethereum) {
            window.ethereum.on('accountsChanged', handleAccountChange);
            window.ethereum.on('chainChanged', handleChainChanged);
        }
        return () => {
            if (window.ethereum) {
                window.ethereum.removeListener('accountsChanged', handleAccountChange);
                window.ethereum.removeListener('chainChanged', handleChainChanged);
            }
        };
    }, [handleAccountChange]);


    return (
        <AuthContext.Provider value={{
            account, role, provider, signer, contract,
            isConnecting, networkError, connectWallet, disconnect,
            switchAccount, switchToSupportedNetwork, handleAccountChange,
            handleAccountsChanged: handleAccountChange,
            resolveActiveAccount
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}

export const useWallet = useAuth;
export const useWalletConnection = useAuth;
