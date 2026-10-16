/**
 * PhonePe Payment Gateway Integration Architecture Module
 *
 * Implements the official server-side architecture for PhonePe standard checkout
 * (Redirect / PG standard v1 & v2 callback specifications).
 *
 * Architecture Principles:
 * 1. ZERO client-side trust: All transaction payloads, signature checksums (SHA256(payload + endpoint + salt) + '###' + keyIndex),
 *    status verifications, and callback validations are strictly calculated on the Node.js server.
 * 2. Secrets isolation: PHONEPE_MERCHANT_ID, PHONEPE_SALT_KEY, and PHONEPE_SALT_INDEX are retrieved exclusively from server env vars.
 * 3. Never marked Paid on frontend say-so: Orders are only updated to 'Paid' upon cryptographic or server-to-server status API response.
 * 4. Graceful readiness: If credentials are not yet configured, the module safely reports its configuration status without throwing errors or breaking checkout.
 */

import crypto from 'crypto';

export interface PhonePeConfig {
  merchantId: string;
  saltKey: string;
  saltIndex: string;
  env: 'UAT' | 'PROD';
  callbackUrl: string;
  redirectUrl: string;
}

export interface PaymentInitiationResult {
  success: boolean;
  orderId: string;
  transactionId: string;
  amount: number;
  paymentUrl?: string;
  status: 'PENDING' | 'CONFIG_REQUIRED' | 'FAILED';
  error?: string;
}

export interface PaymentStatusResult {
  success: boolean;
  orderId: string;
  transactionId: string;
  amount: number;
  paymentState: 'COMPLETED' | 'PENDING' | 'FAILED' | 'CANCELLED';
  responseCode?: string;
  rawStatus?: string;
  message?: string;
}

/**
 * Returns whether PhonePe credentials are fully configured in the server environment.
 */
export function isPhonePeConfigured(): boolean {
  const merchantId = process.env.PHONEPE_MERCHANT_ID;
  const saltKey = process.env.PHONEPE_SALT_KEY;
  const saltIndex = process.env.PHONEPE_SALT_INDEX;

  return Boolean(
    merchantId &&
    saltKey &&
    saltIndex &&
    !merchantId.includes('YOUR_') &&
    !saltKey.includes('YOUR_')
  );
}

/**
 * Returns PhonePe configuration from environment variables.
 */
export function getPhonePeConfig(): PhonePeConfig {
  const isProd = process.env.PHONEPE_ENV === 'PROD';
  const defaultHost = process.env.APP_URL || 'http://localhost:3000';

  return {
    merchantId: process.env.PHONEPE_MERCHANT_ID || '',
    saltKey: process.env.PHONEPE_SALT_KEY || '',
    saltIndex: process.env.PHONEPE_SALT_INDEX || '1',
    env: isProd ? 'PROD' : 'UAT',
    callbackUrl: process.env.PHONEPE_CALLBACK_URL || `${defaultHost}/api/payments/phonepe/callback`,
    redirectUrl: process.env.PHONEPE_REDIRECT_URL || `${defaultHost}/api/payments/phonepe/redirect`,
  };
}

/**
 * Generates official PhonePe X-VERIFY checksum:
 * SHA256(base64Payload + apiEndpoint + saltKey) + "###" + saltIndex
 */
export function generatePhonePeChecksum(
  base64Payload: string,
  apiEndpoint: string,
  saltKey: string,
  saltIndex: string
): string {
  const stringToHash = `${base64Payload}${apiEndpoint}${saltKey}`;
  const sha256Hash = crypto.createHash('sha256').update(stringToHash).digest('hex');
  return `${sha256Hash}###${saltIndex}`;
}

/**
 * Validates a PhonePe server callback X-VERIFY signature.
 */
export function verifyPhonePeCallbackSignature(
  base64Response: string,
  receivedChecksum: string
): boolean {
  const config = getPhonePeConfig();
  if (!config.saltKey) return false;

  const calculated = generatePhonePeChecksum(base64Response, '', config.saltKey, config.saltIndex);
  
  // Timing-safe comparison to prevent timing attacks
  try {
    const calculatedBuf = Buffer.from(calculated);
    const receivedBuf = Buffer.from(receivedChecksum);
    if (calculatedBuf.length !== receivedBuf.length) return false;
    return crypto.timingSafeEqual(calculatedBuf, receivedBuf);
  } catch {
    return false;
  }
}

/**
 * Builds the official PhonePe Payment Request Payload
 * Amount must be in PAISA (INR * 100).
 */
export function buildInitiatePaymentPayload(params: {
  orderId: string;
  orderReference: string;
  amountInRupees: number;
  customerMobile: string;
  customerEmail?: string;
}) {
  const config = getPhonePeConfig();
  const amountInPaise = Math.round(params.amountInRupees * 100);
  const merchantTransactionId = `TXN_${params.orderReference}_${Date.now()}`;

  const payload = {
    merchantId: config.merchantId,
    merchantTransactionId,
    merchantUserId: `CUST_${params.customerMobile.replace(/\D/g, '')}`,
    amount: amountInPaise,
    redirectUrl: `${config.redirectUrl}?merchantTransactionId=${merchantTransactionId}&orderRef=${encodeURIComponent(params.orderReference)}`,
    redirectMode: 'POST',
    callbackUrl: config.callbackUrl,
    mobileNumber: params.customerMobile.replace(/\D/g, '').slice(-10),
    paymentInstrument: {
      type: 'PAY_PAGE',
    },
  };

  const base64Payload = Buffer.from(JSON.stringify(payload)).toString('base64');
  const endpoint = '/pg/v1/pay';
  const checksum = generatePhonePeChecksum(base64Payload, endpoint, config.saltKey, config.saltIndex);

  return {
    merchantTransactionId,
    amountInPaise,
    base64Payload,
    endpoint,
    checksum,
    apiUrl: config.env === 'PROD'
      ? 'https://api.phonepe.com/apis/hermes/pg/v1/pay'
      : 'https://api-preprod.phonepe.com/apis/pg-sandbox/pg/v1/pay',
  };
}

