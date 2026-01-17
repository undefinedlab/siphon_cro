import dotenv from 'dotenv';

dotenv.config();

export const config = {
  // Server configuration
  port: parseInt(process.env.MIDDLEWARE_PORT || '5006', 10),
  // Payload generator URL (which forwards to trade executor)
  backendUrl: process.env.BACKEND_URL || process.env.PAYLOAD_GENERATOR_URL || 'http://localhost:5009',
  
  // Blockchain configuration
  rpcUrl: process.env.RPC_URL || 'https://evm-t3.cronos.org',
  chainId: parseInt(process.env.CHAIN_ID || '338', 10),
  entrypointAddress: process.env.ENTRYPOINT_ADDRESS || '0x531993250171ca1173e96446a5e531F3e58D624D',
  
  // CORS configuration
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',
};

// Entrypoint ABI - minimal interface for feePayments mapping
export const ENTRYPOINT_ABI = [
  "function feePayments(uint256 nullifier) view returns (uint256 executionPrice)",
] as const;
