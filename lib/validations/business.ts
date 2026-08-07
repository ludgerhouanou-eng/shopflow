import { z } from 'zod';

export const businessSettingsSchema = z.object({
  name: z.string().min(3, 'Le nom de la boutique doit contenir au moins 3 caractères'),
  slug: z
    .string()
    .min(3, 'Le slug doit contenir au moins 3 caractères')
    .regex(/^[a-z0-9-]+$/, 'Le slug ne doit contenir que des lettres minuscules, chiffres et tirets'),
  description: z.string().optional().nullable(),
  whatsappNumber: z.string().min(8, 'Le numéro WhatsApp doit contenir au moins 8 chiffres'),
  address: z.string().optional().nullable(),
  city: z.string().min(2, 'La ville est requise'),
  deliveryFee: z.number().min(0, 'Les frais de livraison ne peuvent pas être négatifs'),
  freeDeliveryAbove: z.number().optional().nullable(),
  acceptCod: z.boolean(),
  acceptOnline: z.boolean(),
  mobileMoneyNumber: z.string().optional().nullable(),
});

export type BusinessSettingsInput = z.infer<typeof businessSettingsSchema>;
