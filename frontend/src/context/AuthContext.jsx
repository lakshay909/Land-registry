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

    const connectWallet = async () => {
        if (!window.ethereum) {
            alert('Please install MetaMask!');
            return;
        }

        setIsConnecting(true);
        setNetworkError(false);
        try {
            const web3Provider = new BrowserProvider(window.ethereum);
            const network = await web3Provider.getNetwork();
            
            if (Number(network.chainId) !== SUPPORTED_CHAIN_ID) {
                setNetworkError(true);
                alert(`Wrong network detected. Please switch to chainId: ${SUPPORTED_CHAIN_ID}`);
                return;
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
            isConnecting, connectWallet, disconnect
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}
