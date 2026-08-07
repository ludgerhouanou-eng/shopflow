import { PaymentMethod, PaymentStatus } from './database';

export interface CreatePaymentParams {
  orderId: string;
  businessId: string;
  amount: number;
  currency: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  paymentMethod: PaymentMethod;
  idempotencyKey: string;
  callbackUrl: string;
}

export interface PaymentResult {
  paymentId?: string;
  transactionReference: string;
  status: PaymentStatus;
  paymentUrl?: string;
  rawResponse?: Record<string, any>;
}

export interface PaymentProvider {
  createPayment(params: CreatePaymentParams): Promise<PaymentResult>;
  getPaymentStatus(transactionReference: string): Promise<PaymentResult>;
  verifyWebhookSignature(payload: string | Buffer, headers: Record<string, string>): boolean;
  refundPayment?(transactionReference: string, amount: number): Promise<PaymentResult>;
}
