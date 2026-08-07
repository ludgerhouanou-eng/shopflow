import { z } from 'zod';

export const checkoutItemSchema = z.object({
  productId: z.string().uuid('ID produit invalide'),
  variantId: z.string().uuid().optional().nullable(),
  quantity: z.number().int().min(1, 'La quantité doit être d’au moins 1'),
});

export const checkoutSchema = z.object({
  businessSlug: z.string().min(1, 'Slug boutique requis'),
  customerName: z.string().min(2, 'Le nom du client doit contenir au moins 2 caractères'),
  customerPhone: z
    .string()
    .min(8, 'Le numéro de téléphone doit contenir au moins 8 chiffres')
    .regex(/^[+0-9\s-]+$/, 'Format de téléphone invalide'),
  deliveryAddress: z.string().min(3, 'L’adresse ou le quartier de livraison est requis'),
  deliveryZone: z.string().optional().nullable(),
  paymentMethod: z.enum(['cash_on_delivery', 'mobile_money_manual', 'online']),
  notes: z.string().optional().nullable(),
  items: z.array(checkoutItemSchema).min(1, 'Le panier doit contenir au moins un article'),
  idempotencyKey: z.string().min(10, 'Clé d’idempotence requise'),
});

export const updateOrderStatusSchema = z.object({
  orderId: z.string().uuid('ID commande invalide'),
  status: z.enum(['pending', 'confirmed', 'preparing', 'shipped', 'delivered', 'cancelled', 'returned']),
  paymentStatus: z.enum(['pending', 'succeeded', 'failed', 'cancelled', 'refunded']).optional(),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;
