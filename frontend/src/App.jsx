import React from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

function Navbar() {
  const { account, role, isConnecting, connectWallet, disconnect } = useAuth();

  return (
    <nav className="bg-slate-900 text-white p-4 flex justify-between items-center shadow-md">
      <div className="flex items-center space-x-6">
        <Link to="/" className="text-xl font-bold tracking-tight">LandRegistry</Link>
        {role === 'CITIZEN' && (
          <Link to="/dashboard" className="text-slate-300 hover:text-white transition">My Dashboard</Link>
        )}
        {role === 'AUTHORITY' && (
          <Link to="/authority" className="text-slate-300 hover:text-white transition">Authority Panel</Link>
        )}
      </div>
      
      <div className="flex items-center space-x-4">
        {role && (
          <span className="px-3 py-1 bg-slate-800 rounded-full text-xs font-semibold uppercase tracking-wider text-slate-300 border border-slate-700">
            {role}
          </span>
        )}
        {account ? (
          <div className="flex items-center space-x-4">
            <span className="text-sm font-mono bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700">
              {account.substring(0, 6)}...{account.substring(38)}
            </span>
            <button 
              onClick={disconnect}
              className="text-sm text-rose-400 hover:text-rose-300 transition font-medium"
            >
              Disconnect
            </button>
          </div>
        ) : (
          <button 
            onClick={connectWallet}
            disabled={isConnecting}
            className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-5 py-2 rounded-lg font-medium transition shadow-sm"
          >
            {isConnecting ? 'Connecting...' : 'Connect Wallet'}
          </button>
        )}
      </div>
    </nav>
  );
}

function Layout({ children }) {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />
      <main className="flex-grow container mx-auto px-4 py-8 max-w-7xl">
        {children}
      </main>
      <footer className="bg-slate-900 text-slate-500 py-6 text-center text-sm">
        &copy; {new Date().getFullYear()} Tamper-Proof Land Registry
      </footer>
    </div>
  );
}

import PublicSearch from './pages/PublicSearch';

import CitizenDashboard from './pages/CitizenDashboard';

import AuthorityDashboard from './pages/AuthorityDashboard';

function App() {
  const { role } = useAuth();

  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<PublicSearch />} />
          
          {/* Conditional routes based on role */}
          {role === 'CITIZEN' && (
            <Route path="/dashboard" element={<CitizenDashboard />} />
          )}
          
          {role === 'AUTHORITY' && (
            <Route path="/authority" element={<AuthorityDashboard />} />
          )}
          
          {/* Fallback */}
          <Route path="*" element={
            <div className="text-center py-20">
              <h2 className="text-2xl font-bold text-slate-900">Page Not Found or Unauthorized</h2>
              <p className="text-slate-600 mt-2">Please check the URL or your wallet connection.</p>
            </div>
          } />
        </Routes>
      </Layout>
    </BrowserRouter>
  )
}

export default App;
