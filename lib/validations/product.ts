import { z } from 'zod';

export const productSchema = z
  .object({
    name: z.string().min(2, 'Le nom du produit doit contenir au moins 2 caractères'),
    description: z.string().optional().nullable(),
    price: z.number().min(0, 'Le prix doit être positif'),
    promotionalPrice: z.number().optional().nullable(),
    categoryId: z.string().optional().nullable(),
    imageUrl: z.string().optional().nullable(),
    stock: z.number().int().min(0, 'Le stock ne peut pas être négatif'),
    lowStockThreshold: z.number().int().min(0).default(5),
    isActive: z.boolean().default(true),
  })
  .refine(
    (data) => {
      if (data.promotionalPrice !== undefined && data.promotionalPrice !== null) {
        return data.promotionalPrice < data.price;
      }
      return true;
    },
    {
      message: 'Le prix promotionnel doit être strictement inférieur au prix normal',
      path: ['promotionalPrice'],
    }
  );

export const stockAdjustmentSchema = z.object({
  productId: z.string().uuid('ID produit invalide'),
  variantId: z.string().uuid().optional().nullable(),
  quantityChange: z.number().int().refine((val) => val !== 0, 'Le changement doit être différent de 0'),
  movementType: z.enum(['sale', 'restock', 'adjustment', 'return', 'cancellation']),
  notes: z.string().optional(),
});

export type ProductInput = z.infer<typeof productSchema>;
export type StockAdjustmentInput = z.infer<typeof stockAdjustmentSchema>;
