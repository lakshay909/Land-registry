import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../config';
import { ethers } from 'ethers';
import BuyPropertyModal from '../components/BuyPropertyModal';

export default function Marketplace() {
  const { account, contract, connectWallet } = useAuth();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [actionStatus, setActionStatus] = useState('');

  const fetchMarketplaceProperties = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/properties/marketplace`);
      if (res.ok) {
        const data = await res.json();
        setProperties(data);
      }
    } catch (err) {
      console.error("Failed to fetch marketplace properties:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMarketplaceProperties();
  }, []);

  const handleDelist = async (propertyId) => {
    if (!contract) return;
    try {
      setActionStatus('Awaiting MetaMask confirmation to delist...');
      const tx = await contract.delistProperty(propertyId);
      setActionStatus('Delisting in progress on-chain...');
      await tx.wait();
      setActionStatus('Property successfully delisted from Marketplace.');
      fetchMarketplaceProperties();
      setTimeout(() => setActionStatus(''), 3000);
    } catch (err) {
      console.error(err);
      setActionStatus(`Error: ${err.reason || err.message}`);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header with Institutional Theme */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-gray-200 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-50 border border-green-200 text-[#138808] text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Verified Exchange</span>
            <span>•</span>
            <span>Smart Contract Escrow Protected</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#0f2b5a] tracking-tight">
            Institutional Land Marketplace
          </h1>
          <p className="text-gray-600 mt-2 text-sm sm:text-base max-w-2xl leading-relaxed">
            Browse legally verified cadastral parcels listed for public purchase. Buyer payment is locked securely in the smart contract escrow vault until the Land Registrar approves the conveyance.
          </p>
        </div>

        <button
          onClick={fetchMarketplaceProperties}
          className="group px-4 py-2.5 text-xs font-bold uppercase tracking-wider bg-white border border-gray-300 hover:border-[#0f2b5a] rounded-lg text-gray-700 hover:text-[#0f2b5a] transition flex items-center gap-2 cursor-pointer shadow-xs shrink-0"
        >
          <svg className="w-3.5 h-3.5 text-gray-500 group-hover:text-[#0f2b5a]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span>Refresh Listings</span>
        </button>
      </div>

      {actionStatus && (
        <div className={`p-4 rounded-lg text-sm font-medium border ${
          actionStatus.includes('Error') 
            ? 'bg-red-50 text-red-800 border-red-200' 
            : 'bg-green-50 text-[#138808] border-green-200'
        }`}>
          {actionStatus}
        </div>
      )}

      {/* Grid of Listings */}
      {loading ? (
        <div className="text-center py-24 text-gray-500 flex flex-col items-center justify-center gap-3">
          <svg className="animate-spin h-8 w-8 text-[#0f2b5a]" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
          </svg>
          <span className="text-sm">Fetching verified market listings from chain...</span>
        </div>
      ) : properties.length === 0 ? (
        <div className="text-center py-16 bg-white border border-gray-200 rounded-xl p-8 shadow-xs max-w-xl mx-auto">
          <div className="w-16 h-16 rounded-xl bg-gray-100 border border-gray-200 text-gray-500 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-[#0f2b5a]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
              <line x1="7" y1="7" x2="7.01" y2="7" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-gray-900">No Parcels Currently Listed</h3>
          <p className="text-sm text-gray-600 mt-2 leading-relaxed">
            There are currently no land parcels listed for sale on the public marketplace. Property owners can list verified titles through their Citizen Dashboard.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {properties.map((prop) => {
            const isMyProperty = account && prop.currentOwner.toLowerCase() === account.toLowerCase();
            const priceInEth = prop.price ? ethers.formatEther(prop.price.toString()) : '0';

            return (
              <div
                key={prop.propertyId}
                className="bg-white border border-gray-200 hover:border-gray-300 rounded-xl p-6 shadow-xs flex flex-col justify-between transition"
              >
                <div>
                  <div className="flex justify-between items-start mb-5">
                    <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-md bg-gray-100 border border-gray-200 text-gray-700">
                      PARCEL #{prop.propertyId}
                    </span>
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-green-50 text-[#138808] border border-green-200 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#138808]" />
                      <span>Verified Title</span>
                    </span>
                  </div>

                  {/* Price Banner */}
                  <div className="mb-5 p-4 rounded-xl bg-blue-50/60 border border-blue-100">
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block">Asking Price (ETH)</span>
                    <div className="text-3xl font-bold text-[#0f2b5a] font-mono mt-1 flex items-baseline gap-2">
                      <span>{priceInEth}</span>
                      <span className="text-gray-600 text-sm font-semibold">ETH</span>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="space-y-3 text-xs text-gray-700 border-t border-gray-100 pt-4">
                    <div className="flex justify-between items-center py-1">
                      <span className="text-gray-500">Demarcated Area:</span>
                      <span className="font-semibold text-gray-900 font-mono">{prop.area} sq.m</span>
                    </div>

                    <div className="py-1">
                      <span className="text-gray-500 block text-[11px] mb-1">Cadastral Hash / Location:</span>
                      <p className="font-mono text-gray-700 truncate bg-gray-50 p-2 rounded-md border border-gray-200 text-xs" title={prop.locationHash}>
                        {prop.locationHash}
                      </p>
                    </div>

                    <div className="py-1">
                      <span className="text-gray-500 block text-[11px] mb-1">Registered Owner:</span>
                      <p className="font-mono text-gray-700 truncate bg-gray-50 p-2 rounded-md border border-gray-200 text-xs" title={prop.currentOwner}>
                        {isMyProperty ? "You (Connected Account)" : prop.currentOwner}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Action Button */}
                <div className="mt-6 pt-5 border-t border-gray-100">
                  {isMyProperty ? (
                    <div className="space-y-2">
                      <span className="block text-center text-xs font-semibold text-amber-800 bg-amber-50 py-1 rounded-md border border-amber-200">
                        Listed By You
                      </span>
                      <button
                        onClick={() => handleDelist(prop.propertyId)}
                        className="w-full bg-white hover:bg-gray-50 border border-gray-300 text-gray-700 text-xs font-semibold py-2.5 rounded-lg transition cursor-pointer"
                      >
                        Delist from Marketplace
                      </button>
                    </div>
                  ) : account ? (
                    <button
                      onClick={() => setSelectedProperty(prop)}
                      className="w-full bg-[#0f2b5a] hover:bg-blue-900 active:bg-blue-950 text-white text-xs font-semibold uppercase tracking-wider py-2.5 rounded-lg transition shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      <span>Lock Escrow & Purchase</span>
                    </button>
                  ) : (
                    <button
                      onClick={connectWallet}
                      className="w-full bg-[#0f2b5a] hover:bg-blue-900 text-white text-xs font-semibold uppercase tracking-wider py-2.5 rounded-lg transition shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <span>Connect Wallet to Purchase</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Buy Property Modal */}
      <BuyPropertyModal
        isOpen={!!selectedProperty}
        onClose={() => setSelectedProperty(null)}
        property={selectedProperty}
        onBuySuccess={fetchMarketplaceProperties}
      />
    </div>
  );
}
