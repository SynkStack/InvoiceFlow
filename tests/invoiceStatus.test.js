const { canTransition } = require('../src/services/invoiceStatus');

describe('invoice status transitions', () => {
  it.each([
    ['draft', 'sent'],
    ['sent', 'paid'],
    ['sent', 'overdue'],
    ['overdue', 'paid'],
  ])('allows %s -> %s', (from, to) => {
    expect(canTransition(from, to)).toBe(true);
  });

  it.each([
    ['draft', 'paid'],
    ['draft', 'overdue'],
    ['sent', 'draft'],
    ['sent', 'sent'],
    ['paid', 'sent'],
    ['paid', 'overdue'],
    ['overdue', 'sent'],
  ])('rejects %s -> %s', (from, to) => {
    expect(canTransition(from, to)).toBe(false);
  });

  it('rejects unknown statuses', () => {
    expect(canTransition('archived', 'sent')).toBe(false);
  });
});