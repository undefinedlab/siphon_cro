# x402 Middleware Integration Guide


## Flow Diagram

```
Frontend 
    ↓
1. Pay execution fee → get nullifier
    ↓
2. Call x402 middleware with nullifier
    ↓
x402Gate Middleware 
    ↓
3. Check payment on contract: feePayments(nullifier)
    ↓
4. If paid → Forward to Payload Generator 
    ↓
Payload Generator
    ↓
5. Forward to Trade Executor 
    ↓
Trade Executor
    ↓
6. Execute strategy
```
