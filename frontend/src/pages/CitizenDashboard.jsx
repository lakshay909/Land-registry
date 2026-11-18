import React, { useState, useEffect, useCallback } from 'react';
import { Tab } from '@headlessui/react';
import { useAuth } from '../context/AuthContext';
import { useCurrentState } from '../context/StateContext';
import { API_URL } from '../config';
import { ethers } from 'ethers';
import InitiateTransferModal from '../components/InitiateTransferModal';
import SignTransferModal from '../components/SignTransferModal';
import ListPropertyModal from '../components/ListPropertyModal';
import BuyPropertyModal from '../components/BuyPropertyModal';
import DocumentUploadModal from '../components/DocumentUploadModal';
import { parseContractError } from '../utils/contractErrors';

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

export default function CitizenDashboard() {
  const { account, contract } = useAuth();
  const { stateConfig } = useCurrentState();
  const terminology = stateConfig?.terminology || {};

  const [selectedTabIndex, setSelectedTabIndex] = useState(0);

  const [properties, setProperties] = useState([]);
  const [marketplaceProps, setMarketplaceProps] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const [loadingProps, setLoadingProps] = useState(true);
  const [loadingMarket, setLoadingMarket] = useState(true);
  const [loadingTransfers, setLoadingTransfers] = useState(true);

  // Registration Form State
  const [locationHash, setLocationHash] = useState('');
  const [area, setArea] = useState('');
  const [file, setFile] = useState(null);
  const [saltedDocHash, setSaltedDocHash] = useState('');
  const [extractedDeedInfo, setExtractedDeedInfo] = useState(null);
  const [regStatus, setRegStatus] = useState(null); // { type: 'success' | 'error' | 'info', message: string }
  const [isRegistering, setIsRegistering] = useState(false);

  // Modal State
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [initiatingProperty, setInitiatingProperty] = useState(null);
  const [signingTransfer, setSigningTransfer] = useState(null);
  const [listingProperty, setListingProperty] = useState(null);
  const [buyingProperty, setBuyingProperty] = useState(null);
  const [actionStatus, setActionStatus] = useState(null); // { type: 'success' | 'error' | 'info', message: string }
  const [copiedKey, setCopiedKey] = useState('');

  // Handle successful deed extraction from DocumentUploadModal
  const handleDeedExtracted = useCallback((data) => {
    setExtractedDeedInfo(data);

    // Pre-fill location / cadastral bounds with 16-digit Gata Code, Khasra, village
    const locationString = `UPIC: ${data.gataCode} | Khasra: ${data.khasra} (${data.village || 'Mohanlalganj'}, ${data.tehsil || 'Lucknow Sadar'})`;
    setLocationHash(locationString);

    // Pre-fill Area
    if (data.area) {
      setArea(String(data.area));
    }

    // Pre-fill file & salted document hash
    if (data.file) {
      setFile(data.file);
    }
    if (data.documentHash) {
      setSaltedDocHash(data.documentHash);
    }

    setRegStatus({
      type: 'info',
      message: `Certified deed verified! Pre-filled Gata Code ${data.gataCode} (Khasra ${data.khasra}, ${data.area} sq.m) with salted document hash.`
    });

    // Jump directly to Tab 3 (Register Property, which is index 2)
    setSelectedTabIndex(2);
  }, []);

  const copyText = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(''), 2000);
  };

  const fetchMyProperties = useCallback(async () => {
    if (!account) return;
    setLoadingProps(true);
    try {
      const res = await fetch(`${API_URL}/api/properties?owner=${account}`);
      if (res.ok) {
        const data = await res.json();
        setProperties(data);
      }
    } catch (err) {
      console.error('Failed to fetch properties:', err);
    } finally {
      setLoadingProps(false);
    }
  }, [account]);

  const fetchMarketplace = useCallback(async () => {
    setLoadingMarket(true);
    try {
      const res = await fetch(`${API_URL}/api/properties/marketplace`);
      if (res.ok) {
        const data = await res.json();
        setMarketplaceProps(data);
      }
    } catch (err) {
      console.error('Failed to fetch marketplace:', err);
    } finally {
      setLoadingMarket(false);
    }
  }, []);

  const fetchMyTransfers = useCallback(async () => {
    if (!account) return;
    setLoadingTransfers(true);
    try {
      const res = await fetch(`${API_URL}/api/transfers?party=${account}`);
      if (res.ok) {
        const data = await res.json();
        setTransfers(data.sort((a, b) => b.transferId - a.transferId));
      }
    } catch (err) {
      console.error('Failed to fetch transfers:', err);
    } finally {
      setLoadingTransfers(false);
    }
  }, [account]);

  useEffect(() => {
    if (account) {
      fetchMyProperties();
      fetchMyTransfers();
      fetchMarketplace();
    }
  }, [account, fetchMyProperties, fetchMyTransfers, fetchMarketplace]);

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!contract || isRegistering) return;
    if (!file && !saltedDocHash) {
      setRegStatus({ type: 'error', message: 'Please upload a title deed document (PDF) or use Fast-Track prefill.' });
      return;
    }

    setIsRegistering(true);
    setRegStatus({ type: 'info', message: 'Generating local cryptographic hash (Keccak-256)...' });

    try {
      let finalDocHash = saltedDocHash;
      if (!finalDocHash && file) {
        const arrayBuffer = await file.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);
        finalDocHash = ethers.keccak256(uint8Array);
      }

      if (file) {
        setRegStatus({ type: 'info', message: 'Syncing deed to document vault...' });
        const formData = new FormData();
        formData.append('file', file);
        formData.append('uploadedBy', account);

        await fetch(`${API_URL}/api/documents`, {
          method: 'POST',
          body: formData
        });
      }

      setRegStatus({ type: 'info', message: 'Awaiting MetaMask signature for on-chain parcel creation...' });
      const tx = await contract.registerProperty(
        locationHash,
        parseInt(area, 10),
        finalDocHash
      );

      setRegStatus({ type: 'info', message: 'Registration submitted. Confirming block on chain...' });
      await tx.wait();

      setRegStatus({
        type: 'success',
        message: 'Property registration submitted successfully! Awaiting Registrar audit before official mint.'
      });

      setLocationHash('');
      setArea('');
      setFile(null);
      setSaltedDocHash('');
      setExtractedDeedInfo(null);
      fetchMyProperties();
      setSelectedTabIndex(0);
    } catch (error) {
      console.error(error);
      setRegStatus({ type: 'error', message: parseContractError(error) });
    } finally {
      setIsRegistering(false);
    }
  };

  const handleDelist = async (propertyId) => {
    if (!contract) return;
    try {
      setActionStatus({ type: 'info', message: 'Awaiting MetaMask confirmation to delist...' });
      const tx = await contract.delistProperty(propertyId);
      setActionStatus({ type: 'info', message: 'Delisting property on chain...' });
      await tx.wait();
      setActionStatus({ type: 'success', message: 'Property delisted successfully from marketplace.' });
      fetchMyProperties();
      fetchMarketplace();
      setTimeout(() => setActionStatus(null), 3000);
    } catch (err) {
      console.error(err);
      setActionStatus({ type: 'error', message: parseContractError(err) });
    }
  };

  const handleExecuteTransfer = async (transferId) => {
    if (!contract) return;
    try {
      setActionStatus({ type: 'info', message: 'Awaiting MetaMask confirmation to finalize deed conveyance...' });
      const tx = await contract.executeTransfer(transferId);
      setActionStatus({ type: 'info', message: 'Finalizing title reassignment on-chain...' });
      await tx.wait();
      setActionStatus({ type: 'success', message: 'Title conveyance executed successfully! Property is now registered under your ownership.' });
      fetchMyProperties();
      fetchMyTransfers();
      fetchMarketplace();
      setTimeout(() => setActionStatus(null), 4000);
    } catch (err) {
      console.error(err);
      setActionStatus({ type: 'error', message: parseContractError(err) });
    }
  };

  const pendingActionTransfers = transfers.filter((tx) => {
    if (tx.executed) return false;
    const isSeller = tx.fromAddress?.toLowerCase() === account?.toLowerCase();
    const isBuyer = tx.toAddress?.toLowerCase() === account?.toLowerCase();
    if (isSeller && !tx.fromSigned) return true;
    if (isBuyer && !tx.toSigned) return true;
    return false;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Workspace Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 border-b border-gray-200 pb-6">
        <div className="flex items-start gap-4">
          <img 
            src="/bhumi_ledger_seal.png" 
            alt="National Digital Land Registry Seal" 
            className="w-14 h-14 rounded-full object-contain shrink-0 drop-shadow-xs hidden sm:block" 
          />
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-[#0f2b5a] tracking-tight">
              Citizen Property Portal
            </h1>
            <p className="text-gray-600 mt-1 text-sm sm:text-base max-w-2xl leading-relaxed">
              Manage your verified real estate deeds, authorize ownership transfers with secure digital signatures, and submit new property registrations for government certification.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wider bg-[#138808] hover:bg-green-800 text-white rounded-lg transition flex items-center gap-2 cursor-pointer shadow-xs shrink-0"
          >
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <span>Upload Certified Deed</span>
          </button>

          <button
            onClick={() => {
              fetchMyProperties();
              fetchMyTransfers();
              fetchMarketplace();
            }}
            disabled={loadingProps || loadingTransfers}
            className="group px-4 py-2.5 text-xs font-bold uppercase tracking-wider bg-white border border-gray-300 hover:border-[#0f2b5a] text-gray-700 hover:text-[#0f2b5a] rounded-lg transition flex items-center gap-2 cursor-pointer shadow-xs shrink-0 disabled:opacity-50"
          >
            <svg className={`w-3.5 h-3.5 text-gray-500 group-hover:text-[#0f2b5a] ${(loadingProps || loadingTransfers) ? 'animate-spin' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>Refresh Workspace</span>
          </button>
        </div>
      </div>

      {/* Global Status Banner */}
      {actionStatus && (
        <div className={`p-4 rounded-lg text-sm font-medium border flex items-start justify-between gap-3 shadow-xs ${
          actionStatus.type === 'error'
            ? 'bg-red-50 text-red-800 border-red-200'
            : actionStatus.type === 'success'
            ? 'bg-green-50 text-[#138808] border-green-200'
            : 'bg-blue-50 text-[#0f2b5a] border-blue-200'
        }`}>
          <div className="flex items-center gap-2.5">
            {actionStatus.type === 'error' ? (
              <svg className="w-5 h-5 text-red-600 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            ) : actionStatus.type === 'success' ? (
              <svg className="w-5 h-5 text-[#138808] shrink-0" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-[#0f2b5a] animate-spin shrink-0" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
              </svg>
            )}
            <span>{actionStatus.message}</span>
          </div>
          <button
            onClick={() => setActionStatus(null)}
            className="text-gray-400 hover:text-gray-700 p-0.5 rounded cursor-pointer"
          >
            <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      )}

      {/* =========================================================================
          ACTION REQUIRED: Elevated Signature Inbox Banner
          Surfaces pending EIP-712 signatures directly at the top of the portal
      ========================================================================== */}
      {pendingActionTransfers.length > 0 && (
        <section aria-label="Action Required" className="p-5 sm:p-6 rounded-xl bg-amber-50 border border-amber-300 shadow-xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-amber-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-100 border border-amber-300 text-amber-900 flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-amber-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-amber-950 flex items-center gap-2">
                  <span>Action Required: Digital Signature Pending</span>
                  <span className="px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-amber-200/80 text-amber-900 border border-amber-300">
                    {pendingActionTransfers.length}
                  </span>
                </h2>
                <p className="text-xs text-amber-900/90 mt-0.5">
                  You have property conveyance agreements awaiting your digital signature before ownership transfer can be finalized.
                </p>
              </div>
            </div>
            <button
              onClick={() => setSelectedTabIndex(1)} // Jump to Ownership Transfers tab
              className="text-xs font-semibold text-amber-900 hover:underline transition flex items-center gap-1 shrink-0 cursor-pointer"
            >
              <span>View All Transfers</span>
              <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 pt-4">
            {pendingActionTransfers.map((tx) => {
              const isSeller = tx.fromAddress?.toLowerCase() === account?.toLowerCase();
              const myRole = isSeller ? 'Seller' : 'Buyer';
              const escrowEth = tx.escrowAmount && tx.escrowAmount !== '0'
                ? ethers.formatEther(tx.escrowAmount)
                : null;

              return (
                <div
                  key={tx.transferId}
                  className="p-4 rounded-lg bg-white border border-gray-200 flex items-center justify-between gap-3 shadow-xs hover:border-gray-300 transition"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-semibold text-xs text-gray-900">Transfer #{tx.transferId}</span>
                      <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-md border ${
                        isSeller
                          ? 'bg-blue-50 text-[#0f2b5a] border-blue-200'
                          : 'bg-green-50 text-[#138808] border-green-200'
                      }`}>
                        Your Role: {myRole}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 truncate">
                      Parcel #{tx.propertyId} {escrowEth ? `• ${escrowEth} ETH Escrow` : '• Direct Transfer'}
                    </p>
                  </div>

                  <button
                    onClick={() => setSigningTransfer(tx)}
                    className="px-3.5 py-2 bg-[#0f2b5a] hover:bg-blue-900 text-white rounded-md text-xs font-semibold uppercase tracking-wider transition shadow-xs shrink-0 cursor-pointer flex items-center gap-1.5"
                  >
                    <span>Sign Digital Deed</span>
                    <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* =========================================================================
          CORE TAB INTERFACE: Clarified, Humanized Headings
          1. My Land Titles (Default)
          2. Ownership Transfers
          3. Register Property
          4. Marketplace Listings
      ========================================================================== */}
      <Tab.Group selectedIndex={selectedTabIndex} onChange={setSelectedTabIndex}>
        <Tab.List className="flex space-x-6 border-b border-gray-200 bg-transparent p-0 max-w-full overflow-x-auto">
          <Tab className={({ selected }) => classNames(
            'pb-3 text-xs uppercase tracking-wider transition-all cursor-pointer focus:outline-none flex items-center shrink-0',
            selected 
              ? 'border-b-2 border-[#0f2b5a] text-[#0f2b5a] font-bold' 
              : 'text-gray-500 hover:text-gray-700 border-b-2 border-transparent font-semibold'
          )}>
            My Land Titles
            {properties.length > 0 && (
              <span className="ml-2 bg-blue-50 text-[#0f2b5a] border border-blue-200 px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold">
                {properties.length}
              </span>
            )}
          </Tab>

          <Tab className={({ selected }) => classNames(
            'pb-3 text-xs uppercase tracking-wider transition-all cursor-pointer focus:outline-none flex items-center shrink-0',
            selected 
              ? 'border-b-2 border-[#0f2b5a] text-[#0f2b5a] font-bold' 
              : 'text-gray-500 hover:text-gray-700 border-b-2 border-transparent font-semibold'
          )}>
            Ownership Transfers
            {transfers.length > 0 && (
              <span className="ml-2 bg-blue-50 text-[#0f2b5a] border border-blue-200 px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold">
                {transfers.length}
              </span>
            )}
          </Tab>

          <Tab className={({ selected }) => classNames(
            'pb-3 text-xs uppercase tracking-wider transition-all cursor-pointer focus:outline-none flex items-center shrink-0',
            selected 
              ? 'border-b-2 border-[#0f2b5a] text-[#0f2b5a] font-bold' 
              : 'text-gray-500 hover:text-gray-700 border-b-2 border-transparent font-semibold'
          )}>
            + Register Property
          </Tab>

          <Tab className={({ selected }) => classNames(
            'pb-3 text-xs uppercase tracking-wider transition-all cursor-pointer focus:outline-none flex items-center shrink-0',
            selected 
              ? 'border-b-2 border-[#0f2b5a] text-[#0f2b5a] font-bold' 
              : 'text-gray-500 hover:text-gray-700 border-b-2 border-transparent font-semibold'
          )}>
            Marketplace
            {marketplaceProps.length > 0 && (
              <span className="ml-2 bg-blue-50 text-[#0f2b5a] border border-blue-200 px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold">
                {marketplaceProps.length}
              </span>
            )}
          </Tab>
        </Tab.List>

        <Tab.Panels className="mt-4">
          {/* ===================================================================
              Tab 1: My Land Titles (Primary Asset View)
          ==================================================================== */}
          <Tab.Panel className="bg-white border border-gray-200 rounded-xl p-6 shadow-xs focus:outline-none">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <div>
                <h2 className="text-lg font-bold text-[#0f2b5a]">Your Registered Land Parcels</h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Official real estate deeds registered to your connected wallet address.
                </p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => setIsUploadModalOpen(true)}
                  className="px-4 py-2 bg-[#138808] hover:bg-green-800 text-white rounded-lg text-xs font-semibold uppercase tracking-wider transition shadow-xs cursor-pointer flex items-center gap-1.5 shrink-0"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                  <span>Upload Certified Deed</span>
                </button>
                <button
                  onClick={() => setSelectedTabIndex(2)} // Switch to Register Property tab
                  className="px-4 py-2 bg-[#0f2b5a] hover:bg-blue-900 text-white rounded-lg text-xs font-semibold uppercase tracking-wider transition shadow-xs cursor-pointer flex items-center gap-1.5 shrink-0"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                  </svg>
                  <span>Register New Parcel</span>
                </button>
              </div>
            </div>

            {loadingProps ? (
              <div className="text-gray-500 text-sm py-16 text-center flex flex-col items-center justify-center gap-3">
                <svg className="animate-spin h-7 w-7 text-[#0f2b5a]" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                </svg>
                <span>Loading your registered titles from the blockchain ledger...</span>
              </div>
            ) : properties.length === 0 ? (
              <div className="text-center py-16 px-4 border border-dashed border-gray-300 rounded-xl bg-gray-50 max-w-lg mx-auto">
                <div className="w-12 h-12 rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center mx-auto mb-3 text-gray-400">
                  <svg className="w-6 h-6 text-[#138808]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <h3 className="text-base font-semibold text-gray-800">No Registered Titles Found</h3>
                <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto leading-relaxed">
                  You currently hold no registered land titles under this wallet. Once you register a parcel or complete a transfer, your certified title will appear here.
                </p>
                <button
                  onClick={() => setSelectedTabIndex(2)}
                  className="mt-4 px-4 py-2 bg-white border border-gray-300 hover:border-[#0f2b5a] text-gray-700 hover:text-[#0f2b5a] rounded-lg text-xs font-semibold uppercase tracking-wider transition cursor-pointer shadow-xs"
                >
                  File First Property Registration
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {properties.map((prop) => {
                  const priceEth = prop.price ? ethers.formatEther(prop.price.toString()) : '0';

                  return (
                    <div
                      key={prop.propertyId}
                      className="bg-white border border-gray-200 hover:border-gray-300 rounded-xl p-5 shadow-xs relative flex flex-col justify-between transition space-y-4"
                    >
                      <div>
                        {prop.isFrozen && (
                          <span className="absolute -top-2.5 -right-2.5 bg-red-600 text-white text-[10px] font-bold uppercase px-3 py-0.5 rounded-full shadow-xs border border-red-500 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-white" />
                            <span>Title Frozen / In Dispute</span>
                          </span>
                        )}

                        <div className="flex justify-between items-start mb-4">
                          <span className="font-bold font-mono text-gray-700 text-xs bg-gray-100 px-2.5 py-1 rounded-md border border-gray-200">
                            PARCEL #{prop.propertyId}
                          </span>
                          <div className="flex gap-1.5">
                            {prop.isForSale && (
                              <span className="text-xs font-semibold rounded-full px-2.5 py-0.5 bg-blue-50 text-[#0f2b5a] border border-blue-200">
                                {priceEth} ETH Listed
                              </span>
                            )}
                            <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${
                              prop.isVerified
                                ? 'bg-green-50 text-[#138808] border border-green-200'
                                : 'bg-amber-50 text-amber-800 border border-amber-200'
                            }`}>
                              {prop.isVerified ? '✓ Certified Title' : 'Pending Registrar Audit'}
                            </span>
                          </div>
                        </div>

                        <div className="space-y-2.5 text-xs text-gray-700">
                          <div className="flex justify-between items-center bg-gray-50 p-2 rounded-md border border-gray-200 text-gray-800">
                            <span className="text-gray-500">Surveyed Plot Area:</span>
                            <span className="font-bold text-gray-900 font-mono">{prop.area} sq.m</span>
                          </div>

                          <div>
                            <span className="text-gray-500">Cadastral Ref / Survey Bounds:</span>
                            <p className="font-mono text-xs truncate bg-gray-50 p-2 border border-gray-200 rounded-md mt-1 text-gray-700 select-all">
                              {prop.locationHash}
                            </p>
                          </div>

                          <div>
                            <div className="flex justify-between items-center text-gray-500 mb-1">
                              <span>Title Deed Fingerprint:</span>
                              <button
                                onClick={() => copyText(prop.documentHash, `doc-${prop.propertyId}`)}
                                className="text-[10px] text-[#0f2b5a] hover:underline transition cursor-pointer font-medium"
                              >
                                {copiedKey === `doc-${prop.propertyId}` ? 'Copied ✓' : 'Copy Hash'}
                              </button>
                            </div>
                            <p className="font-mono text-xs truncate bg-gray-50 p-2 border border-gray-200 rounded-md text-gray-700 select-all">
                              {prop.documentHash}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-gray-200 space-y-2">
                        {prop.isFrozen ? (
                          <div className="p-2.5 rounded-md bg-red-50 border border-red-200 text-xs text-red-800 text-center font-medium">
                            Judicial caveat active. Property transfers temporarily enjoined.
                          </div>
                        ) : !prop.isVerified ? (
                          <div className="p-2.5 rounded-md bg-amber-50 border border-amber-200 text-xs text-amber-800 text-center font-medium">
                            Awaiting government registrar verification before transfer options unlock.
                          </div>
                        ) : (
                          <>
                            {prop.isForSale ? (
                              <button
                                onClick={() => handleDelist(prop.propertyId)}
                                className="w-full bg-white hover:bg-gray-50 border border-gray-300 text-gray-700 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition cursor-pointer"
                              >
                                Remove from Marketplace
                              </button>
                            ) : (
                              <button
                                onClick={() => setListingProperty(prop)}
                                className="w-full bg-[#0f2b5a] hover:bg-blue-900 text-white py-2 rounded-lg font-semibold text-xs uppercase tracking-wider transition cursor-pointer shadow-xs"
                              >
                                List for Sale on Marketplace
                              </button>
                            )}

                            <button
                              onClick={() => setInitiatingProperty(prop)}
                              className="w-full bg-white hover:bg-gray-50 border border-gray-300 text-gray-700 py-2 rounded-lg font-semibold text-xs uppercase tracking-wider transition cursor-pointer"
                            >
                              Transfer Ownership Directly
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Tab.Panel>

          {/* ===================================================================
              Tab 2: Ownership Transfers & Escrow Tracking
          ==================================================================== */}
          <Tab.Panel className="bg-white border border-gray-200 rounded-xl p-6 shadow-xs focus:outline-none">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-6">
              <div>
                <h2 className="text-lg font-bold text-[#0f2b5a]">Title Conveyances & Escrow Tracking</h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Track two-party cryptographic sign-offs, escrow vault deposits, and registrar approvals.
                </p>
              </div>
              <span className="text-xs text-gray-700 bg-gray-100 px-3 py-1 rounded-md border border-gray-200 font-semibold">
                {transfers.length} total transfers
              </span>
            </div>

            {loadingTransfers ? (
              <div className="text-gray-500 text-sm py-16 text-center flex flex-col items-center justify-center gap-3">
                <svg className="animate-spin h-7 w-7 text-[#0f2b5a]" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                </svg>
                <span>Loading conveyance records...</span>
              </div>
            ) : transfers.length === 0 ? (
              <div className="border border-dashed border-gray-300 rounded-xl bg-gray-50 p-10 text-center max-w-lg mx-auto">
                <div className="w-12 h-12 rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center mx-auto mb-3 text-gray-400">
                  <svg className="w-6 h-6 text-[#138808]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-base font-semibold text-gray-900">No Active Conveyances</h3>
                <p className="text-xs text-gray-600 mt-1 max-w-sm mx-auto leading-relaxed">
                  You are not party to any active or completed property conveyances. When you initiate a transfer or buy a property, progress will appear here.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto -mx-2 sm:mx-0">
                <table className="w-full text-left border-collapse min-w-[700px]">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      <th className="py-3 px-4">Transfer ID</th>
                      <th className="py-3 px-4">Property Plot</th>
                      <th className="py-3 px-4">Your Role</th>
                      <th className="py-3 px-4">Conditional Escrow</th>
                      <th className="py-3 px-4">Transfer Stage</th>
                      <th className="py-3 px-4 text-right">Action Required</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 text-xs text-gray-800">
                    {transfers.map((tx) => {
                      const isSeller = tx.fromAddress?.toLowerCase() === account?.toLowerCase();
                      const myRole = isSeller ? 'Seller (You)' : 'Buyer (You)';
                      const iHaveSigned = isSeller ? tx.fromSigned : tx.toSigned;
                      const escrowEth = tx.escrowAmount && tx.escrowAmount !== '0' 
                        ? ethers.formatEther(tx.escrowAmount) 
                        : null;
                      
                      let statusBadge;
                      if (tx.executed) {
                        statusBadge = (
                          <span className="bg-green-50 text-[#138808] border border-green-200 px-2.5 py-0.5 rounded-full text-xs font-semibold inline-flex items-center gap-1">
                            <span>✓</span> Ownership Finalized
                          </span>
                        );
                      } else if (tx.authorityApproved) {
                        statusBadge = (
                          <span className="bg-blue-50 text-[#0f2b5a] border border-blue-200 px-2.5 py-0.5 rounded-full text-xs font-semibold">
                            Approved by Registrar
                          </span>
                        );
                      } else if (tx.fromSigned && tx.toSigned) {
                        statusBadge = (
                          <span className="bg-blue-50 text-[#0f2b5a] border border-blue-200 px-2.5 py-0.5 rounded-full text-xs font-semibold">
                            Under Registrar Review
                          </span>
                        );
                      } else {
                        statusBadge = (
                          <span className="bg-amber-50 text-amber-800 border border-amber-200 px-2.5 py-0.5 rounded-full text-xs font-semibold">
                            {iHaveSigned ? 'Awaiting Counterparty' : 'Awaiting Your Signature'}
                          </span>
                        );
                      }

                      return (
                        <tr key={tx.transferId} className="hover:bg-gray-50/80 transition">
                          <td className="py-3.5 px-4 font-mono font-semibold text-gray-900">#{tx.transferId}</td>
                          <td className="py-3.5 px-4 text-gray-700 font-medium">Parcel #{tx.propertyId}</td>
                          <td className="py-3.5 px-4">
                            <span className={`px-2 py-0.5 rounded-md text-xs font-semibold border ${
                              isSeller 
                                ? 'bg-blue-50 text-[#0f2b5a] border-blue-200' 
                                : 'bg-green-50 text-[#138808] border-green-200'
                            }`}>
                              {myRole}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            {escrowEth ? (
                              <span className="font-mono text-xs font-semibold text-[#138808] bg-green-50 px-2.5 py-0.5 rounded-full border border-green-200 inline-flex items-center gap-1.5">
                                <svg className="w-3 h-3 text-[#138808]" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                                </svg>
                                <span>{escrowEth} ETH Locked</span>
                              </span>
                            ) : (
                              <span className="text-xs text-gray-500 font-mono">Direct Transfer</span>
                            )}
                          </td>
                          <td className="py-3.5 px-4">{statusBadge}</td>
                          <td className="py-3.5 px-4 text-right">
                            {!tx.executed && !iHaveSigned && (
                              <button
                                onClick={() => setSigningTransfer(tx)}
                                className="bg-[#0f2b5a] hover:bg-blue-900 text-white px-3 py-1.5 rounded-md text-xs font-semibold uppercase tracking-wider transition shadow-xs cursor-pointer inline-flex items-center gap-1.5"
                              >
                                <span>Sign Digital Deed</span>
                                <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              </button>
                            )}
                            {tx.authorityApproved && !tx.executed && (
                              <button
                                onClick={() => handleExecuteTransfer(tx.transferId)}
                                className="bg-[#0f2b5a] hover:bg-blue-900 text-white px-3 py-1.5 rounded-md text-xs font-semibold uppercase tracking-wider transition shadow-xs cursor-pointer inline-flex items-center gap-1.5"
                                title="Finalize title reassignment on the blockchain"
                              >
                                <span>Execute Conveyance</span>
                                <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              </button>
                            )}
                            {iHaveSigned && !tx.authorityApproved && !tx.executed && (
                              <span className="text-[#138808] font-mono text-xs flex items-center justify-end gap-1 font-semibold">
                                <span>✓ Signed by You</span>
                              </span>
                            )}
                            {tx.executed && (
                              <span className="text-gray-500 text-xs">Settled On-Chain</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Tab.Panel>

          {/* ===================================================================
              Tab 3: Register Cadastral Parcel
          ==================================================================== */}
          <Tab.Panel className="bg-white border border-gray-200 rounded-xl p-6 shadow-xs focus:outline-none">
            <div className="max-w-xl">
              <h2 className="text-lg font-bold text-[#0f2b5a] mb-1">Register New Property Deed</h2>
              <p className="text-xs text-gray-600 mb-6 leading-relaxed">
                Submit cadastral survey coordinates and official deed documentation. A digital fingerprint is calculated in your browser before committing the record on-chain for government audit.
              </p>

              {/* Fast-Track Deed Upload Feature Banner */}
              <div className="mb-6 p-4 sm:p-5 rounded-xl bg-blue-50/70 border border-blue-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#138808]" />
                    <h3 className="text-sm font-bold text-[#0f2b5a]">
                      Fast-Track: Pre-Fill from Certified Deed
                    </h3>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-100 text-[#0f2b5a] border border-blue-200 font-semibold">
                      SHA-256 Web Crypto
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    Upload your certified sale deed or Khatauni extract to automatically parse the 16-digit UPIC Gata Code, Khasra, Area, and pre-compute document hash.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsUploadModalOpen(true)}
                  className="px-4 py-2.5 bg-[#0f2b5a] hover:bg-blue-900 text-white rounded-lg text-xs font-semibold uppercase tracking-wider transition shadow-xs cursor-pointer flex items-center gap-1.5 shrink-0"
                >
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <span>Upload Certified Deed</span>
                </button>
              </div>

              {/* Extracted Deed Metadata Notification Card */}
              {extractedDeedInfo && (
                <div className="mb-6 p-4 rounded-xl bg-white border border-gray-200 shadow-xs space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-gray-200">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#138808]" />
                      <span className="text-xs font-bold text-[#138808] uppercase tracking-wide">
                        Verified Deed Extracted & Pre-Filled
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsUploadModalOpen(true)}
                      className="text-[11px] text-[#0f2b5a] hover:underline font-semibold cursor-pointer"
                    >
                      View Full Metadata
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                    <div className="p-2.5 rounded-lg bg-gray-50 border border-gray-200">
                      <span className="text-gray-500 text-[10px] block uppercase font-bold truncate" title={terminology.parcelCodeLabel || '16-Digit Gata (UPIC)'}>
                        {terminology.parcelCodeLabel || '16-Digit Gata (UPIC)'}
                      </span>
                      <span className="font-mono text-[#0f2b5a] font-bold text-xs select-all">
                        {extractedDeedInfo.gataCode}
                      </span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-gray-50 border border-gray-200">
                      <span className="text-gray-500 text-[10px] block uppercase font-bold truncate" title={terminology.parcelIdentifierLabel || 'Khasra Number'}>
                        {terminology.parcelIdentifierLabel || 'Khasra Number'}
                      </span>
                      <span className="font-mono text-gray-900 font-semibold text-xs">
                        {extractedDeedInfo.khasra}
                      </span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-gray-50 border border-gray-200">
                      <span className="text-gray-500 text-[10px] block uppercase font-bold">Demarcated Area</span>
                      <span className="font-mono text-gray-900 font-semibold text-xs">
                        {extractedDeedInfo.area} sq.m
                      </span>
                    </div>
                  </div>

                  {saltedDocHash && (
                    <div className="p-2.5 rounded-lg bg-gray-50 border border-gray-200 text-xs">
                      <span className="text-gray-500 text-[10px] block uppercase font-bold mb-0.5">Salted Document Hash</span>
                      <p className="font-mono text-xs text-gray-700 truncate select-all">
                        {saltedDocHash}
                      </p>
                    </div>
                  )}
                </div>
              )}
              
              <form onSubmit={handleRegister} className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Municipal Survey Coordinates / Boundary Bounds <span className="text-[#0f2b5a]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={locationHash}
                    onChange={(e) => setLocationHash(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-900 text-sm focus:border-[#0f2b5a] focus:ring-1 focus:ring-[#0f2b5a] outline-none transition font-mono placeholder:text-gray-400 shadow-xs"
                    placeholder="e.g. Survey No. 42/B, Dehradun (30.3165° N, 78.0322° E)"
                  />
                  <p className="text-[11px] text-gray-500 mt-1">
                    Enter certified municipal survey coordinates or decentralized GIS record reference.
                  </p>
                </div>
                
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Surveyed Land Area (sq. meters) <span className="text-[#0f2b5a]">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={area}
                    onChange={(e) => setArea(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-900 text-sm focus:border-[#0f2b5a] focus:ring-1 focus:ring-[#0f2b5a] outline-none transition font-mono placeholder:text-gray-400 shadow-xs"
                    placeholder="e.g. 2400"
                  />
                  <p className="text-[11px] text-gray-500 mt-1">
                    Total demarcated surface area in square meters (1 sq.m ≈ 10.76 sq.ft).
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Official Registered Title Deed (PDF) <span className="text-[#0f2b5a]">*</span>
                  </label>
                  <div className="border-2 border-dashed border-gray-300 hover:border-[#0f2b5a] rounded-xl p-4 bg-gray-50/50 transition">
                    <input
                      type="file"
                      required={!saltedDocHash}
                      accept="application/pdf"
                      onChange={(e) => setFile(e.target.files[0])}
                      className="w-full text-gray-600 file:mr-4 file:py-2 file:px-3.5 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-[#0f2b5a] file:text-white hover:file:bg-blue-900 cursor-pointer text-xs"
                    />
                    {file && (
                      <div className="mt-3 p-2.5 rounded-lg bg-white border border-gray-200 flex items-center justify-between text-xs shadow-xs">
                        <span className="font-mono text-gray-700 truncate max-w-xs">{file.name}</span>
                        <span className="text-gray-500 font-mono">{(file.size / 1024).toFixed(1)} KB</span>
                      </div>
                    )}
                    {saltedDocHash && (
                      <div className="mt-3 p-2.5 rounded-lg bg-green-50 border border-green-200 flex items-center justify-between text-xs">
                        <span className="font-mono text-[#138808] truncate max-w-xs">Hash: {saltedDocHash.slice(0, 24)}...</span>
                        <span className="text-[#138808] font-mono text-[11px] font-semibold">Web Crypto Pre-Hashed ✓</span>
                      </div>
                    )}
                  </div>
                  <p className="mt-1.5 text-[11px] text-gray-500">
                    Upload your legally stamped sale deed PDF. A cryptographic fingerprint (SHA-256) will be generated client-side.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={isRegistering}
                  className="w-full bg-[#138808] hover:bg-green-800 active:bg-green-900 disabled:opacity-50 text-white py-3 px-4 rounded-lg font-semibold transition shadow-xs cursor-pointer text-xs tracking-wider uppercase flex items-center justify-center gap-2"
                >
                  {isRegistering ? (
                    <>
                      <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                      </svg>
                      <span>Submitting Registration to Blockchain...</span>
                    </>
                  ) : (
                    <span>Submit Title for Cadastral Verification</span>
                  )}
                </button>

                {regStatus && (
                  <div className={`p-4 rounded-lg text-xs font-medium border flex items-center gap-2.5 ${
                    regStatus.type === 'error'
                      ? 'bg-red-50 text-red-800 border-red-200'
                      : regStatus.type === 'success'
                      ? 'bg-green-50 text-[#138808] border-green-200'
                      : 'bg-blue-50 text-[#0f2b5a] border-blue-200'
                  }`}>
                    {regStatus.type === 'info' && (
                      <svg className="animate-spin h-3.5 w-3.5 text-[#0f2b5a] shrink-0" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                      </svg>
                    )}
                    <span>{regStatus.message}</span>
                  </div>
                )}
              </form>
            </div>
          </Tab.Panel>

          {/* ===================================================================
              Tab 4: Marketplace Listings
          ==================================================================== */}
          <Tab.Panel className="bg-white border border-gray-200 rounded-xl p-6 shadow-xs focus:outline-none">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-lg font-bold text-[#0f2b5a]">Live Verified Listings</h2>
                <p className="text-xs text-gray-500 mt-0.5">Purchases are secured with conditional smart contract escrow deposits.</p>
              </div>
              <button
                onClick={fetchMarketplace}
                disabled={loadingMarket}
                className="group text-xs text-gray-700 hover:text-[#0f2b5a] font-semibold uppercase tracking-wider px-3.5 py-1.5 border border-gray-300 hover:border-[#0f2b5a] rounded-lg bg-white hover:bg-gray-50 transition cursor-pointer flex items-center gap-1.5 disabled:opacity-50 shadow-xs"
              >
                <svg className={`w-3.5 h-3.5 text-gray-500 group-hover:text-[#0f2b5a] ${loadingMarket ? 'animate-spin' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>Refresh</span>
              </button>
            </div>

            {loadingMarket ? (
              <div className="text-gray-500 text-sm py-16 text-center flex flex-col items-center justify-center gap-3">
                <svg className="animate-spin h-7 w-7 text-[#0f2b5a]" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                </svg>
                <span>Loading verified marketplace listings...</span>
              </div>
            ) : marketplaceProps.length === 0 ? (
              <div className="border border-dashed border-gray-300 rounded-xl bg-gray-50 p-10 text-center max-w-lg mx-auto">
                <h3 className="text-base font-semibold text-gray-900">No Properties Currently Listed</h3>
                <p className="text-xs text-gray-600 mt-1 max-w-sm mx-auto">
                  There are no verified parcels currently posted for sale. You can list verified titles you own from the My Land Titles tab.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {marketplaceProps.map((prop) => {
                  const isOwner = prop.currentOwner?.toLowerCase() === account?.toLowerCase();
                  const priceEth = prop.price ? ethers.formatEther(prop.price.toString()) : '0';

                  return (
                    <div key={prop.propertyId} className="bg-white border border-gray-200 hover:border-gray-300 rounded-xl p-5 shadow-xs flex flex-col justify-between transition">
                      <div>
                        <div className="flex justify-between items-start mb-3">
                          <span className="font-bold text-gray-700 font-mono text-xs bg-gray-100 px-2.5 py-1 rounded-md border border-gray-200">
                            PARCEL #{prop.propertyId}
                          </span>
                          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-green-50 text-[#138808] border border-green-200">
                            ✓ Certified Title
                          </span>
                        </div>

                        <div className="mb-4 p-3 rounded-lg bg-blue-50/60 border border-blue-100">
                          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Price</span>
                          <div className="text-2xl font-bold text-[#0f2b5a] font-mono mt-0.5">
                            {priceEth} <span className="text-gray-600 text-sm font-semibold">ETH</span>
                          </div>
                        </div>

                        <div className="space-y-2 text-xs text-gray-700 mb-4">
                          <p><span className="text-gray-500">Area:</span> <span className="font-semibold text-gray-900 font-mono">{prop.area} sq.m</span></p>
                          <div>
                            <span className="text-gray-500">Cadastral Ref:</span> 
                            <p className="font-mono truncate bg-gray-50 p-1.5 border border-gray-200 rounded mt-0.5 text-xs text-gray-700 select-all">{prop.locationHash}</p>
                          </div>
                          <div>
                            <span className="text-gray-500">Seller:</span> 
                            <p className="font-mono truncate bg-gray-50 p-1.5 border border-gray-200 rounded mt-0.5 text-xs text-gray-700 select-all">
                              {isOwner ? "You (Connected Wallet)" : prop.currentOwner}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-gray-200">
                        {isOwner ? (
                          <button
                            onClick={() => handleDelist(prop.propertyId)}
                            className="w-full bg-white hover:bg-gray-50 border border-gray-300 text-gray-700 py-2.5 rounded-lg font-semibold text-xs uppercase tracking-wider transition cursor-pointer"
                          >
                            Remove from Marketplace
                          </button>
                        ) : (
                          <button
                            onClick={() => setBuyingProperty(prop)}
                            className="w-full bg-[#0f2b5a] hover:bg-blue-900 active:bg-blue-950 text-white py-2.5 rounded-lg font-semibold text-xs uppercase tracking-wider transition shadow-xs cursor-pointer"
                          >
                            Purchase via Escrow ({priceEth} ETH)
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Tab.Panel>
        </Tab.Panels>
      </Tab.Group>

      {/* Modals */}
      <InitiateTransferModal 
        isOpen={!!initiatingProperty} 
        onClose={() => setInitiatingProperty(null)}
        property={initiatingProperty}
        onInitiateSuccess={fetchMyTransfers}
      />

      <SignTransferModal
        isOpen={!!signingTransfer}
        onClose={() => setSigningTransfer(null)}
        transfer={signingTransfer}
        onSignSuccess={fetchMyTransfers}
      />

      <ListPropertyModal
        isOpen={!!listingProperty}
        onClose={() => setListingProperty(null)}
        property={listingProperty}
        onListSuccess={() => {
          fetchMyProperties();
          fetchMarketplace();
        }}
      />

      <BuyPropertyModal
        isOpen={!!buyingProperty}
        onClose={() => setBuyingProperty(null)}
        property={buyingProperty}
        onBuySuccess={() => {
          fetchMyTransfers();
          fetchMarketplace();
        }}
      />

      <DocumentUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onDeedExtracted={handleDeedExtracted}
        accountAddress={account}
      />
    </div>
  );
}
