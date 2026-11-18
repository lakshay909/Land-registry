/**
 * Decodes and formats Ethereum and LandRegistry smart contract errors
 * into human-readable, clear status explanations for citizens and authorities.
 */

const CUSTOM_ERRORS = {
  '0xb0bd6aca': 'This conveyance deed has already been digitally signed by your wallet.',
  '0x1935c293': 'Your wallet is not authorized as a party (buyer or seller) to this conveyance.',
  '0x101f817a': 'This conveyance transfer has already been approved by the Land Registrar.',
  '0x0dc10197': 'This conveyance transfer has already been executed and finalized.',
  '0xc19f17a9': 'This conveyance transfer has not yet been approved by the Land Registrar.',
  '0x1ed40d3e': 'Conveyance not ready for execution: both buyer and seller signatures plus registrar approval are required.',
  '0x118fd7b8': 'This land parcel has already been verified by the Land Revenue Authority.',
  '0x63a185d5': 'Duplicate registration: this deed document hash or parcel ID is already registered.',
  '0x30cd7471': 'Caller is not the registered owner of this property.',
  '0xf52f1420': 'This property is currently frozen due to an active legal dispute or cadastral notice.',
  '0x45afc6c7': 'This property is not currently frozen.',
  '0xb91d1d2d': 'This land parcel has not yet been verified by the Revenue Authority.',
  '0x0c947a40': 'The specified property record does not exist on the state ledger.',
  '0x49378211': 'The specified transfer request does not exist.',
  '0x8baa579f': 'Invalid cryptographic signature: ECDSA verification failed.',
  '0x1fb09b80': 'Replay protection: signature nonce has already been used.',
  '0x23e6f11f': 'Invalid transfer: seller and buyer addresses cannot be identical.',
  '0x00bfc921': 'Invalid price: marketplace listing price must be greater than zero.',
  '0xa68cba24': 'This land title is not listed for public sale.',
  '0xcd1c8867': 'Insufficient payment: sent ETH does not match the escrow sale price.',
  '0x90b8ec18': 'Escrow disbursement or refund transfer failed.'
};

export function parseContractError(error) {
  if (!error) return 'An unexpected error occurred.';

  // 1. User rejection in MetaMask
  if (
    error.code === 'ACTION_REJECTED' ||
    error.code === 4001 ||
    error.message?.includes('user rejected') ||
    error.message?.includes('User rejected')
  ) {
    return 'Transaction request cancelled in MetaMask.';
  }

  // 2. Extract error data selector (ethers v6 places this in various locations)
  const hexData = 
    error.data || 
    error.error?.data || 
    error.info?.error?.data || 
    error.transaction?.data;

  if (typeof hexData === 'string' && hexData.length >= 10) {
    const selector = hexData.slice(0, 10).toLowerCase();
    if (CUSTOM_ERRORS[selector]) {
      return CUSTOM_ERRORS[selector];
    }
  }

  // Also check if data is embedded inside the error string (e.g. data="0xb0bd6aca")
  if (typeof error.message === 'string') {
    const match = error.message.match(/data="(0x[0-9a-fA-F]{8})"/);
    if (match && CUSTOM_ERRORS[match[1].toLowerCase()]) {
      return CUSTOM_ERRORS[match[1].toLowerCase()];
    }
  }

  // 3. Named revert or custom error from ABI
  const revertName = error.revert?.name;
  if (revertName) {
    switch (revertName) {
      case 'AlreadySigned':
        return 'This conveyance deed has already been digitally signed by your wallet.';
      case 'NotAPartyToTransfer':
        return 'Your wallet is not a party (buyer or seller) to this conveyance.';
      case 'TransferNotReady':
        return 'All parties must sign and the Registrar must approve before execution.';
      case 'DuplicateRegistration':
        return 'This deed document or parcel identifier has already been registered on-chain.';
      case 'InvalidTransferToSelf':
        return 'Cannot transfer property: seller and buyer addresses cannot be identical.';
      case 'PropertyIsFrozen':
        return 'This land parcel is frozen due to an administrative or legal hold.';
      case 'PropertyNotVerified':
        return 'This land parcel has not yet been verified by the Revenue Authority.';
      case 'InsufficientPayment':
        return 'Sent ETH does not match the required escrow purchase price.';
      default:
        return `Smart contract reverted with: ${revertName}`;
    }
  }

  // 4. Standard string reasons
  if (error.reason) {
    if (error.reason.includes('AccessControl')) {
      return 'Unauthorized: Your wallet lacks the required permissions for this action.';
    }
    if (error.reason.includes('AlreadySigned')) {
      return 'This conveyance deed has already been digitally signed by your wallet.';
    }
    return `Transaction reverted: ${error.reason}`;
  }

  if (error.shortMessage) return error.shortMessage;
  return error.message || 'Transaction failed.';
}
