const { buildInvoiceFilter } = require('../src/services/invoiceQuery');

describe('buildInvoiceFilter', () => {
  it('returns no WHERE clause without filters', () => {
    expect(buildInvoiceFilter({})).toEqual({ where: '', params: [] });
  });

  it('filters by status', () => {
    expect(buildInvoiceFilter({ status: 'sent' })).toEqual({
      where: 'WHERE status = $1',
      params: ['sent'],
    });
  });

  it('combines filters and numbers the placeholders', () => {
    const result = buildInvoiceFilter({ status: 'sent', customer_id: 2, due_before: '2026-12-31' });
    expect(result).toEqual({
      where: 'WHERE status = $1 AND customer_id = $2 AND due_date < $3',
      params: ['sent', 2, '2026-12-31'],
    });
  });

  it('supports a due date range', () => {
    const result = buildInvoiceFilter({ due_after: '2026-01-01', due_before: '2026-02-01' });
    expect(result).toEqual({
      where: 'WHERE due_date > $1 AND due_date < $2',
      params: ['2026-01-01', '2026-02-01'],
    });
  });
});