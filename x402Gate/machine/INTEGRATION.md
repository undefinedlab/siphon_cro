# ZK Payment Service Integration

## Overview

The ZK Payment Service enables machines to use private ZK payments via x402 without handling ZK complexity themselves.

## Architecture

```
Machine
  ↓
Payment Service (port 5007)
  ↓
  - Generates ZK commitments
  - Stores secrets securely (encrypted)
  - Generates ZK proofs
  - Pays fees on-chain
  ↓
Returns nullifier
  ↓
Machine → x402 Middleware (port 5006)
  ↓
Middleware verifies payment
  ↓
Backend executes strategy
```

## Current Status

⚠️ **Placeholder Implementation**: The ZK proof generation functions are placeholders. To make this fully functional, you need to:

1. **Import ZK functions from main codebase**:
   - `generateCommitmentData` from `src/lib/zkHandler.ts`
   - `generateZKData` from `src/lib/zkHandler.ts`
   - `payExecutionFee` from `src/lib/handler.ts`

2. **Update zkService.ts** to use actual implementations

## API Endpoints

### Create Account & Deposit
```
POST /api/payment/deposit
{
  "apiKey": "machine_123",
  "amount": "1.0",
  "token": "ETH"
}
```

### Pay Execution Fee
```
POST /api/payment/pay-fee
{
  "apiKey": "machine_123",
  "amount": "0.001",
  "token": "ETH"
}
→ Returns: { nullifier, transactionHash }
```

### Get Balance
```
GET /api/payment/balance/:apiKey
→ Returns: { balance, token }
```

## Integration Steps

1. **Install dependencies**:
   ```bash
   cd x402Gate/machine
   npm install
   ```

2. **Set environment variables** (see `.env.example`)

3. **Fund service wallet** with tokens

4. **Import ZK functions** from main codebase into `zkService.ts`

5. **Start service**:
   ```bash
   npm run dev
   ```

## Next Steps

- [ ] Import actual ZK proof generation functions
- [ ] Test deposit flow
- [ ] Test fee payment flow
- [ ] Integrate with x402 middleware
- [ ] Add API key authentication
- [ ] Add rate limiting
- [ ] Production security hardening
