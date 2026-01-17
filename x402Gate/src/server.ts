import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { config } from './config';
import { checkPayment, verifyPayment } from './paymentChecker';
import { forwardToBackend, create402Response } from './proxy';

const app = express();

// Middleware
app.use(cors({
  origin: config.corsOrigin,
  credentials: true,
}));
app.use(express.json());

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'healthy', service: 'x402-gate' });
});

// Check payment status endpoint
app.get('/api/payment/status/:nullifier', async (req: Request, res: Response) => {
  try {
    const { nullifier } = req.params;
    
    if (!nullifier) {
      return res.status(400).json({ error: 'Nullifier is required' });
    }
    
    const paymentStatus = await verifyPayment(nullifier);
    
    res.json({
      nullifier,
      paid: paymentStatus.paid,
      amount: paymentStatus.amount.toString(),
      sufficient: paymentStatus.sufficient,
    });
  } catch (error) {
    console.error('Error checking payment status:', error);
    res.status(500).json({ 
      error: 'Failed to check payment status',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Main strategy execution endpoint
app.post('/api/strategy/execute/:strategyId', async (req: Request, res: Response) => {
  try {
    const { strategyId } = req.params;
    const nullifier = req.headers['x-payment-nullifier'] as string;
    
    // Check if nullifier is provided
    if (!nullifier) {
      const paymentResponse = create402Response({
        strategyId,
        message: 'Payment nullifier required. Please pay execution fee first.',
      });
      
      return res.status(402).json(paymentResponse.body);
    }
    
    // Verify payment on-chain
    console.log(`Checking payment for nullifier: ${nullifier}`);
    const paymentStatus = await verifyPayment(nullifier);
    
    if (!paymentStatus.paid) {
      const paymentResponse = create402Response({
        strategyId,
        message: `Payment not found for nullifier: ${nullifier}. Please pay execution fee first.`,
      });
      
      return res.status(402).json(paymentResponse.body);
    }
    
    console.log(`Payment verified: ${paymentStatus.amount.toString()} paid`);
    
    // Payment verified, forward to payload generator
    // Payload generator will then forward to trade executor
    const backendPath = `/generatePayload`; // Payload generator endpoint
    const backendResponse = await forwardToBackend(
      backendPath,
      'POST',
      {
        'X-Payment-Nullifier': nullifier,
        'X-Payment-Verified': 'true',
        'X-Strategy-Id': strategyId,
      },
      req.body
    );
    
    // Forward backend response to client
    const responseData = await backendResponse.json();
    res.status(backendResponse.status).json(responseData);
    
  } catch (error) {
    console.error('Error in strategy execution:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Generic proxy endpoint for other backend routes
app.all('/api/*', async (req: Request, res: Response) => {
  try {
    // Extract path after /api
    const backendPath = req.path.replace('/api', '');
    
    // Forward to backend
    const backendResponse = await forwardToBackend(
      backendPath,
      req.method,
      req.headers as Record<string, string>,
      req.body
    );
    
    // Forward response
    const responseData = await backendResponse.json();
    res.status(backendResponse.status).json(responseData);
    
  } catch (error) {
    console.error('Error proxying request:', error);
    res.status(500).json({
      error: 'Failed to proxy request',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message,
  });
});

// Start server
const PORT = config.port;
app.listen(PORT, () => {
  console.log(`🚪 x402 Gate middleware running on port ${PORT}`);
  console.log(`📡 Backend URL: ${config.backendUrl}`);
  console.log(`⛓️  Chain: ${config.chainId} (${config.rpcUrl})`);
  console.log(`📄 Entrypoint: ${config.entrypointAddress}`);
});
