'use server';

import { createClient } from '@/lib/supabase/server';
import { Customer } from '@/types/database';

export async function findOrCreateCustomer(
  businessId: string,
  fullName: string,
  phone: string,
  address?: string
): Promise<{ success: boolean; customer?: Customer; error?: string }> {
  const supabase = await createClient();

  // 1. Détection client existant par numéro de téléphone dans cette boutique
  const { data: existingCustomer } = await supabase
    .from('customers')
    .select('*')
    .eq('business_id', businessId)
    .eq('phone', phone)
    .maybeSingle();

  if (existingCustomer) {
    return { success: true, customer: existingCustomer as Customer };
  }

  // 2. Création nouveau client
  const { data: newCustomer, error } = await supabase
    .from('customers')
    .insert({
      business_id: businessId,
      full_name: fullName,
      phone,
      delivery_address: address || null,
      total_orders: 0,
      total_spent: 0,
    })
    .select()
    .single();

  if (error || !newCustomer) {
    return { success: false, error: `Erreur création client: ${error?.message}` };
  }

  return { success: true, customer: newCustomer as Customer };
}

export async function getBusinessCustomers(): Promise<{ success: boolean; customers?: Customer[]; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { success: false, error: 'AUTH_REQUIRED' };

  const { data: member } = await supabase
    .from('business_members')
    .select('business_id')
    .eq('user_id', user.id)
    .single();

  if (!member) return { success: false, error: 'Boutique introuvable' };

  const { data: customers, error } = await supabase
    .from('customers')
    .select('*')
    .eq('business_id', member.business_id)
    .order('updated_at', { ascending: false });

  if (error) return { success: false, error: error.message };

  return { success: true, customers: customers as Customer[] };
}
