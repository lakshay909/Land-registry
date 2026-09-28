import React, { useState } from 'react';
import { Dialog } from '@headlessui/react';
import { useAuth } from '../context/AuthContext';
import { CONTRACT_ADDRESS, SUPPORTED_CHAIN_ID } from '../config';

export default function SignTransferModal({ isOpen, onClose, transfer, onSignSuccess }) {
  const { signer, contract } = useAuth();
  const [isSigning, setIsSigning] = useState(false);
  const [error, setError] = useState('');

  const handleSign = async () => {
    setIsSigning(true);
    setError('');

    try {
      // 1. Fetch current nonce from contract
      const signerAddress = await signer.getAddress();
      const nonce = await contract.nonces(signerAddress);

      // 2. Define exactly matching EIP-712 Domain
      const domain = {
        name: "LandRegistry",
        version: "1",
        chainId: SUPPORTED_CHAIN_ID,
        verifyingContract: CONTRACT_ADDRESS
      };

      // 3. Define exactly matching EIP-712 Types (omitting EIP712Domain, ethers handles it)
      const types = {
        Transfer: [
          { name: "propertyId", type: "uint256" },
          { name: "documentHash", type: "bytes32" },
          { name: "action", type: "string" },
          { name: "nonce", type: "uint256" }
        ]
      };

      // 4. Define Value
      const value = {
        propertyId: Number(transfer.propertyId),
        documentHash: transfer.newDocumentHash,
        action: "TRANSFER",
        nonce: Number(nonce)
      };

      // 5. Request Signature from MetaMask
      const signature = await signer.signTypedData(domain, types, value);

      // 6. Submit Signature to Contract
      const tx = await contract.signTransfer(transfer.transferId, signature);
      await tx.wait();

      onSignSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      setError(`Signature failed: ${err.reason || err.message}`);
    } finally {
      setIsSigning(false);
    }
  };

  if (!transfer) return null;

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-md rounded-xl bg-white p-6 shadow-xl border border-slate-200">
          <Dialog.Title className="text-xl font-bold text-slate-900 mb-4">
            Sign Property Transfer
          </Dialog.Title>
          
          <div className="space-y-4 mb-6">
            <p className="text-slate-600 text-sm">
              You are about to cryptographically sign a transfer request for <strong>Property #{transfer.propertyId}</strong>.
            </p>
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 text-sm font-mono space-y-2 break-all">
              <p><span className="text-slate-500 font-semibold uppercase text-xs">To:</span> <br/>{transfer.toAddress}</p>
              <p><span className="text-slate-500 font-semibold uppercase text-xs">Doc Hash:</span> <br/>{transfer.newDocumentHash}</p>
            </div>
            <p className="text-xs text-slate-500">
              This will trigger a MetaMask signature request. It costs no gas to sign, but the signature will be broadcast on-chain in the next step.
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-rose-50 text-rose-700 text-sm rounded border border-rose-200">
              {error}
            </div>
          )}

          <div className="flex justify-end space-x-3">
            <button
              onClick={onClose}
              disabled={isSigning}
              className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              onClick={handleSign}
              disabled={isSigning}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-70 text-white px-5 py-2 rounded-lg font-semibold transition"
            >
              {isSigning ? 'Waiting for signature...' : 'Sign Typed Data'}
            </button>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}
