import React, { useState } from 'react';
import { Dialog } from '@headlessui/react';
import { useAuth } from '../context/AuthContext';
import { ethers } from 'ethers';

export default function ListPropertyModal({ isOpen, onClose, property, onListSuccess }) {
  const { contract } = useAuth();
  const [priceEth, setPriceEth] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState('');

  if (!property) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!priceEth || isNaN(priceEth) || Number(priceEth) <= 0) {
      setStatus('Error: Please enter a valid price in ETH greater than 0.');
      return;
    }

    setIsSubmitting(true);
    setStatus('Awaiting MetaMask confirmation...');

    try {
      const priceWei = ethers.parseEther(priceEth.toString());
      const tx = await contract.listPropertyForSale(property.propertyId, priceWei);
      setStatus('Listing transaction submitted to blockchain...');
      await tx.wait();

      setStatus('Property successfully listed on Marketplace!');
      setTimeout(() => {
        onListSuccess();
        onClose();
        setStatus('');
        setPriceEth('');
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
        <Dialog.Panel className="w-full max-w-md rounded-xl bg-white border border-gray-200 p-6 shadow-xl text-gray-900">
          <div className="flex items-center justify-between gap-3 mb-2">
            <Dialog.Title className="text-lg font-bold text-[#0f2b5a]">
              List Parcel #{property.propertyId}
            </Dialog.Title>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-900 border border-indigo-200">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
              Market Listing
            </span>
          </div>
          <Dialog.Description className="text-xs text-gray-600 mb-6 leading-relaxed">
            Specify your asking price in ETH. Any verified citizen can lock funds into escrow to initiate conveyance.
          </Dialog.Description>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Asking Price (ETH)
                </label>
                <span className="text-xs text-gray-500 font-mono">Area: {property.area} sq.m</span>
              </div>
              <input
                type="number"
                step="0.0001"
                min="0.0001"
                required
                value={priceEth}
                onChange={(e) => setPriceEth(e.target.value)}
                placeholder="e.g. 2.5"
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 font-mono text-sm focus:border-[#0f2b5a] focus:ring-1 focus:ring-[#0f2b5a] outline-none transition"
              />
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
                {isSubmitting ? 'Confirming...' : 'List on Marketplace'}
              </button>
            </div>
          </form>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}
