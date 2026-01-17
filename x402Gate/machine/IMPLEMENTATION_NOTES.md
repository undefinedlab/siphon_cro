# Implementation Notes

## Current Status

✅ **Structure Complete**: All files created with proper architecture
⚠️ **ZK Integration Pending**: Needs actual ZK proof generation functions

## What's Implemented

1. **Database Layer** (`src/database.ts`)
   - Encrypted secret storage
   - Account management
   - CRUD operations for machine accounts

2. **Encryption** (`src/encryption.ts`)
   - AES-256-GCM encryption
   - Secure key derivation
   - Encrypt/decrypt functions

3. **Payment Service** (`src/paymentService.ts`)
   - Account creation interface
   - Fee payment interface
   - Balance checking

4. **ZK Service** (`src/zkService.ts`)
   - Placeholder implementations
   - Structure ready for integration

5. **Server** (`src/server.ts`)
   - Express API endpoints
   - Error handling
   - Database initialization

## What Needs Integration

### Required: Import ZK Functions

The `zkService.ts` file needs to import actual implementations:

```typescript
// In zkService.ts, replace placeholders with:
import { generateCommitmentData } from '../../../src/lib/zkHandler';
import { generateZKData } from '../../../src/lib/zkHandler';
import { payExecutionFee } from '../../../src/lib/handler';
```

### Required: Update Functions

1. **generateCommitmentData**: Use actual function from main codebase
2. **depositToVault**: Use actual deposit function
3. **generateZKProof**: Use actual `generateZKData` function
4. **payExecutionFee**: Use actual function from handler

## Setup Instructions

1. **Install dependencies**:
   ```bash
   cd x402Gate/machine
   npm install
   ```

2. **Create `.env` file** (copy from `.env.example`)

3. **Set SERVICE_PRIVATE_KEY**: 
   - Generate wallet: `ethers.Wallet.createRandom()`
   - Fund it with tokens
   - Set in `.env`

4. **Set ENCRYPTION_KEY**:
   - Generate: `openssl rand -base64 32`
   - Set in `.env`

5. **Integrate ZK functions** (see above)

6. **Run service**:
   ```bash
   npm run dev
   ```

## Testing Flow

1. **Create account**:
   ```bash
   curl -X POST http://localhost:5007/api/payment/deposit \
     -H "Content-Type: application/json" \
     -d '{"apiKey":"test_machine","amount":"1.0","token":"ETH"}'
   ```

2. **Check balance**:
   ```bash
   curl http://localhost:5007/api/payment/balance/test_machine
   ```

3. **Pay fee**:
   ```bash
   curl -X POST http://localhost:5007/api/payment/pay-fee \
     -H "Content-Type: application/json" \
     -d '{"apiKey":"test_machine","amount":"0.001","token":"ETH"}'
   ```

4. **Use nullifier in x402**:
   ```bash
   curl -X POST http://localhost:5006/api/strategy/execute/limit-order \
     -H "Content-Type: application/json" \
     -H "X-Payment-Nullifier: <nullifier_from_step_3>" \
     -d '{...strategy_data}'
   ```

## Security Notes

- ⚠️ Encryption key MUST be changed in production
- ⚠️ Service wallet MUST be secured
- ⚠️ Database should be backed up regularly
- ⚠️ Add API key authentication before production
- ⚠️ Add rate limiting
- ⚠️ Use HTTPS in production
