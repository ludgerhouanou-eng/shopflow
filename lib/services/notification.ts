import { createAdminClient } from '@/lib/supabase/admin';

export interface SendNotificationPayload {
  businessId: string;
  recipientType: 'merchant' | 'customer';
  recipientContact: string; // email ou numéro de téléphone
  channel: 'email' | 'sms' | 'whatsapp';
  title: string;
  body: string;
}

export class NotificationService {
  private static instance: NotificationService;

  private constructor() {}

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  async sendNotification(payload: SendNotificationPayload): Promise<{ success: boolean; messageId?: string }> {
    const adminSupabase = createAdminClient();

    // 1. Journalisation dans la table notifications
    const { data: notif, error } = await adminSupabase
      .from('notifications')
      .insert({
        business_id: payload.businessId,
        recipient_type: payload.recipientType,
        recipient_contact: payload.recipientContact,
        channel: payload.channel,
        title: payload.title,
        body: payload.body,
        status: 'sent',
        sent_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Erreur journalisation notification:', error);
      return { success: false };
    }

    // 2. Simulation d'envoi selon le canal (Mock / Dev Mode)
    console.log(`[Notification Services] [${payload.channel.toUpperCase()}] à ${payload.recipientContact}:`);
    console.log(`Title: ${payload.title}`);
    console.log(`Body: ${payload.body}`);

    return {
      success: true,
      messageId: notif.id,
    };
  }

  async notifyOrderCreated(businessId: string, orderNumber: string, customerPhone: string, totalAmount: number) {
    return this.sendNotification({
      businessId,
      recipientType: 'customer',
      recipientContact: customerPhone,
      channel: 'sms',
      title: 'Commande enregistrée',
      body: `ShopFlow: Votre commande ${orderNumber} de ${totalAmount} FCFA a bien été enregistrée. Merci pour votre confiance !`,
    });
  }

  async notifyLowStock(businessId: string, productName: string, remainingStock: number, merchantEmail: string) {
    return this.sendNotification({
      businessId,
      recipientType: 'merchant',
      recipientContact: merchantEmail,
      channel: 'email',
      title: 'Alerte Stock Faible',
      body: `Attention : Le produit "${productName}" n'a plus que ${remainingStock} unité(s) en stock. Pensez à réapprovisionner.`,
    });
  }
}
