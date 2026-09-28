import React, { useState, useEffect } from 'react';
import { Tab } from '@headlessui/react';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../config';

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

export default function AuthorityDashboard() {
  const { account, contract } = useAuth();
  
  const [pendingProps, setPendingProps] = useState([]);
  const [pendingTransfers, setPendingTransfers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionStatus, setActionStatus] = useState('');

  // Flag property state
  const [flagSearchId, setFlagSearchId] = useState('');
  const [searchedProperty, setSearchedProperty] = useState(null);
  const [flagReason, setFlagReason] = useState('');

  useEffect(() => {
    fetchData();
  }, [account]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [propsRes, transRes] = await Promise.all([
        fetch(`${API_URL}/api/properties?status=pending`),
        fetch(`${API_URL}/api/transfers?status=pending`)
      ]);
      
      if (propsRes.ok) setPendingProps(await propsRes.json());
      if (transRes.ok) setPendingTransfers(await transRes.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyProperty = async (propertyId) => {
    try {
      setActionStatus('Awaiting MetaMask...');
      const tx = await contract.verifyRegistration(propertyId);
      setActionStatus('Verifying property registration...');
      await tx.wait();
      setActionStatus('Property verified successfully!');
      fetchData();
      setTimeout(() => setActionStatus(''), 3000);
    } catch (error) {
      console.error(error);
      setActionStatus(`Error: ${error.reason || error.message}`);
    }
  };

  const handleApproveTransfer = async (transferId) => {
    try {
      setActionStatus('Awaiting MetaMask...');
      const tx = await contract.approveTransfer(transferId);
      setActionStatus('Approving transfer...');
      await tx.wait();
      setActionStatus('Transfer approved successfully!');
      fetchData();
      setTimeout(() => setActionStatus(''), 3000);
    } catch (error) {
      console.error(error);
      setActionStatus(`Error: ${error.reason || error.message}`);
    }
  };

  const handleExecuteTransfer = async (transferId) => {
    try {
      setActionStatus('Awaiting MetaMask...');
      const tx = await contract.executeTransfer(transferId);
      setActionStatus('Executing transfer...');
      await tx.wait();
      setActionStatus('Transfer executed successfully!');
      fetchData();
      setTimeout(() => setActionStatus(''), 3000);
    } catch (error) {
      console.error(error);
      setActionStatus(`Error: ${error.reason || error.message}`);
    }
  };

  const handleSearchProperty = async (e) => {
    e.preventDefault();
    if (!flagSearchId) return;
    try {
      const res = await fetch(`${API_URL}/api/properties/${flagSearchId}`);
      if (res.ok) {
        setSearchedProperty(await res.json());
        setFlagReason(''); // Reset reason when searching a new property
      } else {
        setSearchedProperty(null);
        setActionStatus('Property not found');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleFlag = async (e) => {
    e.preventDefault(); // In case it's in a form
    if (!searchedProperty) return;
    const isCurrentlyFrozen = searchedProperty.isFrozen;
    
    if (!isCurrentlyFrozen && !flagReason.trim()) {
      setActionStatus('Error: A justification reason is required to flag a property.');
      return;
    }

    try {
      setActionStatus('Awaiting MetaMask...');
      const tx = isCurrentlyFrozen 
        ? await contract.unflagProperty(searchedProperty.propertyId)
        : await contract.flagProperty(searchedProperty.propertyId, flagReason);
        
      setActionStatus(isCurrentlyFrozen ? 'Unflagging property...' : 'Flagging property...');
      await tx.wait();
      
      setActionStatus(`Property successfully ${isCurrentlyFrozen ? 'unflagged' : 'flagged'}!`);
      
      // Refresh searched property
      const res = await fetch(`${API_URL}/api/properties/${searchedProperty.propertyId}`);
      if (res.ok) {
        setSearchedProperty(await res.json());
        setFlagReason('');
      }
      
      fetchData();
      setTimeout(() => setActionStatus(''), 3000);
    } catch (error) {
      console.error(error);
      setActionStatus(`Error: ${error.reason || error.message}`);
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Authority Dashboard</h1>
          <p className="text-slate-600">Approve registrations, transfers, and manage property flags.</p>
        </div>
      </div>

      {actionStatus && (
        <div className={`mb-6 p-4 rounded-lg font-medium shadow-sm border ${actionStatus.includes('Error') ? 'bg-rose-50 text-rose-800 border-rose-200' : 'bg-indigo-50 text-indigo-800 border-indigo-200'}`}>
          {actionStatus}
        </div>
      )}

      <Tab.Group>
        <Tab.List className="flex space-x-1 rounded-xl bg-slate-200 p-1 mb-8 max-w-xl">
          <Tab className={({ selected }) => classNames('w-full rounded-lg py-2.5 text-sm font-medium leading-5 transition-all', 'ring-white/60 ring-offset-2 ring-offset-indigo-400 focus:outline-none focus:ring-2', selected ? 'bg-white text-indigo-700 shadow' : 'text-slate-600 hover:bg-white/[0.12] hover:text-slate-800')}>
            Pending Registrations
            {pendingProps.length > 0 && <span className="ml-2 bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full text-xs">{pendingProps.length}</span>}
          </Tab>
          <Tab className={({ selected }) => classNames('w-full rounded-lg py-2.5 text-sm font-medium leading-5 transition-all', 'ring-white/60 ring-offset-2 ring-offset-indigo-400 focus:outline-none focus:ring-2', selected ? 'bg-white text-indigo-700 shadow' : 'text-slate-600 hover:bg-white/[0.12] hover:text-slate-800')}>
            Pending Transfers
            {pendingTransfers.length > 0 && <span className="ml-2 bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full text-xs">{pendingTransfers.length}</span>}
          </Tab>
          <Tab className={({ selected }) => classNames('w-full rounded-lg py-2.5 text-sm font-medium leading-5 transition-all', 'ring-white/60 ring-offset-2 ring-offset-indigo-400 focus:outline-none focus:ring-2', selected ? 'bg-white text-indigo-700 shadow' : 'text-slate-600 hover:bg-white/[0.12] hover:text-slate-800')}>
            Flag/Unflag Properties
          </Tab>
        </Tab.List>

        <Tab.Panels>
          {/* Registrations */}
          <Tab.Panel className="rounded-xl bg-white p-6 shadow-sm border border-slate-200">
            <h2 className="text-xl font-bold text-slate-800 mb-6">Properties Awaiting Verification</h2>
            {loading ? <p>Loading...</p> : pendingProps.length === 0 ? <p className="text-slate-500 italic">No pending registrations.</p> : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {pendingProps.map(prop => (
                  <div key={prop.propertyId} className="border border-slate-200 rounded-lg p-5 bg-slate-50 flex flex-col justify-between">
                    <div>
                      <h4 className="font-bold text-slate-900 mb-4">Property #{prop.propertyId}</h4>
                      <div className="space-y-2 text-sm text-slate-600 mb-4">
                        <p><span className="font-semibold text-slate-800">Owner:</span> <br/><span className="font-mono text-xs">{prop.currentOwner}</span></p>
                        <p><span className="font-semibold text-slate-800">Area:</span> {prop.area} sqm</p>
                        <p><span className="font-semibold text-slate-800">Location:</span> <br/><span className="font-mono text-xs">{prop.locationHash}</span></p>
                        <p><span className="font-semibold text-slate-800">Deed Hash:</span> <br/><span className="font-mono text-xs break-all">{prop.documentHash}</span></p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleVerifyProperty(prop.propertyId)}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2 rounded transition"
                    >
                      Verify Property
                    </button>
                  </div>
                ))}
              </div>
            )}
          </Tab.Panel>

          {/* Transfers */}
          <Tab.Panel className="rounded-xl bg-white p-6 shadow-sm border border-slate-200">
            <h2 className="text-xl font-bold text-slate-800 mb-6">Transfers Awaiting Action</h2>
            {loading ? <p>Loading...</p> : pendingTransfers.length === 0 ? <p className="text-slate-500 italic">No pending transfers.</p> : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-sm text-slate-500 uppercase tracking-wider">
                      <th className="py-3 px-4">Transfer ID</th>
                      <th className="py-3 px-4">Property ID</th>
                      <th className="py-3 px-4">Signatures</th>
                      <th className="py-3 px-4">Approval</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {pendingTransfers.map(tx => {
                      const signaturesReady = tx.fromSigned && tx.toSigned;
                      
                      return (
                        <tr key={tx.transferId} className="hover:bg-slate-50 transition">
                          <td className="py-3 px-4 text-sm font-medium text-slate-900">#{tx.transferId}</td>
                          <td className="py-3 px-4 text-sm text-slate-600">#{tx.propertyId}</td>
                          <td className="py-3 px-4 text-sm">
                            {signaturesReady ? (
                              <span className="text-emerald-600 font-semibold flex items-center"><svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg> Both Signed</span>
                            ) : (
                              <span className="text-amber-600 font-semibold">Missing Signatures</span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            {tx.authorityApproved ? (
                              <span className="text-emerald-600 font-semibold flex items-center"><svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg> Approved</span>
                            ) : (
                              <span className="text-amber-600 font-semibold">Pending Approval</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right space-x-2">
                            {signaturesReady && !tx.authorityApproved && (
                              <button
                                onClick={() => handleApproveTransfer(tx.transferId)}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded text-sm font-medium transition shadow-sm"
                              >
                                Approve Transfer
                              </button>
                            )}
                            {signaturesReady && tx.authorityApproved && !tx.executed && (
                              <button
                                onClick={() => handleExecuteTransfer(tx.transferId)}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded text-sm font-medium transition shadow-sm"
                              >
                                Execute Transfer
                              </button>
                            )}
                            {!signaturesReady && (
                              <span className="text-sm text-slate-400 italic">Waiting on users...</span>
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

          {/* Flag Properties */}
          <Tab.Panel className="rounded-xl bg-white p-6 shadow-sm border border-slate-200">
            <div className="max-w-xl">
              <h2 className="text-xl font-bold text-slate-800 mb-6">Investigate & Flag Properties</h2>
              
              <form onSubmit={handleSearchProperty} className="flex gap-4 mb-8">
                <input
                  type="number"
                  min="1"
                  required
                  value={flagSearchId}
                  onChange={(e) => setFlagSearchId(e.target.value)}
                  placeholder="Enter Property ID (e.g., 1)"
                  className="flex-grow px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none transition"
                />
                <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-semibold transition shadow-sm">
                  Search
                </button>
              </form>

              {searchedProperty && (
                <div className="border border-slate-200 rounded-xl p-6 bg-slate-50">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h3 className="text-xl font-bold text-slate-900">Property #{searchedProperty.propertyId}</h3>
                      <p className="text-sm text-slate-500 font-mono mt-1">{searchedProperty.currentOwner}</p>
                    </div>
                    {searchedProperty.isFrozen && (
                      <span className="bg-rose-100 text-rose-800 px-3 py-1 rounded-full text-sm font-bold flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                        FROZEN
                      </span>
                    )}
                  </div>

                  <p className="text-sm text-slate-600 mb-6">
                    {searchedProperty.isFrozen 
                      ? 'This property is currently under investigation. It cannot be transferred or modified.'
                      : 'This property is active. Flagging it will prevent any further transfers or state changes.'}
                  </p>

                  <form onSubmit={handleToggleFlag}>
                    {!searchedProperty.isFrozen && (
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-slate-700 mb-1">Reason for Flagging</label>
                        <input
                          type="text"
                          required
                          value={flagReason}
                          onChange={(e) => setFlagReason(e.target.value)}
                          placeholder="e.g. Disputed boundaries, legal freeze, etc."
                          className="w-full px-4 py-2 border border-slate-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 outline-none transition text-sm"
                        />
                      </div>
                    )}
                    <button
                      type="submit"
                      className={`w-full py-3 rounded-lg font-bold text-white transition shadow-sm ${
                        searchedProperty.isFrozen 
                          ? 'bg-emerald-600 hover:bg-emerald-700' 
                          : 'bg-rose-600 hover:bg-rose-700'
                      }`}
                    >
                      {searchedProperty.isFrozen ? 'UNFLAG PROPERTY (RESTORE NORMAL OPERATIONS)' : 'FLAG PROPERTY (FREEZE TRANSFERS)'}
                    </button>
                  </form>
                </div>
              )}
            </div>
          </Tab.Panel>
        </Tab.Panels>
      </Tab.Group>
    </div>
  );
}
