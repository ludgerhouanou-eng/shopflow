'use server';

import { createClient } from '@/lib/supabase/server';
import { businessSettingsSchema, BusinessSettingsInput } from '@/lib/validations/business';
import { Business, BusinessMemberWithBusiness } from '@/types/database';
import { revalidatePath } from 'next/cache';

export async function getCurrentUserBusiness(): Promise<{ success: boolean; business?: Business; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Accès non autorisé. Veuillez vous connecter.' };
  }

  // 1. Requête relationnelle typée avec jointure Supabase
  const { data: rawMember, error: memberError } = await supabase
    .from('business_members')
    .select('*, businesses(*)')
    .eq('user_id', user.id)
    .single();

  const member = rawMember as unknown as BusinessMemberWithBusiness | null;

  if (memberError || !member || !member.businesses) {
    return { success: false, error: 'Aucune boutique associée à ce compte.' };
  }

  return { success: true, business: member.businesses };
}

export async function updateBusinessSettings(input: BusinessSettingsInput) {
  const validation = businessSettingsSchema.safeParse(input);
  if (!validation.success) {
    return { success: false, error: validation.error.errors[0].message };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'AUTH_REQUIRED' };

  const { data: member } = await supabase
    .from('business_members')
    .select('business_id, role')
    .eq('user_id', user.id)
    .single();

  if (!member || !['owner', 'manager'].includes(member.role)) {
    return { success: false, error: 'Droits insuffisants pour modifier la boutique.' };
  }

  const {
    name,
    slug,
    description,
    whatsappNumber,
    address,
    city,
    deliveryFee,
    freeDeliveryAbove,
    acceptCod,
    acceptOnline,
    mobileMoneyNumber,
  } = validation.data;

  const { error } = await supabase
    .from('businesses')
    .update({
      name,
      slug,
      description,
      whatsapp_number: whatsappNumber,
      address,
      city,
      delivery_settings: {
        delivery_fee: deliveryFee,
        free_delivery_above: freeDeliveryAbove ?? null,
      },
      payment_settings: {
        accept_cod: acceptCod,
        accept_online: acceptOnline,
        mobile_money_number: mobileMoneyNumber ?? '',
      },
      updated_at: new Date().toISOString(),
    })
    .eq('id', member.business_id);

  if (error) {
    return { success: false, error: `Échec de la mise à jour : ${error.message}` };
  }

  revalidatePath('/settings');
  revalidatePath('/dashboard');
  return { success: true, message: 'Paramètres de la boutique mis à jour avec succès.' };
}
