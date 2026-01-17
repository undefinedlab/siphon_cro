import dotenv from 'dotenv';

dotenv.config();

export const config = {
  // Server configuration
  port: parseInt(process.env.PAYMENT_SERVICE_PORT || '5007', 10),
  
  // Blockchain configuration
  rpcUrl: process.env.RPC_URL || 'https://evm-t3.cronos.org',
  chainId: parseInt(process.env.CHAIN_ID || '338', 10),
  entrypointAddress: process.env.ENTRYPOINT_ADDRESS || '0x531993250171ca1173e96446a5e531F3e58D624D',
  
  // Database configuration
  dbPath: process.env.DB_PATH || './data/payments.db',
  
  // Encryption key (should be set via environment variable in production)
  encryptionKey: process.env.ENCRYPTION_KEY || 'default-key-change-in-production',
  
  // CORS configuration
  corsOrigin: process.env.CORS_ORIGIN || '*',
  
  // x402 Middleware URL (for forwarding requests)
  x402MiddlewareUrl: process.env.X402_MIDDLEWARE_URL || 'http://localhost:5006',
};

// Entrypoint ABI
export const ENTRYPOINT_ABI = [
  "function deposit(address _asset, uint256 _amount, uint256 _precommitment) external payable returns (uint256 _commitment)",
  "function payExecutionFee(address _asset, uint256 _executionPrice, uint256 _amount, uint256 _stateRoot, uint256 _nullifier, uint256 _newCommitment, uint256[24] calldata _proof) external",
  "function feePayments(uint256 nullifier) view returns (uint256 executionPrice)",
] as const;
