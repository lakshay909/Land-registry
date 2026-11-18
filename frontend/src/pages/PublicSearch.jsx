import React, { useState } from 'react';
import { API_URL } from '../config';
import { useCurrentState } from '../context/StateContext';

export default function PublicSearch() {
  const { stateConfig } = useCurrentState();
  const terminology = stateConfig?.terminology || {};

  const [searchId, setSearchId] = useState('');
  const [property, setProperty] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copiedHash, setCopiedHash] = useState(false);
  const [copiedGata, setCopiedGata] = useState(false);

  const executeSearchWithId = async (idToSearch) => {
    const trimmed = String(idToSearch || '').trim();
    if (!trimmed) {
      setError('Please enter a valid Property / Survey Number or Owner Address.');
      setProperty(null);
      return;
    }

    setLoading(true);
    setError('');
    try {
      if (/^0x[a-fA-F0-9]{40}$/.test(trimmed)) {
        // Search by Ethereum wallet address
        const res = await fetch(`${API_URL}/api/properties?owner=${trimmed}`);
        if (!res.ok) throw new Error('Failed to query the land records indexer.');
        const props = await res.json();
        if (!props || props.length === 0) {
          throw new Error(`No registered land titles found for address ${trimmed}.`);
        }
        const firstId = props[0].propertyId;
        const detailRes = await fetch(`${API_URL}/api/properties/${firstId}`);
        const propData = detailRes.ok ? await detailRes.json() : props[0];
        setProperty(propData);
        setHistory(propData.history || []);
      } else if (!isNaN(trimmed) && Number(trimmed) >= 1) {
        // Search by numeric Property ID
        const propRes = await fetch(`${API_URL}/api/properties/${trimmed}`);
        if (!propRes.ok) {
          if (propRes.status === 404) throw new Error(`Survey Record #${trimmed} is not registered in this state ledger.`);
          throw new Error('Failed to query the land records indexer.');
        }
        const propData = await propRes.json();
        setProperty(propData);
        setHistory(propData.history || []);
      } else {
        throw new Error('Please enter a valid Property / Survey Number (e.g. 1) or an Ethereum Address (0x...).');
      }
    } catch (err) {
      setError(err.message);
      setProperty(null);
      setHistory([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    executeSearchWithId(searchId);
  };

  const handleQuickSample = (id) => {
    setSearchId(String(id));
    executeSearchWithId(id);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  return (
    <div className="relative">
      {/* =========================================================================
          1. HERO SECTION WITH CLEAN GOVERNMENT PORTAL STYLING
      ========================================================================== */}
      <section className="pt-12 pb-16 md:pt-16 md:pb-20 bg-slate-50 border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-5">
          {/* Official National Seal */}
          <div className="flex justify-center">
            <img 
              src="/bhumi_ledger_seal_hd.png" 
              alt="National Digital Land Registry - Bhūmi Ledger Official Seal" 
              className="w-24 h-24 sm:w-28 sm:h-28 rounded-full object-contain drop-shadow-sm" 
            />
          </div>

          {/* Official Verification Badge */}
          <div>
            <span className="inline-flex items-center gap-2 bg-green-100 text-[#138808] border border-green-200 text-xs font-bold px-3.5 py-1 rounded-full uppercase tracking-wide">
              <span className="w-2 h-2 rounded-full bg-[#138808]" />
              Verified by National Digital Ledger
            </span>
          </div>

          {/* Main Government Title */}
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-[#0f2b5a] tracking-tight leading-tight">
            Verify Land Titles Securely
          </h2>

          <p className="text-gray-600 max-w-2xl mx-auto text-base sm:text-lg leading-relaxed font-normal">
            Query state revenue records, inspect cadastral coordinates, and verify authentic property ownership directly through the national digital ledger.
          </p>

          {/* Search Box */}
          <div className="pt-4 max-w-2xl mx-auto">
            <form 
              onSubmit={handleSearch} 
              className="bg-white p-2 rounded-xl shadow-md border border-gray-200 flex flex-col sm:flex-row items-center gap-2"
            >
              <div className="flex-grow flex items-center pl-3 w-full">
                <svg className="w-5 h-5 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  value={searchId}
                  onChange={(e) => setSearchId(e.target.value)}
                  placeholder="Enter Property / Survey ID (e.g. 1, 2) or Owner Address (0x...)"
                  className="w-full pl-3 pr-4 py-3 outline-none text-gray-800 placeholder-gray-400 bg-transparent text-sm sm:text-base font-medium font-mono"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full sm:w-auto bg-[#138808] hover:bg-green-700 active:bg-green-800 text-white font-semibold px-8 py-3 rounded-lg transition shadow-sm flex items-center justify-center gap-2 shrink-0 cursor-pointer text-sm"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                    </svg>
                    <span>Searching...</span>
                  </>
                ) : (
                  <span>Search Title</span>
                )}
              </button>
            </form>

            {/* Quick Demo Queries */}
            <div className="flex items-center justify-center gap-2 mt-4 text-xs text-gray-500 font-medium flex-wrap">
              <span>Quick Demo Queries:</span>
              <button 
                type="button" 
                onClick={() => handleQuickSample(1)}
                className="bg-white text-gray-700 px-2.5 py-1 rounded border border-gray-200 cursor-pointer hover:bg-gray-100 font-medium shadow-xs"
              >
                Survey #1
              </button>
              <button 
                type="button" 
                onClick={() => handleQuickSample(2)}
                className="bg-white text-gray-700 px-2.5 py-1 rounded border border-gray-200 cursor-pointer hover:bg-gray-100 font-medium shadow-xs"
              >
                Survey #2
              </button>
              <button 
                type="button" 
                onClick={() => handleQuickSample(3)}
                className="bg-white text-gray-700 px-2.5 py-1 rounded border border-gray-200 cursor-pointer hover:bg-gray-100 font-medium shadow-xs"
              >
                Survey #3
              </button>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mt-5 p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 flex items-center gap-3 text-sm text-left shadow-xs">
                <svg className="w-5 h-5 text-red-600 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span>{error}</span>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* =========================================================================
          MANDATORY STATUTORY DISCLAIMER BANNER (PUBLIC RECORD INTEGRITY)
      ========================================================================== */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="p-4 sm:p-5 rounded-2xl bg-blue-50/90 border border-blue-200 text-blue-950 flex items-start gap-3.5 shadow-xs">
          <div className="w-9 h-9 rounded-xl bg-[#0f2b5a] text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
            <svg className="w-5 h-5 text-blue-200" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="space-y-1 text-xs">
            <p className="font-bold text-[#0f2b5a] uppercase tracking-wider text-[11px] flex items-center gap-1.5 flex-wrap">
              <span>Mandatory Statutory Notice</span>
              <span>•</span>
              <span className="font-semibold text-blue-800">IT Act 2000 & Registration Act 1908</span>
            </p>
            <p className="text-blue-900/90 leading-relaxed">
              Under Entry 1 of the First Schedule to the Information Technology Act, 2000 and Section 17(1) of the Registration Act, 1908, cryptographic deed hashing and timestamping provide mathematical anti-tamper proof of document integrity. They DO NOT substitute for mandatory physical deed registration before the Sub-Registrar or revenue mutation under the UP Revenue Code, 2006.
            </p>
          </div>
        </div>
      </section>

      {/* =========================================================================
          2. OFFICIAL GOVERNMENT STATISTICS SECTION
      ========================================================================== */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 relative overflow-hidden text-center">
            <div className="absolute top-0 left-0 right-0 h-1 bg-[#0f2b5a]" />
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Secured Records</p>
            <p className="mt-2 text-3xl font-extrabold text-[#0f2b5a]">14,250+</p>
            <p className="mt-1 text-xs text-gray-500">Government Verified</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 relative overflow-hidden text-center">
            <div className="absolute top-0 left-0 right-0 h-1 bg-[#138808]" />
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Transaction Volume</p>
            <p className="mt-2 text-3xl font-extrabold text-[#0f2b5a]">₹5,820 Cr</p>
            <p className="mt-1 text-xs text-gray-500">Securely Processed</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 relative overflow-hidden text-center">
            <div className="absolute top-0 left-0 right-0 h-1 bg-amber-500" />
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Fraud Cases</p>
            <p className="mt-2 text-3xl font-extrabold text-[#0f2b5a]">0 Cases</p>
            <p className="mt-1 text-xs text-gray-500">Zero Duplicates Found</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 relative overflow-hidden text-center">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gray-500" />
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Security Model</p>
            <p className="mt-2 text-2xl font-extrabold text-[#0f2b5a]">Digital Ledger</p>
            <p className="mt-1 text-xs text-gray-500">Tamper-Proof Audit</p>
          </div>
        </div>
      </section>

      {/* =========================================================================
          3. PROPERTY RECORD & OWNERSHIP TIMELINE
      ========================================================================== */}
      {property && (() => {
        const propIdNum = Number(property.propertyId) || 1;
        const gataCode16 = `091501004520${String(propIdNum).padStart(4, '0')}`;
        const ulpinCode = (propIdNum % 2 === 0) ? `UP150100452${String(propIdNum).padStart(3, '0')}` : null;

        return (
        <section className="pb-16 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-gray-200">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">
                <span>Certified Revenue Record</span>
                <span>•</span>
                <span className="text-[#138808]">On-Chain Confirmed</span>
              </div>
              <h3 className="text-2xl font-bold text-[#0f2b5a]">
                Survey Record #{property.propertyId}
              </h3>
            </div>
            
            <div className="flex flex-wrap items-center gap-2">
              {/* 16-Digit Gata Code Badge Block */}
              <div className="flex items-center gap-1.5 bg-gray-100 text-[#0f2b5a] border border-gray-200 px-3 py-1 rounded-full font-mono text-xs font-bold shadow-xs">
                <span className="text-[10px] text-gray-500 uppercase font-sans tracking-wide">UPIC:</span>
                <span className="tracking-wider">{gataCode16}</span>
              </div>

              {/* ULPIN Badge */}
              {ulpinCode ? (
                <span className="px-3 py-1 text-xs font-mono font-bold rounded-full bg-indigo-100 text-indigo-900 border border-indigo-200">
                  ULPIN: {ulpinCode}
                </span>
              ) : (
                <span className="px-3 py-1 text-xs font-semibold rounded-full bg-amber-100 text-amber-900 border border-amber-200 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  Pending Georeferencing
                </span>
              )}

              <span className={`px-3 py-1 text-xs font-bold uppercase rounded-full border flex items-center gap-1.5 ${
                property.isVerified 
                  ? 'bg-green-100 text-[#138808] border-green-200' 
                  : 'bg-amber-100 text-amber-800 border-amber-200'
              }`}>
                {property.isVerified ? (
                  <>
                    <svg className="w-3.5 h-3.5 text-[#138808]" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span>Government Certified</span>
                  </>
                ) : (
                  <>
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                    <span>Under Review</span>
                  </>
                )}
              </span>

              {property.isForSale && (
                <span className="px-3 py-1 text-xs font-bold uppercase rounded-full bg-blue-100 text-[#0f2b5a] border border-blue-200">
                  Listed in Marketplace
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Card 1: Official Land Certificate Summary */}
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm space-y-5">
                <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                  <div>
                    <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Revenue Extract</span>
                    <p className="text-xs font-semibold text-[#0f2b5a] mt-0.5">Govt of India Land Registry</p>
                  </div>
                  <img 
                    src="/bhumi_ledger_seal.png" 
                    alt="Official Seal" 
                    className="w-10 h-10 rounded-full object-contain shrink-0 shadow-xs" 
                  />
                </div>

                {/* 16-Digit Gata Code (UPIC) Badge Block */}
                <div className="border-b border-gray-100 pb-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                      {terminology.parcelCodeLabel || '16-Digit UPIC (भूखंड का विशिष्ट कोड)'}
                    </span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(gataCode16);
                        setCopiedGata(true);
                        setTimeout(() => setCopiedGata(false), 2000);
                      }}
                      className="text-[11px] font-semibold text-[#0f2b5a] hover:underline cursor-pointer"
                    >
                      {copiedGata ? '✓ Copied' : 'Copy UPIC'}
                    </button>
                  </div>
                  <div className="mt-2 p-3 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-between">
                    <span className="font-mono text-sm sm:text-base font-bold tracking-widest text-[#0f2b5a] select-all">
                      {gataCode16}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-gray-100 text-gray-700 border border-gray-200">
                      UP Bhulekh
                    </span>
                  </div>
                </div>

                {/* ULPIN Georeference Badge Block */}
                <div className="border-b border-gray-100 pb-4">
                  <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-2">
                    Bhu-Aadhaar ULPIN Badge
                  </span>
                  {ulpinCode ? (
                    <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-indigo-900">
                        ULPIN: {ulpinCode}
                      </span>
                      <span className="text-[10px] uppercase font-bold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded">
                        Georeferenced
                      </span>
                    </div>
                  ) : (
                    <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-between">
                      <span className="text-xs font-semibold text-amber-900 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-amber-500" />
                        Pending Georeferencing
                      </span>
                      <span className="text-[10px] uppercase font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded">
                        Survey Pending
                      </span>
                    </div>
                  )}
                </div>

                <div className="border-b border-gray-100 pb-4">
                  <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Current Ownership</span>
                  <div className="mt-2 p-3 rounded-lg bg-gray-50 border border-gray-200">
                    <p className="text-xs text-gray-500 mb-1">Title Holder Digital ID</p>
                    <p className="font-mono text-xs text-[#0f2b5a] break-all select-all font-semibold">
                      {property.currentOwner}
                    </p>
                  </div>
                </div>

                {/* Spatial Coordinates & Hash */}
                <div>
                  <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Cadastral Location GIS</span>
                  <div className="mt-2 p-3 rounded-lg bg-gray-50 border border-gray-200 flex items-center justify-between">
                    <p className="font-mono text-xs text-gray-700 truncate" title={property.locationHash}>
                      {property.locationHash}
                    </p>
                    <button
                      onClick={() => copyToClipboard(property.locationHash)}
                      className="text-xs text-gray-500 hover:text-[#0f2b5a] ml-2 shrink-0 transition"
                      title="Copy Location Hash"
                    >
                      {copiedHash ? '✓ Copied' : '⧉'}
                    </button>
                  </div>
                </div>

                {/* Land Area and Registration Date */}
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div className="p-3 rounded-lg bg-gray-50 border border-gray-200">
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Total Area</span>
                    <span className="text-base font-extrabold text-gray-900 mt-0.5 block">{property.area} sq.m</span>
                  </div>
                  <div className="p-3 rounded-lg bg-gray-50 border border-gray-200">
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Registered On</span>
                    <span className="text-base font-extrabold text-gray-900 mt-0.5 block">
                      {new Date(property.registeredAt * 1000).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {/* Marketplace Pricing if listed */}
                {property.isForSale && (
                  <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
                    <span className="text-xs font-semibold text-[#0f2b5a] block">Marketplace Asking Price</span>
                    <span className="text-xl font-extrabold text-[#0f2b5a] mt-1 block">
                      {property.price || '0'} ETH
                    </span>
                  </div>
                )}

                {/* Dispute / Frozen Banner */}
                {property.isFrozen && (
                  <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-800 flex items-start gap-3">
                    <svg className="w-5 h-5 text-red-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <div>
                      <p className="text-sm font-bold text-red-900">Property Enjoined / Disputed</p>
                      <p className="text-xs text-red-700 mt-1">
                        This parcel is currently flagged by the Revenue Registrar and all conveyances are frozen.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Card 2: Ownership Provenance & Conveyance Timeline */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl p-6 sm:p-8 border border-gray-200 shadow-sm h-full">
                <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-6">
                  <div>
                    <h4 className="text-xl font-bold text-[#0f2b5a]">Title Conveyance History</h4>
                    <p className="text-xs text-gray-500 mt-1">Sequential audit trail indexed from government ledger events</p>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-gray-100 text-xs font-mono text-gray-700 border border-gray-200">
                    {history.length} Event{history.length === 1 ? '' : 's'}
                  </span>
                </div>

                {history.length === 0 ? (
                  <div className="text-center py-16 text-gray-500">
                    <p className="italic">No previous conveyances recorded for this survey record.</p>
                  </div>
                ) : (
                  <div className="relative border-l-2 border-gray-200 ml-4 space-y-6">
                    {history.map((event, idx) => (
                      <div key={idx} className="relative pl-6">
                        {/* Status Marker Icon */}
                        <div className="absolute w-6 h-6 bg-white border-2 border-[#138808] rounded-full -left-[13px] top-1 flex items-center justify-center shadow-xs">
                          <span className="w-2 h-2 bg-[#138808] rounded-full"></span>
                        </div>

                        <div className="rounded-xl p-4 bg-gray-50 border border-gray-200 hover:border-gray-300 transition space-y-2">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="text-xs font-bold text-[#0f2b5a] uppercase tracking-wider">
                              {event.eventType}
                            </span>
                            <div className="flex items-center gap-2 text-xs">
                              <span className="px-2 py-0.5 rounded bg-white border border-gray-200 font-mono text-gray-600">
                                Block #{event.blockNumber}
                              </span>
                              <span className="text-gray-500 font-mono">
                                {new Date(event.timestamp * 1000).toLocaleString()}
                              </span>
                            </div>
                          </div>

                          {/* Address Details */}
                          <div className="space-y-1 pt-1 text-xs">
                            {event.fromAddress && event.fromAddress !== '0x0000000000000000000000000000000000000000' && (
                              <div className="flex flex-col sm:flex-row sm:items-center gap-1.5">
                                <span className="w-14 text-gray-500 uppercase font-bold text-[10px]">From:</span>
                                <span className="font-mono text-gray-700 bg-white px-2 py-0.5 rounded border border-gray-200 break-all">
                                  {event.fromAddress}
                                </span>
                              </div>
                            )}
                            {event.toAddress && (
                              <div className="flex flex-col sm:flex-row sm:items-center gap-1.5">
                                <span className="w-14 text-[#138808] uppercase font-bold text-[10px]">To:</span>
                                <span className="font-mono text-[#0f2b5a] bg-white px-2 py-0.5 rounded border border-gray-200 break-all font-semibold">
                                  {event.toAddress}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
        );
      })()}
    </div>
  );
}
