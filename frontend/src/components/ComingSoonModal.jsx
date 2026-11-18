import React, { useState } from 'react';
import { useCurrentState } from '../context/StateContext';

export default function ComingSoonModal() {
  const { comingSoonTarget, closeComingSoon } = useCurrentState();
  const [email, setEmail] = useState('');
  const [district, setDistrict] = useState('');
  const [consent, setConsent] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  if (!comingSoonTarget) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!email || !email.includes('@') || !email.includes('.')) {
      setError('Please provide a valid email address.');
      return;
    }

    if (!consent) {
      setError('Please provide consent for state launch notifications under the DPDP Act.');
      return;
    }

    // In non-custodial MVP mode, store lead in local storage or log safely without PII breach
    const existing = JSON.parse(localStorage.getItem('bhumi_state_interest') || '[]');
    existing.push({
      stateCode: comingSoonTarget.code,
      stateName: comingSoonTarget.nameEn,
      district: district.trim(),
      email: email.trim(),
      timestamp: new Date().toISOString()
    });
    localStorage.setItem('bhumi_state_interest', JSON.stringify(existing));

    setSubmitted(true);
  };

  const handleClose = () => {
    setEmail('');
    setDistrict('');
    setConsent(false);
    setSubmitted(false);
    setError('');
    closeComingSoon();
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-gray-900/50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-state-title"
    >
      <div className="relative bg-white rounded-2xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-gray-200">
        {/* Header Strip with Ashoka / Tricolor */}
        <div className="flex items-start justify-between pb-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-800 font-bold text-sm shrink-0">
              {comingSoonTarget.code}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 id="modal-state-title" className="text-lg font-bold text-[#0f2b5a]">
                  {comingSoonTarget.nameEn}
                </h3>
                <span className="text-xs text-gray-500 font-hindi">
                  ({comingSoonTarget.nameHi})
                </span>
              </div>
              <p className="text-xs text-amber-700 font-medium mt-0.5 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                Expanding Soon • Under Architecture Review
              </p>
            </div>
          </div>

          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition cursor-pointer"
            aria-label="Close modal"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Constitutional & Statutory Notice */}
        <div className="mt-4 p-3.5 bg-blue-50/70 border border-blue-200/60 rounded-xl text-xs text-blue-900 leading-relaxed">
          <p className="font-semibold text-[#0f2b5a] mb-1 flex items-center gap-1.5">
            <svg className="w-4 h-4 text-[#0f2b5a]" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            Constitutional Jurisdiction Notice (Entry 18, State List)
          </p>
          <span>
            Under the Seventh Schedule of the Constitution of India, land tenure, revenue codes, and deed registrations are governed exclusively by respective State Governments. Bhūmi Ledger is currently active in the <strong>Uttar Pradesh pilot zone</strong>.
          </span>
        </div>

        {/* State Specific Details */}
        <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
          <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
            <span className="text-gray-500 block mb-0.5">Target Land Portal</span>
            <span className="font-semibold text-gray-800">{comingSoonTarget.portalName}</span>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
            <span className="text-gray-500 block mb-0.5">Governing Code</span>
            <span className="font-semibold text-gray-800 line-clamp-1" title={comingSoonTarget.governingCode}>
              {comingSoonTarget.governingCode}
            </span>
          </div>
        </div>

        {/* Lead Capture or Success State */}
        {submitted ? (
          <div className="mt-5 p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-center">
            <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 mx-auto flex items-center justify-center font-bold text-sm mb-2">
              ✓
            </div>
            <h4 className="text-sm font-bold text-emerald-900">Notification Request Received</h4>
            <p className="text-xs text-emerald-700 mt-1">
              You will be notified once {comingSoonTarget.nameEn} land synchronization goes live.
            </p>
            <button
              onClick={handleClose}
              className="mt-4 px-4 py-2 bg-[#0f2b5a] text-white rounded-lg text-xs font-semibold hover:bg-blue-900 transition cursor-pointer"
            >
              Continue Exploring UP Pilot
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-5 space-y-3.5">
            <div>
              <label htmlFor="user-email" className="block text-xs font-semibold text-gray-700 mb-1">
                Notify me when {comingSoonTarget.nameEn} launches:
              </label>
              <input
                id="user-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="citizen@example.com"
                className="w-full px-3.5 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0f2b5a] focus:border-transparent"
                required
              />
            </div>

            <div>
              <label htmlFor="user-district" className="block text-xs font-semibold text-gray-700 mb-1">
                Your District / Tehsil (Optional):
              </label>
              <input
                id="user-district"
                type="text"
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                placeholder="e.g. Pune, Dehradun, Bengaluru"
                className="w-full px-3.5 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0f2b5a] focus:border-transparent"
              />
            </div>

            {/* DPDP Consent */}
            <div className="flex items-start gap-2 pt-1">
              <input
                id="dpdp-consent"
                type="checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                className="mt-0.5 h-3.5 w-3.5 rounded border-gray-300 text-[#0f2b5a] focus:ring-[#0f2b5a]"
              />
              <label htmlFor="dpdp-consent" className="text-[11px] text-gray-600 leading-snug">
                I consent to receiving state availability notifications under Section 6 of the DPDP Act, 2023. No commercial solicitation or sharing with third parties.
              </label>
            </div>

            {error && (
              <p className="text-xs text-rose-600 font-medium mt-1">{error}</p>
            )}

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 border border-gray-300 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-50 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-[#0f2b5a] hover:bg-blue-900 text-white rounded-lg text-xs font-semibold shadow-xs transition cursor-pointer"
              >
                Register Interest
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
