const express = require('express');
const pool = require('../db/pool');
const asyncHandler = require('../utils/asyncHandler');
const { validateBody } = require('../utils/validate');
const { invoiceSchema } = require('../schemas/invoice');
const { calculateTotals } = require('../services/taxCalculator');

const router = express.Router();
const MAX_INT = 2147483647; // largest value a Postgres INTEGER can hold

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

module.exports = router;
module.exports.findInvoice = findInvoice;