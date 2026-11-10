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

module.exports = { calculateLineTotal, calculateSubtotal };