import { PaymentProvider, CreatePaymentParams, PaymentResult } from '@/types/payment';
import crypto from 'crypto';

export class SandboxPaymentProvider implements PaymentProvider {
  private apiKey: string;
  private secretKey: string;
  private webhookSecret: string;

  constructor() {
    this.apiKey = process.env.PAYMENT_API_KEY || 'sb_api_key_mock_12345';
    this.secretKey = process.env.PAYMENT_SECRET_KEY || 'sb_sec_key_mock_67890';
    this.webhookSecret = process.env.PAYMENT_WEBHOOK_SECRET || 'whsec_mock_abcdef123456789';
  }

  async createPayment(params: CreatePaymentParams): Promise<PaymentResult> {
    const transactionReference = `REF_SB_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;

    // URL de redirection simulée pour la sandbox
    const paymentUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/checkout/sandbox-pay?ref=${transactionReference}&amount=${params.amount}&idemp=${params.idempotencyKey}`;

    return {
      transactionReference,
      status: 'pending',
      paymentUrl,
      rawResponse: {
        provider: 'sandbox',
        params,
        timestamp: new Date().toISOString(),
      },
    };
  }

  async getPaymentStatus(transactionReference: string): Promise<PaymentResult> {
    // Simulation: les références terminées par 'FAIL' sont échouées, les autres réussies
    const isFailed = transactionReference.endsWith('FAIL');

    return {
      transactionReference,
      status: isFailed ? 'failed' : 'succeeded',
      rawResponse: {
        provider: 'sandbox',
        checkedAt: new Date().toISOString(),
      },
    };
  }

  verifyWebhookSignature(payload: string | Buffer, headers: Record<string, string>): boolean {
    const signature = headers['x-payment-signature'] || headers['X-Payment-Signature'];
    if (!signature) return false;

    const payloadString = typeof payload === 'string' ? payload : payload.toString('utf8');

    // Génération signature HMAC SHA-256 avec la clé secrète du webhook
    const expectedSignature = crypto
      .createHmac('sha256', this.webhookSecret)
      .update(payloadString)
      .digest('hex');

    const bufSignature = Buffer.from(signature);
    const bufExpected = Buffer.from(expectedSignature);

    if (bufSignature.length !== bufExpected.length) {
      return false;
    }

    return crypto.timingSafeEqual(bufSignature, bufExpected);
  }

  async refundPayment(transactionReference: string, amount: number): Promise<PaymentResult> {
    return {
      transactionReference,
      status: 'refunded',
      rawResponse: {
        provider: 'sandbox',
        refundedAmount: amount,
        refundedAt: new Date().toISOString(),
      },
    };
  }
}
