import { getPublicStoreData } from '@/lib/services/store';
import { formatFCFA } from '@/lib/utils/formatters';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import PublicStoreClient from './PublicStoreClient';

export default async function PublicStorePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const storeData = await getPublicStoreData(slug);

  // Si la boutique démo est demandée et n'existe pas en base, fournir des données de démo réactives
  if (!storeData) {
    if (slug === 'demo') {
      const demoData = {
        business: {
          id: 'demo-biz-123',
          slug: 'demo',
          name: 'Boutique Élégance Cotonou',
          description: 'Votre référence en pagnes traditionnels, bazins et cosmétiques au Bénin.',
          whatsapp_number: '+22997000000',
          city: 'Cotonou',
          currency: 'XOF',
          delivery_settings: { delivery_fee: 1000 },
          payment_settings: { accept_cod: true, accept_online: true },
          address: 'Quartier Haie Vive, Cotonou',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          delivery_zones: [],
          opening_hours: {},
        },
        products: [
          {
            id: 'prod-1',
            business_id: 'demo-biz-123',
            name: 'Pagne Bazin Riche 3 Mètres',
            description: 'Tissu traditionnel de haute qualité, éclat garanti.',
            price: 15000,
            promotional_price: 12500,
            stock: 12,
            low_stock_threshold: 3,
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          {
            id: 'prod-2',
            business_id: 'demo-biz-123',
            name: 'Sac à Main Cuir Véritable',
            description: 'Fait main par des artisans locaux à Cotonou.',
            price: 25000,
            promotional_price: null,
            stock: 5,
            low_stock_threshold: 2,
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          {
            id: 'prod-3',
            business_id: 'demo-biz-123',
            name: 'Parfum Karité & Vanille 100ml',
            description: 'Senteur naturelle envoûtante longue durée.',
            price: 8000,
            promotional_price: 7000,
            stock: 20,
            low_stock_threshold: 5,
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ],
        categories: [
          { id: 'cat-1', business_id: 'demo-biz-123', name: 'Mode & Tissus', slug: 'mode', created_at: new Date().toISOString() },
          { id: 'cat-2', business_id: 'demo-biz-123', name: 'Beauté & Soins', slug: 'beaute', created_at: new Date().toISOString() },
        ],
      };

      return <PublicStoreClient storeData={demoData} />;
    }

    notFound();
  }

  return <PublicStoreClient storeData={storeData} />;
}
