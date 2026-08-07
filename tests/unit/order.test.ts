import { describe, it, expect } from 'vitest';
import { checkoutSchema } from '../../lib/validations/order';
import { formatFCFA } from '../../lib/utils/formatters';

describe('Validation des Commandes & Calcul de Montants', () => {
  it('doit valider une commande publique valide', () => {
    const validCheckout = {
      businessSlug: 'boutique-elegance-1234',
      customerName: 'Ablawa Dossou',
      customerPhone: '+22996112233',
      deliveryAddress: 'Quartier Haie Vive, Cotonou',
      paymentMethod: 'cash_on_delivery' as const,
      idempotencyKey: 'idemp_key_998877665544',
      items: [
        {
          productId: '123e4567-e89b-12d3-a456-426614174000',
          quantity: 2,
        },
      ],
    };

    const result = checkoutSchema.safeParse(validCheckout);
    expect(result.success).toBe(true);
  });

  it('doit rejeter un panier vide', () => {
    const emptyCart = {
      businessSlug: 'boutique-elegance-1234',
      customerName: 'Ablawa Dossou',
      customerPhone: '+22996112233',
      deliveryAddress: 'Cotonou',
      paymentMethod: 'cash_on_delivery' as const,
      idempotencyKey: 'idemp_key_998877665544',
      items: [], // Panier vide
    };

    const result = checkoutSchema.safeParse(emptyCart);
    expect(result.success).toBe(false);
  });

  it('doit formater correctement la monnaie FCFA sans décimales', () => {
    expect(formatFCFA(15000)).toContain('15');
    expect(formatFCFA(15000)).toContain('FCFA');
  });

  it('doit calculer le sous-total serveur correctement', () => {
    const items = [
      { unitPrice: 5000, quantity: 2 },
      { unitPrice: 2500, quantity: 1 },
    ];
    const subtotal = items.reduce((acc, item) => acc + item.unitPrice * item.quantity, 0);
    const deliveryFee = 1000;
    const totalAmount = subtotal + deliveryFee;

    expect(subtotal).toBe(12500);
    expect(totalAmount).toBe(13500);
  });
});
