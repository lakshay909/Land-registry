import React, { useState } from 'react';
import { Dialog } from '@headlessui/react';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../config';
import { ethers } from 'ethers';

export default function InitiateTransferModal({ isOpen, onClose, property, onInitiateSuccess }) {
  const { account, contract } = useAuth();
  const [buyerAddress, setBuyerAddress] = useState('');
  const [file, setFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file || !buyerAddress) return;

    if (!ethers.isAddress(buyerAddress)) {
      setStatus('Error: Invalid buyer address format.');
      return;
    }

    setIsSubmitting(true);
    setStatus('Hashing new deed document locally (Keccak-256)...');

    try {
      // 1. Client-side hashing
      const arrayBuffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      const documentHash = ethers.keccak256(uint8Array);

      // 2. Upload file to backend FIRST
      setStatus('Uploading new deed to document vault...');
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
      setStatus('Awaiting MetaMask confirmation...');
      const tx = await contract.initiateTransfer(
        property.propertyId,
        buyerAddress,
        documentHash
      );

      setStatus('Transaction submitted. Waiting for confirmation...');
      await tx.wait();

      setStatus('Transfer initiated successfully!');
      
      setTimeout(() => {
        onInitiateSuccess();
        onClose();
        setBuyerAddress('');
        setFile(null);
        setStatus('');
      }, 1500);
      
    } catch (error) {
      console.error(error);
      setStatus(`Error: ${error.reason || error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!property) return null;

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-gray-900/50 transition-opacity" aria-hidden="true" />
      
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto w-full max-w-md rounded-xl bg-white border border-gray-200 p-6 shadow-xl text-gray-900">
          <div className="flex items-center justify-between gap-3 mb-2">
            <Dialog.Title className="text-lg font-bold text-[#0f2b5a]">
              Initiate Conveyance #{property.propertyId}
            </Dialog.Title>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-[#0f2b5a] border border-blue-200">
              <span className="w-1.5 h-1.5 rounded-full bg-[#0f2b5a]" />
              Direct Transfer
            </span>
          </div>
          <Dialog.Description className="text-xs text-gray-600 mb-6 leading-relaxed">
            Direct off-market title conveyance. Both parties must submit a digital wallet signature before the registrar can approve and execute the transfer.
          </Dialog.Description>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Buyer Wallet Address</label>
              <input
                type="text"
                required
                value={buyerAddress}
                onChange={(e) => setBuyerAddress(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 font-mono text-xs focus:border-[#0f2b5a] focus:ring-1 focus:ring-[#0f2b5a] outline-none transition"
                placeholder="0x..."
              />
            </div>
            
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Conveyance Deed (PDF)</label>
              <input
                type="file"
                required
                accept="application/pdf"
                onChange={(e) => setFile(e.target.files[0])}
                className="w-full text-gray-600 file:mr-4 file:py-2 file:px-3.5 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-[#0f2b5a] file:text-white hover:file:bg-blue-900 cursor-pointer bg-gray-50 p-2 border border-gray-300 rounded-lg text-xs"
              />
              <p className="mt-1.5 text-[10px] text-gray-500">Document will be hashed client-side before submission.</p>
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
                {isSubmitting ? 'Processing...' : 'Initiate Conveyance'}
              </button>
            </div>
          </form>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}
