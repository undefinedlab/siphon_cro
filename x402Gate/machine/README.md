# ZK Payment Service for Machines

Enables machines to use private ZK payments via x402 without handling ZK complexity themselves.

## Overview

This service abstracts ZK proof generation and secret management, allowing machines to:
- Deposit funds privately (via ZK commitments)
- Pay execution fees privately (via ZK proofs)
- Use simple API (just API key)
- Maintain full privacy

## Architecture

```
Machine
  ↓
Payment Service (this service)
  ↓
  - Generates ZK commitments
  - Stores secrets securely (encrypted)
  - Generates ZK proofs
  - Pays fees on-chain
  ↓
Returns nullifier to machine
  ↓
Machine uses nullifier in x402 request
```

## Features

- **Private Deposits**: Machines deposit via ZK commitments
- **Private Payments**: Fees paid via ZK proofs
- **Secure Secret Storage**: Secrets encrypted in database
- **Simple API**: Machines just need API key
- **Balance Tracking**: Check available balance

## Setup

### Install Dependencies

```bash
cd machine
npm install
```

### Configure Environment

Create `.env` file:

```env
# Server
PAYMENT_SERVICE_PORT=5007

# Blockchain
RPC_URL=https://evm-t3.cronos.org
CHAIN_ID=338
ENTRYPOINT_ADDRESS=0x531993250171ca1173e96446a5e531F3e58D624D

# Database
DB_PATH=./data/payments.db

# Encryption (CHANGE IN PRODUCTION!)
ENCRYPTION_KEY=your-secure-encryption-key-here

# Service Wallet (CHANGE IN PRODUCTION!)
SERVICE_PRIVATE_KEY=your-service-wallet-private-key

# CORS
CORS_ORIGIN=*
```

### Run Service

```bash
npm run dev
```

## API Endpoints

### Create Account & Deposit

```http
POST /api/payment/deposit
Content-Type: application/json

{
  "apiKey": "machine_123",
  "amount": "1.0",
  "token": "ETH"
}
```

**Response:**
```json
{
  "success": true,
  "commitment": "0x...",
  "message": "Account created and funds deposited"
}
```

### Pay Execution Fee

```http
POST /api/payment/pay-fee
Content-Type: application/json

{
  "apiKey": "machine_123",
  "amount": "0.001",
  "token": "ETH"
}
```

**Response:**
```json
{
  "success": true,
  "nullifier": "9482578145332275198044027932040875063350373923929218886695036493595124610459",
  "transactionHash": "0x...",
  "message": "Fee paid successfully"
}
```

### Get Balance

```http
GET /api/payment/balance/:apiKey
```

**Response:**
```json
{
  "success": true,
  "balance": "0.999",
  "token": "ETH"
}
```

## Usage Flow

### 1. Machine Setup

```typescript
// Machine creates account and deposits
const response = await fetch('http://localhost:5007/api/payment/deposit', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    apiKey: 'my_machine_001',
    amount: '1.0',
    token: 'ETH'
  })
});

const { commitment } = await response.json();
// Account created, funds deposited privately
```

### 2. Pay Fee Before Strategy Execution

```typescript
// Machine pays execution fee
const feeResponse = await fetch('http://localhost:5007/api/payment/pay-fee', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    apiKey: 'my_machine_001',
    amount: '0.001',
    token: 'ETH'
  })
});

const { nullifier, transactionHash } = await feeResponse.json();
// Fee paid, got nullifier
```

### 3. Execute Strategy with x402

```typescript
// Machine executes strategy with nullifier
const strategyResponse = await fetch('http://localhost:5006/api/strategy/execute/limit-order', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Payment-Nullifier': nullifier,
    'X-API-Key': 'my_machine_001'
  },
  body: JSON.stringify(strategyData)
});

// Strategy executes if payment verified
```

## Security Considerations

### Encryption Key
- **MUST** be changed in production
- Use strong, random key (32+ bytes)
- Store securely (env var, secret manager)

### Service Wallet
- **MUST** be funded with tokens
- Keep private key secure
- Use hardware wallet or secure key management in production

### Database
- Encrypted at rest (secrets are encrypted)
- Backup regularly
- Restrict access

### API Keys
- Generate securely (UUID, crypto.randomBytes)
- Don't reuse across machines
- Revoke if compromised

## Integration with x402 Middleware

The x402 middleware can check payments from this service:

```typescript
// In x402 middleware
const nullifier = req.headers['x-payment-nullifier'];
const apiKey = req.headers['x-api-key'];

// Verify payment on-chain
const paid = await checkZKPayment(nullifier);

if (paid) {
  // Forward to backend
}
```
