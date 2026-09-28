import React, { useState } from 'react';
import { API_URL } from '../config';

export default function PublicSearch() {
  const [searchId, setSearchId] = useState('');
  const [property, setProperty] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchId || isNaN(searchId) || Number(searchId) < 1) {
      setError('Please enter a valid Property ID (positive integer).');
      setProperty(null);
      return;
    }

    setLoading(true);
    setError('');
    try {
      // Fetch property details (history is included in this response!)
      const propRes = await fetch(`${API_URL}/api/properties/${searchId}`);
      if (!propRes.ok) {
        if (propRes.status === 404) throw new Error('Property not found.');
        throw new Error('Failed to fetch property details.');
      }
      const propData = await propRes.json();
      setProperty(propData);
      setHistory(propData.history || []);
    } catch (err) {
      setError(err.message);
      setProperty(null);
      setHistory([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Search Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Public Registry Search</h1>
        <p className="text-slate-600 max-w-xl mx-auto text-lg">
          Verify property ownership and view immutable transaction history directly from the blockchain ledger.
        </p>
      </div>

      {/* Search Form */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <form onSubmit={handleSearch} className="flex gap-4">
          <input
            type="number"
            min="1"
            value={searchId}
            onChange={(e) => setSearchId(e.target.value)}
            placeholder="Enter Property ID (e.g., 1)"
            className="flex-grow px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition text-lg"
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-70 text-white px-8 py-3 rounded-lg font-semibold transition flex items-center shadow-sm text-lg"
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </form>
        {error && (
          <div className="mt-4 p-4 bg-rose-50 text-rose-700 rounded-lg border border-rose-100 flex items-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            {error}
          </div>
        )}
      </div>

      {/* Results Area */}
      {property && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Property Details Card */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <div className="flex justify-between items-start mb-6">
                <h3 className="text-xl font-bold text-slate-900">Property #{property.propertyId}</h3>
                <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${
                  property.isVerified ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                }`}>
                  {property.isVerified ? 'Verified' : 'Pending Verification'}
                </span>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Current Owner</label>
                  <p className="text-sm font-mono text-slate-900 break-all bg-slate-50 p-2 rounded border border-slate-100 mt-1">
                    {property.currentOwner}
                  </p>
                </div>
                
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Location Hash</label>
                  <p className="text-sm font-mono text-slate-600 truncate bg-slate-50 p-2 rounded border border-slate-100 mt-1" title={property.locationHash}>
                    {property.locationHash}
                  </p>
                </div>

                <div className="flex justify-between items-center border-t border-slate-100 pt-4 mt-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Area</label>
                    <p className="text-slate-900 font-medium">{property.area} sq m</p>
                  </div>
                  <div className="text-right">
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Registered</label>
                    <p className="text-slate-900 font-medium">{new Date(property.registeredAt * 1000).toLocaleDateString()}</p>
                  </div>
                </div>

                {property.isFrozen === true && (
                  <div className="mt-4 p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-start">
                    <svg className="w-5 h-5 text-rose-600 mt-0.5 mr-2 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <div>
                      <p className="text-sm font-bold text-rose-800">Property Frozen</p>
                      <p className="text-xs text-rose-600 mt-1">This property is under investigation and cannot be transferred.</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="lg:col-span-2">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 h-full">
              <h3 className="text-xl font-bold text-slate-900 mb-6">Ownership History</h3>
              
              {history.length === 0 ? (
                <p className="text-slate-500 italic text-center py-8">No history available.</p>
              ) : (
                <div className="relative border-l-2 border-indigo-100 ml-3 space-y-8">
                  {history.map((event, idx) => (
                    <div key={idx} className="relative pl-8">
                      <div className="absolute w-6 h-6 bg-indigo-100 border-2 border-indigo-500 rounded-full -left-[13px] top-1 flex items-center justify-center">
                        <div className="w-2 h-2 bg-indigo-600 rounded-full"></div>
                      </div>
                      
                      <div className="bg-slate-50 border border-slate-100 rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-semibold text-slate-900">{event.eventType}</h4>
                          <span className="text-xs font-medium text-slate-500 bg-white px-2 py-1 rounded border border-slate-200">
                            Block {event.blockNumber}
                          </span>
                        </div>
                        
                        <p className="text-sm text-slate-600 mb-3">
                          {new Date(event.timestamp * 1000).toLocaleString()}
                        </p>

                        <div className="space-y-2">
                          {event.fromAddress && event.fromAddress !== '0x0000000000000000000000000000000000000000' && (
                            <div className="flex flex-col sm:flex-row sm:items-center text-sm">
                              <span className="w-16 text-slate-400 text-xs font-semibold uppercase">From</span>
                              <span className="font-mono text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-100">{event.fromAddress}</span>
                            </div>
                          )}
                          {event.toAddress && (
                            <div className="flex flex-col sm:flex-row sm:items-center text-sm">
                              <span className="w-16 text-slate-400 text-xs font-semibold uppercase">To</span>
                              <span className="font-mono text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-100">{event.toAddress}</span>
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
      )}
    </div>
  );
}
