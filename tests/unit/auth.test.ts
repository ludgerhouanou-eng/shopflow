import { describe, it, expect } from 'vitest';
import { registerSchema, loginSchema } from '../../lib/validations/auth';

describe('Validation d\'Authentification & Inscription (Zod)', () => {
  it('doit valider une inscription correcte', () => {
    const validData = {
      firstName: 'Jean',
      lastName: 'Kpodohoun',
      phone: '+22997000000',
      businessName: 'Boutique Elegance',
      email: 'jean@elegance.bj',
      password: 'password123',
    };

    const result = registerSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it('doit rejeter un mot de passe trop court', () => {
    const invalidData = {
      firstName: 'Jean',
      lastName: 'Kpodohoun',
      phone: '+22997000000',
      businessName: 'Boutique Elegance',
      email: 'jean@elegance.bj',
      password: '123',
    };

    const result = registerSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toContain('at least 6 characters');
    }
  });

  it('doit rejeter une adresse email invalide', () => {
    const invalidEmail = {
      email: 'email_invalide',
      password: 'password123',
    };

    const result = loginSchema.safeParse(invalidEmail);
    expect(result.success).toBe(false);
  });
});
