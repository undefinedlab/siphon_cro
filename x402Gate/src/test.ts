import { ethers } from 'ethers';
import { config, ENTRYPOINT_ABI } from './config';
import { checkPayment, verifyPayment, initializePaymentChecker } from './paymentChecker';

/**
 * Simple test script to verify middleware setup
 */
async function runTests() {
  console.log('🧪 Running x402 Gate Tests...\n');
  
  // Test 1: Configuration
  console.log('Test 1: Configuration');
  console.log('  ✓ Port:', config.port);
  console.log('  ✓ Backend URL:', config.backendUrl);
  console.log('  ✓ RPC URL:', config.rpcUrl);
  console.log('  ✓ Chain ID:', config.chainId);
  console.log('  ✓ Entrypoint:', config.entrypointAddress);
  console.log('  ✅ Configuration loaded\n');
  
  // Test 2: Provider Connection
  console.log('Test 2: Provider Connection');
  try {
    const { provider } = initializePaymentChecker();
    const blockNumber = await provider!.getBlockNumber();
    console.log('  ✓ Connected to chain');
    console.log('  ✓ Current block:', blockNumber);
    console.log('  ✅ Provider connection successful\n');
  } catch (error) {
    console.error('  ❌ Provider connection failed:', error);
    return;
  }
  
  // Test 3: Contract Connection
  console.log('Test 3: Contract Connection');
  try {
    const { contract } = initializePaymentChecker();
    const address = await contract!.getAddress();
    console.log('  ✓ Contract address:', address);
    console.log('  ✅ Contract connection successful\n');
  } catch (error) {
    console.error('  ❌ Contract connection failed:', error);
    return;
  }
  
  // Test 4: Payment Check (with test nullifier)
  console.log('Test 4: Payment Check');
  try {
    // Use a test nullifier (this will likely return 0, which is expected)
    const testNullifier = '0';
    const paymentAmount = await checkPayment(testNullifier);
    console.log('  ✓ Test nullifier checked:', testNullifier);
    console.log('  ✓ Payment amount:', paymentAmount.toString());
    console.log('  ✓ Paid:', paymentAmount > 0n ? 'Yes' : 'No');
    console.log('  ✅ Payment check function works\n');
  } catch (error) {
    console.error('  ❌ Payment check failed:', error);
    return;
  }
  
  // Test 5: Verify Payment Function
  console.log('Test 5: Verify Payment Function');
  try {
    const testNullifier = '0';
    const result = await verifyPayment(testNullifier);
    console.log('  ✓ Paid:', result.paid);
    console.log('  ✓ Amount:', result.amount.toString());
    console.log('  ✓ Sufficient:', result.sufficient);
    console.log('  ✅ Verify payment function works\n');
  } catch (error) {
    console.error('  ❌ Verify payment failed:', error);
    return;
  }
  
  // Test 6: Backend Connectivity (optional)
  console.log('Test 6: Backend Connectivity');
  try {
    const response = await fetch(`${config.backendUrl}/health`);
    if (response.ok) {
      const data = await response.json();
      console.log('  ✓ Backend reachable');
      console.log('  ✓ Backend response:', data);
      console.log('  ✅ Backend connection successful\n');
    } else {
      console.log('  ⚠️  Backend returned:', response.status);
      console.log('  ⚠️  (This is OK if backend is not running)\n');
    }
  } catch (error) {
    console.log('  ⚠️  Backend not reachable (expected if not running)');
    console.log('  ⚠️  Error:', (error as Error).message);
    console.log('  ℹ️  This is OK - backend will be checked at runtime\n');
  }
  
  console.log('✨ All tests completed!');
  console.log('\n📝 Next steps:');
  console.log('  1. Start the middleware: npm run dev');
  console.log('  2. Test the API endpoints with a real nullifier');
  console.log('  3. Integrate with frontend\n');
}

// Run tests
runTests().catch(console.error);
