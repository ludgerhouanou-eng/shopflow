'use server';

import { createClient } from '@/lib/supabase/server';

export interface DashboardMetrics {
  totalRevenue: number;
  totalOrdersCount: number;
  pendingOrdersCount: number;
  pendingPaymentsCount: number;
  lowStockProductsCount: number;
  estimatedProfit: number;
  topProducts: Array<{
    name: string;
    totalQuantitySold: number;
    totalRevenueGenerated: number;
  }>;
}

export async function getDashboardMetrics(): Promise<{ success: boolean; metrics?: DashboardMetrics; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { success: false, error: 'AUTH_REQUIRED' };

  const { data: member } = await supabase
    .from('business_members')
    .select('business_id')
    .eq('user_id', user.id)
    .single();

  if (!member) return { success: false, error: 'Boutique introuvable' };

  const businessId = member.business_id;

  // 1. Récupération des commandes
  const { data: orders } = await supabase
    .from('orders')
    .select('*')
    .eq('business_id', businessId);

  const allOrders = orders || [];

  // Chiffre d'affaires (commandes confirmées ou livrées)
  const confirmedOrders = allOrders.filter(
    (o) => o.payment_status === 'succeeded' || o.status === 'delivered' || o.status === 'confirmed'
  );
  const totalRevenue = confirmedOrders.reduce((acc, o) => acc + Number(o.total_amount || 0), 0);

  // Nombre total de commandes
  const totalOrdersCount = allOrders.length;

  // Commandes en attente de traitement
  const pendingOrdersCount = allOrders.filter((o) => o.status === 'pending').length;

  // Paiements en attente
  const pendingPaymentsCount = allOrders.filter((o) => o.payment_status === 'pending').length;

  // 2. Produits en alerte de stock faible
  const { data: products } = await supabase
    .from('products')
    .select('*')
    .eq('business_id', businessId);

  const allProducts = products || [];
  const lowStockProductsCount = allProducts.filter(
    (p) => p.stock <= (p.low_stock_threshold || 5)
  ).length;

  // 3. Bénéfice estimé (marge simulée de 30% ou bas de gamme)
  const estimatedProfit = Math.round(totalRevenue * 0.3);

  // 4. Produits les plus vendus
  const { data: orderItems } = await supabase
    .from('order_items')
    .select('*')
    .eq('business_id', businessId);

  const productStats: Record<string, { name: string; quantity: number; revenue: number }> = {};

  (orderItems || []).forEach((item) => {
    if (!productStats[item.product_name]) {
      productStats[item.product_name] = { name: item.product_name, quantity: 0, revenue: 0 };
    }
    productStats[item.product_name].quantity += item.quantity;
    productStats[item.product_name].revenue += Number(item.total_price);
  });

  const topProducts = Object.values(productStats)
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5)
    .map((p) => ({
      name: p.name,
      totalQuantitySold: p.quantity,
      totalRevenueGenerated: p.revenue,
    }));

  return {
    success: true,
    metrics: {
      totalRevenue,
      totalOrdersCount,
      pendingOrdersCount,
      pendingPaymentsCount,
      lowStockProductsCount,
      estimatedProfit,
      topProducts,
    },
  };
}
