const {
  calculateLineTotal,
  calculateSubtotal,
  calculateTax,
  calculateTotals,
} = require('../src/services/taxCalculator');

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

describe('tax and totals', () => {
  it('calculates 18% tax', () => {
    expect(calculateTax(10000)).toBe(1800);
  });

  it('rounds to the nearest cent', () => {
    expect(calculateTax(15)).toBe(3); // 2.7 -> 3
  });

  it('rounds tax per line item', () => {
    // 3 lines of 1 cent: each line's tax (0.18 cents) rounds to 0
    const items = [1, 2, 3].map(() => ({ quantity: 1, unit_price_cents: 1 }));
    expect(calculateTotals(items).tax_cents).toBe(0);
  });

  it('returns subtotal, tax and total', () => {
    const items = [{ quantity: 2, unit_price_cents: 5000 }];
    expect(calculateTotals(items)).toEqual({
      subtotal_cents: 10000,
      tax_cents: 1800,
      total_cents: 11800,
    });
  });

  it('supports a custom rate in bps', () => {
    expect(calculateTax(10000, 500)).toBe(500); // 5%
  });
});
