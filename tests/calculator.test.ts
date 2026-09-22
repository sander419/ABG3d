import { describe, expect, test } from 'bun:test';
import { HOUSES, INDIVIDUAL_SURCHARGE_PER_M2, housePrice } from '../src/calculator/houses';
import { FAMILY_LIMIT, annuityPayment, planMortgage } from '../src/calculator/mortgage';

describe('ABG price table', () => {
  test('15 projects, both regions filled', () => {
    expect(HOUSES).toHaveLength(15);
    HOUSES.forEach((house) => {
      expect(house.prices.msk.total).toBeGreaterThan(0);
      expect(house.prices.spb.total).toBeGreaterThan(0);
    });
  });
  test('published totals match area × price per m² (within ABG rounding, 0.1 %)', () => {
    HOUSES.forEach((house) => {
      (['msk', 'spb'] as const).forEach((region) => {
        const { perM2, total } = house.prices[region];
        expect(Math.abs(perM2 * house.areaM2 - total) / total).toBeLessThan(0.001);
      });
    });
  });
  test('Petersburg is cheaper than Moscow for every project', () => {
    HOUSES.forEach((house) => expect(house.prices.spb.total).toBeLessThan(house.prices.msk.total));
  });
  test('individual project adds the surcharge per m²', () => {
    const house = HOUSES[0];
    expect(housePrice(house, 'msk', true) - housePrice(house, 'msk', false)).toBe(house.areaM2 * INDIVIDUAL_SURCHARGE_PER_M2);
  });
});

describe('mortgage', () => {
  test('annuity matches the textbook value: 10 mln ₽, 6 %, 30 years ≈ 59 955 ₽', () => {
    expect(annuityPayment(10_000_000, 6, 30)).toBeCloseTo(59955.05, 1);
  });
  test('zero rate and zero principal', () => {
    expect(annuityPayment(1_200_000, 0, 10)).toBeCloseTo(10000, 6);
    expect(annuityPayment(0, 6, 30)).toBe(0);
  });
  test('loan within the family limit goes fully at 6 %', () => {
    const plan = planMortgage({ price: 11_000_000, downPayment: 2_200_000, familyEligible: true, marketRate: 20, years: 30 });
    expect(plan.loan).toBe(8_800_000);
    expect(plan.familyPart).toBe(8_800_000);
    expect(plan.marketPart).toBe(0);
    expect(plan.downPaymentTooLow).toBe(false);
  });
  test('above the limit the rest goes at the market rate (combined loan)', () => {
    const plan = planMortgage({ price: 20_000_000, downPayment: 4_000_000, familyEligible: true, marketRate: 20, years: 30 });
    expect(plan.familyPart).toBe(FAMILY_LIMIT);
    expect(plan.marketPart).toBe(4_000_000);
    expect(plan.monthly).toBeCloseTo(annuityPayment(FAMILY_LIMIT, 6, 30) + annuityPayment(4_000_000, 20, 30), 6);
  });
  test('without the family programme everything is at the market rate', () => {
    const plan = planMortgage({ price: 10_000_000, downPayment: 2_000_000, familyEligible: false, marketRate: 20, years: 20 });
    expect(plan.familyPart).toBe(0);
    expect(plan.marketPart).toBe(8_000_000);
  });
  test('flags a down payment below 20 %', () => {
    expect(planMortgage({ price: 10_000_000, downPayment: 1_000_000, familyEligible: true, marketRate: 20, years: 30 }).downPaymentTooLow).toBe(true);
  });
  test('down payment larger than the price means no loan', () => {
    const plan = planMortgage({ price: 5_000_000, downPayment: 9_000_000, familyEligible: true, marketRate: 20, years: 30 });
    expect(plan.loan).toBe(0);
    expect(plan.monthly).toBe(0);
  });
});
