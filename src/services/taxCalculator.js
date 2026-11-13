// All money is in integer cents. Never use floats for money.

// Make sure a value is a whole number >= min, else throw
function assertInt(value, name, min) {
  if (!Number.isInteger(value) || value < min) {
    throw new Error(`${name} must be an integer >= ${min}`);
  }
}

// One line's total: quantity x unit price
function calculateLineTotal(item) {
  assertInt(item.quantity, 'quantity', 1);
  assertInt(item.unit_price_cents, 'unit_price_cents', 0);
  return item.quantity * item.unit_price_cents;
}

// Sum of all line totals
function calculateSubtotal(items) {
  return items.reduce((sum, item) => sum + calculateLineTotal(item), 0);
}
const DEFAULT_TAX_RATE_BPS = 1800; // 18%

// Tax on the subtotal, rounded ONCE to the nearest cent
function calculateTax(subtotalCents, rateBps = DEFAULT_TAX_RATE_BPS) {
  assertInt(subtotalCents, 'subtotalCents', 0);
  assertInt(rateBps, 'rateBps', 0);
  return Math.round((subtotalCents * rateBps) / 10000);
}

// The three numbers stored on an invoice
function calculateTotals(items, rateBps = DEFAULT_TAX_RATE_BPS) {
  const subtotal_cents = calculateSubtotal(items);
  const tax_cents = calculateTax(subtotal_cents, rateBps);
  return { subtotal_cents, tax_cents, total_cents: subtotal_cents + tax_cents };
}

module.exports = {
  DEFAULT_TAX_RATE_BPS,
  calculateLineTotal,
  calculateSubtotal,
  calculateTax,
  calculateTotals,
};