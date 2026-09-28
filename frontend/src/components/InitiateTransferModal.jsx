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
    setStatus('Hashing new deed document...');

    try {
      // 1. Client-side hashing
      const arrayBuffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      const documentHash = ethers.keccak256(uint8Array);

      // 2. Upload file to backend FIRST
      setStatus('Uploading new deed...');
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
      }, 2000);
      
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
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto w-full max-w-md rounded-xl bg-white p-6 shadow-xl border border-slate-200">
          <Dialog.Title className="text-xl font-bold text-slate-900 mb-4">
            Initiate Transfer for Property #{property.propertyId}
          </Dialog.Title>
          
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Buyer Address</label>
              <input
                type="text"
                required
                value={buyerAddress}
                onChange={(e) => setBuyerAddress(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 outline-none transition font-mono text-sm"
                placeholder="0x..."
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">New Title Deed (PDF)</label>
              <input
                type="file"
                required
                accept="application/pdf"
                onChange={(e) => setFile(e.target.files[0])}
                className="w-full text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
              />
              <p className="mt-1 text-xs text-slate-500">Must be a valid PDF transferring ownership to the new buyer.</p>
            </div>

            {status && (
              <div className={`p-3 rounded-md text-sm font-medium ${
                status.includes('Error') ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-blue-50 text-blue-700 border border-blue-200'
              }`}>
                {status}
              </div>
            )}

            <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-70 text-white px-5 py-2 rounded-lg font-semibold transition"
              >
                {isSubmitting ? 'Processing...' : 'Initiate Transfer'}
              </button>
            </div>
          </form>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}
