'use server';

import { createClient } from '@/lib/supabase/server';
import { productSchema, stockAdjustmentSchema, ProductInput, StockAdjustmentInput } from '@/lib/validations/product';
import { Product, InventoryMovement } from '@/types/database';
import { revalidatePath } from 'next/cache';

export async function getBusinessProducts(): Promise<{ success: boolean; products?: Product[]; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { success: false, error: 'AUTH_REQUIRED' };

  const { data: member } = await supabase
    .from('business_members')
    .select('business_id')
    .eq('user_id', user.id)
    .single();

  if (!member) return { success: false, error: 'Boutique introuvable' };

  const { data: products, error } = await supabase
    .from('products')
    .select('*')
    .eq('business_id', member.business_id)
    .order('created_at', { ascending: false });

  if (error) return { success: false, error: error.message };

  return { success: true, products: products as Product[] };
}

export async function createProduct(input: ProductInput) {
  const validation = productSchema.safeParse(input);
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

  if (!member || !['owner', 'manager', 'seller'].includes(member.role)) {
    return { success: false, error: 'FORBIDDEN' };
  }

  const { name, description, price, promotionalPrice, categoryId, imageUrl, stock, lowStockThreshold, isActive } = validation.data;

  // 1. Insertion du produit
  const { data: newProduct, error } = await supabase
    .from('products')
    .insert({
      business_id: member.business_id,
      category_id: categoryId || null,
      name,
      description,
      price,
      promotional_price: promotionalPrice || null,
      image_url: imageUrl || null,
      stock,
      low_stock_threshold: lowStockThreshold,
      is_active: isActive,
    })
    .select()
    .single();

  if (error || !newProduct) {
    return { success: false, error: `Erreur lors de la création du produit: ${error?.message}` };
  }

  // 2. Mouvement de stock initial si stock > 0
  if (stock > 0) {
    await supabase.from('inventory_movements').insert({
      business_id: member.business_id,
      product_id: newProduct.id,
      movement_type: 'restock',
      quantity_change: stock,
      previous_stock: 0,
      new_stock: stock,
      created_by: user.id,
    });
  }

  revalidatePath('/products');
  revalidatePath('/dashboard');
  return { success: true, product: newProduct, message: 'Produit créé avec succès' };
}

export async function updateProduct(productId: string, input: Partial<ProductInput>) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'AUTH_REQUIRED' };

  const { data: member } = await supabase
    .from('business_members')
    .select('business_id, role')
    .eq('user_id', user.id)
    .single();

  if (!member || !['owner', 'manager', 'seller'].includes(member.role)) {
    return { success: false, error: 'FORBIDDEN' };
  }

  const { error } = await supabase
    .from('products')
    .update({
      ...input,
      updated_at: new Date().toISOString(),
    })
    .eq('id', productId)
    .eq('business_id', member.business_id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath('/products');
  return { success: true, message: 'Produit mis à jour avec succès' };
}

export async function deleteProduct(productId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'AUTH_REQUIRED' };

  const { data: member } = await supabase
    .from('business_members')
    .select('business_id, role')
    .eq('user_id', user.id)
    .single();

  if (!member || !['owner', 'manager'].includes(member.role)) {
    return { success: false, error: 'FORBIDDEN: Seuls le propriétaire ou le manager peuvent supprimer un produit.' };
  }

  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', productId)
    .eq('business_id', member.business_id);

  if (error) return { success: false, error: error.message };

  revalidatePath('/products');
  return { success: true, message: 'Produit supprimé' };
}

export async function adjustStock(input: StockAdjustmentInput) {
  const validation = stockAdjustmentSchema.safeParse(input);
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

  if (!member || !['owner', 'manager', 'seller'].includes(member.role)) {
    return { success: false, error: 'FORBIDDEN' };
  }

  const { productId, variantId, quantityChange, movementType } = validation.data;

  // Récupérer stock actuel
  const { data: product, error: prodErr } = await supabase
    .from('products')
    .select('stock')
    .eq('id', productId)
    .eq('business_id', member.business_id)
    .single();

  if (prodErr || !product) return { success: false, error: 'Produit introuvable' };

  const previousStock = product.stock;
  const newStock = previousStock + quantityChange;

  if (newStock < 0) {
    return { success: false, error: 'INSUFFICIENT_STOCK: Le stock résultant ne peut pas être négatif.' };
  }

  // Mettre à jour le stock produit
  const { error: updateErr } = await supabase
    .from('products')
    .update({ stock: newStock, updated_at: new Date().toISOString() })
    .eq('id', productId);

  if (updateErr) return { success: false, error: updateErr.message };

  // Enregistrer le mouvement d'inventaire
  await supabase.from('inventory_movements').insert({
    business_id: member.business_id,
    product_id: productId,
    variant_id: variantId || null,
    movement_type: movementType,
    quantity_change: quantityChange,
    previous_stock: previousStock,
    new_stock: newStock,
    created_by: user.id,
  });

  revalidatePath('/products');
  revalidatePath('/stock');
  return { success: true, newStock, message: 'Stock mis à jour avec succès' };
}

export async function getInventoryMovements(): Promise<{ success: boolean; movements?: InventoryMovement[]; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'AUTH_REQUIRED' };

  const { data: member } = await supabase
    .from('business_members')
    .select('business_id')
    .eq('user_id', user.id)
    .single();

  if (!member) return { success: false, error: 'Boutique introuvable' };

  const { data: movements, error } = await supabase
    .from('inventory_movements')
    .select('*')
    .eq('business_id', member.business_id)
    .order('created_at', { ascending: false });

  if (error) return { success: false, error: error.message };

  return { success: true, movements: movements as InventoryMovement[] };
}
