// Builds the WHERE clause and the parameter list from validated filters.
// We write only column names and operators; values always go in params ($1, $2...).
function buildInvoiceFilter(filters) {
  const conditions = [];
  const params = [];

  // Adds one condition, replacing "?" with the next placeholder ($1, $2, ...)
  const add = (template, value) => {
    params.push(value);
    conditions.push(template.replace('?', () => `$${params.length}`));
  };

  if (filters.status) add('status = ?', filters.status);
  if (filters.customer_id) add('customer_id = ?', filters.customer_id);
  if (filters.due_after) add('due_date > ?', filters.due_after);
  if (filters.due_before) add('due_date < ?', filters.due_before);

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  return { where, params };
}

module.exports = { buildInvoiceFilter };