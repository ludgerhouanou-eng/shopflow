import { z } from 'zod';

export const registerSchema = z.object({
  firstName: z.string().min(2, 'Le prénom doit contenir au moins 2 caractères'),
  lastName: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
  phone: z
    .string()
    .min(8, 'Le numéro de téléphone doit contenir au moins 8 chiffres')
    .regex(/^[+0-9\s-]+$/, 'Format de numéro de téléphone invalide'),
  businessName: z.string().min(3, 'Le nom de la boutique doit contenir au moins 3 caractères'),
  email: z.string().email('Adresse e-mail invalide'),
  password: z.string().min(6, 'Le mot de passe doit contenir au moins 6 caractères'),
});

export const loginSchema = z.object({
  email: z.string().email('Adresse e-mail invalide'),
  password: z.string().min(1, 'Le mot de passe est requis'),
});

export const resetPasswordSchema = z.object({
  email: z.string().email('Adresse e-mail invalide'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
