import React, { useState } from 'react';
import { Dialog } from '@headlessui/react';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../config';
import { ethers } from 'ethers';

export default function BuyPropertyModal({ isOpen, onClose, property, onBuySuccess }) {
  const { account, contract } = useAuth();
  const [file, setFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState('');

  if (!property) return null;

  const priceEth = property.price ? ethers.formatEther(property.price.toString()) : '0';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setStatus('Error: Please upload a conveyance deed document (PDF).');
      return;
    }

    setIsSubmitting(true);
    setStatus('Hashing purchase deed document locally (Keccak-256)...');

    try {
      // 1. Client-side hashing
      const arrayBuffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      const documentHash = ethers.keccak256(uint8Array);

      // 2. Upload to backend
      setStatus('Uploading purchase deed to document storage...');
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

      // 3. Submit transaction with ETH locked in Escrow
      setStatus(`Awaiting MetaMask: Depositing ${priceEth} ETH to Smart Escrow...`);
      const tx = await contract.initiateTransfer(
        property.propertyId,
        account,
        documentHash,
        { value: property.price }
      );

      setStatus('Transaction submitted. Locking funds in Escrow vault...');
      await tx.wait();

      setStatus('Success! Escrow funds locked. Transfer initiated.');
      setTimeout(() => {
        onBuySuccess();
        onClose();
        setStatus('');
        setFile(null);
      }, 1500);
    } catch (err) {
      console.error(err);
      setStatus(`Error: ${err.reason || err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-gray-900/50 transition-opacity" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="w-full max-w-lg rounded-xl bg-white border border-gray-200 p-6 shadow-xl text-gray-900">
          <div className="flex items-center justify-between gap-3 mb-2">
            <Dialog.Title className="text-lg font-bold text-[#0f2b5a]">
              Purchase Parcel #{property.propertyId}
            </Dialog.Title>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-50 text-[#138808] border border-green-200">
              <span className="w-1.5 h-1.5 rounded-full bg-[#138808]" />
              Smart Escrow
            </span>
          </div>
          <Dialog.Description className="text-xs text-gray-600 mb-6 leading-relaxed">
            Your purchase payment will be locked inside the smart contract escrow. Funds are disbursed to the seller only after the Government Registrar approves the dual-signed deed.
          </Dialog.Description>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6 space-y-2.5 text-gray-800">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500 font-medium">Required Escrow Lock:</span>
              <span className="text-2xl font-bold text-[#0f2b5a] font-mono">{priceEth} <span className="text-gray-600 text-sm font-semibold">ETH</span></span>
            </div>
            <div className="flex justify-between text-xs text-gray-600">
              <span className="text-gray-500">Cadastral Area:</span>
              <span className="font-semibold text-gray-900 font-mono">{property.area} sq.m</span>
            </div>
            <div className="flex justify-between text-xs text-gray-600">
              <span className="text-gray-500">Seller Address:</span>
              <span className="font-mono text-gray-700 truncate max-w-[220px]" title={property.currentOwner}>
                {property.currentOwner}
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Executed Sale Agreement / Conveyance Deed (PDF)
              </label>
              <input
                type="file"
                required
                accept="application/pdf"
                onChange={(e) => setFile(e.target.files[0])}
                className="w-full text-gray-600 file:mr-4 file:py-2 file:px-3.5 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-[#0f2b5a] file:text-white hover:file:bg-blue-900 cursor-pointer bg-gray-50 p-2 border border-gray-300 rounded-lg text-xs"
              />
              <p className="mt-1.5 text-[10px] text-gray-500">
                Document will be hashed client-side before escrow lock.
              </p>
            </div>

            {status && (
              <div className={`p-3 rounded-lg text-xs font-medium border ${
                status.includes('Error') 
                  ? 'bg-red-50 text-red-800 border-red-200' 
                  : 'bg-green-50 text-[#138808] border-green-200'
              }`}>
                {status}
              </div>
            )}

            <div className="flex justify-end items-center gap-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-gray-600 hover:text-gray-900 transition cursor-pointer rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-[#0f2b5a] hover:bg-blue-900 active:bg-blue-950 disabled:opacity-50 text-white px-5 py-2.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition shadow-xs cursor-pointer"
              >
                {isSubmitting ? 'Processing Escrow...' : `Lock ${priceEth} ETH & Buy`}
              </button>
            </div>
          </form>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}
