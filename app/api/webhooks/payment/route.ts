import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getPaymentProvider } from '@/lib/payments/factory';

export async function POST(request: NextRequest) {
  const requestId = `wh_req_${Date.now()}`;
  
  try {
    const rawBody = await request.text();
    const headers: Record<string, string> = {};
    request.headers.forEach((value, key) => {
      headers[key.toLowerCase()] = value;
    });

    const provider = getPaymentProvider();

    // 1. VÉRIFICATION OBLIGATOIRE DE LA SIGNATURE DU WEBHOOK
    const isValidSignature = provider.verifyWebhookSignature(rawBody, headers);
    if (!isValidSignature && process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'WEBHOOK_INVALID',
            message: 'Signature de webhook invalide.',
            requestId,
          },
        },
        { status: 401 }
      );
    }

    const payload = JSON.parse(rawBody);
    const providerEventId = payload.eventId || payload.id || `evt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const eventType = payload.eventType || payload.type || 'payment.succeeded';
    const orderId = payload.orderId || payload.data?.orderId;
    const transactionReference = payload.transactionReference || payload.data?.transactionReference;
    const providerName = process.env.PAYMENT_PROVIDER || 'sandbox';

    const adminSupabase = createAdminClient();

    // 2. ENREGISTREMENT ET VÉRIFICATION D'IDEMPOTENCE DANS WEBHOOK_EVENTS
    const { data: existingEvent, error: insertErr } = await adminSupabase
      .from('webhook_events')
      .insert({
        provider: providerName,
        provider_event_id: providerEventId,
        event_type: eventType,
        payload,
        status: 'pending',
      })
      .select()
      .single();

    // Si erreur de contrainte unique -> événement déjà reçu et traité !
    if (insertErr && insertErr.code === '23505') {
      return NextResponse.json({
        success: true,
        message: 'Webhook déjà reçu et ignoré (Idempotence).',
        requestId,
      });
    }

    if (insertErr || !existingEvent) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: `Erreur d'enregistrement du webhook: ${insertErr?.message}`,
            requestId,
          },
        },
        { status: 500 }
      );
    }

    // 3. TRAITEMENT DU WEBHOOK PAIEMENT RÉUSSI
    if (eventType === 'payment.succeeded' && orderId) {
      // Confirmation de la commande
      const { error: orderErr } = await adminSupabase
        .from('orders')
        .update({
          status: 'confirmed',
          payment_status: 'succeeded',
          updated_at: new Date().toISOString(),
        })
        .eq('id', orderId);

      if (orderErr) {
        await adminSupabase
          .from('webhook_events')
          .update({
            status: 'failed',
            error_message: `Erreur mise à jour commande: ${orderErr.message}`,
          })
          .eq('id', existingEvent.id);

        return NextResponse.json(
          { success: false, error: { code: 'INTERNAL_ERROR', message: orderErr.message, requestId } },
          { status: 500 }
        );
      }

      // Confirmation du paiement
      await adminSupabase
        .from('payments')
        .update({
          status: 'succeeded',
          transaction_reference: transactionReference,
          updated_at: new Date().toISOString(),
        })
        .eq('order_id', orderId);

      // Marquer le webhook comme traité
      await adminSupabase
        .from('webhook_events')
        .update({
          status: 'processed',
          processed_at: new Date().toISOString(),
        })
        .eq('id', existingEvent.id);

      return NextResponse.json({
        success: true,
        message: 'Commande et paiement confirmés avec succès.',
        requestId,
      });
    }

    // Traitement des paiements échoués
    if (eventType === 'payment.failed' && orderId) {
      await adminSupabase
        .from('orders')
        .update({
          payment_status: 'failed',
          updated_at: new Date().toISOString(),
        })
        .eq('id', orderId);

      await adminSupabase
        .from('payments')
        .update({
          status: 'failed',
          updated_at: new Date().toISOString(),
        })
        .eq('order_id', orderId);

      await adminSupabase
        .from('webhook_events')
        .update({
          status: 'processed',
          processed_at: new Date().toISOString(),
        })
        .eq('id', existingEvent.id);

      return NextResponse.json({
        success: true,
        message: 'Paiement échoué enregistré.',
        requestId,
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Type d’événement ignoré sans erreur.',
      requestId,
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: err.message || 'Erreur lors du traitement du webhook.',
          requestId,
        },
      },
      { status: 500 }
    );
  }
}
