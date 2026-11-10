const express = require('express');
const pool = require('../db/pool');
const asyncHandler = require('../utils/asyncHandler');
const { validateBody } = require('../utils/validate');
const { invoiceSchema, statusSchema } = require('../schemas/invoice');
const { calculateTotals } = require('../services/taxCalculator');
const { canTransition } = require('../services/invoiceStatus');

const router = express.Router();
const MAX_INT = 2147483647; // largest value a Postgres INTEGER can hold

// Validate :id on every route that has it
router.param('id', (req, res, next, value) => {
  const id = Number(value);
  if (!Number.isInteger(id) || id < 1 || id > MAX_INT) {
    return res.status(400).json({ error: 'Invalid id' });
  }
  req.invoiceId = id;
  next();
});

// Fetch an invoice together with its line items
async function findInvoice(id) {
  const invoice = await pool.query('SELECT * FROM invoices WHERE id = $1', [id]);
  if (invoice.rows.length === 0) return null;
  const items = await pool.query(
    `SELECT id, description, quantity, unit_price_cents
     FROM line_items WHERE invoice_id = $1 ORDER BY id`,
    [id]
  );
  return { ...invoice.rows[0], line_items: items.rows };
}

// Create an invoice
router.post('/', asyncHandler(async (req, res) => {
  const data = validateBody(invoiceSchema, req, res);
  if (!data) return;

  // Money is always calculated on the server, never trusted from the client
  const totals = calculateTotals(data.line_items);
  if (totals.total_cents > MAX_INT) {
    return res.status(400).json({ error: 'Invoice total is too large' });
  }

  let invoiceId;
  const client = await pool.connect(); // one connection for the whole transaction
  try {
    await client.query('BEGIN');

    const { rows } = await client.query(
      `INSERT INTO invoices (customer_id, due_date, subtotal_cents, tax_cents, total_cents)
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [data.customer_id, data.due_date, totals.subtotal_cents, totals.tax_cents, totals.total_cents]
    );
    invoiceId = rows[0].id;

    for (const item of data.line_items) {
      await client.query(
        `INSERT INTO line_items (invoice_id, description, quantity, unit_price_cents)
         VALUES ($1, $2, $3, $4)`,
        [invoiceId, item.description, item.quantity, item.unit_price_cents]
      );
    }

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK'); // undo everything if any step failed
    if (err.code === '23503') { // foreign key violation: customer does not exist
      return res.status(404).json({ error: 'Customer not found' });
    }
    throw err;
  } finally {
    client.release(); // always give the connection back to the pool
  }

  res.status(201).json(await findInvoice(invoiceId));
}));

// Read one invoice
router.get('/:id', asyncHandler(async (req, res) => {
  const invoice = await findInvoice(req.invoiceId);
  if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
  res.json(invoice);
}));

// Change an invoice's status
router.patch('/:id/status', asyncHandler(async (req, res) => {
  const data = validateBody(statusSchema, req, res);
  if (!data) return;

  const current = await pool.query('SELECT status FROM invoices WHERE id = $1', [req.invoiceId]);
  if (current.rows.length === 0) {
    return res.status(404).json({ error: 'Invoice not found' });
  }

  const from = current.rows[0].status;
  if (!canTransition(from, data.status)) {
    return res.status(409).json({ error: `Cannot move invoice from ${from} to ${data.status}` });
  }

  // "AND status = $3" protects against two requests changing it at the same time
  const result = await pool.query(
    'UPDATE invoices SET status = $1 WHERE id = $2 AND status = $3',
    [data.status, req.invoiceId, from]
  );
  if (result.rowCount === 0) {
    return res.status(409).json({ error: 'Invoice status changed, please retry' });
  }

  res.json(await findInvoice(req.invoiceId));
}));

module.exports = router;
module.exports.findInvoice = findInvoice;