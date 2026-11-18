import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useCurrentState } from '../context/StateContext';

export default function StateSelector() {
  const {
    currentState,
    allStates,
    selectState
  } = useCurrentState();

  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef(null);

  // Close dropdown on outside click or escape key
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const filteredStates = useMemo(() => {
    if (!searchQuery.trim()) return allStates;
    const q = searchQuery.toLowerCase().trim();
    return allStates.filter(s =>
      s.nameEn.toLowerCase().includes(q) ||
      s.nameHi.includes(q) ||
      s.code.toLowerCase().includes(q) ||
      (s.portalName && s.portalName.toLowerCase().includes(q))
    );
  }, [allStates, searchQuery]);

  const activeGroup = useMemo(() => {
    return filteredStates.filter(s => s.status === 'ACTIVE_PILOT');
  }, [filteredStates]);

  const upcomingGroup = useMemo(() => {
    return filteredStates.filter(s => s.status === 'COMING_SOON');
  }, [filteredStates]);

  const handleSelect = (stateCode) => {
    selectState(stateCode);
    setIsOpen(false);
    setSearchQuery('');
  };

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      {/* Top Navbar Trigger Pill */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-gray-300 hover:border-[#0f2b5a] shadow-xs text-xs font-medium text-gray-700 hover:text-[#0f2b5a] transition cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0f2b5a]"
        aria-expanded={isOpen}
        aria-haspopup="true"
        title="Change State / Territory Jurisdiction"
      >
        {/* Tricolor / Map Pin Symbol */}
        <span className="flex items-center justify-center w-5 h-5 rounded-md bg-emerald-50 text-emerald-800 font-bold text-[10px] border border-emerald-200">
          {currentState.code}
        </span>

        <div className="flex flex-col text-left leading-tight">
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-gray-900">{currentState.nameEn}</span>
            <span className="text-[10px] text-gray-400 font-normal hidden sm:inline">
              ({currentState.nameHi})
            </span>
          </div>
          <span className="text-[10px] text-emerald-700 font-medium flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
            Active Pilot
          </span>
        </div>

        <svg
          className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-150 ${isOpen ? 'rotate-180' : ''}`}
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>

      {/* Dropdown Menu Panel */}
      {isOpen && (
        <div className="absolute left-0 sm:right-0 sm:left-auto mt-2 w-80 sm:w-96 rounded-2xl bg-white shadow-2xl border border-gray-200 z-50 overflow-hidden divide-y divide-gray-100 animate-in fade-in zoom-in-95 duration-100">
          {/* Header Strip */}
          <div className="p-3 bg-gray-50 border-b border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-[#0f2b5a] tracking-wide">
                SELECT JURISDICTION
              </span>
              <span className="text-[10px] text-gray-500 font-medium">
                Entry 18, State List
              </span>
            </div>

            {/* State Search Input */}
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search state, UT, or code (e.g. MH, Delhi)..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0f2b5a] focus:border-transparent"
                autoFocus
              />
              <svg
                className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1.5 text-gray-400 hover:text-gray-600 text-xs"
                >
                  ×
                </button>
              )}
            </div>
          </div>

          {/* Scrollable States List */}
          <div className="max-h-80 overflow-y-auto p-2 space-y-3">
            {/* Active Pilot Section */}
            {activeGroup.length > 0 && (
              <div>
                <div className="px-2 py-1 text-[10px] font-bold text-emerald-800 uppercase tracking-wider flex items-center justify-between">
                  <span>Live Production Pilot</span>
                  <span className="bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded text-[9px]">
                    1 Live
                  </span>
                </div>
                {activeGroup.map((state) => {
                  const isCurrent = currentState.code === state.code;
                  return (
                    <button
                      key={state.code}
                      onClick={() => handleSelect(state.code)}
                      className={`w-full mt-1 p-2 rounded-xl text-left flex items-start justify-between transition cursor-pointer border ${
                        isCurrent
                          ? 'bg-emerald-50/70 border-emerald-300 ring-1 ring-emerald-200'
                          : 'bg-white hover:bg-gray-50 border-gray-200'
                      }`}
                    >
                      <div className="flex items-start gap-2.5">
                        <span className="w-7 h-7 rounded-lg bg-emerald-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                          {state.code}
                        </span>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-gray-900">{state.nameEn}</span>
                            <span className="text-[11px] text-gray-500 font-hindi">({state.nameHi})</span>
                          </div>
                          <p className="text-[10px] text-gray-500 mt-0.5">
                            {state.portalName} • Pilot: Lucknow, GB Nagar
                          </p>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-semibold tracking-wide shrink-0">
                        {isCurrent ? 'Current' : 'Select'}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Upcoming States Section */}
            {upcomingGroup.length > 0 && (
              <div>
                <div className="px-2 py-1 text-[10px] font-bold text-gray-500 uppercase tracking-wider flex items-center justify-between">
                  <span>Expanding Across India (Coming Soon)</span>
                  <span className="bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded text-[9px]">
                    {upcomingGroup.length} States / UTs
                  </span>
                </div>
                <div className="space-y-1 mt-1">
                  {upcomingGroup.map((state) => (
                    <button
                      key={state.code}
                      onClick={() => handleSelect(state.code)}
                      className="w-full p-2 rounded-lg text-left flex items-center justify-between hover:bg-gray-50 transition cursor-pointer group"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="w-6 h-6 rounded bg-gray-100 group-hover:bg-amber-100 text-gray-700 group-hover:text-amber-900 font-mono font-bold text-[10px] flex items-center justify-center shrink-0">
                          {state.code}
                        </span>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1 truncate">
                            <span className="text-xs font-medium text-gray-800 group-hover:text-[#0f2b5a]">
                              {state.nameEn}
                            </span>
                            <span className="text-[10px] text-gray-400 font-hindi truncate">
                              ({state.nameHi})
                            </span>
                          </div>
                          <p className="text-[10px] text-gray-400 truncate">
                            {state.portalName}
                          </p>
                        </div>
                      </div>
                      <span className="px-1.5 py-0.5 rounded bg-gray-100 group-hover:bg-amber-50 text-gray-500 group-hover:text-amber-800 text-[9px] font-medium shrink-0 ml-2">
                        Coming Soon
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {filteredStates.length === 0 && (
              <div className="p-6 text-center text-xs text-gray-500">
                No state or territory matched "{searchQuery}".
              </div>
            )}
          </div>

          {/* Footer Informational Strip */}
          <div className="p-2.5 bg-gray-50 border-t border-gray-200 text-[10px] text-gray-500 flex items-center justify-between">
            <span>Constitutional Seventh Schedule</span>
            <span className="font-semibold text-[#0f2b5a]">State Revenue Autonomy</span>
          </div>
        </div>
      )}
    </div>
  );
}