/**
 * Prepares server-side PhonePe transaction order initiation.
 * If credentials are not yet configured, returns CONFIG_REQUIRED state.
 */
export async function initiatePhonePePayment(params: {
  orderId: string;
  orderReference: string;
  amountInRupees: number;
  customerMobile: string;
  customerEmail?: string;
}): Promise<PaymentInitiationResult> {
  if (!isPhonePeConfigured()) {
    return {
      success: false,
      orderId: params.orderId,
      transactionId: '',
      amount: params.amountInRupees,
      status: 'CONFIG_REQUIRED',
      error: 'PhonePe merchant credentials are not configured in server environment. Online payments are currently in setup mode.',
    };
  }

  const { merchantTransactionId, base64Payload, apiUrl, checksum } = buildInitiatePaymentPayload(params);

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-VERIFY': checksum,
        accept: 'application/json',
      },
      body: JSON.stringify({ request: base64Payload }),
    });

    const data: any = await response.json();

    if (data.success && data.data?.instrumentResponse?.redirectInfo?.url) {
      return {
        success: true,
        orderId: params.orderId,
        transactionId: merchantTransactionId,
        amount: params.amountInRupees,
        paymentUrl: data.data.instrumentResponse.redirectInfo.url,
        status: 'PENDING',
      };
    } else {
      return {
        success: false,
        orderId: params.orderId,
        transactionId: merchantTransactionId,
        amount: params.amountInRupees,
        status: 'FAILED',
        error: data.message || 'PhonePe gateway initiation rejected.',
      };
    }
  } catch (err: any) {
    return {
      success: false,
      orderId: params.orderId,
      transactionId: merchantTransactionId,
      amount: params.amountInRupees,
      status: 'FAILED',
      error: err.message || 'Failed to reach PhonePe gateway server.',
    };
  }
}

/**
 * Server-to-Server Payment Status Check
 * Endpoint: /pg/v1/status/{merchantId}/{merchantTransactionId}
 * Header: X-VERIFY = SHA256("/pg/v1/status/{merchantId}/{merchantTransactionId}" + saltKey) + "###" + saltIndex
 */
export async function checkPhonePePaymentStatus(
  merchantTransactionId: string
): Promise<PaymentStatusResult> {
  const config = getPhonePeConfig();

  if (!isPhonePeConfigured()) {
    return {
      success: false,
      orderId: '',
      transactionId: merchantTransactionId,
      amount: 0,
      paymentState: 'PENDING',
      message: 'PhonePe credentials not configured.',
    };
  }

  const endpoint = `/pg/v1/status/${config.merchantId}/${merchantTransactionId}`;
  const sha256 = crypto
    .createHash('sha256')
    .update(`${endpoint}${config.saltKey}`)
    .digest('hex');
  const checksum = `${sha256}###${config.saltIndex}`;

  const host = config.env === 'PROD'
    ? 'https://api.phonepe.com/apis/hermes'
    : 'https://api-preprod.phonepe.com/apis/pg-sandbox';

  try {
    const response = await fetch(`${host}${endpoint}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-VERIFY': checksum,
        'X-MERCHANT-ID': config.merchantId,
        accept: 'application/json',
      },
    });

    const data: any = await response.json();

    if (data.success && data.code === 'PAYMENT_SUCCESS') {
      return {
        success: true,
        orderId: data.data?.merchantOrderId || '',
        transactionId: merchantTransactionId,
        amount: (data.data?.amount || 0) / 100,
        paymentState: 'COMPLETED',
        responseCode: data.code,
        rawStatus: data.data?.state,
        message: 'Payment completed successfully via PhonePe.',
      };
    } else if (data.code === 'PAYMENT_PENDING') {
      return {
        success: true,
        orderId: data.data?.merchantOrderId || '',
        transactionId: merchantTransactionId,
        amount: (data.data?.amount || 0) / 100,
        paymentState: 'PENDING',
        responseCode: data.code,
        rawStatus: data.data?.state,
        message: 'Payment is pending customer authorization.',
      };
    } else {
      return {
        success: false,
        orderId: data.data?.merchantOrderId || '',
        transactionId: merchantTransactionId,
        amount: (data.data?.amount || 0) / 100,
        paymentState: 'FAILED',
        responseCode: data.code,
        rawStatus: data.data?.state,
        message: data.message || 'Payment failed or declined.',
      };
    }
  } catch (err: any) {
    return {
      success: false,
      orderId: '',
      transactionId: merchantTransactionId,
      amount: 0,
      paymentState: 'FAILED',
      message: err.message || 'Error communicating with PhonePe verification endpoint.',
    };
  }
}
