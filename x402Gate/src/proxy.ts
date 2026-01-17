import { config } from './config';

/**
 * Forward request to backend
 * @param path - The backend path to forward to
 * @param method - HTTP method
 * @param headers - Request headers
 * @param body - Request body
 * @returns Response from backend
 */
export async function forwardToBackend(
  path: string,
  method: string = 'POST',
  headers: Record<string, string> = {},
  body?: any
): Promise<Response> {
  const url = `${config.backendUrl}${path}`;
  
  const requestOptions: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  };
  
  if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
    requestOptions.body = JSON.stringify(body);
  }
  
  try {
    const response = await fetch(url, requestOptions);
    return response;
  } catch (error) {
    console.error('Error forwarding to backend:', error);
    throw error;
  }
}

/**
 * Create 402 Payment Required response
 * @param paymentInfo - Payment details
 * @returns Response object
 */
export function create402Response(paymentInfo: {
  amount?: string;
  token?: string;
  strategyId?: string;
  message?: string;
}) {
  return {
    status: 402,
    body: {
      error: 'Payment Required',
      message: paymentInfo.message || 'Payment required to execute this strategy',
      payment: {
        type: 'zk-proof',
        nullifier: paymentInfo.strategyId, // Strategy ID can be used as identifier
        ...paymentInfo,
      },
    },
  };
}
