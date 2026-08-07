'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { getPaymentProvider } from '@/lib/payments/factory';
import { PaymentMethod } from '@/types/database';

export async function initiatePayment(params: {
  orderId: string;
  businessId: string;
  amount: number;
  customerName: string;
  customerPhone: string;
  paymentMethod: PaymentMethod;
  idempotencyKey: string;
}) {
  const adminSupabase = createAdminClient();

  // 1. Vérifier si un paiement existe déjà avec cette clé d'idempotence
  const { data: existingPayment } = await adminSupabase
    .from('payments')
    .select('*')
    .eq('idempotency_key', params.idempotencyKey)
    .maybeSingle();

  if (existingPayment) {
    return {
      success: true,
      payment: existingPayment,
      message: 'Tentative de paiement déjà existante.',
    };
  }

  // 2. Traitement des paiements à la livraison (COD) ou Mobile Money Manuel
  if (params.paymentMethod === 'cash_on_delivery' || params.paymentMethod === 'mobile_money_manual') {
    const { data: codPayment, error } = await adminSupabase
      .from('payments')
      .insert({
        business_id: params.businessId,
        order_id: params.orderId,
        provider: params.paymentMethod,
        idempotency_key: params.idempotencyKey,
        amount: params.amount,
        status: 'pending',
        payment_method: params.paymentMethod,
        metadata: {
          note: params.paymentMethod === 'cash_on_delivery' ? 'Paiement prévu à la livraison' : 'Paiement manuel Mobile Money',
        },
      })
      .select()
      .single();

    if (error) {
      return { success: false, error: `Erreur création paiement: ${error.message}` };
    }

    return {
      success: true,
      payment: codPayment,
      redirectUrl: null,
    };
  }

  // 3. Traitement des paiements en ligne via l'adaptateur
  const provider = getPaymentProvider();
  const callbackUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/checkout/confirmation?orderId=${params.orderId}`;

  try {
    const result = await provider.createPayment({
      orderId: params.orderId,
      businessId: params.businessId,
      amount: params.amount,
      currency: 'XOF',
      customerName: params.customerName,
      customerPhone: params.customerPhone,
      paymentMethod: params.paymentMethod,
      idempotencyKey: params.idempotencyKey,
      callbackUrl,
    });

    const { data: newPayment, error: payErr } = await adminSupabase
      .from('payments')
      .insert({
        business_id: params.businessId,
        order_id: params.orderId,
        provider: process.env.PAYMENT_PROVIDER || 'sandbox',
        transaction_reference: result.transactionReference,
        idempotency_key: params.idempotencyKey,
        amount: params.amount,
        status: result.status,
        payment_method: params.paymentMethod,
        provider_response: result.rawResponse || null,
      })
      .select()
      .single();

    if (payErr) {
      return { success: false, error: `Échec d'enregistrement du paiement: ${payErr.message}` };
    }

    return {
      success: true,
      payment: newPayment,
      redirectUrl: result.paymentUrl,
    };
  } catch (err: any) {
    return {
      success: false,
      error: `PAYMENT_PROVIDER_ERROR: ${err.message}`,
    };
  }
}

export async function retryFailedWebhook(webhookEventId: string) {
  const adminSupabase = createAdminClient();

  const { data: event, error } = await adminSupabase
    .from('webhook_events')
    .select('*')
    .eq('id', webhookEventId)
    .single();

  if (error || !event) {
    return { success: false, error: 'Événement webhook introuvable.' };
  }

  if (event.status === 'processed') {
    return { success: true, message: 'Le webhook a déjà été traité avec succès.' };
  }

  // Relance du traitement
  const payload = event.payload;
  const { orderId, transactionReference, eventType } = payload;

  if (eventType === 'payment.succeeded' && orderId) {
    // Mettre à jour la commande et le paiement
    await adminSupabase
      .from('orders')
      .update({
        status: 'confirmed',
        payment_status: 'succeeded',
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId);

    await adminSupabase
      .from('payments')
      .update({
        status: 'succeeded',
        transaction_reference: transactionReference,
        updated_at: new Date().toISOString(),
      })
      .eq('order_id', orderId);

    await adminSupabase
      .from('webhook_events')
      .update({
        status: 'processed',
        processed_at: new Date().toISOString(),
        error_message: null,
      })
      .eq('id', event.id);

    return { success: true, message: 'Webhook relancé et traité avec succès.' };
  }

  return { success: false, error: 'Type d’événement non pris en charge pour la relance.' };
}
