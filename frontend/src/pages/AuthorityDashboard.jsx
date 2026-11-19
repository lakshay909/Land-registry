import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Tab, Dialog } from '@headlessui/react';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../config';
import { ethers } from 'ethers';
import { parseContractError } from '../utils/contractErrors';

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

export default function AuthorityDashboard() {
  const { account, contract } = useAuth();

  // Core Queues & Datasets
  const [pendingProps, setPendingProps] = useState([]);
  const [pendingTransfers, setPendingTransfers] = useState([]);
  const [frozenProps, setFrozenProps] = useState([]);
  const [verifiedProps, setVerifiedProps] = useState([]);
  const [loading, setLoading] = useState(true);

  // Global Action Feedback & Processing Spinners
  const [actionStatus, setActionStatus] = useState(null); // { type: 'success' | 'error' | 'info', message: string }
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingId, setProcessingId] = useState(null);

  // Clipboard Helper
  const [copiedKey, setCopiedKey] = useState('');

  // Tab 1: Cadastral Registration Filter & Inspection Modal
  const [registrationSearch, setRegistrationSearch] = useState('');
  const [inspectingProp, setInspectingProp] = useState(null);

  // Tab 2: Conveyance Status Filter & Rejection Modal
  const [transferFilter, setTransferFilter] = useState('all'); // 'all' | 'ready' | 'pending_sig'
  const [rejectModalData, setRejectModalData] = useState(null); // { transferId, propertyId, hasEscrow, escrowEth, buyer }
  const [rejectReason, setRejectReason] = useState('');
  const [rejectError, setRejectError] = useState('');

  // Tab 3: Enjoin / Freeze Inspector State
  const [flagSearchId, setFlagSearchId] = useState('');
  const [searchedProperty, setSearchedProperty] = useState(null);
  const [flagReason, setFlagReason] = useState('');
  const [isSearchingProperty, setIsSearchingProperty] = useState(false);

  // Tab 4: Cadastral Survey & Georeferencing Queue State
  const [georefModalData, setGeorefModalData] = useState(null); // Property object to georeference
  const [georefUlpin, setGeorefUlpin] = useState('');
  const [georefNotes, setGeorefNotes] = useState('');
  const [georefError, setGeorefError] = useState('');
  const [isSubmittingGeoref, setIsSubmittingGeoref] = useState(false);

  const copyText = (text, key) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(''), 2000);
  };

  const fetchData = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const [pendingRes, transRes, frozenRes, verifiedRes] = await Promise.all([
        fetch(`${API_URL}/api/properties?status=pending`),
        fetch(`${API_URL}/api/transfers?status=pending`),
        fetch(`${API_URL}/api/properties?status=frozen`),
        fetch(`${API_URL}/api/properties?status=verified`)
      ]);

      if (pendingRes.ok) setPendingProps(await pendingRes.json());
      if (transRes.ok) setPendingTransfers(await transRes.json());
      if (frozenRes.ok) setFrozenProps(await frozenRes.json());
      if (verifiedRes.ok) setVerifiedProps(await verifiedRes.json());
    } catch (err) {
      console.error('Failed to query queues:', err);
      if (!isSilent) {
        setActionStatus({
          type: 'error',
          message: 'Unable to communicate with the registry indexer. Please verify network connectivity.'
        });
      }
    } finally {
      if (!isSilent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    let isCancelled = false;
    const runFetch = async () => {
      await fetchData(isCancelled);
    };
    runFetch();
    const interval = setInterval(() => {
      fetchData(true);
    }, 8000);
    return () => {
      isCancelled = true;
      clearInterval(interval);
    };
  }, [account, fetchData]);

  // Executive KPI Metrics Calculation
  const kpiMetrics = useMemo(() => {
    const pendingAudits = pendingProps.length;
    const pendingConveyances = pendingTransfers.length;

    const totalEscrowWei = pendingTransfers.reduce((acc, t) => {
      if (t.escrowAmount && t.escrowAmount !== '0') {
        try {
          return acc + BigInt(t.escrowAmount);
        } catch {
          return acc;
        }
      }
      return acc;
    }, 0n);
    const totalEscrowEth = ethers.formatEther(totalEscrowWei);

    const activeInjunctions = frozenProps.length;

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const startOfTodaySec = Math.floor(startOfToday.getTime() / 1000);

    const certifiedToday = verifiedProps.filter(p => {
      if (!p.registeredAt) return false;
      const regSec = Number(p.registeredAt);
      return regSec >= startOfTodaySec;
    }).length;

    return {
      pendingAudits,
      pendingConveyances,
      totalEscrowEth,
      activeInjunctions,
      certifiedToday
    };
  }, [pendingProps, pendingTransfers, frozenProps, verifiedProps]);

  // Tab 4: Georeferencing Queue (properties pending ULPIN)
  const georefQueue = useMemo(() => {
    const allCandidates = [...pendingProps, ...verifiedProps];
    const seenIds = new Set();
    const queue = [];
    for (const p of allCandidates) {
      if (!seenIds.has(p.propertyId)) {
        seenIds.add(p.propertyId);
        if (!p.ulpin || p.ulpin === 'PENDING_GEOREFERENCING') {
          queue.push(p);
        }
      }
    }
    return queue;
  }, [pendingProps, verifiedProps]);

  // Tab 1: Filtered Pending Registrations
  const filteredPendingProps = useMemo(() => {
    if (!registrationSearch.trim()) return pendingProps;
    const q = registrationSearch.toLowerCase().trim();
    return pendingProps.filter((prop) => {
      const idMatch = String(prop.propertyId || '').includes(q);
      const gataMatch = String(prop.gataCode || '').toLowerCase().includes(q);
      const khasraMatch = String(prop.khasraNumber || '').toLowerCase().includes(q);
      const ownerMatch = String(prop.currentOwner || '').toLowerCase().includes(q);
      const ulpinMatch = String(prop.ulpin || '').toLowerCase().includes(q);
      const locMatch = String(prop.locationHash || '').toLowerCase().includes(q);
      return idMatch || gataMatch || khasraMatch || ownerMatch || ulpinMatch || locMatch;
    });
  }, [pendingProps, registrationSearch]);

  // Tab 2: Filtered Transfers
  const filteredTransfers = useMemo(() => {
    if (transferFilter === 'ready') {
      return pendingTransfers.filter(tx => tx.fromSigned && tx.toSigned);
    }
    if (transferFilter === 'pending_sig') {
      return pendingTransfers.filter(tx => !tx.fromSigned || !tx.toSigned);
    }
    return pendingTransfers;
  }, [pendingTransfers, transferFilter]);

  // -------------------------------------------------------------------------
  // On-Chain Actions
  // -------------------------------------------------------------------------

  // 1. Verify Property
  const handleVerifyProperty = async (propertyId) => {
    if (!contract || isProcessing) return;
    setIsProcessing(true);
    setProcessingId(`verify-${propertyId}`);
    setActionStatus({
      type: 'info',
      message: `Awaiting MetaMask signature to certify Cadastral Parcel #${propertyId}...`
    });

    try {
      const tx = await contract.verifyRegistration(propertyId);
      setActionStatus({
        type: 'info',
        message: `Mining certification transaction for Parcel #${propertyId} on-chain...`
      });
      await tx.wait();
      setActionStatus({
        type: 'success',
        message: `Cadastral Parcel #${propertyId} has been successfully certified & verified on the blockchain.`
      });
      if (inspectingProp?.propertyId === propertyId) {
        setInspectingProp(null);
      }
      setTimeout(() => fetchData(true), 500);
    } catch (error) {
      console.error(error);
      setActionStatus({ type: 'error', message: parseContractError(error) });
    } finally {
      setIsProcessing(false);
      setProcessingId(null);
    }
  };

  // 2. Approve Transfer
  const handleApproveTransfer = async (transferId, hasEscrow, escrowAmount) => {
    if (!contract || isProcessing) return;
    setIsProcessing(true);
    setProcessingId(`approve-${transferId}`);
    setActionStatus({
      type: 'info',
      message: 'Awaiting MetaMask approval to authorize conveyance deed...'
    });

    try {
      const tx = await contract.approveTransfer(transferId);
      setActionStatus({
        type: 'info',
        message: hasEscrow
          ? `Authorizing conveyance & releasing ${escrowAmount} ETH escrow to seller...`
          : 'Authorizing conveyance on-chain...'
      });
      await tx.wait();
      setActionStatus({
        type: 'success',
        message: `Conveyance #${transferId} approved successfully.${hasEscrow ? ` ${escrowAmount} ETH released to seller.` : ''}`
      });
      setTimeout(() => fetchData(true), 500);
    } catch (error) {
      console.error(error);
      setActionStatus({ type: 'error', message: parseContractError(error) });
    } finally {
      setIsProcessing(false);
      setProcessingId(null);
    }
  };

  // 3. Reject Transfer (with Statutory Justification)
  const openRejectModal = (transfer) => {
    const hasEscrow = transfer.escrowAmount && transfer.escrowAmount !== '0';
    const escrowEth = hasEscrow ? ethers.formatEther(transfer.escrowAmount) : '0';
    setRejectModalData({
      transferId: transfer.transferId,
      propertyId: transfer.propertyId,
      hasEscrow,
      escrowEth,
      buyer: transfer.toAddress
    });
    setRejectReason('Title deed document discrepancy or illegible scan');
    setRejectError('');
  };

  const handleConfirmRejection = async (e) => {
    e.preventDefault();
    if (!rejectModalData || !contract || isProcessing) return;

    if (!rejectReason.trim() || rejectReason.trim().length < 5) {
      setRejectError('Please provide a substantive justification reason (minimum 5 characters).');
      return;
    }

    setIsProcessing(true);
    setProcessingId(`reject-${rejectModalData.transferId}`);
    setRejectError('');

    try {
      const tx = await contract.rejectTransfer(rejectModalData.transferId, rejectReason.trim());
      const currentModal = rejectModalData;
      setRejectModalData(null);
      setActionStatus({
        type: 'info',
        message: currentModal.hasEscrow
          ? `Rejecting transfer on-chain and returning ${currentModal.escrowEth} ETH to buyer...`
          : 'Rejecting transfer on-chain...'
      });
      await tx.wait();
      setActionStatus({
        type: 'success',
        message: `Transfer #${currentModal.transferId} rejected.${currentModal.hasEscrow ? ` ${currentModal.escrowEth} ETH refunded to buyer.` : ''}`
      });
      setTimeout(() => fetchData(true), 500);
    } catch (error) {
      console.error(error);
      setRejectError(parseContractError(error));
      setActionStatus({ type: 'error', message: parseContractError(error) });
    } finally {
      setIsProcessing(false);
      setProcessingId(null);
    }
  };

  // 4. Finalize Transfer Title Mutation
  const handleExecuteTransfer = async (transferId) => {
    if (!contract || isProcessing) return;
    setIsProcessing(true);
    setProcessingId(`execute-${transferId}`);
    setActionStatus({
      type: 'info',
      message: 'Awaiting MetaMask confirmation to finalize deed title mutation...'
    });

    try {
      const tx = await contract.executeTransfer(transferId);
      setActionStatus({ type: 'info', message: 'Finalizing title reassignment on-chain...' });
      await tx.wait();
      setActionStatus({
        type: 'success',
        message: 'Title mutation settled permanently on the blockchain!'
      });
      setTimeout(() => fetchData(true), 500);
    } catch (error) {
      console.error(error);
      setActionStatus({ type: 'error', message: parseContractError(error) });
    } finally {
      setIsProcessing(false);
      setProcessingId(null);
    }
  };

  // 5. Search Single Property for Enjoin / Freeze Inspector
  const handleSearchProperty = async (e) => {
    e.preventDefault();
    if (!flagSearchId || isSearchingProperty) return;
    setIsSearchingProperty(true);
    setActionStatus(null);
    try {
      const res = await fetch(`${API_URL}/api/properties/${flagSearchId}`);
      if (res.ok) {
        setSearchedProperty(await res.json());
        setFlagReason('');
      } else {
        setSearchedProperty(null);
        setActionStatus({
          type: 'error',
          message: `Cadastral Parcel #${flagSearchId} was not found on this registry.`
        });
      }
    } catch (err) {
      console.error(err);
      setActionStatus({ type: 'error', message: 'Failed to query property status from ledger indexer.' });
    } finally {
      setIsSearchingProperty(false);
    }
  };

  // 6. Freeze / Unfreeze Property (from Inspector or Sub-Section A)
  const handleToggleFlag = async (e) => {
    e.preventDefault();
    if (!searchedProperty || !contract || isProcessing) return;
    const isCurrentlyFrozen = searchedProperty.isFrozen;

    if (!isCurrentlyFrozen && (!flagReason.trim() || flagReason.trim().length < 5)) {
      setActionStatus({
        type: 'error',
        message: 'A formal judicial order or legal reference (minimum 5 characters) is required to freeze a property.'
      });
      return;
    }

    setIsProcessing(true);
    setProcessingId(`flag-${searchedProperty.propertyId}`);
    setActionStatus({
      type: 'info',
      message: `Awaiting MetaMask authorization to ${isCurrentlyFrozen ? 'lift title freeze' : 'place judicial freeze'}...`
    });

    try {
      const tx = isCurrentlyFrozen
        ? await contract.unflagProperty(searchedProperty.propertyId)
        : await contract.flagProperty(searchedProperty.propertyId, flagReason.trim());

      setActionStatus({
        type: 'info',
        message: isCurrentlyFrozen ? 'Unfreezing parcel title on-chain...' : 'Placing judicial freeze on parcel...'
      });
      await tx.wait();

      setActionStatus({
        type: 'success',
        message: `Cadastral Parcel #${searchedProperty.propertyId} successfully ${isCurrentlyFrozen ? 'restored to active circulation' : 'frozen under judicial order'}.`
      });

      const res = await fetch(`${API_URL}/api/properties/${searchedProperty.propertyId}`);
      if (res.ok) {
        setSearchedProperty(await res.json());
        setFlagReason('');
      }
      setTimeout(() => fetchData(true), 500);
    } catch (error) {
      console.error(error);
      setActionStatus({ type: 'error', message: parseContractError(error) });
    } finally {
      setIsProcessing(false);
      setProcessingId(null);
    }
  };

  // 7. Direct Lift Injunction (from Sub-Section A Table)
  const handleDirectUnflag = async (propertyId) => {
    if (!contract || isProcessing) return;
    setIsProcessing(true);
    setProcessingId(`unflag-${propertyId}`);
    setActionStatus({
      type: 'info',
      message: `Awaiting MetaMask authorization to lift injunction on Parcel #${propertyId}...`
    });

    try {
      const tx = await contract.unflagProperty(propertyId);
      setActionStatus({
        type: 'info',
        message: `Lifting judicial injunction on Parcel #${propertyId} on-chain...`
      });
      await tx.wait();

      setActionStatus({
        type: 'success',
        message: `Judicial injunction on Parcel #${propertyId} successfully lifted. Title restored to active commercial circulation.`
      });

      if (searchedProperty?.propertyId === propertyId) {
        const res = await fetch(`${API_URL}/api/properties/${propertyId}`);
        if (res.ok) setSearchedProperty(await res.json());
      }
      setTimeout(() => fetchData(true), 500);
    } catch (error) {
      console.error(error);
      setActionStatus({ type: 'error', message: parseContractError(error) });
    } finally {
      setIsProcessing(false);
      setProcessingId(null);
    }
  };

  // 8. Assign Certified ULPIN (Tab 4)
  const openGeorefModal = (prop) => {
    setGeorefModalData(prop);
    setGeorefUlpin('');
    setGeorefNotes('');
    setGeorefError('');
  };

  const handleAssignUlpin = async (e) => {
    e.preventDefault();
    if (!georefModalData || isSubmittingGeoref) return;

    const cleanUlpin = georefUlpin.trim().toUpperCase();
    const ulpinRegex = /^[A-Z0-9]{14}$/;

    if (!ulpinRegex.test(cleanUlpin)) {
      setGeorefError('Invalid ULPIN format: Must be exactly 14 uppercase alphanumeric characters (e.g. UP09LK41200001).');
      return;
    }

    setIsSubmittingGeoref(true);
    setGeorefError('');
    setActionStatus({
      type: 'info',
      message: `Registering certified ULPIN ${cleanUlpin} for Parcel #${georefModalData.propertyId}...`
    });

    try {
      const res = await fetch(`${API_URL}/api/properties/${georefModalData.propertyId}/georeference`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-user-address': account || ''
        },
        body: JSON.stringify({
          ulpin: cleanUlpin,
          notes: georefNotes.trim()
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to record georeferenced ULPIN.');
      }

      setActionStatus({
        type: 'success',
        message: `Cadastral ULPIN ${cleanUlpin} successfully assigned to Parcel #${georefModalData.propertyId}.`
      });

      setGeorefModalData(null);
      setGeorefUlpin('');
      setGeorefNotes('');
      setTimeout(() => fetchData(true), 500);
    } catch (err) {
      console.error('Error assigning ULPIN:', err);
      setGeorefError(err.message || 'Failed to record georeferencing.');
      setActionStatus({
        type: 'error',
        message: err.message || 'Failed to record georeferencing.'
      });
    } finally {
      setIsSubmittingGeoref(false);
    }
  };

  const reasonPresets = [
    'Title deed document discrepancy or illegible scan',
    'Cadastral boundary dispute / survey area mismatch',
    'Judicial caveat or ongoing court litigation',
    'Signature verification mismatch or expired agreement'
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* 1. Official NIC Sub-Registrar Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 border-b border-gray-200 pb-6">
        <div className="flex items-start gap-4">
          <img
            src="/bhumi_ledger_seal.png"
            alt="National Digital Land Registry - Official Seal"
            className="w-16 h-16 rounded-full object-contain shrink-0 drop-shadow-xs hidden sm:block"
          />
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-[#0f2b5a] text-xs font-semibold uppercase tracking-wider mb-2">
              <span className="w-2 h-2 rounded-full bg-[#138808]" />
              <span>Office of the Sub-Registrar / Land Revenue Tehsildar</span>
              <span>•</span>
              <span className="font-semibold">Authorized Revenue Registrar Portal</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0f2b5a] tracking-tight">
              Cadastral Audit & Revenue Title Adjudication
            </h1>
            <p className="text-gray-600 mt-1 text-xs sm:text-sm max-w-2xl leading-relaxed">
              Administrative gateway for statutory deed certification, escrow disbursement, judicial title injunctions, and certified Bhu-Aadhaar ULPIN georeferencing.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          {account && (
            <div className="hidden lg:flex flex-col items-end text-right">
              <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Connected Registrar</span>
              <span className="font-mono text-xs text-[#0f2b5a] font-semibold">
                {account.substring(0, 8)}...{account.substring(36)}
              </span>
            </div>
          )}
          <button
            onClick={() => fetchData(false)}
            disabled={loading || isProcessing}
            className="group px-4 py-2.5 text-xs font-bold uppercase tracking-wider bg-white border border-gray-300 hover:border-[#0f2b5a] rounded-lg text-gray-700 hover:text-[#0f2b5a] transition flex items-center gap-2 cursor-pointer shadow-xs shrink-0 disabled:opacity-50"
            title="Force refresh of all revenue and transfer queues"
          >
            <svg
              className={`w-3.5 h-3.5 text-gray-500 group-hover:text-[#0f2b5a] ${loading ? 'animate-spin' : ''}`}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>Refresh Queues</span>
          </button>
        </div>
      </div>

      {/* 2. Executive KPI Cards Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Pending Cadastral Audits */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-xs flex flex-col justify-between border-l-4 border-l-[#0f2b5a]">
          <div className="flex items-center justify-between text-gray-500 text-xs font-semibold uppercase tracking-wider">
            <span>Pending Cadastral Audits</span>
            <span className="w-6 h-6 rounded-md bg-blue-50 text-[#0f2b5a] flex items-center justify-center font-bold">1</span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-[#0f2b5a] font-mono">
              {kpiMetrics.pendingAudits}
            </span>
            <span className="text-xs text-gray-500">Parcels Awaiting Review</span>
          </div>
          <p className="mt-2 text-[11px] text-gray-500">
            Initial title deed and boundary verification queue
          </p>
        </div>

        {/* Card 2: Pending Conveyances & Escrow Volume */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-xs flex flex-col justify-between border-l-4 border-l-[#138808]">
          <div className="flex items-center justify-between text-gray-500 text-xs font-semibold uppercase tracking-wider">
            <span>Conveyances & Escrow</span>
            <span className="w-6 h-6 rounded-md bg-green-50 text-[#138808] flex items-center justify-center font-bold">2</span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-[#138808] font-mono">
              {kpiMetrics.totalEscrowEth} <span className="text-sm font-sans font-bold">ETH</span>
            </span>
            <span className="text-xs text-gray-500">Locked</span>
          </div>
          <p className="mt-2 text-[11px] text-gray-500">
            {kpiMetrics.pendingConveyances} pending conveyances awaiting release
          </p>
        </div>

        {/* Card 3: Active Disputed / Enjoined Titles */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-xs flex flex-col justify-between border-l-4 border-l-red-600">
          <div className="flex items-center justify-between text-gray-500 text-xs font-semibold uppercase tracking-wider">
            <span>Active Enjunctions</span>
            <span className="w-6 h-6 rounded-md bg-red-50 text-red-600 flex items-center justify-center font-bold">3</span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-red-600 font-mono">
              {kpiMetrics.activeInjunctions}
            </span>
            <span className="text-xs text-gray-500">Titles Frozen</span>
          </div>
          <p className="mt-2 text-[11px] text-gray-500">
            Judicial court stay orders and caveat injunctions
          </p>
        </div>

        {/* Card 4: Today's Certified Mutations Count */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-xs flex flex-col justify-between border-l-4 border-l-[#FF9933]">
          <div className="flex items-center justify-between text-gray-500 text-xs font-semibold uppercase tracking-wider">
            <span>Today's Certified Titles</span>
            <span className="w-6 h-6 rounded-md bg-amber-50 text-amber-700 flex items-center justify-center font-bold">4</span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-[#0f2b5a] font-mono">
              {kpiMetrics.certifiedToday}
            </span>
            <span className="text-xs text-gray-500">Mutations Today</span>
          </div>
          <p className="mt-2 text-[11px] text-gray-500">
            {verifiedProps.length} total active certified titles on ledger
          </p>
        </div>
      </div>

      {/* Global Action Status Alert */}
      {actionStatus && (
        <div
          className={`p-4 rounded-lg text-xs sm:text-sm font-medium border flex items-start justify-between gap-3 shadow-xs ${
            actionStatus.type === 'error'
              ? 'bg-red-50 text-red-800 border-red-200'
              : actionStatus.type === 'success'
              ? 'bg-green-50 text-[#138808] border-green-200'
              : 'bg-blue-50 text-[#0f2b5a] border-blue-200'
          }`}
        >
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
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
            )}
            <span className="leading-snug">{actionStatus.message}</span>
          </div>
          <button
            onClick={() => setActionStatus(null)}
            className="text-gray-400 hover:text-gray-700 transition p-0.5 rounded cursor-pointer"
            title="Dismiss notice"
          >
            <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      )}

      {/* 3. Primary Navigation Tabs */}
      <Tab.Group>
        <Tab.List className="flex flex-wrap gap-2 sm:gap-6 border-b border-gray-200 bg-transparent p-0 max-w-full">
          <Tab
            className={({ selected }) =>
              classNames(
                'pb-3 text-xs uppercase tracking-wider transition-all cursor-pointer focus:outline-none flex items-center',
                selected
                  ? 'border-b-2 border-[#0f2b5a] text-[#0f2b5a] font-bold'
                  : 'text-gray-500 hover:text-gray-700 border-b-2 border-transparent font-semibold'
              )
            }
          >
            Pending Registrations
            {pendingProps.length > 0 && (
              <span className="ml-2 bg-blue-50 text-[#0f2b5a] border border-blue-200 px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold">
                {pendingProps.length}
              </span>
            )}
          </Tab>

          <Tab
            className={({ selected }) =>
              classNames(
                'pb-3 text-xs uppercase tracking-wider transition-all cursor-pointer focus:outline-none flex items-center',
                selected
                  ? 'border-b-2 border-[#0f2b5a] text-[#0f2b5a] font-bold'
                  : 'text-gray-500 hover:text-gray-700 border-b-2 border-transparent font-semibold'
              )
            }
          >
            Pending Transfers & Escrow
            {pendingTransfers.length > 0 && (
              <span className="ml-2 bg-blue-50 text-[#0f2b5a] border border-blue-200 px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold">
                {pendingTransfers.length}
              </span>
            )}
          </Tab>

          <Tab
            className={({ selected }) =>
              classNames(
                'pb-3 text-xs uppercase tracking-wider transition-all cursor-pointer focus:outline-none flex items-center',
                selected
                  ? 'border-b-2 border-[#0f2b5a] text-[#0f2b5a] font-bold'
                  : 'text-gray-500 hover:text-gray-700 border-b-2 border-transparent font-semibold'
              )
            }
          >
            Disputed Titles & Injunctions
            {frozenProps.length > 0 && (
              <span className="ml-2 bg-red-50 text-red-700 border border-red-200 px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold">
                {frozenProps.length}
              </span>
            )}
          </Tab>

          <Tab
            className={({ selected }) =>
              classNames(
                'pb-3 text-xs uppercase tracking-wider transition-all cursor-pointer focus:outline-none flex items-center',
                selected
                  ? 'border-b-2 border-[#0f2b5a] text-[#0f2b5a] font-bold'
                  : 'text-gray-500 hover:text-gray-700 border-b-2 border-transparent font-semibold'
              )
            }
          >
            Cadastral Survey & Georeferencing
            {georefQueue.length > 0 && (
              <span className="ml-2 bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold">
                {georefQueue.length}
              </span>
            )}
          </Tab>
        </Tab.List>

        <Tab.Panels className="mt-4">
          {/* ================================================================= */}
          {/* TAB 1: Pending Registrations (Blueprint §4.1)                     */}
          {/* ================================================================= */}
          <Tab.Panel className="bg-white border border-gray-200 rounded-xl p-6 shadow-xs focus:outline-none space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h2 className="text-lg font-bold text-[#0f2b5a]">Properties Awaiting Cadastral Certification</h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Verify ingested revenue deeds against land records before authorizing official on-chain title creation.
                </p>
              </div>

              {/* Search & Filter Bar */}
              <div className="w-full md:w-80">
                <div className="relative">
                  <input
                    type="text"
                    value={registrationSearch}
                    onChange={(e) => setRegistrationSearch(e.target.value)}
                    placeholder="Filter by Gata, Khasra, Owner, or ID..."
                    className="w-full pl-8 pr-4 py-2 rounded-lg bg-gray-50 border border-gray-300 text-gray-900 text-xs focus:bg-white focus:border-[#0f2b5a] focus:ring-1 focus:ring-[#0f2b5a] outline-none transition placeholder:text-gray-400"
                  />
                  <svg
                    className="w-4 h-4 text-gray-400 absolute left-2.5 top-2.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  {registrationSearch && (
                    <button
                      onClick={() => setRegistrationSearch('')}
                      className="absolute right-2.5 top-2.5 text-gray-400 hover:text-gray-600 text-xs"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
            </div>

            {loading ? (
              <div className="text-gray-500 text-sm py-16 text-center flex flex-col items-center justify-center gap-3">
                <svg className="animate-spin h-7 w-7 text-[#0f2b5a]" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                <span>Loading cadastral audit queue from ledger...</span>
              </div>
            ) : filteredPendingProps.length === 0 ? (
              <div className="border border-dashed border-gray-300 rounded-xl bg-gray-50 p-10 text-center">
                <div className="w-12 h-12 rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center mx-auto mb-3 text-gray-500">
                  <svg className="w-6 h-6 text-[#138808]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-base font-semibold text-gray-900">
                  {registrationSearch ? 'No Matching Registrations Found' : 'No Registrations Pending Inspection'}
                </h3>
                <p className="text-xs text-gray-600 mt-1 max-w-sm mx-auto">
                  {registrationSearch
                    ? 'Try clearing the search query or filtering by another attribute.'
                    : 'All submitted land parcels have been audited and certified by the administrative registrar.'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredPendingProps.map((prop) => {
                  const isCurrentVerifying = processingId === `verify-${prop.propertyId}`;
                  const isGeoreferenced = prop.ulpin && prop.ulpin !== 'PENDING_GEOREFERENCING';

                  return (
                    <div
                      key={prop.propertyId}
                      className="bg-white border border-gray-200 hover:border-gray-300 rounded-xl p-5 shadow-xs flex flex-col justify-between transition space-y-4"
                    >
                      <div>
                        {/* Header Tags */}
                        <div className="flex justify-between items-start gap-2 mb-3">
                          <span className="font-bold font-mono text-gray-800 text-xs bg-gray-100 px-2.5 py-1 rounded-md border border-gray-200">
                            PARCEL #{prop.propertyId}
                          </span>
                          <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                            Pending Cadastral Audit
                          </span>
                        </div>

                        {/* Revenue Extraction Left-Joined Fields */}
                        <div className="grid grid-cols-2 gap-2 mb-3 p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-xs">
                          <div>
                            <span className="text-[10px] uppercase font-bold text-gray-500 block">Gata Code</span>
                            <span className="font-mono font-semibold text-gray-900 truncate block" title={prop.gataCode || 'N/A'}>
                              {prop.gataCode || 'N/A'}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] uppercase font-bold text-gray-500 block">Khasra No.</span>
                            <span className="font-mono font-semibold text-gray-900 truncate block" title={prop.khasraNumber || 'N/A'}>
                              {prop.khasraNumber || 'N/A'}
                            </span>
                          </div>
                        </div>

                        {/* ULPIN Georeference Badge */}
                        <div className="mb-3">
                          {isGeoreferenced ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-green-50 border border-green-200 text-[#138808] text-[11px] font-mono font-semibold">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#138808]" />
                              <span>Georeferenced: {prop.ulpin}</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-semibold">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                              <span>Pending Georeferencing</span>
                            </span>
                          )}
                        </div>

                        {/* Applicant & Parcel Details */}
                        <div className="space-y-2 text-xs text-gray-700">
                          <div>
                            <div className="flex justify-between items-center text-gray-500 mb-1">
                              <span>Applicant Owner:</span>
                              <button
                                onClick={() => copyText(prop.currentOwner, `owner-${prop.propertyId}`)}
                                className="text-[10px] text-[#0f2b5a] hover:underline transition cursor-pointer font-medium"
                              >
                                {copiedKey === `owner-${prop.propertyId}` ? 'Copied ✓' : 'Copy'}
                              </button>
                            </div>
                            <p className="font-mono text-[11px] truncate bg-gray-50 p-1.5 rounded border border-gray-200 text-gray-700 select-all">
                              {prop.currentOwner}
                            </p>
                          </div>

                          <div className="flex justify-between items-center bg-gray-50 p-2 rounded border border-gray-200 text-gray-800">
                            <span className="text-gray-500">Demarcated Area:</span>
                            <span className="font-bold text-gray-900 font-mono">{prop.area} sq.m</span>
                          </div>

                          <div>
                            <span className="text-gray-500 block mb-0.5">Cadastral Bounds GIS Ref:</span>
                            <p className="font-mono text-[10px] truncate bg-gray-50 p-1.5 rounded border border-gray-200 text-gray-700 select-all">
                              {prop.locationHash}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="pt-3 border-t border-gray-100 flex items-center gap-2">
                        <button
                          onClick={() => setInspectingProp(prop)}
                          className="flex-1 bg-white hover:bg-gray-50 border border-gray-300 text-gray-700 font-semibold py-2 px-3 rounded-lg transition text-xs cursor-pointer shadow-xs text-center"
                          title="Inspect deed document and extracted revenue attributes"
                        >
                          Inspect Deed
                        </button>

                        <button
                          onClick={() => handleVerifyProperty(prop.propertyId)}
                          disabled={isProcessing}
                          className="flex-1 bg-[#138808] hover:bg-green-800 disabled:opacity-50 text-white font-semibold py-2 px-3 rounded-lg transition text-xs uppercase tracking-wider shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                          title="Certify parcel on blockchain"
                        >
                          {isCurrentVerifying ? (
                            <>
                              <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                              </svg>
                              <span>Mining...</span>
                            </>
                          ) : (
                            <>
                              <svg className="w-3.5 h-3.5 text-white" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                              <span>Certify</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Tab.Panel>

          {/* ================================================================= */}
          {/* TAB 2: Pending Transfers & Escrow (Blueprint §4.2)                */}
          {/* ================================================================= */}
          <Tab.Panel className="bg-white border border-gray-200 rounded-xl p-6 shadow-xs focus:outline-none space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h2 className="text-lg font-bold text-[#0f2b5a]">Conveyance Requests Awaiting Authority Adjudication</h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Review bilateral EIP-712 deed signatures and escrow vaults. Approving releases smart contract escrow directly to the seller.
                </p>
              </div>

              {/* Status Filter Pills */}
              <div className="inline-flex rounded-lg border border-gray-200 bg-gray-50 p-1 text-xs">
                <button
                  onClick={() => setTransferFilter('all')}
                  className={`px-3 py-1.5 rounded-md font-medium transition cursor-pointer ${
                    transferFilter === 'all'
                      ? 'bg-white text-[#0f2b5a] shadow-xs font-semibold'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  All ({pendingTransfers.length})
                </button>
                <button
                  onClick={() => setTransferFilter('ready')}
                  className={`px-3 py-1.5 rounded-md font-medium transition cursor-pointer ${
                    transferFilter === 'ready'
                      ? 'bg-white text-[#138808] shadow-xs font-semibold'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Dual-Signed Ready ({pendingTransfers.filter(t => t.fromSigned && t.toSigned).length})
                </button>
                <button
                  onClick={() => setTransferFilter('pending_sig')}
                  className={`px-3 py-1.5 rounded-md font-medium transition cursor-pointer ${
                    transferFilter === 'pending_sig'
                      ? 'bg-white text-amber-800 shadow-xs font-semibold'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Awaiting Signatures ({pendingTransfers.filter(t => !t.fromSigned || !t.toSigned).length})
                </button>
              </div>
            </div>

            {loading ? (
              <div className="text-gray-500 text-sm py-16 text-center flex flex-col items-center justify-center gap-3">
                <svg className="animate-spin h-7 w-7 text-[#0f2b5a]" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                <span>Loading conveyance queue from ledger...</span>
              </div>
            ) : filteredTransfers.length === 0 ? (
              <div className="border border-dashed border-gray-300 rounded-xl bg-gray-50 p-10 text-center">
                <div className="w-12 h-12 rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center mx-auto mb-3 text-gray-500">
                  <svg className="w-6 h-6 text-[#138808]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-base font-semibold text-gray-900">No Conveyances Pending in Selected Filter</h3>
                <p className="text-xs text-gray-600 mt-1 max-w-sm mx-auto">
                  There are no land transfers currently matching the active filter criteria.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto -mx-2 sm:mx-0">
                <table className="w-full text-left border-collapse min-w-[750px]">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      <th className="py-3 px-4">Transfer / Parcel ID</th>
                      <th className="py-3 px-4">Parties (Buyer & Seller)</th>
                      <th className="py-3 px-4">Escrow Deposit</th>
                      <th className="py-3 px-4">Dual EIP-712 Signatures</th>
                      <th className="py-3 px-4">Authority Status</th>
                      <th className="py-3 px-4 text-right">Adjudication Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 text-xs text-gray-800">
                    {filteredTransfers.map((tx) => {
                      const signaturesReady = tx.fromSigned && tx.toSigned;
                      const hasEscrow = tx.escrowAmount && tx.escrowAmount !== '0';
                      const escrowEth = hasEscrow ? ethers.formatEther(tx.escrowAmount) : '0';
                      const isApproving = processingId === `approve-${tx.transferId}`;
                      const isExecuting = processingId === `execute-${tx.transferId}`;

                      return (
                        <tr key={tx.transferId} className="hover:bg-gray-50/80 transition">
                          <td className="py-3.5 px-4">
                            <span className="font-mono font-bold text-gray-900 block">Transfer #{tx.transferId}</span>
                            <span className="text-[11px] text-gray-500 font-medium">Parcel #{tx.propertyId}</span>
                          </td>

                          <td className="py-3.5 px-4 space-y-1">
                            <div className="flex items-center gap-1.5 text-[11px]">
                              <span className="text-gray-400 font-semibold w-10">Seller:</span>
                              <code className="font-mono text-gray-700 bg-gray-100 px-1.5 py-0.5 rounded">
                                {tx.fromAddress ? `${tx.fromAddress.substring(0, 6)}...${tx.fromAddress.substring(38)}` : 'N/A'}
                              </code>
                            </div>
                            <div className="flex items-center gap-1.5 text-[11px]">
                              <span className="text-gray-400 font-semibold w-10">Buyer:</span>
                              <code className="font-mono text-gray-700 bg-gray-100 px-1.5 py-0.5 rounded">
                                {tx.toAddress ? `${tx.toAddress.substring(0, 6)}...${tx.toAddress.substring(38)}` : 'N/A'}
                              </code>
                            </div>
                          </td>

                          <td className="py-3.5 px-4">
                            {hasEscrow ? (
                              <span className="font-mono font-semibold text-xs text-[#138808] bg-green-50 px-2.5 py-1 rounded-full border border-green-200 inline-flex items-center gap-1.5">
                                <svg className="w-3.5 h-3.5 text-[#138808]" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                                </svg>
                                <span>{escrowEth} ETH Locked in Vault</span>
                              </span>
                            ) : (
                              <span className="text-xs text-gray-500 font-mono">Direct (0 ETH)</span>
                            )}
                          </td>

                          <td className="py-3.5 px-4">
                            {signaturesReady ? (
                              <span className="text-[#138808] font-semibold flex items-center gap-1.5 text-xs">
                                <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                                <span>Dual-Signed (Seller & Buyer)</span>
                              </span>
                            ) : (
                              <div className="space-y-0.5">
                                <div className="flex items-center gap-1 text-[11px]">
                                  <span className={`w-1.5 h-1.5 rounded-full ${tx.fromSigned ? 'bg-[#138808]' : 'bg-amber-500'}`} />
                                  <span className={tx.fromSigned ? 'text-[#138808]' : 'text-amber-700'}>
                                    Seller: {tx.fromSigned ? 'Signed' : 'Pending'}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1 text-[11px]">
                                  <span className={`w-1.5 h-1.5 rounded-full ${tx.toSigned ? 'bg-[#138808]' : 'bg-amber-500'}`} />
                                  <span className={tx.toSigned ? 'text-[#138808]' : 'text-amber-700'}>
                                    Buyer: {tx.toSigned ? 'Signed' : 'Pending'}
                                  </span>
                                </div>
                              </div>
                            )}
                          </td>

                          <td className="py-3.5 px-4">
                            {tx.authorityApproved ? (
                              <span className="text-[#138808] font-semibold text-xs inline-flex items-center gap-1">
                                <span>✓</span> Approved
                              </span>
                            ) : (
                              <span className="text-amber-700 font-medium text-xs">Pending Review</span>
                            )}
                          </td>

                          <td className="py-3.5 px-4 text-right space-x-2">
                            {signaturesReady && !tx.authorityApproved && (
                              <>
                                <button
                                  onClick={() => handleApproveTransfer(tx.transferId, hasEscrow, escrowEth)}
                                  disabled={isProcessing}
                                  className="bg-[#138808] hover:bg-green-800 disabled:opacity-50 text-white px-3 py-1.5 rounded-md text-xs font-semibold uppercase tracking-wider transition shadow-xs cursor-pointer inline-flex items-center gap-1.5"
                                  title="Authorizes transfer and disburses escrow to seller"
                                >
                                  {isApproving && (
                                    <svg className="animate-spin h-3 w-3 text-white" fill="none" viewBox="0 0 24 24">
                                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                                    </svg>
                                  )}
                                  <span>{hasEscrow ? `Approve & Release ${escrowEth} ETH` : 'Approve Transfer'}</span>
                                </button>

                                <button
                                  onClick={() => openRejectModal(tx)}
                                  disabled={isProcessing}
                                  className="bg-white hover:bg-red-50 border border-red-300 text-red-700 disabled:opacity-50 px-3 py-1.5 rounded-md text-xs font-semibold uppercase tracking-wider transition cursor-pointer inline-flex items-center gap-1"
                                  title="Reject conveyance and return escrow to buyer"
                                >
                                  Reject & Refund
                                </button>
                              </>
                            )}

                            {signaturesReady && tx.authorityApproved && !tx.executed && (
                              <button
                                onClick={() => handleExecuteTransfer(tx.transferId)}
                                disabled={isProcessing}
                                className="bg-[#0f2b5a] hover:bg-blue-900 disabled:opacity-50 text-white px-3 py-1.5 rounded-md text-xs font-semibold uppercase tracking-wider transition shadow-xs cursor-pointer inline-flex items-center gap-1.5"
                              >
                                {isExecuting && (
                                  <svg className="animate-spin h-3 w-3 text-white" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                                  </svg>
                                )}
                                <span>Finalize Title Mutation</span>
                              </button>
                            )}

                            {!signaturesReady && (
                              <span className="text-gray-500 italic text-[11px]">
                                Awaiting citizen EIP-712 signatures...
                              </span>
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

          {/* ================================================================= */}
          {/* TAB 3: Disputed Titles & Judicial Enjunction (Blueprint §4.3)    */}
          {/* ================================================================= */}
          <Tab.Panel className="bg-white border border-gray-200 rounded-xl p-6 shadow-xs focus:outline-none space-y-8">
            {/* Sub-Section A: Active Judicial Enjunctions Live Table */}
            <div>
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-lg font-bold text-[#0f2b5a]">Sub-Section A: Active Judicial Injunctions & Stay Orders</h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Live registry audit of all parcels currently enjoined under court order. Disputed titles are blocked from commercial sale or mutation.
                  </p>
                </div>
                <span className="bg-red-50 text-red-800 border border-red-200 rounded-md px-2.5 py-0.5 text-xs font-semibold">
                  {frozenProps.length} frozen
                </span>
              </div>

              {frozenProps.length === 0 ? (
                <div className="border border-dashed border-gray-300 rounded-xl bg-gray-50 p-8 text-center">
                  <div className="w-10 h-10 rounded-xl bg-green-50 border border-green-200 flex items-center justify-center mx-auto mb-2 text-[#138808]">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-sm font-semibold text-gray-900">No Titles Under Judicial Injunction</h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    All recorded land titles in this jurisdiction are unencumbered and in active commercial circulation.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto -mx-2 sm:mx-0">
                  <table className="w-full text-left border-collapse min-w-[700px]">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        <th className="py-3 px-4">Parcel ID</th>
                        <th className="py-3 px-4">Current Titleholder</th>
                        <th className="py-3 px-4">Demarcated Area</th>
                        <th className="py-3 px-4">Judicial Caveat / Order Reason</th>
                        <th className="py-3 px-4 text-right">Injunction Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 text-xs text-gray-800">
                      {frozenProps.map((prop) => {
                        const isCurrentUnflagging = processingId === `unflag-${prop.propertyId}`;
                        return (
                          <tr key={prop.propertyId} className="hover:bg-red-50/40 transition">
                            <td className="py-3.5 px-4 font-mono font-bold text-gray-900">
                              Parcel #{prop.propertyId}
                            </td>
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-1.5">
                                <code className="font-mono text-gray-700 bg-gray-100 px-1.5 py-0.5 rounded text-[11px]">
                                  {prop.currentOwner ? `${prop.currentOwner.substring(0, 8)}...${prop.currentOwner.substring(36)}` : 'N/A'}
                                </code>
                                <button
                                  onClick={() => copyText(prop.currentOwner, `frozen-owner-${prop.propertyId}`)}
                                  className="text-[10px] text-[#0f2b5a] hover:underline"
                                >
                                  {copiedKey === `frozen-owner-${prop.propertyId}` ? '✓' : 'Copy'}
                                </button>
                              </div>
                            </td>
                            <td className="py-3.5 px-4 font-mono text-gray-700">
                              {prop.area} sq.m
                            </td>
                            <td className="py-3.5 px-4">
                              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-red-50 border border-red-200 text-red-800 text-xs font-medium">
                                <span className="w-1.5 h-1.5 rounded-full bg-red-600 shrink-0" />
                                <span>{prop.caveatReason || 'Judicial Injunction / Caveat Active'}</span>
                              </div>
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              <button
                                onClick={() => handleDirectUnflag(prop.propertyId)}
                                disabled={isProcessing}
                                className="bg-[#138808] hover:bg-green-800 disabled:opacity-50 text-white px-3 py-1.5 rounded-md text-xs font-semibold uppercase tracking-wider transition shadow-xs cursor-pointer inline-flex items-center gap-1.5"
                                title="Lift judicial freeze and restore title to circulation"
                              >
                                {isCurrentUnflagging && (
                                  <svg className="animate-spin h-3 w-3 text-white" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                                  </svg>
                                )}
                                <span>Lift Injunction</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Sub-Section B: Enjoin / Freeze Inspector */}
            <div className="border-t border-gray-200 pt-6 max-w-xl">
              <h2 className="text-lg font-bold text-[#0f2b5a] mb-1">Sub-Section B: Enjoin / Freeze Inspector</h2>
              <p className="text-xs text-gray-600 mb-6 leading-relaxed">
                Inspect any parcel on the ledger and enforce judicial stay orders or lift dispute caveats on-chain.
              </p>

              <form onSubmit={handleSearchProperty} className="flex gap-3 mb-6">
                <input
                  type="number"
                  min="1"
                  required
                  value={flagSearchId}
                  onChange={(e) => setFlagSearchId(e.target.value)}
                  placeholder="Enter Cadastral Parcel ID (e.g., 1)"
                  className="flex-grow px-4 py-2.5 rounded-lg bg-white border border-gray-300 text-gray-900 text-xs focus:border-[#0f2b5a] focus:ring-1 focus:ring-[#0f2b5a] outline-none transition font-mono placeholder:text-gray-400 shadow-xs"
                />
                <button
                  type="submit"
                  disabled={isSearchingProperty}
                  className="bg-[#0f2b5a] hover:bg-blue-900 disabled:opacity-50 text-white px-5 py-2.5 rounded-lg font-semibold text-xs uppercase tracking-wider transition shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  {isSearchingProperty ? 'Searching...' : 'Inspect Parcel'}
                </button>
              </form>

              {searchedProperty && (
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-base font-bold text-gray-900">Cadastral Parcel #{searchedProperty.propertyId}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-gray-500">Current Owner:</span>
                        <code className="text-xs text-gray-700 font-mono bg-white px-2 py-0.5 rounded border border-gray-300">
                          {searchedProperty.currentOwner?.substring(0, 8)}...{searchedProperty.currentOwner?.substring(36)}
                        </code>
                      </div>
                    </div>
                    {searchedProperty.isFrozen ? (
                      <span className="bg-red-100 text-red-800 border border-red-200 px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-red-600" />
                        <span>FROZEN / DISPUTED</span>
                      </span>
                    ) : (
                      <span className="bg-green-100 text-[#138808] border border-green-200 px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-[#138808]" />
                        <span>ACTIVE / UNENCUMBERED</span>
                      </span>
                    )}
                  </div>

                  <div className="p-3.5 rounded-lg bg-white border border-gray-200 text-xs text-gray-700 leading-relaxed shadow-xs">
                    {searchedProperty.isFrozen
                      ? `This parcel is currently under judicial freeze (${searchedProperty.caveatReason || 'Court stay order'}). Smart contract enforces rejection of all transfer agreements.`
                      : 'This property title is active and unencumbered. Placing an injunction will immediately freeze all on-chain transactions.'}
                  </div>

                  <form onSubmit={handleToggleFlag} className="space-y-4">
                    {!searchedProperty.isFrozen && (
                      <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                          Court Order / Judicial Reference <span className="text-red-600">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={flagReason}
                          onChange={(e) => setFlagReason(e.target.value)}
                          placeholder="e.g. High Court Stay Order No. 402/2026, Boundary Survey Dispute"
                          className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-900 text-xs focus:border-[#0f2b5a] focus:ring-1 focus:ring-[#0f2b5a] outline-none transition placeholder:text-gray-400 shadow-xs"
                        />
                        <p className="text-[11px] text-gray-500 mt-1">
                          Minimum 5 characters. Emitted in the on-chain PropertyFlagged event log.
                        </p>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={isProcessing}
                      className={`w-full py-2.5 rounded-lg font-semibold text-white transition shadow-xs text-xs cursor-pointer tracking-wider uppercase flex items-center justify-center gap-2 ${
                        searchedProperty.isFrozen ? 'bg-[#138808] hover:bg-green-800' : 'bg-red-700 hover:bg-red-800'
                      } disabled:opacity-50`}
                    >
                      {processingId === `flag-${searchedProperty.propertyId}` ? (
                        <>
                          <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                          </svg>
                          <span>Updating Blockchain State...</span>
                        </>
                      ) : (
                        <span>
                          {searchedProperty.isFrozen
                            ? 'LIFT INJUNCTION (RESTORE TITLE TO CIRCULATION)'
                            : 'ENJOIN PROPERTY (FREEZE TITLE ON-CHAIN)'}
                        </span>
                      )}
                    </button>
                  </form>
                </div>
              )}
            </div>
          </Tab.Panel>

          {/* ================================================================= */}
          {/* TAB 4: Cadastral Survey & Georeferencing Queue (Blueprint §4.4)   */}
          {/* ================================================================= */}
          <Tab.Panel className="bg-white border border-gray-200 rounded-xl p-6 shadow-xs focus:outline-none space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <div>
                <h2 className="text-lg font-bold text-[#0f2b5a]">Bhu-Aadhaar & Cadastral Georeferencing Queue</h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Assign statutory 14-character alphanumeric Unique Land Parcel Identification Numbers (ULPIN) to surveyed parcels.
                </p>
              </div>
              <span className="bg-amber-50 text-amber-800 border border-amber-200 rounded-md px-2.5 py-0.5 text-xs font-semibold">
                {georefQueue.length} awaiting ULPIN
              </span>
            </div>

            {georefQueue.length === 0 ? (
              <div className="border border-dashed border-gray-300 rounded-xl bg-gray-50 p-10 text-center">
                <div className="w-12 h-12 rounded-xl bg-green-50 border border-green-200 flex items-center justify-center mx-auto mb-3 text-[#138808]">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-base font-semibold text-gray-900">All Parcels Certified & Georeferenced</h3>
                <p className="text-xs text-gray-600 mt-1 max-w-sm mx-auto">
                  Every parcel on the registry has a certified 14-character Bhu-Aadhaar ULPIN attached to its cadastral record.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto -mx-2 sm:mx-0">
                <table className="w-full text-left border-collapse min-w-[700px]">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      <th className="py-3 px-4">Parcel ID</th>
                      <th className="py-3 px-4">Gata / Khasra</th>
                      <th className="py-3 px-4">Area (sq.m)</th>
                      <th className="py-3 px-4">Titleholder</th>
                      <th className="py-3 px-4">Current Status</th>
                      <th className="py-3 px-4 text-right">Cadastral Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 text-xs text-gray-800">
                    {georefQueue.map((prop) => (
                      <tr key={prop.propertyId} className="hover:bg-gray-50/80 transition">
                        <td className="py-3.5 px-4 font-mono font-bold text-gray-900">
                          Parcel #{prop.propertyId}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-mono text-gray-800 block">Gata: {prop.gataCode || 'N/A'}</span>
                          <span className="text-[11px] text-gray-500 font-mono">Khasra: {prop.khasraNumber || 'N/A'}</span>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-gray-700">
                          {prop.area} sq.m
                        </td>
                        <td className="py-3.5 px-4">
                          <code className="font-mono text-gray-700 bg-gray-100 px-1.5 py-0.5 rounded text-[11px]">
                            {prop.currentOwner ? `${prop.currentOwner.substring(0, 8)}...${prop.currentOwner.substring(36)}` : 'N/A'}
                          </code>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-semibold">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                            <span>Pending Georeferencing</span>
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => openGeorefModal(prop)}
                            className="bg-[#0f2b5a] hover:bg-blue-900 text-white px-3.5 py-1.5 rounded-md text-xs font-semibold uppercase tracking-wider transition shadow-xs cursor-pointer inline-flex items-center gap-1.5"
                          >
                            <span>Assign ULPIN</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Tab.Panel>
        </Tab.Panels>
      </Tab.Group>

      {/* ===================================================================== */}
      {/* MODAL 1: Cadastral Inspection Modal (Tab 1)                           */}
      {/* ===================================================================== */}
      <Dialog
        open={!!inspectingProp}
        onClose={() => setInspectingProp(null)}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-gray-900/50 transition-opacity" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="mx-auto w-full max-w-2xl rounded-xl bg-white border border-gray-200 p-6 shadow-xl text-gray-900 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-200 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-200 text-[#0f2b5a] flex items-center justify-center font-bold">
                  #{inspectingProp?.propertyId}
                </div>
                <div>
                  <Dialog.Title className="text-base sm:text-lg font-bold text-[#0f2b5a]">
                    Cadastral Inspection & Deed Document Audit
                  </Dialog.Title>
                  <p className="text-xs text-gray-500">
                    Official Revenue Record Inspection • Digital India Land Records (DILRMP)
                  </p>
                </div>
              </div>
              <button
                onClick={() => setInspectingProp(null)}
                className="text-gray-400 hover:text-gray-700 p-1 rounded-lg transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            {inspectingProp && (
              <div className="space-y-4">
                {/* Official Deed Download Banner */}
                <div className="p-4 rounded-lg bg-blue-50/70 border border-blue-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[#0f2b5a]">
                      Registered Title Deed Document
                    </h4>
                    <p className="text-xs text-gray-600 mt-0.5">
                      Stream physical certified PDF deed securely from the government vault.
                    </p>
                  </div>
                  <a
                    href={`${API_URL}/api/documents/${inspectingProp.documentHash}/download?userAddress=${account || ''}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#0f2b5a] hover:bg-blue-900 text-white text-xs font-semibold tracking-wider uppercase transition shadow-xs"
                  >
                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    <span>Download Deed PDF</span>
                  </a>
                </div>

                {/* Extracted Revenue Metadata Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="bg-gray-50 border border-gray-200 p-3 rounded-lg">
                    <span className="text-[10px] uppercase font-bold text-gray-500 block">16-Digit Gata Code</span>
                    <span className="font-mono font-semibold text-gray-900 text-sm block mt-0.5">
                      {inspectingProp.gataCode || 'Pending OCR / Survey Extraction'}
                    </span>
                  </div>

                  <div className="bg-gray-50 border border-gray-200 p-3 rounded-lg">
                    <span className="text-[10px] uppercase font-bold text-gray-500 block">Khasra Number</span>
                    <span className="font-mono font-semibold text-gray-900 text-sm block mt-0.5">
                      {inspectingProp.khasraNumber || 'Pending Extraction'}
                    </span>
                  </div>

                  <div className="bg-gray-50 border border-gray-200 p-3 rounded-lg">
                    <span className="text-[10px] uppercase font-bold text-gray-500 block">Bhu-Aadhaar ULPIN</span>
                    <span className="font-mono font-semibold text-gray-900 text-sm block mt-0.5">
                      {inspectingProp.ulpin || 'PENDING_GEOREFERENCING'}
                    </span>
                  </div>

                  <div className="bg-gray-50 border border-gray-200 p-3 rounded-lg">
                    <span className="text-[10px] uppercase font-bold text-gray-500 block">Demarcated Area</span>
                    <span className="font-mono font-semibold text-gray-900 text-sm block mt-0.5">
                      {inspectingProp.area} sq.meters
                    </span>
                  </div>

                  <div className="bg-gray-50 border border-gray-200 p-3 rounded-lg">
                    <span className="text-[10px] uppercase font-bold text-gray-500 block">Tenure Classification</span>
                    <span className="font-semibold text-gray-800 text-xs block mt-0.5">
                      {inspectingProp.tenureClass || 'Standard Transferable Land Title'}
                    </span>
                  </div>

                  <div className="bg-gray-50 border border-gray-200 p-3 rounded-lg">
                    <span className="text-[10px] uppercase font-bold text-gray-500 block">Deed Freshness</span>
                    <span className="font-semibold text-[#138808] text-xs block mt-0.5">
                      {inspectingProp.freshnessStatus || 'VALID_RECENT'}
                    </span>
                  </div>
                </div>

                {/* Hashes & On-Chain Addresses */}
                <div className="space-y-2 text-xs">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-gray-500">Applicant Owner Digital ID:</span>
                    <p className="font-mono text-xs truncate bg-gray-50 p-2 rounded border border-gray-200 text-gray-800 select-all mt-0.5">
                      {inspectingProp.currentOwner}
                    </p>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase font-bold text-gray-500">Deed Keccak-256 Digest:</span>
                    <p className="font-mono text-xs truncate bg-gray-50 p-2 rounded border border-gray-200 text-gray-800 select-all mt-0.5">
                      {inspectingProp.documentHash}
                    </p>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase font-bold text-gray-500">Cadastral Location GIS Hash:</span>
                    <p className="font-mono text-xs truncate bg-gray-50 p-2 rounded border border-gray-200 text-gray-800 select-all mt-0.5">
                      {inspectingProp.locationHash}
                    </p>
                  </div>
                </div>

                {/* Certification Action Inside Modal */}
                <div className="pt-4 border-t border-gray-200 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setInspectingProp(null)}
                    className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-gray-600 hover:text-gray-900 transition rounded-lg"
                  >
                    Close
                  </button>
                  <button
                    type="button"
                    onClick={() => handleVerifyProperty(inspectingProp.propertyId)}
                    disabled={isProcessing}
                    className="bg-[#138808] hover:bg-green-800 disabled:opacity-50 text-white px-5 py-2.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition shadow-xs cursor-pointer flex items-center gap-2"
                  >
                    {processingId === `verify-${inspectingProp.propertyId}` ? (
                      <>
                        <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                        </svg>
                        <span>Submitting Certification...</span>
                      </>
                    ) : (
                      <span>Certify & Verify On-Chain</span>
                    )}
                  </button>
                </div>
              </div>
            )}
          </Dialog.Panel>
        </div>
      </Dialog>

      {/* ===================================================================== */}
      {/* MODAL 2: Rejection Justification Modal (Tab 2)                        */}
      {/* ===================================================================== */}
      <Dialog
        open={!!rejectModalData}
        onClose={() => !isProcessing && setRejectModalData(null)}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-gray-900/50 transition-opacity" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="mx-auto w-full max-w-lg rounded-xl bg-white border border-gray-200 p-6 shadow-xl text-gray-900 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-200 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-red-50 border border-red-200 text-red-600 flex items-center justify-center">
                  <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <Dialog.Title className="text-lg font-bold text-[#0f2b5a]">
                    Reject Title Conveyance
                  </Dialog.Title>
                  <p className="text-xs text-gray-500">
                    Transfer #{rejectModalData?.transferId} • Cadastral Parcel #{rejectModalData?.propertyId}
                  </p>
                </div>
              </div>
              <button
                onClick={() => !isProcessing && setRejectModalData(null)}
                className="text-gray-400 hover:text-gray-700 p-1 rounded-lg transition cursor-pointer"
                disabled={isProcessing}
              >
                ✕
              </button>
            </div>

            {/* Escrow Settlement Disclosure */}
            <div
              className={`p-4 rounded-lg border text-xs leading-relaxed space-y-1.5 ${
                rejectModalData?.hasEscrow
                  ? 'bg-amber-50 border-amber-200 text-amber-900'
                  : 'bg-gray-50 border-gray-200 text-gray-800'
              }`}
            >
              <div className="font-semibold flex items-center gap-1.5">
                <svg className="w-4 h-4 text-amber-600 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <span>Automated Smart Contract Escrow Refund</span>
              </div>
              <p>
                {rejectModalData?.hasEscrow ? (
                  <>
                    Confirming rejection will immediately unlock and refund{' '}
                    <strong className="text-gray-900 font-mono">{rejectModalData.escrowEth} ETH</strong> from the smart contract vault back to the buyer address (
                    <code className="text-amber-800 font-mono text-[11px]">
                      {rejectModalData.buyer?.substring(0, 6)}...{rejectModalData.buyer?.substring(38)}
                    </code>
                    ).
                  </>
                ) : (
                  'This conveyance is a direct transfer without deposited escrow. Rejection will finalize cancellation on the smart contract.'
                )}
              </p>
            </div>

            <form onSubmit={handleConfirmRejection} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                  Standard Statutory Justification Presets:
                </label>
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {reasonPresets.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setRejectReason(preset)}
                      className={`text-[11px] px-2.5 py-1 rounded-md border text-left transition cursor-pointer ${
                        rejectReason === preset
                          ? 'bg-blue-50 text-[#0f2b5a] border-blue-300 font-semibold'
                          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 font-medium'
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>

                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Official Justification Reason <span className="text-red-600">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Provide official administrative findings explaining why this conveyance is rejected..."
                  className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-900 text-xs focus:border-[#0f2b5a] focus:ring-1 focus:ring-[#0f2b5a] outline-none transition resize-none placeholder:text-gray-400"
                />
                <div className="flex justify-between text-[11px] text-gray-500 mt-1">
                  <span>Minimum 5 characters required</span>
                  <span>{rejectReason.length} characters</span>
                </div>
              </div>

              {rejectError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-800 text-xs rounded-lg">
                  {rejectError}
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setRejectModalData(null)}
                  disabled={isProcessing}
                  className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-gray-600 hover:text-gray-900 transition rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="bg-red-700 hover:bg-red-800 disabled:opacity-50 text-white px-5 py-2.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition shadow-xs cursor-pointer flex items-center gap-2"
                >
                  {isProcessing ? (
                    <>
                      <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                      </svg>
                      <span>Submitting Rejection...</span>
                    </>
                  ) : (
                    <span>Confirm Rejection & Refund</span>
                  )}
                </button>
              </div>
            </form>
          </Dialog.Panel>
        </div>
      </Dialog>

      {/* ===================================================================== */}
      {/* MODAL 3: Assign ULPIN Georeferencing Modal (Tab 4)                     */}
      {/* ===================================================================== */}
      <Dialog
        open={!!georefModalData}
        onClose={() => !isSubmittingGeoref && setGeorefModalData(null)}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-gray-900/50 transition-opacity" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="mx-auto w-full max-w-lg rounded-xl bg-white border border-gray-200 p-6 shadow-xl text-gray-900 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-200 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 flex items-center justify-center font-bold text-xs">
                  GIS
                </div>
                <div>
                  <Dialog.Title className="text-lg font-bold text-[#0f2b5a]">
                    Assign Bhu-Aadhaar ULPIN
                  </Dialog.Title>
                  <p className="text-xs text-gray-500">
                    Cadastral Georeferencing for Parcel #{georefModalData?.propertyId}
                  </p>
                </div>
              </div>
              <button
                onClick={() => !isSubmittingGeoref && setGeorefModalData(null)}
                className="text-gray-400 hover:text-gray-700 p-1 rounded-lg transition cursor-pointer"
                disabled={isSubmittingGeoref}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAssignUlpin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  14-Character Alphanumeric ULPIN <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  maxLength={14}
                  value={georefUlpin}
                  onChange={(e) => setGeorefUlpin(e.target.value.toUpperCase())}
                  placeholder="e.g. UP09LK41200001"
                  className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-900 text-sm font-mono tracking-widest uppercase focus:border-[#0f2b5a] focus:ring-1 focus:ring-[#0f2b5a] outline-none transition placeholder:text-gray-400"
                />
                <div className="flex justify-between text-[11px] text-gray-500 mt-1">
                  <span>Standard Indian Bhu-Aadhaar 14-char format (^[A-Z0-9]{'{14}'}$)</span>
                  <span className={georefUlpin.length === 14 ? 'text-[#138808] font-bold' : 'text-gray-500'}>
                    {georefUlpin.length} / 14
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Survey Field Notes & GIS Boundary Centroid
                </label>
                <textarea
                  rows={2}
                  value={georefNotes}
                  onChange={(e) => setGeorefNotes(e.target.value)}
                  placeholder="Total-Station survey reference, drone orthophoto ID, or bounding GIS coordinates..."
                  className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-900 text-xs focus:border-[#0f2b5a] focus:ring-1 focus:ring-[#0f2b5a] outline-none transition resize-none placeholder:text-gray-400"
                />
              </div>

              {georefError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-800 text-xs rounded-lg">
                  {georefError}
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setGeorefModalData(null)}
                  disabled={isSubmittingGeoref}
                  className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-gray-600 hover:text-gray-900 transition rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingGeoref || georefUlpin.trim().length !== 14}
                  className="bg-[#0f2b5a] hover:bg-blue-900 disabled:opacity-50 text-white px-5 py-2.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition shadow-xs cursor-pointer flex items-center gap-2"
                >
                  {isSubmittingGeoref ? (
                    <>
                      <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                      </svg>
                      <span>Certifying ULPIN...</span>
                    </>
                  ) : (
                    <span>Record Georeferenced ULPIN</span>
                  )}
                </button>
              </div>
            </form>
          </Dialog.Panel>
        </div>
      </Dialog>
    </div>
  );
}
