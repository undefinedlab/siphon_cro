# x402 Gate - Payment Middleware

Simple payment verification middleware for Siphon Protocol that implements x402 payment standard using ZK proofs.

## Overview

This middleware sits between the frontend and backend, checking if execution fees have been paid before allowing strategy execution. It uses the ZK `feePayments` mapping on the Entrypoint contract to verify payments.

## How It Works

1. **Client Request**: Frontend sends strategy execution request with `X-Payment-Nullifier` header
2. **Payment Check**: Middleware queries contract `feePayments(nullifier)` mapping
3. **402 Response**: If not paid, returns HTTP 402 Payment Required
4. **Forward Request**: If paid, forwards request to backend
5. **Backend Execution**: Backend receives normal request and executes strategy

## Setup

### Install Dependencies

```bash
cd x402Gate
npm install
```

### Configure Environment

Copy `.env.example` to `.env` and update values:

```bash
cp .env.example .env
```

### Run Development Server

```bash
npm run dev
```

### Build for Production

```bash
npm run build
npm start
```

## API Endpoints

### Health Check
```
GET /health
```

### Check Payment Status
```
GET /api/payment/status/:nullifier
```

Returns:
```json
{
  "nullifier": "123...",
  "paid": true,
  "amount": "1000000000000000",
  "sufficient": true
}
```

### Execute Strategy (with payment check)
```
POST /api/strategy/execute/:strategyId
Headers:
  X-Payment-Nullifier: <nullifier_hash>
Body:
  { ...strategy_data }
```

**Response 402 (Payment Required)**:
```json
{
  "error": "Payment Required",
  "message": "Payment nullifier required. Please pay execution fee first.",
  "payment": {
    "type": "zk-proof",
    "strategyId": "..."
  }
}
```

**Response 200 (Payment Verified)**:
Forwards backend response

## Integration

### Frontend Changes

Update your API calls to use the middleware:

```typescript
// Before: Direct backend call
const response = await fetch('http://localhost:5005/createStrategy', ...);

// After: Middleware call
const response = await fetch('http://localhost:5006/api/strategy/execute/123', {
  headers: {
    'X-Payment-Nullifier': nullifier, // From payExecutionFee transaction
  },
  ...
});
```

### Payment Flow

1. User calls `payExecutionFee()` → gets `nullifier` from transaction
2. User retries strategy execution with `X-Payment-Nullifier` header
3. Middleware verifies payment on-chain
4. If verified → forwards to backend
5. Backend executes strategy

## Architecture

```
Frontend → x402Gate → Backend → Contract
           ↓
        Checks: feePayments(nullifier)
```

## Environment Variables

- `MIDDLEWARE_PORT`: Port for middleware server (default: 5006)
- `BACKEND_URL`: Backend API URL (default: http://localhost:5005)
- `RPC_URL`: Blockchain RPC endpoint
- `CHAIN_ID`: Chain ID (338 for Cronos Testnet)
- `ENTRYPOINT_ADDRESS`: Entrypoint contract address
- `CORS_ORIGIN`: Allowed CORS origin (default: http://localhost:3000)
