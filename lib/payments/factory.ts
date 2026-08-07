import { PaymentProvider } from '@/types/payment';
import { SandboxPaymentProvider } from './sandbox';

export function getPaymentProvider(): PaymentProvider {
  const providerName = (process.env.PAYMENT_PROVIDER || 'sandbox').toLowerCase();

  switch (providerName) {
    case 'sandbox':
    default:
      return new SandboxPaymentProvider();
  }
}
