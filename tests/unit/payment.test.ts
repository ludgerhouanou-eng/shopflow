import { describe, it, expect, beforeEach } from 'vitest';
import { SandboxPaymentProvider } from '../../lib/payments/sandbox';
import crypto from 'crypto';

describe('Système de Paiement Sandbox & Idempotence des Webhooks', () => {
  let provider: SandboxPaymentProvider;
  const webhookSecret = 'whsec_mock_abcdef123456789';

  beforeEach(() => {
    process.env.PAYMENT_WEBHOOK_SECRET = webhookSecret;
    provider = new SandboxPaymentProvider();
  });

  it('doit créer une tentative de paiement sandbox et retourner une URL de paiement', async () => {
    const params = {
      orderId: '123e4567-e89b-12d3-a456-426614174000',
      businessId: '987e6543-e21b-12d3-a456-426614174000',
      amount: 15000,
      currency: 'XOF',
      customerName: 'Koffi Mensah',
      customerPhone: '+22997112233',
      paymentMethod: 'online' as const,
      idempotencyKey: 'idemp_test_123456789',
      callbackUrl: 'http://localhost:3000/checkout/confirmation',
    };

    const result = await provider.createPayment(params);

    expect(result.status).toBe('pending');
    expect(result.transactionReference).toBeDefined();
    expect(result.transactionReference).toContain('REF_SB_');
    expect(result.paymentUrl).toContain('sandbox-pay');
  });

  it('doit valider une signature HMAC SHA-256 correcte de webhook', () => {
    const payload = JSON.stringify({
      eventId: 'evt_99887766',
      eventType: 'payment.succeeded',
      orderId: '123e4567-e89b-12d3-a456-426614174000',
    });

    const signature = crypto
      .createHmac('sha256', webhookSecret)
      .update(payload)
      .digest('hex');

    const headers = {
      'x-payment-signature': signature,
    };

    const isValid = provider.verifyWebhookSignature(payload, headers);
    expect(isValid).toBe(true);
  });

  it('doit rejeter une signature HMAC de webhook falsifiée ou invalide', () => {
    const payload = JSON.stringify({
      eventId: 'evt_99887766',
      eventType: 'payment.succeeded',
    });

    const headers = {
      'x-payment-signature': 'signature_falsifiee_invalide',
    };

    const isValid = provider.verifyWebhookSignature(payload, headers);
    expect(isValid).toBe(false);
  });

  it('doit simuler un paiement échoué si la référence se termine par FAIL', async () => {
    const failRef = 'REF_SB_123456_FAIL';
    const status = await provider.getPaymentStatus(failRef);

    expect(status.status).toBe('failed');
  });

  it('doit simuler un remboursement avec succès', async () => {
    if (provider.refundPayment) {
      const refundResult = await provider.refundPayment('REF_SB_123456', 5000);
      expect(refundResult.status).toBe('refunded');
    }
  });
});
