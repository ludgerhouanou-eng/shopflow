import { describe, it, expect } from 'vitest';
import { productSchema, stockAdjustmentSchema } from '../../lib/validations/product';

describe('Validation des Produits & Stock (Zod)', () => {
  it('doit valider la création d\'un produit avec prix promotionnel valide', () => {
    const validProduct = {
      name: 'Pagne Bazin Riche',
      description: 'Superbe tissu traditionnel',
      price: 15000,
      promotionalPrice: 12000,
      stock: 10,
      lowStockThreshold: 3,
      isActive: true,
    };

    const result = productSchema.safeParse(validProduct);
    expect(result.success).toBe(true);
  });

  it('doit rejeter un prix promotionnel supérieur au prix normal', () => {
    const invalidProduct = {
      name: 'Pagne Bazin Riche',
      price: 15000,
      promotionalPrice: 18000, // Invalide !
      stock: 10,
      lowStockThreshold: 3,
      isActive: true,
    };

    const result = productSchema.safeParse(invalidProduct);
    expect(result.success).toBe(false);
  });

  it('doit rejeter un stock négatif', () => {
    const invalidStock = {
      name: 'Sac en cuir',
      price: 5000,
      stock: -5, // Invalide !
    };

    const result = productSchema.safeParse(invalidStock);
    expect(result.success).toBe(false);
  });

  it('doit valider une réapprovisionnement de stock', () => {
    const validAdjustment = {
      productId: '123e4567-e89b-12d3-a456-426614174000',
      quantityChange: 15,
      movementType: 'restock' as const,
    };

    const result = stockAdjustmentSchema.safeParse(validAdjustment);
    expect(result.success).toBe(true);
  });
});
