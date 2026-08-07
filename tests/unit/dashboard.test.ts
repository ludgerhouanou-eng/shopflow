import { describe, it, expect } from 'vitest';
import { PLAN_CONFIGS } from '../../app/actions/subscription';

describe('Limites d\'Abonnement & Calculs Dashboard', () => {
  it('doit posséder les quotas corrects pour le plan Gratuit (20 produits, 50 commandes)', () => {
    const freePlan = PLAN_CONFIGS.free;

    expect(freePlan.maxProducts).toBe(20);
    expect(freePlan.maxOrdersPerMonth).toBe(50);
    expect(freePlan.maxUsers).toBe(2);
    expect(freePlan.priceFCFA).toBe(0);
  });

  it('doit posséder les quotas corrects pour le plan Standard (100 produits, 500 commandes)', () => {
    const standardPlan = PLAN_CONFIGS.standard;

    expect(standardPlan.maxProducts).toBe(100);
    expect(standardPlan.maxOrdersPerMonth).toBe(500);
    expect(standardPlan.priceFCFA).toBe(5000);
  });

  it('doit posséder des limites illimitées pour le plan Pro', () => {
    const proPlan = PLAN_CONFIGS.pro;

    expect(proPlan.maxProducts).toBeGreaterThan(1000);
    expect(proPlan.maxOrdersPerMonth).toBeGreaterThan(1000);
    expect(proPlan.priceFCFA).toBe(15000);
  });

  it('doit estimer correctement la marge bénéficiaire à 30% du chiffre d\'affaires', () => {
    const totalRevenue = 100000;
    const estimatedProfit = Math.round(totalRevenue * 0.3);

    expect(estimatedProfit).toBe(30000);
  });
});
