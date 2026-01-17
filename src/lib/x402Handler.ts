/**
 * x402 Payment Handler
 * Handles HTTP 402 Payment Required responses and integrates with x402 middleware
 */

const MIDDLEWARE_URL = process.env.NEXT_PUBLIC_X402_MIDDLEWARE_URL || 'http://localhost:5006';

export interface X402PaymentResponse {
  error: string;
  message: string;
  payment: {
    type: string;
    strategyId?: string;
    nullifier?: string;
    amount?: string;
    token?: string;
  };
}

/**
 * Check payment status for a nullifier
 */
export async function checkPaymentStatus(nullifier: string): Promise<{
  paid: boolean;
  amount: string;
  sufficient: boolean;
}> {
  try {
    const response = await fetch(`${MIDDLEWARE_URL}/api/payment/status/${nullifier}`);
    
    if (!response.ok) {
      throw new Error(`Failed to check payment status: ${response.statusText}`);
    }
    
    const data = await response.json();
    return {
      paid: data.paid,
      amount: data.amount,
      sufficient: data.sufficient,
    };
  } catch (error) {
    console.error('Error checking payment status:', error);
    throw error;
  }
}

/**
 * Execute strategy through x402 middleware
 * Automatically handles 402 responses and payment verification
 */
export async function executeStrategyWithX402(
  strategyId: string,
  strategyPayload: unknown,
  paymentNullifier: string,
  options: {
    apiToken?: string;
    on402Response?: (response: X402PaymentResponse) => void;
  } = {}
): Promise<{ success: boolean; data?: unknown; error?: string }> {
  try {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'X-Payment-Nullifier': paymentNullifier,
    };

    if (options.apiToken) {
      headers['X-API-TOKEN'] = options.apiToken;
    }

    const response = await fetch(`${MIDDLEWARE_URL}/api/strategy/execute/${strategyId}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(strategyPayload),
    });

    // Handle 402 Payment Required
    if (response.status === 402) {
      const paymentResponse: X402PaymentResponse = await response.json();
      
      if (options.on402Response) {
        options.on402Response(paymentResponse);
      }
      
      return {
        success: false,
        error: `Payment required: ${paymentResponse.message}`,
      };
    }

    // Handle other errors
    if (!response.ok) {
      const errorText = await response.text();
      return {
        success: false,
        error: `HTTP ${response.status}: ${errorText}`,
      };
    }

    // Success - parse response
    const data = await response.json();
    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error('Error executing strategy with x402:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Enhanced fetch with automatic x402 payment handling
 * Falls back to direct backend call if middleware is not available
 */
export async function fetchWithX402(
  url: string,
  options: RequestInit & {
    paymentNullifier?: string;
    strategyId?: string;
    on402Response?: (response: X402PaymentResponse) => void;
  } = {}
): Promise<Response> {
  const { paymentNullifier, strategyId, on402Response, ...fetchOptions } = options;

  // If payment nullifier and strategy ID provided, use middleware
  if (paymentNullifier && strategyId) {
    const middlewareUrl = `${MIDDLEWARE_URL}/api/strategy/execute/${strategyId}`;
    
    const headers = new Headers(fetchOptions.headers);
    headers.set('X-Payment-Nullifier', paymentNullifier);
    headers.set('Content-Type', 'application/json');

    const response = await fetch(middlewareUrl, {
      ...fetchOptions,
      headers,
      body: fetchOptions.body || JSON.stringify(options),
    });

    // Handle 402
    if (response.status === 402 && on402Response) {
      const paymentResponse: X402PaymentResponse = await response.json();
      on402Response(paymentResponse);
    }

    return response;
  }

  // Fallback to direct fetch
  return fetch(url, fetchOptions);
}
