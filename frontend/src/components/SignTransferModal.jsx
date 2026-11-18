import React, { useState } from 'react';
import { Dialog } from '@headlessui/react';
import { useAuth } from '../context/AuthContext';
import { CONTRACT_ADDRESS, SUPPORTED_CHAIN_ID } from '../config';
import { parseContractError } from '../utils/contractErrors';

export default function SignTransferModal({ isOpen, onClose, transfer, onSignSuccess }) {
  const { signer, contract } = useAuth();
  const [isSigning, setIsSigning] = useState(false);
  const [error, setError] = useState('');

  const handleSign = async () => {
    setIsSigning(true);
    setError('');

    try {
      const signerAddress = await signer.getAddress();

      // 0. Safety Pre-check: Verify if signer has already signed on-chain
      if (contract && transfer?.transferId) {
        try {
          const onChainTransfer = await contract.transfers(transfer.transferId);
          const isSender = signerAddress.toLowerCase() === onChainTransfer.from.toLowerCase();
          const isReceiver = signerAddress.toLowerCase() === onChainTransfer.to.toLowerCase();
          const alreadySigned = (isSender && onChainTransfer.fromSigned) || (isReceiver && onChainTransfer.toSigned);
          if (alreadySigned) {
            onSignSuccess?.();
            onClose();
            return;
          }
        } catch (checkErr) {
          console.warn('Could not pre-verify transfer signature status:', checkErr);
        }
      }

      // 1. Fetch current nonce from contract
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

      onSignSuccess?.();
      onClose();
    } catch (err) {
      console.error('Sign transfer error:', err);
      const parsedMsg = parseContractError(err);
      
      // If the error was AlreadySigned (e.g. race condition or double submission),
      // refresh UI and close modal gracefully
      if (parsedMsg.includes('already been digitally signed')) {
        onSignSuccess?.();
        onClose();
        return;
      }

      setError(`Signature failed: ${parsedMsg}`);
    } finally {
      setIsSigning(false);
    }
  };

  if (!transfer) return null;

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-gray-900/50 transition-opacity" aria-hidden="true" />
      
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-md w-full rounded-xl bg-white border border-gray-200 p-6 shadow-xl text-gray-900">
          <div className="flex items-center justify-between gap-3 mb-2">
            <Dialog.Title className="text-lg font-bold text-[#0f2b5a]">
              Sign Conveyance Deed
            </Dialog.Title>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-50 text-[#138808] border border-green-200">
              <span className="w-1.5 h-1.5 rounded-full bg-[#138808]" />
              Digital Deed
            </span>
          </div>
          
          <div className="space-y-4 mb-6">
            <p className="text-gray-600 text-xs leading-relaxed">
              You are authorizing the transfer of <strong>Parcel #{transfer.propertyId}</strong> using your digital wallet signature. This verifies to the Government Registrar that you consent to this title conveyance.
            </p>
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 text-xs font-mono space-y-2 break-all text-gray-800">
              <p><span className="text-gray-500 font-bold uppercase text-[10px]">Recipient (Buyer):</span> <br/><span className="text-gray-700">{transfer.toAddress}</span></p>
              <p><span className="text-gray-500 font-bold uppercase text-[10px]">Title Deed Fingerprint:</span> <br/><span className="text-gray-900 font-semibold">{transfer.newDocumentHash}</span></p>
            </div>
            <p className="text-[11px] text-gray-500">
              Your connected wallet will prompt you to review and sign. Once submitted, the Government Registrar can review and execute the title transfer.
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-800 text-xs rounded-lg border border-red-200">
              {error}
            </div>
          )}

          <div className="flex justify-end items-center gap-3 pt-4 border-t border-gray-200">
            <button
              onClick={onClose}
              disabled={isSigning}
              className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-gray-600 hover:text-gray-900 transition cursor-pointer rounded-lg"
            >
              Cancel
            </button>
            <button
              onClick={handleSign}
              disabled={isSigning}
              className="bg-[#0f2b5a] hover:bg-blue-900 active:bg-blue-950 disabled:opacity-50 text-white px-5 py-2.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition shadow-xs cursor-pointer"
            >
              {isSigning ? 'Signing in Wallet...' : 'Authorize & Sign Deed'}
            </button>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}
