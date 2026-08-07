import { createAdminClient } from '@/lib/supabase/admin';
import { Business, Product, Category } from '@/types/database';

export interface PublicStoreData {
  business: Business;
  products: Product[];
  categories: Category[];
}

export async function getPublicStoreData(slug: string): Promise<PublicStoreData | null> {
  const supabase = createAdminClient();

  // 1. Boutique par slug
  const { data: business, error: bizErr } = await supabase
    .from('businesses')
    .select('*')
    .eq('slug', slug)
    .single();

  if (bizErr || !business) return null;

  // 2. Produits actifs de cette boutique
  const { data: products } = await supabase
    .from('products')
    .select('*')
    .eq('business_id', business.id)
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  // 3. Catégories de cette boutique
  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .eq('business_id', business.id);

  return {
    business: business as Business,
    products: (products || []) as Product[],
    categories: (categories || []) as Category[],
  };
}
