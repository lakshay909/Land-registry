import React, { useState, useEffect } from 'react';
import { Tab } from '@headlessui/react';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../config';
import { ethers } from 'ethers';
import InitiateTransferModal from '../components/InitiateTransferModal';
import SignTransferModal from '../components/SignTransferModal';

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

export default function CitizenDashboard() {
  const { account, contract, signer } = useAuth();
  const [properties, setProperties] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const [loadingProps, setLoadingProps] = useState(true);
  const [loadingTransfers, setLoadingTransfers] = useState(true);

  // Registration Form State
  const [locationHash, setLocationHash] = useState('');
  const [area, setArea] = useState('');
  const [file, setFile] = useState(null);
  const [regStatus, setRegStatus] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);

  // Modal State
  const [initiatingProperty, setInitiatingProperty] = useState(null);
  const [signingTransfer, setSigningTransfer] = useState(null);

  useEffect(() => {
    if (account) {
      fetchMyProperties();
      fetchMyTransfers();
    }
  }, [account]);

  const fetchMyProperties = async () => {
    setLoadingProps(true);
    try {
      const res = await fetch(`${API_URL}/api/properties?owner=${account}`);
      if (res.ok) {
        const data = await res.json();
        setProperties(data);
      }
    } catch (err) {
      console.error("Failed to fetch properties:", err);
    } finally {
      setLoadingProps(false);
    }
  };

  const fetchMyTransfers = async () => {
    setLoadingTransfers(true);
    try {
      const res = await fetch(`${API_URL}/api/transfers?party=${account}`);
      if (res.ok) {
        const data = await res.json();
        // Sort newest first
        setTransfers(data.sort((a, b) => b.transferId - a.transferId));
      }
    } catch (err) {
      console.error("Failed to fetch transfers:", err);
    } finally {
      setLoadingTransfers(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!file || !locationHash || !area) return;

    setIsRegistering(true);
    setRegStatus('Hashing document...');

    try {
      // 1. Client-side hashing
      const arrayBuffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      const documentHash = ethers.keccak256(uint8Array);

      // 2. Upload file to backend FIRST
      // NOTE: Uploading first ensures the file is safely stored before committing on-chain.
      // If the user rejects the MetaMask prompt after upload, this file becomes orphaned on disk.
      // In a production system, a cleanup cron could purge orphaned files after 24h.
      setRegStatus('Uploading document...');
      const formData = new FormData();
      formData.append('file', file);
      formData.append('uploadedBy', account);

      const uploadRes = await fetch(`${API_URL}/api/documents`, {
        method: 'POST',
        body: formData
      });

      if (!uploadRes.ok) {
        throw new Error('Document upload failed. Please try again.');
      }

      // 3. Submit transaction
      setRegStatus('Awaiting MetaMask confirmation...');
      const tx = await contract.registerProperty(
        locationHash,
        parseInt(area, 10),
        documentHash
      );

      setRegStatus('Transaction submitted. Waiting for confirmation...');
      await tx.wait();

      setRegStatus('Property registered successfully!');
      
      // Reset form
      setLocationHash('');
      setArea('');
      setFile(null);
      fetchMyProperties();
      
      // Clear success message after 5 seconds
      setTimeout(() => setRegStatus(''), 5000);
      
    } catch (error) {
      console.error(error);
      setRegStatus(`Error: ${error.reason || error.message}`);
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold text-slate-900 mb-8">Citizen Dashboard</h1>
      
      <Tab.Group>
        <Tab.List className="flex space-x-1 rounded-xl bg-slate-200 p-1 mb-8 max-w-xl">
          <Tab className={({ selected }) => classNames('w-full rounded-lg py-2.5 text-sm font-medium leading-5', 'ring-white/60 ring-offset-2 ring-offset-indigo-400 focus:outline-none focus:ring-2', selected ? 'bg-white text-indigo-700 shadow' : 'text-slate-600 hover:bg-white/[0.12] hover:text-slate-800')}>
            My Properties
          </Tab>
          <Tab className={({ selected }) => classNames('w-full rounded-lg py-2.5 text-sm font-medium leading-5', 'ring-white/60 ring-offset-2 ring-offset-indigo-400 focus:outline-none focus:ring-2', selected ? 'bg-white text-indigo-700 shadow' : 'text-slate-600 hover:bg-white/[0.12] hover:text-slate-800')}>
            My Transfers
          </Tab>
          <Tab className={({ selected }) => classNames('w-full rounded-lg py-2.5 text-sm font-medium leading-5', 'ring-white/60 ring-offset-2 ring-offset-indigo-400 focus:outline-none focus:ring-2', selected ? 'bg-white text-indigo-700 shadow' : 'text-slate-600 hover:bg-white/[0.12] hover:text-slate-800')}>
            Register Property
          </Tab>
        </Tab.List>
        <Tab.Panels>
          {/* Tab 1: My Properties */}
          <Tab.Panel className="rounded-xl bg-white p-6 shadow-sm border border-slate-200 focus:outline-none">
            {loadingProps ? (
              <p className="text-slate-500">Loading properties...</p>
            ) : properties.length === 0 ? (
              <div className="text-center py-12">
                <svg className="mx-auto h-12 w-12 text-slate-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                <h3 className="text-lg font-medium text-slate-900">No properties found</h3>
                <p className="mt-1 text-sm text-slate-500">You don't own any registered properties yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {properties.map((prop) => (
                  <div key={prop.propertyId} className="border border-slate-200 rounded-lg p-5 hover:border-indigo-300 transition bg-slate-50 relative flex flex-col justify-between">
                    <div>
                      {prop.isFrozen && (
                        <span className="absolute -top-2 -right-2 bg-rose-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-sm">
                          Frozen
                        </span>
                      )}
                      <div className="flex justify-between items-start mb-4">
                        <h4 className="font-bold text-slate-900">ID #{prop.propertyId}</h4>
                        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${prop.isVerified ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                          {prop.isVerified ? 'Verified' : 'Pending'}
                        </span>
                      </div>
                      <div className="space-y-2 text-sm text-slate-600 mb-4">
                        <p><span className="font-semibold text-slate-800">Area:</span> {prop.area} sq m</p>
                        <div>
                          <span className="font-semibold text-slate-800">Location:</span> 
                          <p className="font-mono text-xs truncate bg-white p-1 border border-slate-200 rounded mt-1">{prop.locationHash}</p>
                        </div>
                        <div>
                          <span className="font-semibold text-slate-800">Deed Hash:</span>
                          <p className="font-mono text-xs truncate bg-white p-1 border border-slate-200 rounded mt-1">{prop.documentHash}</p>
                        </div>
                      </div>
                    </div>
                    
                    <button
                      disabled={prop.isFrozen || !prop.isVerified}
                      onClick={() => setInitiatingProperty(prop)}
                      className="w-full mt-4 bg-indigo-100 text-indigo-700 hover:bg-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed py-2 rounded font-medium transition"
                    >
                      Initiate Transfer
                    </button>
                  </div>
                ))}
              </div>
            )}
          </Tab.Panel>

          {/* Tab 2: My Transfers */}
          <Tab.Panel className="rounded-xl bg-white p-6 shadow-sm border border-slate-200 focus:outline-none">
            {loadingTransfers ? (
              <p className="text-slate-500">Loading transfers...</p>
            ) : transfers.length === 0 ? (
              <div className="text-center py-12">
                <svg className="mx-auto h-12 w-12 text-slate-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
                <h3 className="text-lg font-medium text-slate-900">No transfers found</h3>
                <p className="mt-1 text-sm text-slate-500">You are not involved in any property transfers.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-sm text-slate-500 uppercase tracking-wider">
                      <th className="py-3 px-4">Transfer ID</th>
                      <th className="py-3 px-4">Property ID</th>
                      <th className="py-3 px-4">Role</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {transfers.map(tx => {
                      const isSeller = tx.fromAddress.toLowerCase() === account.toLowerCase();
                      const myRole = isSeller ? 'Seller' : 'Buyer';
                      const iHaveSigned = isSeller ? tx.fromSigned : tx.toSigned;
                      
                      let statusBadge;
                      if (tx.executed) {
                        statusBadge = <span className="bg-emerald-100 text-emerald-800 px-2 py-1 rounded text-xs font-semibold">Executed</span>;
                      } else if (tx.authorityApproved) {
                        statusBadge = <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-semibold">Approved, Awaiting Exec</span>;
                      } else if (tx.fromSigned && tx.toSigned) {
                        statusBadge = <span className="bg-indigo-100 text-indigo-800 px-2 py-1 rounded text-xs font-semibold">Awaiting Approval</span>;
                      } else {
                        statusBadge = <span className="bg-amber-100 text-amber-800 px-2 py-1 rounded text-xs font-semibold">Pending Signatures</span>;
                      }

                      return (
                        <tr key={tx.transferId} className="hover:bg-slate-50 transition">
                          <td className="py-3 px-4 text-sm font-medium text-slate-900">#{tx.transferId}</td>
                          <td className="py-3 px-4 text-sm text-slate-600">Property #{tx.propertyId}</td>
                          <td className="py-3 px-4 text-sm">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${isSeller ? 'bg-purple-100 text-purple-800' : 'bg-teal-100 text-teal-800'}`}>
                              {myRole}
                            </span>
                          </td>
                          <td className="py-3 px-4">{statusBadge}</td>
                          <td className="py-3 px-4 text-right">
                            {!tx.executed && !iHaveSigned && (
                              <button
                                onClick={() => setSigningTransfer(tx)}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded text-sm font-medium transition shadow-sm"
                              >
                                Sign Typed Data
                              </button>
                            )}
                            {iHaveSigned && !tx.executed && (
                              <span className="text-sm text-slate-400 italic">Signed</span>
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

          {/* Tab 3: Register Property */}
          <Tab.Panel className="rounded-xl bg-white p-6 shadow-sm border border-slate-200 focus:outline-none">
            <div className="max-w-xl">
              <h2 className="text-2xl font-bold text-slate-900 mb-6">Register New Property</h2>
              
              <form onSubmit={handleRegister} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Location Hash (GeoCoordinates / Boundaries)</label>
                  <input
                    type="text"
                    required
                    value={locationHash}
                    onChange={(e) => setLocationHash(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                    placeholder="e.g. 51.5074N,0.1278W"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Area (sq meters)</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={area}
                    onChange={(e) => setArea(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                    placeholder="e.g. 1500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Title Deed Document (PDF)</label>
                  <input
                    type="file"
                    required
                    accept="application/pdf"
                    onChange={(e) => setFile(e.target.files[0])}
                    className="w-full text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
                  />
                  <p className="mt-1 text-xs text-slate-500">Document will be hashed locally before upload to ensure integrity.</p>
                </div>

                <button
                  type="submit"
                  disabled={isRegistering}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white py-3 px-4 rounded-md font-semibold transition"
                >
                  {isRegistering ? 'Processing...' : 'Register Property'}
                </button>

                {regStatus && (
                  <div className={`p-4 rounded-md text-sm font-medium ${
                    regStatus.includes('Error') ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-blue-50 text-blue-700 border border-blue-200'
                  }`}>
                    {regStatus}
                  </div>
                )}
              </form>
            </div>
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
    </div>
  );
}
