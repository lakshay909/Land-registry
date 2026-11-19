import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { StateProvider } from './context/StateContext';
import { SUPPORTED_CHAIN_ID } from './config';
import StateSelector from './components/StateSelector';
import ComingSoonModal from './components/ComingSoonModal';
import PublicSearch from './pages/PublicSearch';
import CitizenDashboard from './pages/CitizenDashboard';
import AuthorityDashboard from './pages/AuthorityDashboard';
import Marketplace from './pages/Marketplace';

function NavLink({ to, children }) {
  const location = useLocation();
  const isActive = location.pathname === to;

  return (
    <Link
      to={to}
      className={`px-3.5 py-2 text-sm font-medium transition-all duration-150 flex items-center gap-1.5 ${
        isActive
          ? 'text-[#0f2b5a] border-b-2 border-[#0f2b5a] font-semibold'
          : 'text-gray-600 hover:text-[#0f2b5a] hover:bg-gray-50 rounded-md'
      }`}
    >
      {children}
    </Link>
  );
}

function Navbar() {
  const { account, role, isConnecting, networkError, connectWallet, disconnect, switchAccount, switchToSupportedNetwork } = useAuth();
  const [copied, setCopied] = useState(false);
  const isAuthority = role === 'AUTHORITY';

  const copyAddress = () => {
    if (account) {
      navigator.clipboard.writeText(account);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-white shadow-sm border-b-4 border-[#FF9933]">
      {/* Top Government Strip */}
      <div className="bg-gray-100 border-b border-gray-200 py-1.5 px-4 sm:px-6 lg:px-8 text-xs font-semibold text-gray-600 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span>भारत सरकार | GOVERNMENT OF INDIA</span>
          <span className="hidden sm:inline text-gray-400">•</span>
          <span className="hidden sm:inline">Ministry of Rural Development • Digital Land Records (DILRMP)</span>
        </div>
        <div className="flex items-center gap-2">
          <StateSelector />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex justify-between items-center">
        {/* Brand Logo & Title */}
        <div className="flex items-center space-x-6">
          <Link to="/" className="flex items-center gap-3.5 group">
            {/* Official Bhūmi Ledger National Seal */}
            <img 
              src="/bhumi_ledger_seal.png" 
              alt="National Digital Land Registry - Bhūmi Ledger Official Seal" 
              className="h-13 w-13 rounded-full object-contain shrink-0 drop-shadow-xs"
            />
            <div className="flex flex-col">
              <h1 className="text-xl font-bold text-[#0f2b5a] leading-tight">
                Department of Land Records
              </h1>
              <p className="text-xs font-medium text-gray-500">
                National Digital Land Registry
              </p>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center space-x-2 pl-6 border-l border-gray-200">
            <NavLink to="/">Public Search</NavLink>
            <NavLink to="/marketplace">Marketplace</NavLink>
            <NavLink to="/dashboard">Citizen Dashboard</NavLink>
            {isAuthority && (
              <NavLink to="/authority">Authority Approvals</NavLink>
            )}
          </nav>
        </div>

        {/* Right Section: Node Status, Role Badge, Login with Digital ID */}
        <div className="flex items-center space-x-3.5">
          {/* Network Switch Warning */}
          {networkError && (
            <button
              onClick={switchToSupportedNetwork}
              className="px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-300 text-xs font-semibold text-amber-900 hover:bg-amber-100 transition flex items-center gap-1.5"
              title={`Connect to Cadastral Ledger Cluster (Chain ID ${SUPPORTED_CHAIN_ID})`}
            >
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span>State Cluster Disconnected • Connect Node</span>
            </button>
          )}

          {/* Node Live Indicator */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-green-50 border border-green-200 text-xs font-semibold text-[#138808]">
            <span className="inline-flex h-2 w-2 rounded-full bg-[#138808]" />
            <span>NIC Blockchain Network Active</span>
          </div>

          {/* Role Badge */}
          {role && (
            <div className={`px-3 py-1 rounded-full text-xs font-semibold tracking-wide flex items-center gap-1.5 border shadow-xs ${
              isAuthority
                ? 'bg-blue-50 text-[#0f2b5a] border-blue-200'
                : 'bg-green-50 text-[#138808] border-green-200'
            }`}>
              {isAuthority ? (
                <>
                  <svg className="w-3.5 h-3.5 text-[#0f2b5a]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                  <span>Registrar Authority</span>
                </>
              ) : (
                <>
                  <svg className="w-3.5 h-3.5 text-[#138808]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="7" r="4" />
                    <path d="M5.5 21a8.5 8.5 0 0 1 13 0" />
                  </svg>
                  <span>Verified Citizen</span>
                </>
              )}
            </div>
          )}

          {/* Login / Digital ID Wallet Controls */}
          {account ? (
            <div className="flex items-center gap-2 bg-white border border-gray-200 p-1 rounded-lg shadow-xs">
              <button
                onClick={copyAddress}
                title="Click to copy full Digital ID address"
                className="flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-mono text-gray-700 hover:bg-gray-100 transition cursor-pointer"
              >
                <div className="w-2 h-2 rounded-full bg-[#138808]" />
                <span>{account.substring(0, 6)}...{account.substring(38)}</span>
                <span className="text-[10px] text-gray-400 ml-1">
                  {copied ? '✓' : '⧉'}
                </span>
              </button>
              <button
                onClick={switchAccount}
                className="text-xs text-[#0f2b5a] hover:text-blue-900 hover:bg-blue-50 px-2.5 py-1.5 rounded-md transition font-medium cursor-pointer border border-blue-200"
                title="Switch MetaMask Account"
              >
                Switch
              </button>
              <button
                onClick={disconnect}
                className="text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-2.5 py-1.5 rounded-md transition font-medium cursor-pointer"
                title="Logout"
              >
                Exit
              </button>
            </div>
          ) : (
            <button
              onClick={connectWallet}
              disabled={isConnecting}
              className="bg-[#0f2b5a] hover:bg-blue-900 active:bg-blue-950 disabled:opacity-60 text-white px-5 py-2.5 rounded-lg shadow-sm transition flex items-center gap-2 font-medium text-sm cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0f2b5a] focus-visible:ring-offset-2"
            >
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <span>{isConnecting ? 'Authenticating...' : 'Login with Digital ID'}</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

function Layout({ children }) {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-gray-800">
      <Navbar />

      <main className="flex-grow">
        {children}
      </main>

      <ComingSoonModal />

      {/* Institutional Indian Government Portal Footer */}
      <footer className="bg-gray-100 border-t border-gray-200 text-gray-600 py-10 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6 pb-8 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <img 
                src="/bhumi_ledger_seal.png" 
                alt="Department of Land Records Official Seal" 
                className="w-12 h-12 rounded-full object-contain shrink-0 shadow-xs"
              />
              <div>
                <p className="text-sm font-bold text-gray-800">
                  Department of Land Records, Government of India
                </p>
                <p className="text-xs text-gray-500">
                  National Digital Land Record Modernization Programme (DILRMP) • Public Title Service
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 text-xs">
              <span className="px-3 py-1 rounded-full bg-white border border-gray-200 text-gray-600 shadow-xs">
                Digital Deeds Verification
              </span>
              <span className="px-3 py-1 rounded-full bg-white border border-gray-200 text-gray-600 shadow-xs">
                Smart Escrow Settlement
              </span>
              <span className="px-3 py-1 rounded-full bg-white border border-gray-200 text-gray-600 shadow-xs">
                Revenue Department Certified
              </span>
            </div>
          </div>

          <div className="pt-6 flex flex-col sm:flex-row justify-between items-center text-xs text-gray-500 gap-4">
            <p>© {new Date().getFullYear()} Department of Land Records, Government of India. All rights reserved.</p>
            <div className="flex space-x-6 font-medium">
              <Link to="/" className="text-[#0f2b5a] hover:underline">Public Search</Link>
              <Link to="/marketplace" className="text-[#0f2b5a] hover:underline">Marketplace</Link>
              <a href="https://dilrmp.gov.in" target="_blank" rel="noreferrer" className="text-[#0f2b5a] hover:underline">DILRMP Guidelines</a>
              <a href="https://india.gov.in" target="_blank" rel="noreferrer" className="text-[#0f2b5a] hover:underline">india.gov.in</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function App() {
  const { role, account, handleAccountChange } = useAuth();
  const isAuthority = role === 'AUTHORITY';

  useEffect(() => {
    if (typeof window !== 'undefined' && window.ethereum && handleAccountChange) {
      window.ethereum.on('accountsChanged', handleAccountChange);
      return () => {
        window.ethereum.removeListener('accountsChanged', handleAccountChange);
      };
    }
  }, [handleAccountChange]);

  return (
    <StateProvider>
      <BrowserRouter>
        <Layout>
          <Routes>
          <Route path="/" element={<PublicSearch />} />
          <Route path="/marketplace" element={<Marketplace />} />
          
          {/* Citizen Routes */}
          <Route path="/dashboard" element={<CitizenDashboard />} />
          <Route path="/my-properties" element={<Navigate to="/dashboard" replace />} />
          
          {/* Authority Routes */}
          <Route 
            path="/authority" 
            element={
              isAuthority ? (
                <AuthorityDashboard />
              ) : (
                <div className="container mx-auto px-4 py-20 max-w-xl">
                  <div className="bg-white rounded-2xl p-8 text-center border border-gray-200 shadow-sm relative">
                    <img 
                      src="/bhumi_ledger_seal_hd.png" 
                      alt="Department of Land Records Official Seal" 
                      className="w-20 h-20 rounded-full object-contain mx-auto mb-4 drop-shadow-sm"
                    />
                    <h2 className="text-2xl font-bold text-[#0f2b5a] tracking-tight">
                      Restricted Authority Portal
                    </h2>
                    <p className="text-gray-600 mt-3 text-sm leading-relaxed">
                      This gateway is reserved exclusively for authorized Land Revenue Tehsildars & Municipal Registrars holding the on-chain <span className="text-gray-700 bg-gray-100 px-2 py-0.5 rounded border border-gray-200 font-semibold text-xs">Authorized Revenue Registrar Portal</span>.
                    </p>
                    <div className="mt-6 p-4 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-600">
                      {account ? (
                        <span>Connected ID <code className="text-[#0f2b5a] font-mono font-semibold">{account.substring(0, 10)}...</code> lacks registrar privileges.</span>
                      ) : (
                        <span>Please authenticate with an authorized registrar Digital ID to continue.</span>
                      )}
                    </div>
                    <div className="mt-6">
                      <Link to="/" className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#0f2b5a] hover:underline">
                        ← Return to Public Registry Search
                      </Link>
                    </div>
                  </div>
                </div>
              )
            } 
          />
          <Route path="/approvals" element={<Navigate to="/authority" replace />} />
          
          {/* Fallback */}
          <Route path="*" element={
            <div className="container mx-auto px-4 py-24 text-center">
              <h2 className="text-3xl font-extrabold text-[#0f2b5a]">404 — Record Not Found</h2>
              <p className="text-gray-600 mt-2 text-sm">The route or resource you requested does not exist on this portal.</p>
              <Link to="/" className="mt-6 inline-flex items-center gap-2 text-[#0f2b5a] font-semibold text-sm hover:underline">
                ← Back to Public Registry Search
              </Link>
            </div>
          } />
        </Routes>
      </Layout>
    </BrowserRouter>
  </StateProvider>
);
}

export default App;
