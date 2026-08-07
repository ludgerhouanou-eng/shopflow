'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { checkoutSchema, CheckoutInput, updateOrderStatusSchema, UpdateOrderStatusInput } from '@/lib/validations/order';
import { findOrCreateCustomer } from './customer';
import { Order, OrderItem } from '@/types/database';
import { revalidatePath } from 'next/cache';

export async function createPublicOrder(input: CheckoutInput) {
  // 1. Validation des entrées avec Zod
  const validation = checkoutSchema.safeParse(input);
  if (!validation.success) {
    return { success: false, error: validation.error.errors[0].message };
  }

  const {
    businessSlug,
    customerName,
    customerPhone,
    deliveryAddress,
    deliveryZone,
    paymentMethod,
    notes,
    items,
  } = validation.data;

  const adminSupabase = createAdminClient();

  // 2. Charger la boutique à partir du slug
  const { data: business, error: bizErr } = await adminSupabase
    .from('businesses')
    .select('*')
    .eq('slug', businessSlug)
    .single();

  if (bizErr || !business) {
    return { success: false, error: 'Boutique introuvable ou inactive.' };
  }

  // 3. RECALCUL DU MONTANT STRICTEMENT CÔTÉ SERVEUR
  let subtotal = 0;
  const verifiedItems: Array<{
    productId: string;
    productName: string;
    unitPrice: number;
    quantity: number;
    totalPrice: number;
  }> = [];

  for (const item of items) {
    const { data: product, error: prodErr } = await adminSupabase
      .from('products')
      .select('id, name, price, promotional_price, stock, is_active')
      .eq('id', item.productId)
      .eq('business_id', business.id)
      .single();

    if (prodErr || !product || !product.is_active) {
      return { success: false, error: `Le produit sélectionné n’est plus disponible.` };
    }

    if (product.stock < item.quantity) {
      return {
        success: false,
        error: `INSUFFICIENT_STOCK: Stock insuffisant pour "${product.name}". (Restant: ${product.stock}, demandé: ${item.quantity})`,
      };
    }

    const unitPrice = product.promotional_price !== null && product.promotional_price > 0
      ? Number(product.promotional_price)
      : Number(product.price);

    const itemTotal = unitPrice * item.quantity;
    subtotal += itemTotal;

    verifiedItems.push({
      productId: product.id,
      productName: product.name,
      unitPrice,
      quantity: item.quantity,
      totalPrice: itemTotal,
    });
  }

  // Calcul frais de livraison
  const deliveryFee = Number(business.delivery_settings?.delivery_fee || 1000);
  const totalAmount = subtotal + deliveryFee;

  // 4. Détection / Création du client
  const customerResult = await findOrCreateCustomer(
    business.id,
    customerName,
    customerPhone,
    deliveryAddress
  );

  const customerId = customerResult.customer?.id || null;

  // 5. Génération du numéro de commande lisible (ex: CMD-7489)
  const orderNumber = `CMD-${Math.floor(1000 + Math.random() * 9000)}`;

  // 6. Insertion de la commande
  const { data: newOrder, error: orderErr } = await adminSupabase
    .from('orders')
    .insert({
      business_id: business.id,
      customer_id: customerId,
      order_number: orderNumber,
      customer_name: customerName,
      customer_phone: customerPhone,
      delivery_address: deliveryAddress,
      delivery_zone: deliveryZone || null,
      subtotal,
      delivery_fee: deliveryFee,
      total_amount: totalAmount,
      status: 'pending',
      payment_status: 'pending',
      payment_method: paymentMethod,
      notes: notes || null,
    })
    .select()
    .single();

  if (orderErr || !newOrder) {
    return { success: false, error: `Échec création commande: ${orderErr?.message}` };
  }

  // 7. Insertion des articles de commande
  const orderItemsPayload = verifiedItems.map((item) => ({
    business_id: business.id,
    order_id: newOrder.id,
    product_id: item.productId,
    product_name: item.productName,
    unit_price: item.unitPrice,
    quantity: item.quantity,
    total_price: item.totalPrice,
  }));

  const { error: itemsErr } = await adminSupabase
    .from('order_items')
    .insert(orderItemsPayload);

  if (itemsErr) {
    // Nettoyage en cas d'échec
    await adminSupabase.from('orders').delete().eq('id', newOrder.id);
    return { success: false, error: `Erreur enregistrement articles commande.` };
  }

  // 8. DÉCRÉMENTATION ATOMIQUE DU STOCK VIA PROCÉDURE PL/PGSQL
  const { error: stockErr } = await adminSupabase.rpc('process_order_stock_decrement', {
    p_order_id: newOrder.id,
    p_business_id: business.id,
  });

  if (stockErr) {
    console.error('Erreur décrémentation stock:', stockErr);
    return { success: false, error: `Erreur stock: ${stockErr.message}` };
  }

  // 9. Mise à jour statistiques client
  if (customerId) {
    await adminSupabase
      .from('customers')
      .update({
        total_orders: (customerResult.customer?.total_orders || 0) + 1,
        total_spent: Number(customerResult.customer?.total_spent || 0) + totalAmount,
        updated_at: new Date().toISOString(),
      })
      .eq('id', customerId);
  }

  revalidatePath(`/boutique/${businessSlug}`);
  revalidatePath('/orders');
  revalidatePath('/dashboard');

  return {
    success: true,
    order: newOrder as Order,
    message: 'Commande enregistrée avec succès !',
  };
}

export async function getBusinessOrders(): Promise<{ success: boolean; orders?: Order[]; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { success: false, error: 'AUTH_REQUIRED' };

  const { data: member } = await supabase
    .from('business_members')
    .select('business_id')
    .eq('user_id', user.id)
    .single();

  if (!member) return { success: false, error: 'Boutique introuvable' };

  const { data: orders, error } = await supabase
    .from('orders')
    .select('*')
    .eq('business_id', member.business_id)
    .order('created_at', { ascending: false });

  if (error) return { success: false, error: error.message };

  return { success: true, orders: orders as Order[] };
}

export async function updateOrderStatus(input: UpdateOrderStatusInput) {
  const validation = updateOrderStatusSchema.safeParse(input);
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

  if (!member || !['owner', 'manager', 'seller', 'delivery_agent'].includes(member.role)) {
    return { success: false, error: 'FORBIDDEN' };
  }

  const { orderId, status, paymentStatus } = validation.data;

  const updateData: Record<string, any> = {
    status,
    updated_at: new Date().toISOString(),
  };

  if (paymentStatus) {
    updateData.payment_status = paymentStatus;
  }

  const { error } = await supabase
    .from('orders')
    .update(updateData)
    .eq('id', orderId)
    .eq('business_id', member.business_id);

  if (error) return { success: false, error: error.message };

  revalidatePath('/orders');
  revalidatePath('/dashboard');
  return { success: true, message: 'Statut de la commande mis à jour.' };
}
