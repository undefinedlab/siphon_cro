import express, { Request, Response } from 'express';
import cors from 'cors';
import { config } from './config';
import { initDatabase, closeDatabase } from './database';
import { initializeServiceSigner } from './paymentService';
import { createAccountAndDeposit, payFeeForMachine, getMachineBalance } from './paymentService';

const app = express();

// Middleware
app.use(cors({
  origin: config.corsOrigin,
  credentials: true,
}));
app.use(express.json());

// Initialize service signer (should be from secure env var in production)
const SERVICE_PRIVATE_KEY = process.env.SERVICE_PRIVATE_KEY;
if (!SERVICE_PRIVATE_KEY) {
  console.warn('⚠️  SERVICE_PRIVATE_KEY not set. Payment service will not work.');
} else {
  initializeServiceSigner(SERVICE_PRIVATE_KEY);
}

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({ 
    status: 'healthy', 
    service: 'zk-payment-service',
    hasSigner: !!SERVICE_PRIVATE_KEY
  });
});

// Create account and deposit
app.post('/api/payment/deposit', async (req: Request, res: Response) => {
  try {
    const { apiKey, amount, token } = req.body;

    if (!apiKey || !amount || !token) {
      return res.status(400).json({
        error: 'Missing required fields: apiKey, amount, token',
      });
    }

    const result = createAccountAndDeposit(apiKey, amount, token);

    if (!result.success) {
      return res.status(500).json({
        error: result.error || 'Failed to create account and deposit',
      });
    }

    res.json({
      success: true,
      commitment: result.commitment,
      message: 'Account created and funds deposited',
    });
  } catch (error) {
    console.error('Error in deposit:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Pay execution fee (ZK)
app.post('/api/payment/pay-fee', async (req: Request, res: Response) => {
  try {
    const { apiKey, amount, token } = req.body;

    if (!apiKey || !amount || !token) {
      return res.status(400).json({
        error: 'Missing required fields: apiKey, amount, token',
      });
    }

    const result = payFeeForMachine(apiKey, amount, token);

    if (!result.success) {
      return res.status(400).json({
        error: result.error || 'Failed to pay fee',
      });
    }

    res.json({
      success: true,
      nullifier: result.nullifier,
      transactionHash: result.transactionHash,
      message: 'Fee paid successfully',
    });
  } catch (error) {
    console.error('Error in pay-fee:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Get balance
app.get('/api/payment/balance/:apiKey', async (req: Request, res: Response) => {
  try {
    const { apiKey } = req.params;

    const result = getMachineBalance(apiKey);

    if (!result.success) {
      return res.status(404).json({
        error: result.error || 'Account not found',
      });
    }

    res.json({
      success: true,
      balance: result.balance,
      token: result.token,
    });
  } catch (error) {
    console.error('Error getting balance:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Start server
const PORT = config.port;

// Initialize database and start server
try {
  initDatabase();
  
  app.listen(PORT, () => {
    console.log(`🔐 ZK Payment Service running on port ${PORT}`);
    console.log(`📡 RPC: ${config.rpcUrl}`);
    console.log(`⛓️  Chain: ${config.chainId}`);
    console.log(`📄 Entrypoint: ${config.entrypointAddress}`);
    console.log(`💾 Database: ${config.dbPath}`);
    if (!SERVICE_PRIVATE_KEY) {
      console.warn('⚠️  SERVICE_PRIVATE_KEY not set - service will not function');
    }
  });
} catch (error) {
  console.error('Failed to initialize database:', error);
  process.exit(1);
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\nShutting down...');
  await closeDatabase();
  process.exit(0);
});
