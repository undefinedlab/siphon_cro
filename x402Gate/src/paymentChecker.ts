import { ethers } from 'ethers';
import { config, ENTRYPOINT_ABI } from './config';

let provider: ethers.Provider | null = null;
let contract: ethers.Contract | null = null;

/**
 * Initialize provider and contract connection
 */
export function initializePaymentChecker() {
  if (!provider) {
    provider = new ethers.JsonRpcProvider(config.rpcUrl);
  }
  
  if (!contract) {
    contract = new ethers.Contract(
      config.entrypointAddress,
      ENTRYPOINT_ABI,
      provider
    );
  }
  
  return { provider, contract };
}

/**
 * Check if a payment was made for a given nullifier
 * @param nullifier - The nullifier hash from the ZK proof
 * @returns The payment amount (0 if not paid)
 */
export async function checkPayment(nullifier: string): Promise<bigint> {
  try {
    const { contract } = initializePaymentChecker();
    
    if (!contract) {
      throw new Error('Contract not initialized');
    }
    
    // Convert nullifier to BigInt (handle hex strings)
    const nullifierBigInt = typeof nullifier === 'string' && nullifier.startsWith('0x')
      ? BigInt(nullifier)
      : BigInt(nullifier);
    
    // Query feePayments mapping
    const paymentAmount = await contract.feePayments(nullifierBigInt);
    
    return BigInt(paymentAmount.toString());
  } catch (error) {
    console.error('Error checking payment:', error);
    throw error;
  }
}

/**
 * Verify if payment exists and is sufficient
 * @param nullifier - The nullifier hash
 * @param requiredAmount - Minimum required payment amount (optional)
 * @returns Object with payment status
 */
export async function verifyPayment(
  nullifier: string,
  requiredAmount?: bigint
): Promise<{
  paid: boolean;
  amount: bigint;
  sufficient: boolean;
}> {
  const amount = await checkPayment(nullifier);
  const paid = amount > 0n;
  const sufficient = requiredAmount ? amount >= requiredAmount : paid;
  
  return {
    paid,
    amount,
    sufficient,
  };
}
