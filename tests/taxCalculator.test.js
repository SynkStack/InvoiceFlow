const { calculateLineTotal, calculateSubtotal } = require('../src/services/taxCalculator');

describe('subtotal', () => {
  it('multiplies quantity by unit price', () => {
    expect(calculateLineTotal({ quantity: 3, unit_price_cents: 1050 })).toBe(3150);
  });

  it('sums all lines', () => {
    const items = [
      { quantity: 2, unit_price_cents: 500 },
      { quantity: 1, unit_price_cents: 250 },
    ];
    expect(calculateSubtotal(items)).toBe(1250);
  });

  it('returns 0 for no items', () => {
    expect(calculateSubtotal([])).toBe(0);
  });

  it('rejects floats and bad quantities', () => {
    expect(() => calculateLineTotal({ quantity: 1, unit_price_cents: 10.5 })).toThrow();
    expect(() => calculateLineTotal({ quantity: 0, unit_price_cents: 100 })).toThrow();
  });
});