'use server';

import { createClient } from '@/lib/supabase/server';
import { Subscription } from '@/types/database';

export interface PlanLimits {
  code: 'free' | 'standard' | 'pro';
  name: string;
  maxProducts: number;
  maxOrdersPerMonth: number;
  maxUsers: number;
  priceFCFA: number;
}

export const PLAN_CONFIGS: Record<string, PlanLimits> = {
  free: {
    code: 'free',
    name: 'Plan Gratuit',
    maxProducts: 20,
    maxOrdersPerMonth: 50,
    maxUsers: 2,
    priceFCFA: 0,
  },
  standard: {
    code: 'standard',
    name: 'Plan Standard',
    maxProducts: 100,
    maxOrdersPerMonth: 500,
    maxUsers: 5,
    priceFCFA: 5000,
  },
  pro: {
    code: 'pro',
    name: 'Plan Professionnel',
    maxProducts: 99999,
    maxOrdersPerMonth: 99999,
    maxUsers: 20,
    priceFCFA: 15000,
  },
};

export async function getCurrentSubscription(): Promise<{ success: boolean; subscription?: Subscription; planDetails?: PlanLimits; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { success: false, error: 'AUTH_REQUIRED' };

  const { data: member } = await supabase
    .from('business_members')
    .select('business_id')
    .eq('user_id', user.id)
    .single();

  if (!member) return { success: false, error: 'Boutique introuvable' };

  const { data: subscription, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('business_id', member.business_id)
    .maybeSingle();

  if (error || !subscription) {
    // Si aucun abonnement, plan gratuit par défaut
    const defaultPlan = PLAN_CONFIGS.free;
    return {
      success: true,
      planDetails: defaultPlan,
    };
  }

  const planDetails = PLAN_CONFIGS[subscription.plan_code] || PLAN_CONFIGS.free;

  return {
    success: true,
    subscription: subscription as Subscription,
    planDetails,
  };
}

export async function checkQuotaLimit(businessId: string, quotaType: 'products' | 'orders'): Promise<{ allowed: boolean; message?: string }> {
  const supabase = await createClient();

  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('business_id', businessId)
    .maybeSingle();

  const planCode = subscription?.plan_code || 'free';
  const plan = PLAN_CONFIGS[planCode] || PLAN_CONFIGS.free;

  if (quotaType === 'products') {
    const { count } = await supabase
      .from('products')
      .select('id', { count: 'exact', head: true })
      .eq('business_id', businessId);

    const currentProductsCount = count || 0;

    if (currentProductsCount >= plan.maxProducts) {
      return {
        allowed: false,
        message: `Limite atteinte : Votre abonnement (${plan.name}) est limité à ${plan.maxProducts} produits. Veuillez passer au plan supérieur pour ajouter de nouveaux produits.`,
      };
    }
  }

  if (quotaType === 'orders') {
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();

    const { count } = await supabase
      .from('orders')
      .select('id', { count: 'exact', head: true })
      .eq('business_id', businessId)
      .gte('created_at', startOfMonth);

    const currentOrdersCount = count || 0;

    if (currentOrdersCount >= plan.maxOrdersPerMonth) {
      return {
        allowed: false,
        message: `Limite de commandes atteinte : Votre formule (${plan.name}) est limitée à ${plan.maxOrdersPerMonth} commandes ce mois-ci. Veuillez surclasser votre abonnement.`,
      };
    }
  }

  return { allowed: true };
}
